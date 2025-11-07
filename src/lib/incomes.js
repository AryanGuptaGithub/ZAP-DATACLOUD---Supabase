import { supabase } from '@/lib/supabaseClient';

// incomes: id, owner_id, client_id, amount(numeric), date(date), remark(text), uploaded_path(text), created_at

export async function listIncomes({ from, to, limit = 200 } = {}) {
  let q = supabase.from('incomes').select('*').order('date', { ascending: false }).limit(limit);
  if (from) q = q.gte('date', from);
  if (to) q = q.lte('date', to);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createIncome({ client_id, amount, date, remark, uploaded_path }) {
  const { data, error } = await supabase
    .from('incomes')
    .insert([{ client_id, amount: Number(amount), date, remark, uploaded_path }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateIncome(id, patch) {
  if (patch.amount != null) patch.amount = Number(patch.amount);
  const { data, error } = await supabase.from('incomes').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteIncome(id) {
  const { error } = await supabase.from('incomes').delete().eq('id', id);
  if (error) throw error;
  return true;
}
