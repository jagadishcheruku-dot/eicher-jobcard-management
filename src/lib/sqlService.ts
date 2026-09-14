// The app's data layer.
//
// Records are moving from Firestore to Supabase. Supabase takes over as soon
// as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set; until then the
// Firestore implementation keeps serving, so a deploy made before the
// environment variables exist changes nothing for the workshop.
import { isSupabaseConfigured } from './supabase';
import { supabaseApi } from './supabaseService';
import { firestoreApi } from './firestoreService';

export const sqlApi = isSupabaseConfigured ? supabaseApi : firestoreApi;
export const sqlService = sqlApi;
export const activeBackend = isSupabaseConfigured ? 'supabase' : 'firestore';

console.log(`Data backend: ${activeBackend}`);
