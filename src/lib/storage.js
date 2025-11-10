// src/lib/storage.js
import { supabase } from "@/lib/supabaseClient";

/**
 * Upload a file to Supabase Storage.
 *
 * @param {File|Blob} file - file object from <input type="file">
 * @param {Object} [opts]
 * @param {string} [opts.bucket='invoices'] - storage bucket id
 * @param {string} [opts.folder=''] - optional subfolder inside bucket
 * @param {boolean} [opts.upsert=false] - whether to overwrite if same path exists
 * @returns {Promise<{ path: string, publicUrl: string | null }>}
 */
export async function uploadInvoice(file, { bucket = "invoices", folder = "", upsert = false } = {}) {
  if (!file) return null;
  // sanitize filename and add timestamp prefix to avoid collisions
  const safeName = String(file.name).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
  const filename = `${Date.now()}_${safeName}`;
  const path = folder ? `${folder}/${filename}` : filename;

  // upload
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert,
  });

  if (uploadError) {
    console.error("Supabase storage upload error:", uploadError);
    throw uploadError;
  }

  // try to get public url (works for public buckets)
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = publicData?.publicUrl ?? null;

  return { path, publicUrl };
}

/**
 * Get public URL for a stored object.
 * (Works only for public buckets.)
 * @param {string} path
 * @param {{bucket?: string}} opts
 * @returns {{ publicUrl: string | null }}
 */
export function getPublicUrl(path, { bucket = "invoices" } = {}) {
  if (!path) return { publicUrl: null };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data?.publicUrl ?? null };
}

/**
 * Create a signed URL for a private bucket object.
 * @param {string} path
 * @param {number} ttlSeconds - how long the signed url is valid (e.g. 60)
 * @param {{bucket?: string}} opts
 * @returns {Promise<{ signedUrl: string }>}
 */
export async function createSignedUrl(path, ttlSeconds = 60, { bucket = "invoices" } = {}) {
  if (!path) return { signedUrl: null };
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (error) throw error;
  return { signedUrl: data?.signedUrl ?? null };
}

/**
 * Delete a file from storage
 * @param {string} path
 * @param {{bucket?: string}} opts
 * @returns {Promise<void>}
 */
export async function deleteFile(path, { bucket = "invoices" } = {}) {
  if (!path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
