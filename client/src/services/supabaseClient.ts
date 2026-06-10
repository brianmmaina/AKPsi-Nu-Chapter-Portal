import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

const url = import.meta?.env?.VITE_SUPABASE_URL;
const anonKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY;

if (url && anonKey) {
  client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

export const getSupabaseClient = () => client;

