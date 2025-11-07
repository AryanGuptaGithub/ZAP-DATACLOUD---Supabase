import { supabase } from '@/lib/supabaseClient';

// expenses: id, owner_id, customer_name, amount(numeric), date(date), remark(text), uploaded_path(text), created_at

export async function listExpenses({ from, to, customer, limit = 200 } = {}) {
  let q = supabase.from('expenses').select('*').order('date', { ascending: false }).limit(limit);
  if (customer) q = q.ilike('customer_name', `%${customer}%`);
  if (from) q = q.gte('date', from);
  if (to) q = q.lte('date', to);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createExpense({ customer_name, amount, date, remark, uploaded_path }) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{ customer_name, amount: Number(amount), date, remark, uploaded_path }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExpense(id, patch) {
  if (patch.amount != null) patch.amount = Number(patch.amount);
  const { data, error } = await supabase.from('expenses').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
  return true;
}
