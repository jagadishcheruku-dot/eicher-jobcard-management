// The app cached the Firestore-era records in localStorage and IndexedDB and
// hydrates from them on mount. After the move to Supabase those copies would
// show up next to the new rows, so they are cleared once per browser.
import { isSupabaseConfigured } from './supabase';

const DONE_KEY = 'sri_supabase_cutover_v1';

const LEGACY_KEYS = [
  'jobcard_sg_customer_v2',
  'jobcard_sg_spares_v2',
  'sri_backup_jobcards',
  'sri_backup_complaints',
  'sri_backup_staff',
  'sri_job_cards_backup',
  'sri_service_camps_backup',
  'sri_staff_attendance_data',
  'sri_customers_cleared',
  'sri_all_customers',
  'sri_all_jobcards',
  'sri_all_complaints',
];

const IDB_NAME = 'SgJobcardStorageDB_v1';

export function clearLegacyCache() {
  if (!isSupabaseConfigured) return;
  try {
    if (localStorage.getItem(DONE_KEY) === 'done') return;
  } catch {
    return;
  }

  LEGACY_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });

  try {
    indexedDB.deleteDatabase(IDB_NAME);
  } catch {}

  try {
    localStorage.setItem(DONE_KEY, 'done');
  } catch {}

  console.log('Cleared the cached Firestore records; Supabase is the source now.');
}

clearLegacyCache();
