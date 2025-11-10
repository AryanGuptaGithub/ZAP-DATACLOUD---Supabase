// src/lib/incomes.js
import { supabase } from "@/lib/supabaseClient";

/**
 * List incomes with optional date range and limit.
 * Returns raw DB rows (the UI normalizes/mapping later).
 *
 * @param {Object} [opts]
 * @param {string} [opts.from] - ISO date string inclusive (gte)
 * @param {string} [opts.to] - ISO date string inclusive (lte)
 * @param {number} [opts.limit=200]
 * @param {string} [opts.owner_id] - optional owner filter (if you use owner_id)
 * @returns {Promise<Array<Object>>}
 */
export async function listIncomes({ from, to, limit = 200, owner_id } = {}) {
  let q = supabase
    .from("incomes")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);

  if (from) q = q.gte("date", from);
  if (to) q = q.lte("date", to);
  if (owner_id) q = q.eq("owner_id", owner_id);

  const { data, error } = await q;
  if (error) throw error;

  // return raw rows (UI will normalize / map)
  return data ?? [];
}

/**
 * Create a new income row.
 * Accepts payload keys:
 *  - customer (or customer_name)
 *  - amount
 *  - date
 *  - remark
 *  - uploaded_path (path returned by storage)
 *  - owner_id (optional)
 *
 * Returns the inserted DB row.
 */


export async function createIncome(payload = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const owner_id = session?.user?.id ?? null;

  const row = {
    customer_name: payload.customer ?? null,
    amount: Number(payload.amount) || 0,
    date: payload.date ?? null,
    remark: payload.remark ?? null,
    uploaded_path: payload.uploaded_path ?? null,
    owner_id,
    client_id: null, // ✅ explicitly set null to avoid FK issue
  };

  const { data, error } = await supabase
    .from("incomes")
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return data;
}


/**
 * Update an existing income row by id.
 * patch can contain the same keys as createIncome accepts (customer, amount, date, remark, uploaded_path)
 *
 * Returns updated row.
 */
export async function updateIncome(id, patch = {}) {
  if (!id) throw new Error("Missing id for updateIncome");

  const updates = {};
  if (patch.customer !== undefined) updates.customer_name = patch.customer;
  if (patch.customer_name !== undefined) updates.customer_name = patch.customer_name;
  if (patch.amount !== undefined) updates.amount = patch.amount !== null ? Number(patch.amount) : null;
  if (patch.date !== undefined) updates.date = patch.date;
  if (patch.remark !== undefined) updates.remark = patch.remark;
  if (patch.uploaded_path !== undefined) updates.uploaded_path = patch.uploaded_path;
  if (patch.uploaded !== undefined) updates.uploaded_path = patch.uploaded;
  if (patch.owner_id !== undefined) updates.owner_id = patch.owner_id;

  const { data, error } = await supabase
    .from("incomes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an income row by id.
 * Returns the deleted row (if DB returns it) or true on success.
 */
export async function deleteIncome(id) {
  if (!id) throw new Error("Missing id for deleteIncome");

  const { data, error } = await supabase.from("incomes").delete().eq("id", id).select().single();
  if (error) throw error;
  return data ?? true;
}
