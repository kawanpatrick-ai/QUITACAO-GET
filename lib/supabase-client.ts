import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

let client: SupabaseClient<Database> | null = null;

export function getClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  if (!client) {
    client = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return client;
}
