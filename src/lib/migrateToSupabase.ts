// One-off move of the workshop's records from Firestore to Supabase.
//
// It runs in the browser because that is the only place both services are
// reachable. Every step is an upsert keyed on the record's business id, so
// running it twice updates rows rather than duplicating them, and a run that
// dies partway can simply be started again.
import { firestoreApi } from './firestoreService';
import { supabaseApi } from './supabaseService';

type Step = {
  label: string;
  read: () => Promise<any[]>;
  write: (rows: any[]) => Promise<any>;
};

const STEPS: Step[] = [
  {
    label: 'customers',
    read: () => firestoreApi.getCustomers(),
    write: (rows) => supabaseApi.bulkUpsertCustomers(rows),
  },
  {
    label: 'job cards',
    read: () => firestoreApi.getJobCards(),
    write: (rows) => supabaseApi.bulkUpsertJobcards(rows),
  },
  {
    label: 'spares',
    read: () => firestoreApi.getSpares(),
    write: (rows) => supabaseApi.bulkUpsertSpares(rows),
  },
  {
    label: 'staff',
    read: () => firestoreApi.getStaff(),
    write: (rows) => supabaseApi.bulkUpsertStaff(rows),
  },
  {
    label: 'complaints',
    read: () => firestoreApi.getComplaints(),
    write: (rows) => supabaseApi.bulkUpsertComplaints(rows),
  },
  {
    label: 'service camps',
    read: () => firestoreApi.getServiceCamps(),
    write: (rows) => supabaseApi.bulkUpsertServiceCamps(rows),
  },
];

export async function migrateToSupabase() {
  const summary: Record<string, string> = {};
  console.log('Moving records from Firestore to Supabase…');

  for (const step of STEPS) {
    try {
      const rows = await step.read();
      if (!rows.length) {
        summary[step.label] = 'nothing to move';
        console.log(`  ${step.label}: nothing to move`);
        continue;
      }
      const result: any = await step.write(rows);
      if (result?.success) {
        summary[step.label] = `${rows.length} moved`;
        console.log(`  ${step.label}: ${rows.length} moved`);
      } else {
        summary[step.label] = `failed — ${result?.error ?? 'unknown error'}`;
        console.error(`  ${step.label}: failed —`, result?.error);
      }
    } catch (err) {
      summary[step.label] = `failed — ${err}`;
      console.error(`  ${step.label}: failed —`, err);
    }
  }

  try {
    const attendance = await firestoreApi.getAttendance();
    const dates = Object.keys(attendance || {});
    for (const date of dates) {
      await supabaseApi.saveAttendance(date, (attendance as any)[date]);
    }
    summary.attendance = `${dates.length} day(s) moved`;
  } catch (err) {
    summary.attendance = `failed — ${err}`;
  }

  console.log('Done. Reload the page to start using Supabase.');
  console.table(summary);
  return summary;
}

// Exposed so the migration can be started from the browser console without
// adding a button that would outlive the move.
(window as any).migrateToSupabase = migrateToSupabase;
