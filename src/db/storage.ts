import fs from 'fs';
import path from 'path';

export interface CustomerRecord {
  id?: number;
  chassis_key: string;
  chassis_no: string;
  cust_name?: string;
  father_name?: string;
  cust_addr?: string;
  village?: string;
  mandal?: string;
  owner_mob?: string;
  driver_mob?: string;
  regd_no?: string;
  engine_no?: string;
  tractor_model?: string;
  date_of_delivery?: string;
  followup_history?: string;
  full_data?: string;
  updated_at?: string;
}

export interface SpareRecord {
  id?: number;
  part_key: string;
  part_no: string;
  part_desc?: string;
  mrp?: string;
  category?: string;
  full_data?: string;
  updated_at?: string;
}

export interface JobCardRecord {
  id: string;
  job_no?: string;
  online_job_card_no?: string;
  job_date?: string;
  date_time_in?: string;
  date_time_out?: string;
  expected_repair_time?: string;
  status?: string;
  cust_name?: string;
  father_name?: string;
  cust_addr?: string;
  village?: string;
  mandal?: string;
  owner_mob?: string;
  driver_mob?: string;
  regd_no?: string;
  chassis_no?: string;
  engine_no?: string;
  model?: string;
  model_type?: string;
  serial_no?: string;
  hour_meter?: string;
  service_type?: string;
  free_service_list?: string;
  extra_repairs?: string;
  mechanic?: string;
  ws_incharge?: string;
  service_location?: string;
  bill_no?: string;
  reasons_for_analysis?: string;
  telecalling?: string;
  warranty_override?: string;
  total_labour?: string;
  warranty_material?: string;
  non_warranty_material?: string;
  g_total?: string;
  actual_closed_date?: string;
  branch?: string;
  history_file_no?: string;
  complaint_date?: string;
  install_date?: string;
  date_of_delivery?: string;
  dist_dealership?: string;
  full_data?: string;
  checkpoints?: string;
  repair_rows?: string;
  part_rows?: string;
  created_by?: string;
  created_by_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ComplaintRecord {
  id: string;
  complaint_no?: string;
  date?: string;
  customer_name?: string;
  phone?: string;
  village?: string;
  mandal?: string;
  tractor_model?: string;
  chassis_no?: string;
  hours?: string;
  complaint_details?: string;
  mechanic?: string;
  status?: string;
  job_card_no?: string;
  closure_date?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffRecord {
  id: string;
  name: string;
  role: string;
  phone?: string;
  father_name?: string;
  village?: string;
  mandal?: string;
  mobile_number?: string;
  date_of_joining?: string;
  supervisor?: string;
  active?: string | boolean;
  assigned_supervisor?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceCampRecord {
  id: string;
  dealership_code?: string;
  branch?: string;
  mandal?: string;
  village?: string;
  camp_date?: string;
  target_tractors?: string;
  supervisor?: string;
  mechanic?: string;
  status?: string;
  service_type_expected?: string;
  offers?: string;
  contact_person?: string;
  contact_phone?: string;
  notes?: string;
  attended_count?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbData {
  customers: CustomerRecord[];
  spares: SpareRecord[];
  jobcards: JobCardRecord[];
  complaints: ComplaintRecord[];
  staff: StaffRecord[];
  staff_attendance: Record<string, any>;
  app_settings: Record<string, string>;
  service_camps: ServiceCampRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'eicher_db.json');

const INITIAL_STAFF: StaffRecord[] = [];

const INITIAL_SPARES: SpareRecord[] = [
  {
    id: 1,
    part_key: 'd3540010',
    part_no: 'D3540010',
    part_desc: 'ENGINE OIL FILTER ELEMENT',
    mrp: '240',
    category: 'Filters',
    full_data: JSON.stringify({ partNo: 'D3540010', partDesc: 'ENGINE OIL FILTER ELEMENT', mrp: '240', category: 'Filters' }),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    part_key: 'd3540020',
    part_no: 'D3540020',
    part_desc: 'DIESEL FILTER PRIMARY',
    mrp: '180',
    category: 'Filters',
    full_data: JSON.stringify({ partNo: 'D3540020', partDesc: 'DIESEL FILTER PRIMARY', mrp: '180', category: 'Filters' }),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    part_key: 'd3540030',
    part_no: 'D3540030',
    part_desc: 'DIESEL FILTER SECONDARY',
    mrp: '195',
    category: 'Filters',
    full_data: JSON.stringify({ partNo: 'D3540030', partDesc: 'DIESEL FILTER SECONDARY', mrp: '195', category: 'Filters' }),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    part_key: 'e1020045',
    part_no: 'E1020045',
    part_desc: 'FAN BELT B-44',
    mrp: '350',
    category: 'Belts',
    full_data: JSON.stringify({ partNo: 'E1020045', partDesc: 'FAN BELT B-44', mrp: '350', category: 'Belts' }),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    part_key: 'e2030090',
    part_no: 'E2030090',
    part_desc: 'CLUTCH PLATE 11 INCH',
    mrp: '2850',
    category: 'Clutch',
    full_data: JSON.stringify({ partNo: 'E2030090', partDesc: 'CLUTCH PLATE 11 INCH', mrp: '2850', category: 'Clutch' }),
    updated_at: new Date().toISOString()
  },
  {
    id: 6,
    part_key: 'e4050012',
    part_no: 'E4050012',
    part_desc: 'ENGINE OIL 15W40 (7.5 LTR)',
    mrp: '2650',
    category: 'Oils & Lubricants',
    full_data: JSON.stringify({ partNo: 'E4050012', partDesc: 'ENGINE OIL 15W40 (7.5 LTR)', mrp: '2650', category: 'Oils & Lubricants' }),
    updated_at: new Date().toISOString()
  }
];

class LocalDatabase {
  private data: DbData;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DbData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          spares: Array.isArray(parsed.spares) ? parsed.spares : INITIAL_SPARES,
          jobcards: Array.isArray(parsed.jobcards) ? parsed.jobcards : [],
          complaints: Array.isArray(parsed.complaints) ? parsed.complaints : [],
          staff: Array.isArray(parsed.staff) ? parsed.staff : [],
          staff_attendance: parsed.staff_attendance || {},
          app_settings: parsed.app_settings || { dealershipCode: '4731', defaultBranch: 'Tiruvuru' },
          service_camps: Array.isArray(parsed.service_camps) ? parsed.service_camps : []
        };
      }
    } catch (e) {
      console.warn('Notice loading local database, creating fresh copy:', e);
    }

    const defaultData: DbData = {
      customers: [],
      spares: INITIAL_SPARES,
      jobcards: [],
      complaints: [],
      staff: [],
      staff_attendance: {},
      app_settings: { dealershipCode: '4731', defaultBranch: 'Tiruvuru' },
      service_camps: []
    };

    this.saveDataDirect(defaultData);
    return defaultData;
  }

  private saveDataDirect(data: DbData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write local database to disk:', e);
    }
  }

  public scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveDataDirect(this.data);
      this.saveTimeout = null;
    }, 100);
  }

  // Clear Database
  public clearAll() {
    this.data.customers = [];
    this.data.spares = [];
    this.data.jobcards = [];
    this.data.complaints = [];
    this.data.staff = [];
    this.data.staff_attendance = {};
    this.data.app_settings = {};
    this.data.service_camps = [];
    this.scheduleSave();
  }

  // Customers
  public getCustomers(): CustomerRecord[] {
    return [...this.data.customers];
  }

  public upsertCustomer(item: CustomerRecord): CustomerRecord {
    const existingIndex = this.data.customers.findIndex(
      c => c.chassis_key === item.chassis_key || (item.chassis_no && c.chassis_no === item.chassis_no)
    );

    const record: CustomerRecord = {
      ...item,
      id: existingIndex >= 0 ? this.data.customers[existingIndex].id : this.data.customers.length + 1,
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.data.customers[existingIndex] = { ...this.data.customers[existingIndex], ...record };
    } else {
      this.data.customers.push(record);
    }
    this.scheduleSave();
    return record;
  }

  public bulkUpsertCustomers(items: CustomerRecord[], replaceAll = false): number {
    if (replaceAll) {
      this.data.customers = [];
    }

    const keyMap = new Map<string, number>();
    this.data.customers.forEach((c, idx) => {
      keyMap.set(c.chassis_key, idx);
      if (c.chassis_no) keyMap.set(`no_${c.chassis_no}`, idx);
    });

    for (const item of items) {
      let matchIdx = keyMap.get(item.chassis_key);
      if (matchIdx === undefined && item.chassis_no) {
        matchIdx = keyMap.get(`no_${item.chassis_no}`);
      }

      const rec: CustomerRecord = {
        ...item,
        id: matchIdx !== undefined ? this.data.customers[matchIdx].id : this.data.customers.length + 1,
        updated_at: new Date().toISOString()
      };

      if (matchIdx !== undefined) {
        this.data.customers[matchIdx] = { ...this.data.customers[matchIdx], ...rec };
      } else {
        const newIdx = this.data.customers.length;
        this.data.customers.push(rec);
        keyMap.set(item.chassis_key, newIdx);
        if (item.chassis_no) keyMap.set(`no_${item.chassis_no}`, newIdx);
      }
    }

    this.scheduleSave();
    return items.length;
  }

  public deleteAllCustomers() {
    this.data.customers = [];
    this.scheduleSave();
  }

  // Spares
  public getSpares(): SpareRecord[] {
    return [...this.data.spares];
  }

  public bulkUpsertSpares(items: SpareRecord[], replaceAll = false): number {
    if (replaceAll) {
      this.data.spares = [];
    }

    const keyMap = new Map<string, number>();
    this.data.spares.forEach((s, idx) => {
      keyMap.set(s.part_key, idx);
      if (s.part_no) keyMap.set(`p_${s.part_no}`, idx);
    });

    for (const item of items) {
      let matchIdx = keyMap.get(item.part_key);
      if (matchIdx === undefined && item.part_no) {
        matchIdx = keyMap.get(`p_${item.part_no}`);
      }

      const rec: SpareRecord = {
        ...item,
        id: matchIdx !== undefined ? this.data.spares[matchIdx].id : this.data.spares.length + 1,
        updated_at: new Date().toISOString()
      };

      if (matchIdx !== undefined) {
        this.data.spares[matchIdx] = { ...this.data.spares[matchIdx], ...rec };
      } else {
        const newIdx = this.data.spares.length;
        this.data.spares.push(rec);
        keyMap.set(item.part_key, newIdx);
        if (item.part_no) keyMap.set(`p_${item.part_no}`, newIdx);
      }
    }

    this.scheduleSave();
    return items.length;
  }

  // Job Cards
  public getJobCards(): JobCardRecord[] {
    return [...this.data.jobcards].sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
  }

  public saveJobCard(card: JobCardRecord): JobCardRecord {
    const idx = this.data.jobcards.findIndex(j => j.id === card.id);
    const rec: JobCardRecord = {
      ...card,
      created_at: card.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (idx >= 0) {
      this.data.jobcards[idx] = { ...this.data.jobcards[idx], ...rec };
    } else {
      this.data.jobcards.unshift(rec);
    }
    this.scheduleSave();
    return rec;
  }

  public deleteJobCard(id: string): boolean {
    const prevLen = this.data.jobcards.length;
    this.data.jobcards = this.data.jobcards.filter(j => j.id !== id);
    this.scheduleSave();
    return this.data.jobcards.length < prevLen;
  }

  public bulkDeleteJobCards(ids: string[]): boolean {
    const idSet = new Set(ids);
    this.data.jobcards = this.data.jobcards.filter(j => !idSet.has(j.id));
    this.scheduleSave();
    return true;
  }

  public bulkUpsertJobCards(cards: JobCardRecord[], replaceAll = false): number {
    if (replaceAll) {
      this.data.jobcards = [];
    }

    const map = new Map<string, number>();
    this.data.jobcards.forEach((j, idx) => map.set(j.id, idx));

    for (const card of cards) {
      if (!card.id) continue;
      const rec: JobCardRecord = {
        ...card,
        created_at: card.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const idx = map.get(card.id);
      if (idx !== undefined) {
        this.data.jobcards[idx] = { ...this.data.jobcards[idx], ...rec };
      } else {
        this.data.jobcards.push(rec);
        map.set(card.id, this.data.jobcards.length - 1);
      }
    }
    this.scheduleSave();
    return cards.length;
  }

  // Complaints
  public getComplaints(): ComplaintRecord[] {
    return [...this.data.complaints].sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
  }

  public saveComplaint(comp: ComplaintRecord): ComplaintRecord {
    const idx = this.data.complaints.findIndex(c => c.id === comp.id);
    const rec: ComplaintRecord = {
      ...comp,
      created_at: comp.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (idx >= 0) {
      this.data.complaints[idx] = { ...this.data.complaints[idx], ...rec };
    } else {
      this.data.complaints.unshift(rec);
    }
    this.scheduleSave();
    return rec;
  }

  public deleteComplaint(id: string): boolean {
    const prevLen = this.data.complaints.length;
    this.data.complaints = this.data.complaints.filter(c => c.id !== id);
    this.scheduleSave();
    return this.data.complaints.length < prevLen;
  }

  public bulkUpsertComplaints(complaints: ComplaintRecord[], replaceAll = false): number {
    if (replaceAll) {
      this.data.complaints = [];
    }
    const map = new Map<string, number>();
    this.data.complaints.forEach((c, idx) => map.set(c.id, idx));

    for (const comp of complaints) {
      if (!comp.id) continue;
      const rec: ComplaintRecord = {
        ...comp,
        created_at: comp.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const idx = map.get(comp.id);
      if (idx !== undefined) {
        this.data.complaints[idx] = { ...this.data.complaints[idx], ...rec };
      } else {
        this.data.complaints.push(rec);
        map.set(comp.id, this.data.complaints.length - 1);
      }
    }
    this.scheduleSave();
    return complaints.length;
  }

  // Staff
  public getStaff(): StaffRecord[] {
    return [...this.data.staff].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  public saveStaff(st: StaffRecord): StaffRecord {
    const idx = this.data.staff.findIndex(s => s.id === st.id);
    const rec: StaffRecord = {
      ...st,
      created_at: st.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (idx >= 0) {
      this.data.staff[idx] = { ...this.data.staff[idx], ...rec };
    } else {
      this.data.staff.push(rec);
    }
    this.scheduleSave();
    return rec;
  }

  public deleteStaff(id: string): boolean {
    const prevLen = this.data.staff.length;
    this.data.staff = this.data.staff.filter(s => s.id !== id);
    this.scheduleSave();
    return this.data.staff.length < prevLen;
  }

  public bulkUpsertStaff(staffList: StaffRecord[], replaceAll = false): number {
    if (replaceAll) {
      this.data.staff = [];
    }
    const map = new Map<string, number>();
    this.data.staff.forEach((s, idx) => map.set(s.id, idx));

    for (const st of staffList) {
      if (!st.id) continue;
      const rec: StaffRecord = {
        ...st,
        created_at: st.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const idx = map.get(st.id);
      if (idx !== undefined) {
        this.data.staff[idx] = { ...this.data.staff[idx], ...rec };
      } else {
        this.data.staff.push(rec);
        map.set(st.id, this.data.staff.length - 1);
      }
    }
    this.scheduleSave();
    return staffList.length;
  }

  // Attendance
  public getAttendance(): Record<string, any> {
    return { ...this.data.staff_attendance };
  }

  public saveAttendance(date: string, records: any) {
    this.data.staff_attendance[date] = records;
    this.scheduleSave();
  }

  // Settings
  public getSettings(): Record<string, string> {
    return { ...this.data.app_settings };
  }

  public saveSetting(key: string, value: string) {
    this.data.app_settings[key] = String(value);
    this.scheduleSave();
  }

  // Service Camps
  public getServiceCamps(): ServiceCampRecord[] {
    return [...this.data.service_camps].sort((a, b) => {
      const da = a.camp_date || '';
      const db = b.camp_date || '';
      return da.localeCompare(db);
    });
  }

  public saveServiceCamp(camp: ServiceCampRecord): ServiceCampRecord {
    const idx = this.data.service_camps.findIndex(c => c.id === camp.id);
    const rec: ServiceCampRecord = {
      ...camp,
      created_at: camp.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (idx >= 0) {
      this.data.service_camps[idx] = { ...this.data.service_camps[idx], ...rec };
    } else {
      this.data.service_camps.push(rec);
    }
    this.scheduleSave();
    return rec;
  }

  public deleteServiceCamp(id: string): boolean {
    const prevLen = this.data.service_camps.length;
    this.data.service_camps = this.data.service_camps.filter(c => c.id !== id);
    this.scheduleSave();
    return this.data.service_camps.length < prevLen;
  }

  public bulkUpsertServiceCamps(camps: ServiceCampRecord[], replaceAll = false): number {
    if (replaceAll) {
      this.data.service_camps = [];
    }
    const map = new Map<string, number>();
    this.data.service_camps.forEach((c, idx) => map.set(c.id, idx));

    for (const camp of camps) {
      if (!camp.id) continue;
      const rec: ServiceCampRecord = {
        ...camp,
        created_at: camp.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const idx = map.get(camp.id);
      if (idx !== undefined) {
        this.data.service_camps[idx] = { ...this.data.service_camps[idx], ...rec };
      } else {
        this.data.service_camps.push(rec);
        map.set(camp.id, this.data.service_camps.length - 1);
      }
    }
    this.scheduleSave();
    return camps.length;
  }

  // Master Backup Export
  public getMasterBackup() {
    return {
      success: true,
      customers: this.data.customers,
      spares: this.data.spares,
      jobcards: this.data.jobcards,
      complaints: this.data.complaints,
      staff: this.data.staff,
      attendance: Object.entries(this.data.staff_attendance).map(([date, records]) => ({
        date,
        records: JSON.stringify(records)
      })),
      settings: Object.entries(this.data.app_settings).map(([key, value]) => ({
        key,
        value
      })),
      serviceCamps: this.data.service_camps
    };
  }
}

export const localDb = new LocalDatabase();
