// The app's data layer. Supabase is the only backend now - the earlier
// Firestore fallback was removed along with the Firebase project.
import { supabaseApi } from './supabaseService';

export const activeBackend = () => 'supabase' as const;

export const sqlApi = supabaseApi;

export const sqlService = sqlApi;
