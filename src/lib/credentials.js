import { supabase } from "@/lib/supabaseClient";

// credentials: id, owner_id, client_name, type, provider, portal_url, login, service_name, expiry(date), notes, created_at
// upcoming_renewals (view): client_name, type, provider, service_name, expiry, days_left

export async function listCredentials({ search = "", limit = 200 } = {}) {
  let q = supabase
    .from("credentials")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (search?.trim()) q = q.ilike("client_name", `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/**
 * Create credential - ensures owner_id is set and type is normalized
 */
export async function createCredential(payload) {
  const typeMap = {
    Domain: "domain",
    Hosting: "hosting",
    Email: "email",
    Other: "other",
  };

  // Get current user
  const { data: { session } = {} } = await supabase.auth.getSession();
  const owner_id = session?.user?.id ?? null;

  // ---- STRICT TYPE VALIDATION ----
  const rawType = payload.type;
  const mappedType = typeMap[rawType];
  const normalizedType = mappedType ?? (rawType ? rawType.toLowerCase() : null);

  const validTypes = ["domain", "hosting", "email", "other"];
  if (!validTypes.includes(normalizedType)) {
    throw new Error(
      `Invalid type "${rawType}". Must be one of: Domain, Hosting, Email, Other.`
    );
  }
  // --------------------------------

  const normalized = {
    owner_id,
    client_name: payload.client, // ← FIX
    type: normalizedType,
    provider: payload.provider,
    portal_url: payload.url, // ← FIX
    login: payload.login,
    password: payload.password,
    service_name: payload.serviceName, // ← FIX
    expiry: payload.expiry,
    notes: payload.notes,
  };

  const { data, error } = await supabase
    .from("credentials")
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
    Domain: "domain",
    Hosting: "hosting",
    Email: "email",
    Other: "other",
  };

  // ---- STRICT TYPE VALIDATION (only if type is in patch) ----
  let normalizedType = undefined;
  if (patch.type !== undefined) {
    const rawType = patch.type;
    const mappedType = typeMap[rawType];
    normalizedType = mappedType ?? (rawType ? rawType.toLowerCase() : null);

    const validTypes = ["domain", "hosting", "email", "other"];
    if (!validTypes.includes(normalizedType)) {
      throw new Error(
        `Invalid type "${rawType}". Must be one of: Domain, Hosting, Email, Other.`
      );
    }
  }
  // -----------------------------------------------------------

  const normalizedPatch = {
    ...(patch.client && { client_name: patch.client }),
    ...(patch.url && { portal_url: patch.url }),
    ...(patch.serviceName && { service_name: patch.serviceName }),
    ...(patch.password !== undefined && { password: patch.password }),
    ...(patch.login && { login: patch.login }),
    ...(patch.provider && { provider: patch.provider }),
    ...(normalizedType !== undefined && { type: normalizedType }),
    ...(patch.expiry && { expiry: patch.expiry }),
    ...(patch.notes && { notes: patch.notes }),
  };

  const { data, error } = await supabase
    .from("credentials")
    .update(normalizedPatch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCredential(id) {
  const { error } = await supabase.from("credentials").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function listUpcomingRenewals() {
  const { data, error } = await supabase
    .from("upcoming_renewals")
    .select("*")
    .order("expiry", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
