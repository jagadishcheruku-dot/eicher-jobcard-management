import { createClient } from '@supabase/supabase-js';

// The publishable key is meant to ship in the client bundle: it grants only
// what the row level security policies allow. Environment variables override
// it so a different project can be pointed at without a code change.
const DEFAULT_URL = 'https://cpgwveltwuoniwzgfhwo.supabase.co';
const DEFAULT_KEY = 'sb_publishable_DuIbPusPTliL1jpTWLcveg_qgRQ53ci';

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

// The app only commits to Supabase once the records are actually there. An
// unreachable project, a missing table, a rejected key — or tables that exist
// but are still empty because the migration has not been run — all mean the
// Firestore path should keep serving, so the workshop never opens the app to
// blank screens mid-migration. Once the data lands, the next load switches
// over on its own.
export async function isSupabaseReady(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('job_cards').select('id').limit(1);
    if (error) {
      console.warn('Supabase unavailable, staying on Firestore:', error.message);
      return false;
    }
    if (!data || data.length === 0) {
      console.warn('Supabase has no job cards yet, staying on Firestore. Run migrateToSupabase() to move the data.');
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase unreachable, staying on Firestore:', err);
    return false;
  }
}
