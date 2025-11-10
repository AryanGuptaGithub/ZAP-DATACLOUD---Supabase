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


// ... other functions unchanged ...

/**
 * Create credential - ensures owner_id is set and type is normalized
 */
export async function createCredential(payload) {
  // normalize enum-safe values for `type`
  const typeMap = {
    Domain: 'domain',
    Hosting: 'hosting',
    Email: 'email',
    Other: 'other',
  };

  // get session user id
  const { data: { session } = {} } = await supabase.auth.getSession();
  const owner_id = session?.user?.id ?? null;

  const normalized = {
    ...payload,
    type: typeMap[payload.type] ?? payload.type?.toLowerCase() ?? null,
    owner_id, // attach owner (important when DB has NOT NULL)
  };

  const { data, error } = await supabase
    .from('credentials')
    .insert([normalized])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update credential - normalizes type if present and doesn't drop owner_id
 */
export async function updateCredential(id, patch) {
  const typeMap = {
    Domain: 'domain',
    Hosting: 'hosting',
    Email: 'email',
    Other: 'other',
  };

  const normalizedPatch = {
    ...patch,
    ...(patch.type && { type: typeMap[patch.type] ?? patch.type?.toLowerCase() }),
  };

  const { data, error } = await supabase
    .from('credentials')
    .update(normalizedPatch)
    .eq('id', id)
    .select()
    .single();

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


