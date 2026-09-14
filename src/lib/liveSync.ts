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

// A burst of changes — a bulk upload sends one per row — is coalesced into a
// single render.
const SETTLE_MS = 400;

export function onLiveSnapshot(
  ref: LiveRef,
  onNext: (snapshot: LiveSnapshot) => void,
  onError?: (err: any) => void
) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  // The table is read once and then kept up to date from the change events
  // themselves. Re-reading it on every change would have every open browser
  // pull all 1458 job cards each time one of them was edited.
  let rows: any[] = [];
  const indexOf = new Map<string, number>();

  const reindex = () => {
    indexOf.clear();
    rows.forEach((row, i) => indexOf.set(String(row.id), i));
  };

  const publish = () => {
    if (!stopped) onNext(asSnapshot(rows));
  };

  const schedulePublish = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(publish, SETTLE_MS);
  };

  const apply = (payload: any) => {
    const row = payload.new && Object.keys(payload.new).length ? payload.new : null;
    const gone = payload.old ?? null;

    if (payload.eventType === 'DELETE' || (!row && gone)) {
      const id = String(gone?.id ?? '');
      const at = indexOf.get(id);
      if (at !== undefined) {
        rows.splice(at, 1);
        reindex();
        schedulePublish();
      }
      return;
    }
    if (!row) return;

    const id = String(row.id);
    const at = indexOf.get(id);
    if (at === undefined) {
      indexOf.set(id, rows.length);
      rows.push(row);
    } else {
      rows[at] = row;
    }
    schedulePublish();
  };

  const load = async () => {
    try {
      rows = await readTableRows(ref.table);
      reindex();
      publish();
    } catch (err) {
      if (!stopped) onError?.(err);
    }
  };

  load();

  const channel = supabase
    .channel(`live:${ref.table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: ref.table },
      apply
    )
    .subscribe((status) => {
      // A dropped connection can miss changes, so the table is re-read once
      // the subscription comes back rather than left to drift.
      if (status === 'SUBSCRIBED' && rows.length > 0) load();
    });

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    supabase.removeChannel(channel);
  };
}
