// Live updates from Supabase, shaped like the Firestore snapshots the screens
// were written against, so the listeners in App.tsx keep their existing
// bodies: a snapshot exposes `empty` and `forEach`, and each doc an `id` and
// `data()`.
import { supabase } from './supabase';
import { readTableRows } from './supabaseService';

export type LiveRef = { table: string };
type LiveDoc = { id: string; data: () => any };
type LiveSnapshot = { empty: boolean; forEach: (cb: (doc: LiveDoc) => void) => void };

export const liveCollection = (table: string): LiveRef => ({ table });

// Rows that keep their record in a jsonb `data` column read back as that
// record; the rest (attendance, settings) are handed over as stored.
const asDoc = (row: any): LiveDoc => ({
  id: row.id,
  data: () => (row.data && typeof row.data === 'object' ? { ...row.data, id: row.id } : row),
});

const asSnapshot = (rows: any[]): LiveSnapshot => ({
  empty: rows.length === 0,
  forEach: (cb) => rows.map(asDoc).forEach(cb),
});

// A bulk upload fires a change per row, so re-reads are coalesced.
const SETTLE_MS = 600;

export function onLiveSnapshot(
  ref: LiveRef,
  onNext: (snapshot: LiveSnapshot) => void,
  onError?: (err: any) => void
) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const emit = async () => {
    try {
      const rows = await readTableRows(ref.table);
      if (!stopped) onNext(asSnapshot(rows));
    } catch (err) {
      if (!stopped) onError?.(err);
    }
  };

  emit();

  const channel = supabase
    .channel(`live:${ref.table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: ref.table },
      () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(emit, SETTLE_MS);
      }
    )
    .subscribe();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    supabase.removeChannel(channel);
  };
}
