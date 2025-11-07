import { supabase } from '@/lib/supabaseClient';


// credentials: id, owner_id, client_name, type, provider, portal_url, login, service_name, expiry(date), notes, created_at

// upcoming_renewals (view): client_name, type, provider, service_name, expiry, days_left

export async function listCredentials({ search = '', limit = 200 } = {}) {
  let q = supabase.from('credentials').select('*').order('created_at', { ascending: false }).limit(limit);
  if (search?.trim()) q = q.ilike('client_name', `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createCredential(payload) {
  const { data, error } = await supabase.from('credentials').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function updateCredential(id, patch) {
  const { data, error } = await supabase.from('credentials').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCredential(id) {
  const { error } = await supabase.from('credentials').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function listUpcomingRenewals() {
  const { data, error } = await supabase.from('upcoming_renewals').select('*').order('expiry', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
