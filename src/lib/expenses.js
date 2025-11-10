// src/lib/expenses.js
import { supabase } from "@/lib/supabaseClient";

/** listExpenses({ from, to, limit, owner_id }) */
export async function listExpenses({ from, to, limit = 200, owner_id } = {}) {
  let q = supabase.from("expenses").select("*").order("date", { ascending: false }).limit(limit);
  if (from) q = q.gte("date", from);
  if (to) q = q.lte("date", to);
  if (owner_id) q = q.eq("owner_id", owner_id);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((r) => ({
  id: r.id,
  customer: r.customer_name ?? "",
  amount: r.amount ?? 0,
  date: r.date ?? "",
  category: r.category ?? "",
  remark: r.remark ?? "",
  uploaded: r.uploaded_path ?? "",
  client_id: r.client_id ?? null,
  owner_id: r.owner_id ?? null,
  __raw: r,
}));

}


// normalize a DB row into the UI row shape
function normalizeExpense(r) {
  return {
    id: r.id,
    customer: (r.customer_name ?? r.name ?? "").toString(),
    amount: r.amount ?? 0,
    date: r.date ?? "",
    category: r.category ?? "",
    remark: r.remark ?? "",
    uploaded: r.uploaded_path ?? r.uploaded ?? "",
    client_id: r.client_id ?? null,
    owner_id: r.owner_id ?? null,
    __raw: r,
  };
}


/** createExpense(payload) */
export async function createExpense(payload = {}) {
  const { data: { session } = {} } = await supabase.auth.getSession();
  const owner_id = session?.user?.id ?? null;

 
const row = {
  customer_name: payload.customer ?? payload.name ?? null,
  amount: Number(payload.amount) || 0,
  date: payload.date ?? null,
  category: payload.category ?? null,      // safe: sends null if not provided
  remark: payload.remark ?? null,
  uploaded_path: payload.uploaded ?? null,
  owner_id, client_id: payload.client_id ?? null,
};


  // inside onSave when inserting a new expense
const { data, error } = await supabase
  .from("expenses")
  .insert([row])
  .select()
  .single();

if (error) throw error;

// normalize the inserted DB row before storing it in local state
const updatedNormalized = normalizeExpense(data);
setRows(prev => prev.map(r => (r.id === updatedNormalized.id ? updatedNormalized : r)));

toast.success("Expense added");

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
