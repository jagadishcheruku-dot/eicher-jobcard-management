// Data layer for Sri Balaji Eicher Tractors, backed by Supabase (Postgres).
//
// The app is a static bundle with no backend of its own, and the workshop
// shares one link without signing in, so records live in Supabase: they
// survive a reload and every viewer sees the same rows.
//
// Uploads come from Excel sheets whose columns vary, so each table keeps the
// whole record in a jsonb `data` column and promotes only the fields worth
// indexing.
import { supabase } from './supabase';

type TableName =
  | 'customers'
  | 'job_cards'
  | 'complaints'
  | 'spares'
  | 'staff'
  | 'service_camps';

// Columns mirrored out of `data` so Postgres can index them.
const PROMOTED: Record<TableName, string[]> = {
  customers: ['chassis_no', 'cust_name', 'village', 'mandal', 'owner_mob'],
  job_cards: ['job_no', 'job_date', 'status', 'chassis_no', 'cust_name', 'branch'],
  complaints: ['complaint_no', 'status', 'chassis_no'],
  spares: ['part_no', 'part_desc'],
  staff: ['name', 'role'],
  service_camps: ['camp_date', 'status'],
};

// Where each promoted column reads from on an app record.
const FIELD_SOURCES: Record<string, string[]> = {
  chassis_no: ['chassisNo', 'chassis', 'Chassis no'],
  cust_name: ['custName', 'customerName', 'Customer Name'],
  village: ['village', 'Village'],
  mandal: ['mandal', 'Mandal'],
  owner_mob: ['ownerMob', 'mobileNumber', 'phone'],
  job_no: ['jobNo', 'onlineJobCardNo'],
  job_date: ['jobDate', 'complaintDate'],
  status: ['status'],
  branch: ['branch'],
  complaint_no: ['complaintNo'],
  part_no: ['partNo', 'partKey', 'Part No'],
  part_desc: ['partDesc', 'Part Desc'],
  name: ['name'],
  role: ['role'],
  camp_date: ['campDate'],
};

const ids: Record<TableName, (row: any) => any> = {
  customers: (r) => r.chassisNo || r.chassis || r['Chassis no'] || r.chassisKey || r.id,
  job_cards: (r) => r.jobNo || r.onlineJobCardNo || r.id,
  complaints: (r) => r.id || r._id || r.complaintNo,
  spares: (r) => r.partNo || r.partKey || r['Part No'] || r.id,
  staff: (r) => r.id || r.name,
  service_camps: (r) => r.id,
};

const ok = (count: number) => ({ success: true, count });
const fail = (error: string) => ({ success: false, error });

const pick = (record: any, column: string) => {
  for (const key of FIELD_SOURCES[column] || []) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return null;
};

// A record with no business key still needs a stable id, or re-uploading the
// same file would append a fresh copy of it every time.
const contentId = (record: any) => {
  const text = JSON.stringify(record ?? {});
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return `row_${(hash >>> 0).toString(36)}`;
};

const rowId = (table: TableName, record: any) => {
  const raw = String(ids[table](record) ?? '').trim();
  return raw || contentId(record);
};

const toRow = (table: TableName, record: any) => {
  const row: Record<string, any> = {
    id: rowId(table, record),
    data: record ?? {},
    updated_at: new Date().toISOString(),
  };
  PROMOTED[table].forEach((column) => {
    row[column] = pick(record, column);
  });
  return row;
};

const toRecord = (row: any) => ({ ...(row?.data ?? {}), id: row?.id });

// Several parts of the app ask for the same table while the page is loading;
// identical reads share one round trip.
const READ_CACHE_MS = 60_000;
const readCache = new Map<string, { at: number; rows: Promise<any[]> }>();

// PostgREST caps a response at 1000 rows, so a plain select would silently
// truncate the job card and spares tables.
const PAGE_SIZE = 1000;

async function readAll(table: string): Promise<any[]> {
  const cached = readCache.get(table);
  if (cached && Date.now() - cached.at < READ_CACHE_MS) return cached.rows;

  const rows = (async () => {
    try {
      const all: any[] = [];
      for (let page = 0; ; page++) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
        if (error) throw error;
        all.push(...(data ?? []));
        if (!data || data.length < PAGE_SIZE) break;
      }
      return all;
    } catch (err) {
      readCache.delete(table);
      console.warn(`Supabase read (${table}) failed:`, err);
      return [];
    }
  })();

  readCache.set(table, { at: Date.now(), rows });
  return rows;
}

const WRITE_CHUNK = 500;

async function upsertRows(table: string, rows: any[]): Promise<boolean> {
  try {
    for (let start = 0; start < rows.length; start += WRITE_CHUNK) {
      const { error } = await supabase
        .from(table)
        .upsert(rows.slice(start, start + WRITE_CHUNK), { onConflict: 'id' });
      if (error) throw error;
    }
    readCache.delete(table);
    return true;
  } catch (err) {
    console.warn(`Supabase write (${table}) failed:`, err);
    return false;
  }
}

async function deleteIds(table: string, rowIds: string[]): Promise<boolean> {
  try {
    for (let start = 0; start < rowIds.length; start += WRITE_CHUNK) {
      const { error } = await supabase
        .from(table)
        .delete()
        .in('id', rowIds.slice(start, start + WRITE_CHUNK));
      if (error) throw error;
    }
    readCache.delete(table);
    return true;
  } catch (err) {
    console.warn(`Supabase delete (${table}) failed:`, err);
    return false;
  }
}

async function deleteAllRows(table: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(table).delete().neq('id', '');
    if (error) throw error;
    readCache.delete(table);
    return true;
  } catch (err) {
    console.warn(`Supabase clear (${table}) failed:`, err);
    return false;
  }
}

async function readRecords(table: TableName) {
  return (await readAll(table)).map(toRecord);
}

// Writes the new rows first, then drops whatever they did not cover, so a
// failed write can never leave the table emptied.
async function save(table: TableName, records: any[], replaceAll = false) {
  if (!Array.isArray(records) || records.length === 0) return ok(0);
  const rows = records.map((record) => toRow(table, record));
  const existing = replaceAll ? (await readAll(table)).map((r) => r.id) : [];

  if (!(await upsertRows(table, rows))) {
    return fail(`Could not save to Supabase (${table})`);
  }

  if (replaceAll) {
    const keep = new Set(rows.map((r) => r.id));
    await deleteIds(table, existing.filter((id) => !keep.has(id)));
  }
  return ok(records.length);
}

const removeOne = async (table: TableName, id: string) => {
  const key = String(id ?? '').trim();
  if (!key) return fail('Missing id');
  return (await deleteIds(table, [key])) ? ok(1) : fail(`Could not delete from ${table}`);
};

export const supabaseApi = {
  // Customers
  fetchCustomers: async () =>
    (await readRecords('customers')).map((r: any) => ({
      ...r,
      chassisNo: r.chassisNo || r.chassis || r['Chassis no'] || r.id,
      tractorModel: r.tractorModel || r.model || r.modelType || '',
    })),
  getCustomers: async () => supabaseApi.fetchCustomers(),

  saveCustomer: async (customer: any) => save('customers', [customer]),
  bulkUpsertCustomers: async (rows: any[], replaceAll = false) =>
    save('customers', rows, replaceAll),
  saveCustomersBulk: async (rows: any[], replaceAll = false) =>
    supabaseApi.bulkUpsertCustomers(rows, replaceAll),

  deleteAllCustomers: async () =>
    (await deleteAllRows('customers')) ? ok(0) : fail('Could not clear customers'),

  // Spares
  fetchSpares: async () => readRecords('spares'),
  getSpares: async () => supabaseApi.fetchSpares(),

  saveSpare: async (spare: any) => save('spares', [spare]),
  bulkUpsertSpares: async (rows: any[], replaceAll = false) =>
    save('spares', rows, replaceAll),
  saveSparesBulk: async (rows: any[], replaceAll = false) =>
    supabaseApi.bulkUpsertSpares(rows, replaceAll),

  // Job cards
  fetchJobcards: async () => readRecords('job_cards'),
  fetchJobCards: async () => supabaseApi.fetchJobcards(),
  getJobCards: async () => supabaseApi.fetchJobcards(),

  saveJobcard: async (card: any) => save('job_cards', [card]),
  saveJobCard: async (card: any) => supabaseApi.saveJobcard(card),

  deleteJobcard: async (id: string) => removeOne('job_cards', id),
  deleteJobCard: async (id: string) => supabaseApi.deleteJobcard(id),

  bulkUpsertJobcards: async (cards: any[], replaceAll = false) =>
    save('job_cards', cards, replaceAll),
  saveJobCardsBulk: async (cards: any[], replaceAll = false) =>
    supabaseApi.bulkUpsertJobcards(cards, replaceAll),

  bulkDeleteJobcards: async (cardIds: string[]) => {
    const keys = (cardIds || []).map((id) => String(id ?? '').trim()).filter(Boolean);
    return (await deleteIds('job_cards', keys)) ? ok(keys.length) : fail('Could not delete job cards');
  },

  // Complaints
  fetchComplaints: async () => readRecords('complaints'),
  getComplaints: async () => supabaseApi.fetchComplaints(),

  saveComplaint: async (complaint: any) => save('complaints', [complaint]),
  deleteComplaint: async (id: string) => removeOne('complaints', id),

  bulkUpsertComplaints: async (complaints: any[], replaceAll = false) =>
    save('complaints', complaints, replaceAll),
  saveComplaintsBulk: async (complaints: any[], replaceAll = false) =>
    supabaseApi.bulkUpsertComplaints(complaints, replaceAll),

  // Staff
  fetchStaff: async () =>
    (await readRecords('staff')).map((r: any) => ({
      ...r,
      role: r.role || 'mechanic',
      active: r.active === undefined ? true : r.active === true || r.active === 'true',
    })),
  getStaff: async () => supabaseApi.fetchStaff(),

  saveStaff: async (staff: any) => save('staff', [staff]),
  deleteStaff: async (id: string) => removeOne('staff', id),

  bulkUpsertStaff: async (staff: any[], replaceAll = false) =>
    save('staff', staff, replaceAll),
  saveStaffBulk: async (staff: any[], replaceAll = false) =>
    supabaseApi.bulkUpsertStaff(staff, replaceAll),

  // Attendance — one row per date, returned as { [date]: records }.
  fetchAttendance: async () => {
    const byDate: Record<string, any> = {};
    (await readAll('attendance')).forEach((row: any) => {
      byDate[row.id] = row.records ?? {};
    });
    return byDate;
  },
  getAttendance: async () => supabaseApi.fetchAttendance(),

  saveAttendance: async (date: string, records: any) => {
    if (!date) return fail('Attendance needs a date');
    const saved = await upsertRows('attendance', [
      { id: date, records: records ?? {}, updated_at: new Date().toISOString() },
    ]);
    return saved ? ok(1) : fail('Could not save attendance');
  },

  // App settings — one row per key, returned as { [key]: value }.
  fetchSettings: async () => {
    const settings: Record<string, string> = {};
    (await readAll('app_settings')).forEach((row: any) => {
      if (row.value !== null && row.value !== undefined) settings[row.id] = row.value;
    });
    return settings;
  },
  getSettings: async () => supabaseApi.fetchSettings(),

  saveSettings: async (key: string, value: string) => {
    if (!key) return fail('Setting needs a key');
    const saved = await upsertRows('app_settings', [
      { id: key, value, updated_at: new Date().toISOString() },
    ]);
    return saved ? ok(1) : fail('Could not save setting');
  },

  // Service camps
  fetchServiceCamps: async () =>
    (await readRecords('service_camps')).map((r: any) => ({
      ...r,
      dealershipCode: r.dealershipCode || '4731',
      status: r.status || 'Upcoming',
    })),
  getServiceCamps: async () => supabaseApi.fetchServiceCamps(),

  saveServiceCamp: async (camp: any) => save('service_camps', [camp]),
  deleteServiceCamp: async (id: string) => removeOne('service_camps', id),

  bulkUpsertServiceCamps: async (camps: any[], replaceAll = false) =>
    save('service_camps', camps, replaceAll),

  // Wipes every table. Only reachable from the guarded "clear all data" button.
  clearAllData: async () => {
    const tables = [
      'customers', 'job_cards', 'complaints', 'spares',
      'staff', 'service_camps', 'attendance', 'app_settings',
    ];
    const results = await Promise.all(tables.map(deleteAllRows));
    return results.every(Boolean) ? ok(tables.length) : fail('Could not clear every table');
  },

  // Master backup — every table in one payload.
  fetchMasterBackup: async () => {
    const [customers, spares, jobCards, complaints, staff, serviceCamps] = await Promise.all([
      readRecords('customers'),
      readRecords('spares'),
      readRecords('job_cards'),
      readRecords('complaints'),
      readRecords('staff'),
      readRecords('service_camps'),
    ]);
    const attendance = await supabaseApi.fetchAttendance();
    return {
      success: true,
      data: { customers, spares, jobCards, complaints, staff, serviceCamps, attendance },
    };
  },
};

export const supabaseService = supabaseApi;
