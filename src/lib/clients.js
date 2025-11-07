// clients.jsx
import { supabase } from "@/lib/supabaseClient";

// map UI -> DB
// If your final column names differ, update these maps:

function toDb(row) {
  return {
    client_name: row.clientName ?? null,
    company_name: row.companyName ?? null,
    client_designation: row.clientDesignation ?? null,
    company_address: row.companyAddress ?? null,
    city: row.city ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    gstin: row.gstin ?? null,
  };
}

function fromDb(row) {
  return {
    id: row.id,
    created_at: row.created_at,
    clientName: row.client_name,
    companyName: row.company_name,
    clientDesignation: row.client_designation,
    companyAddress: row.company_address,
    city: row.city,
    phone: row.phone,
    email: row.email,
    gstin: row.gstin,
  };
}


/** Get all clients */
export async function listClients() {
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, created_at, client_name, company_name, client_designation, company_address, city, phone, email, gstin"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromDb);
}

/** Create client */
export async function createClient(payload) {
  const { data, error } = await supabase
    .from("clients")
    .insert(toDb(payload))
    .select(
      "id, created_at, client_name, company_name, client_designation, company_address, city, phone, email, gstin"
    )
    .single();
  if (error) throw error;
  return fromDb(data);
}

/** Update client */
export async function updateClient(id, payload) {
  const { data, error } = await supabase
    .from("clients")
    .update(toDb(payload))
    .eq("id", id)
    .select(
      "id, created_at, client_name, company_name, client_designation, company_address, city, phone, email, gstin"
    )
    .single();
  if (error) throw error;
  return fromDb(data);
}

/** Delete client */
export async function deleteClient(id) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
  return true;
}
