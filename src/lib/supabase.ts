import { createClient } from '@supabase/supabase-js';

// The publishable key is meant to ship in the client bundle: it grants only
// what the row level security policies allow. Environment variables override
// it so a different project can be pointed at without a code change.
const DEFAULT_URL = 'https://cpgwveltwuoniwzgfhwo.supabase.co';
const DEFAULT_KEY = 'sb_publishable_xIhr-lmqpKbh3khMR2qbiA_ngVLX9Sc';

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

// Supabase takes over as soon as its tables answer. An unreachable project, a
// missing table or a rejected key all mean the Firestore path should keep
// serving instead, so a deploy that lands before the schema is applied changes
// nothing for the workshop.
//
// The tables start empty and are filled by re-uploading the Excel sheets, so
// an empty table is a ready one — waiting for rows here would leave uploads
// writing to Firestore forever.
export async function isSupabaseReady(): Promise<boolean> {
  try {
    const { error } = await supabase.from('job_cards').select('id').limit(1);
    if (error) {
      console.warn('Supabase unavailable, staying on Firestore:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase unreachable, staying on Firestore:', err);
    return false;
  }
}
