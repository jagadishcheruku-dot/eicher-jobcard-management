// Data layer for Sri Balaji Eicher Tractors.
//
// Firestore is the single source of truth. The app ships as a static bundle
// (no Express backend in production), and every user opens the same link
// without signing in, so records have to live in Firestore to survive a
// reload and to be visible to everyone.
import { db } from '../firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

const COLLECTIONS = {
  customers: 'customers',
  spares: 'spares_master',
  jobCards: 'jobcards',
  complaints: 'complaints',
  staff: 'staff',
  attendance: 'attendance',
  settings: 'settings',
  serviceCamps: 'serviceCamps',
} as const;

// Spares are stored as chunk documents (chunk_0, chunk_1, …) each holding a
// rows array, because the full parts list exceeds Firestore's 1MB per-document
// limit.
const SPARES_CHUNK_SIZE = 300;

const ok = (count: number) => ({ success: true, count });
const fail = (error: string) => ({ success: false, error });

// Firestore ids may not contain "/" and may not be empty.
const docId = (raw: any, fallback: string) => {
  const id = String(raw ?? '').trim().replace(/\//g, '_');
  return id || fallback;
};

// Firestore rejects undefined; a JSON round-trip drops those keys.
const plain = (row: any) => JSON.parse(JSON.stringify(row ?? {}));

// A row with no business key still needs a stable id, or re-uploading the same
// file would append a fresh copy of it every time.
const contentId = (row: any) => {
  const text = JSON.stringify(row ?? {});
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return `row_${(hash >>> 0).toString(36)}`;
};

// Several parts of the app ask for the same collection while the page is
// loading. Firestore bills per document, and a full job-card read is well over
// a thousand documents, so identical reads share one round trip instead of
// each paying for the whole collection again.
const READ_CACHE_MS = 60_000;
const readCache = new Map<string, { at: number; rows: Promise<any[]> }>();

async function readAll(collectionName: string): Promise<any[]> {
  const cached = readCache.get(collectionName);
  if (cached && Date.now() - cached.at < READ_CACHE_MS) return cached.rows;

  const rows = (async () => {
    try {
      if (!db) return [];
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch (err) {
      readCache.delete(collectionName);
      console.warn(`Firestore read (${collectionName}) failed:`, err);
      return [];
    }
  })();

  readCache.set(collectionName, { at: Date.now(), rows });
  return rows;
}

async function upsertAll(
  collectionName: string,
  rows: any[],
  idOf: (row: any) => any
): Promise<string[] | null> {
  try {
    if (!db) return null;
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const ref = collection(db, collectionName);
    const written: string[] = [];
    // A Firestore batch holds at most 500 writes.
    for (let start = 0; start < rows.length; start += 400) {
      const batch = writeBatch(db);
      rows.slice(start, start + 400).forEach((row, offset) => {
        const id = docId(idOf(row), contentId(row));
        written.push(id);
        batch.set(doc(ref, id), plain(row), { merge: true });
      });
      await batch.commit();
    }
    readCache.delete(collectionName);
    return written;
  } catch (err) {
    console.warn(`Firestore write (${collectionName}) failed:`, err);
    return null;
  }
}

async function deleteIds(collectionName: string, ids: string[]): Promise<boolean> {
  try {
    if (!db || ids.length === 0) return true;
    const ref = collection(db, collectionName);
    for (let start = 0; start < ids.length; start += 400) {
      const batch = writeBatch(db);
      ids.slice(start, start + 400).forEach((id) => batch.delete(doc(ref, id)));
      await batch.commit();
    }
    readCache.delete(collectionName);
    return true;
  } catch (err) {
    console.warn(`Firestore delete (${collectionName}) failed:`, err);
    return false;
  }
}

// Writes the new rows first, then drops whatever they did not cover, so a
// failed write can never leave the collection emptied.
async function replaceAllDocs(
  collectionName: string,
  rows: any[],
  idOf: (row: any) => any
): Promise<boolean> {
  const existing = (await readAll(collectionName)).map((r) => r.id);
  const written = await upsertAll(collectionName, rows, idOf);
  if (written === null) return false;
  const keep = new Set(written);
  await deleteIds(collectionName, existing.filter((id) => !keep.has(id)));
  return true;
}

async function save(
  collectionName: string,
  rows: any[],
  idOf: (row: any) => any,
  replaceAll: boolean
) {
  if (!Array.isArray(rows) || rows.length === 0) return ok(0);
  const done = replaceAll
    ? await replaceAllDocs(collectionName, rows, idOf)
    : (await upsertAll(collectionName, rows, idOf)) !== null;
  return done ? ok(rows.length) : fail(`Could not save to Firestore (${collectionName})`);
}

const ids = {
  customer: (r: any) => r.chassisNo || r.chassis || r['Chassis no'] || r.chassisKey || r.id,
  spare: (r: any) => r.partNo || r.partKey || r['Part No'] || r.id,
  jobCard: (r: any) => r.jobNo || r.onlineJobCardNo || r.id,
  complaint: (r: any) => r.id || r._id || r.complaintNo,
  staff: (r: any) => r.id || r.name,
  camp: (r: any) => r.id,
};

export const firestoreApi = {
  // Customers
  fetchCustomers: async () =>
    (await readAll(COLLECTIONS.customers)).map((r: any) => ({
      ...r,
      chassisNo: r.chassisNo || r.chassis || r['Chassis no'] || r.id,
      tractorModel: r.tractorModel || r.model || r.modelType || '',
    })),
  getCustomers: async () => firestoreApi.fetchCustomers(),

  saveCustomer: async (customer: any) =>
    save(COLLECTIONS.customers, [customer], ids.customer, false),

  bulkUpsertCustomers: async (rows: any[], replaceAll = false) =>
    save(COLLECTIONS.customers, rows, ids.customer, replaceAll),
  saveCustomersBulk: async (rows: any[], replaceAll = false) =>
    firestoreApi.bulkUpsertCustomers(rows, replaceAll),

  deleteAllCustomers: async () => {
    const existing = (await readAll(COLLECTIONS.customers)).map((r) => r.id);
    const done = await deleteIds(COLLECTIONS.customers, existing);
    return done ? ok(existing.length) : fail('Could not clear customers');
  },

  // Spares
  fetchSpares: async () =>
    (await readAll(COLLECTIONS.spares))
      .sort((a: any, b: any) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0))
      .flatMap((chunk: any) => (Array.isArray(chunk.rows) ? chunk.rows : [])),
  getSpares: async () => firestoreApi.fetchSpares(),

  saveSpare: async (spare: any) => {
    const rows = await firestoreApi.fetchSpares();
    const key = (r: any) => String(ids.spare(r) ?? '').trim();
    const index = rows.findIndex((r: any) => key(r) && key(r) === key(spare));
    if (index >= 0) rows[index] = { ...rows[index], ...spare };
    else rows.push(spare);
    return firestoreApi.bulkUpsertSpares(rows);
  },

  // The chunks are positional, so a write always republishes the whole list.
  bulkUpsertSpares: async (rows: any[]) => {
    try {
      if (!db) return fail('Firestore unavailable');
      const list = Array.isArray(rows) ? rows : [];
      const ref = collection(db, COLLECTIONS.spares);
      const existing = (await readAll(COLLECTIONS.spares)).map((r) => r.id);
      const totalChunks = Math.ceil(list.length / SPARES_CHUNK_SIZE);
      const uploadedAt = new Date().toISOString();
      for (let i = 0; i < totalChunks; i++) {
        const batch = writeBatch(db);
        batch.set(doc(ref, `chunk_${i}`), {
          chunkIndex: i,
          totalChunks,
          uploadedAt,
          rows: list.slice(i * SPARES_CHUNK_SIZE, (i + 1) * SPARES_CHUNK_SIZE).map(plain),
        });
        await batch.commit();
      }
      const keep = new Set(Array.from({ length: totalChunks }, (_, i) => `chunk_${i}`));
      await deleteIds(COLLECTIONS.spares, existing.filter((id) => !keep.has(id)));
      readCache.delete(COLLECTIONS.spares);
      return ok(list.length);
    } catch (err) {
      console.warn('Firestore write (spares) failed:', err);
      return fail('Could not save spares to Firestore');
    }
  },
  saveSparesBulk: async (rows: any[]) => firestoreApi.bulkUpsertSpares(rows),

  // Job cards
  fetchJobcards: async () => readAll(COLLECTIONS.jobCards),
  fetchJobCards: async () => firestoreApi.fetchJobcards(),
  getJobCards: async () => firestoreApi.fetchJobcards(),

  saveJobcard: async (card: any) => save(COLLECTIONS.jobCards, [card], ids.jobCard, false),
  saveJobCard: async (card: any) => firestoreApi.saveJobcard(card),

  deleteJobcard: async (id: string) => {
    const done = await deleteIds(COLLECTIONS.jobCards, [docId(id, '')].filter(Boolean));
    return done ? ok(1) : fail('Could not delete job card');
  },
  deleteJobCard: async (id: string) => firestoreApi.deleteJobcard(id),

  bulkUpsertJobcards: async (cards: any[], replaceAll = false) =>
    save(COLLECTIONS.jobCards, cards, ids.jobCard, replaceAll),
  saveJobCardsBulk: async (cards: any[], replaceAll = false) =>
    firestoreApi.bulkUpsertJobcards(cards, replaceAll),

  bulkDeleteJobcards: async (cardIds: string[]) => {
    const done = await deleteIds(
      COLLECTIONS.jobCards,
      (cardIds || []).map((id) => docId(id, '')).filter(Boolean)
    );
    return done ? ok(cardIds.length) : fail('Could not delete job cards');
  },

  // Complaints
  fetchComplaints: async () => readAll(COLLECTIONS.complaints),
  getComplaints: async () => firestoreApi.fetchComplaints(),

  saveComplaint: async (complaint: any) =>
    save(COLLECTIONS.complaints, [complaint], ids.complaint, false),

  deleteComplaint: async (id: string) => {
    const done = await deleteIds(COLLECTIONS.complaints, [docId(id, '')].filter(Boolean));
    return done ? ok(1) : fail('Could not delete complaint');
  },

  bulkUpsertComplaints: async (complaints: any[], replaceAll = false) =>
    save(COLLECTIONS.complaints, complaints, ids.complaint, replaceAll),
  saveComplaintsBulk: async (complaints: any[], replaceAll = false) =>
    firestoreApi.bulkUpsertComplaints(complaints, replaceAll),

  // Staff
  fetchStaff: async () =>
    (await readAll(COLLECTIONS.staff)).map((r: any) => ({
      ...r,
      role: r.role || 'mechanic',
      active: r.active === undefined ? true : r.active === true || r.active === 'true',
    })),
  getStaff: async () => firestoreApi.fetchStaff(),

  saveStaff: async (staff: any) => save(COLLECTIONS.staff, [staff], ids.staff, false),

  deleteStaff: async (id: string) => {
    const done = await deleteIds(COLLECTIONS.staff, [docId(id, '')].filter(Boolean));
    return done ? ok(1) : fail('Could not delete staff member');
  },

  bulkUpsertStaff: async (staff: any[], replaceAll = false) =>
    save(COLLECTIONS.staff, staff, ids.staff, replaceAll),
  saveStaffBulk: async (staff: any[], replaceAll = false) =>
    firestoreApi.bulkUpsertStaff(staff, replaceAll),

  // Attendance — one document per date, returned as { [date]: records }.
  fetchAttendance: async () => {
    const days = await readAll(COLLECTIONS.attendance);
    const byDate: Record<string, any> = {};
    days.forEach(({ id, ...rest }: any) => {
      byDate[id] = rest.records ?? rest;
    });
    return byDate;
  },
  getAttendance: async () => firestoreApi.fetchAttendance(),

  saveAttendance: async (date: string, records: any) => {
    if (!date) return fail('Attendance needs a date');
    const done = await upsertAll(COLLECTIONS.attendance, [{ date, records }], () => date);
    return done !== null ? ok(1) : fail('Could not save attendance');
  },

  // App settings — one document per key, returned as { [key]: value }.
  fetchSettings: async () => {
    const rows = await readAll(COLLECTIONS.settings);
    const settings: Record<string, string> = {};
    rows.forEach(({ id, value }: any) => {
      if (value !== undefined) settings[id] = value;
    });
    return settings;
  },
  getSettings: async () => firestoreApi.fetchSettings(),

  saveSettings: async (key: string, value: string) => {
    if (!key) return fail('Setting needs a key');
    const done = await upsertAll(COLLECTIONS.settings, [{ value }], () => key);
    return done !== null ? ok(1) : fail('Could not save setting');
  },

  // Wipes every collection. Only reachable from the guarded "clear all data"
  // admin button.
  clearAllData: async () => {
    const names = Object.values(COLLECTIONS);
    const results = await Promise.all(
      names.map(async (name) => {
        const existing = (await readAll(name)).map((r) => r.id);
        return deleteIds(name, existing);
      })
    );
    return results.every(Boolean) ? ok(names.length) : fail('Could not clear every collection');
  },

  // Master backup — every collection in one payload.
  fetchMasterBackup: async () => {
    const [customers, spares, jobCards, complaints, staff, serviceCamps] = await Promise.all([
      readAll(COLLECTIONS.customers),
      readAll(COLLECTIONS.spares),
      readAll(COLLECTIONS.jobCards),
      readAll(COLLECTIONS.complaints),
      readAll(COLLECTIONS.staff),
      readAll(COLLECTIONS.serviceCamps),
    ]);
    const attendance = await firestoreApi.fetchAttendance();
    return {
      success: true,
      data: { customers, spares, jobCards, complaints, staff, serviceCamps, attendance },
    };
  },

  // Service camps
  fetchServiceCamps: async () =>
    (await readAll(COLLECTIONS.serviceCamps)).map((r: any) => ({
      ...r,
      dealershipCode: r.dealershipCode || '4731',
      status: r.status || 'Upcoming',
    })),
  getServiceCamps: async () => firestoreApi.fetchServiceCamps(),

  saveServiceCamp: async (camp: any) =>
    save(COLLECTIONS.serviceCamps, [camp], ids.camp, false),

  deleteServiceCamp: async (id: string) => {
    const done = await deleteIds(COLLECTIONS.serviceCamps, [docId(id, '')].filter(Boolean));
    return done ? ok(1) : fail('Could not delete service camp');
  },

  bulkUpsertServiceCamps: async (camps: any[], replaceAll = false) =>
    save(COLLECTIONS.serviceCamps, camps, ids.camp, replaceAll),
};

export const firestoreService = firestoreApi;
