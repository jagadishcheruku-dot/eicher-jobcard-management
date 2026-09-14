// The app's data layer.
//
// Records are moving from Firestore to Supabase. Supabase takes over only once
// its tables answer a probe, so a deploy that lands before the migration has
// run keeps serving from Firestore rather than showing empty screens.
import { isSupabaseConfigured, isSupabaseReachable } from './supabase';
import { supabaseApi } from './supabaseService';
import { firestoreApi } from './firestoreService';

type DataApi = typeof firestoreApi;

let resolving: Promise<DataApi> | null = null;
let resolved: 'supabase' | 'firestore' | 'pending' = 'pending';

async function backend(): Promise<DataApi> {
  if (!isSupabaseConfigured) {
    resolved = 'firestore';
    return firestoreApi;
  }
  if (!resolving) {
    resolving = isSupabaseReachable().then((reachable) => {
      resolved = reachable ? 'supabase' : 'firestore';
      console.log(`Data backend: ${resolved}`);
      return (reachable ? supabaseApi : firestoreApi) as DataApi;
    });
  }
  return resolving;
}

export const activeBackend = () => resolved;

// Every method on the data layer is async, so calls can be forwarded once the
// probe settles without each one being written out twice.
export const sqlApi = new Proxy({} as DataApi, {
  get:
    (_target, method: string) =>
    async (...args: any[]) => {
      const api = (await backend()) as any;
      const fn = api[method];
      if (typeof fn !== 'function') {
        throw new TypeError(`sqlService has no method "${method}"`);
      }
      return fn(...args);
    },
});

export const sqlService = sqlApi;
