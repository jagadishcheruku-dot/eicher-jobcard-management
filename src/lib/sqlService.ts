// Real PostgreSQL REST API client for Sri Balaji Eicher Tractors
import { db } from '../firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

// When the app is served without the Express backend (e.g. a static Vercel
// deploy), every /api call resolves to index.html and yields no data. Firestore
// is then both the source of truth and the way records reach other users.
const FS_COLLECTIONS = {
  customers: 'customers',
  spares: 'spares',
  jobCards: 'jobCards',
  complaints: 'complaints',
} as const;

const fsDocId = (raw: any, fallback: string) => {
  const id = String(raw ?? '').trim();
  // Firestore ids cannot contain "/" and cannot be empty.
  return id ? id.replace(/\//g, '_') : fallback;
};

async function fsReadAll(collectionName: string): Promise<any[]> {
  try {
    if (!db) return [];
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    console.warn(`Firestore read (${collectionName}) failed:`, err);
    return [];
  }
}

async function fsUpsertAll(
  collectionName: string,
  rows: any[],
  idOf: (row: any) => any
): Promise<boolean> {
  try {
    if (!db || !Array.isArray(rows) || rows.length === 0) return false;
    const collectionRef = collection(db, collectionName);
    // Firestore caps a batch at 500 writes.
    for (let start = 0; start < rows.length; start += 400) {
      const batch = writeBatch(db);
      rows.slice(start, start + 400).forEach((row, offset) => {
        const id = fsDocId(idOf(row), `row_${start + offset}_${Date.now()}`);
        // JSON round-trip drops undefined values, which Firestore rejects.
        batch.set(doc(collectionRef, id), JSON.parse(JSON.stringify(row ?? {})), { merge: true });
      });
      await batch.commit();
    }
    console.log(`✅ ${rows.length} record(s) saved to Firestore (${collectionName})`);
    return true;
  } catch (err) {
    console.warn(`Firestore write (${collectionName}) failed:`, err);
    return false;
  }
}

async function safeRequestJson<T = any>(
  url: string,
  options?: RequestInit,
  retries = 2
): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        if (attempt < retries && (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 404)) {
          await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        return null;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

export const sqlApi = {
  // Customers
  fetchCustomers: async () => {
    try {
      const data = await safeRequestJson<{ success: boolean; data: any[] }>('/api/customers');
      if (data && data.success && Array.isArray(data.data)) {
        return data.data.map((r: any) => {
          let fullData = {};
          let followupHistory = [];
          try { fullData = typeof r.full_data === 'string' ? JSON.parse(r.full_data) : (r.full_data || {}); } catch {}
          try { followupHistory = typeof r.followup_history === 'string' ? JSON.parse(r.followup_history) : (r.followup_history || []); } catch {}
          return {
            ...fullData,
            id: r.id,
            chassisKey: r.chassis_key,
            chassisNo: r.chassis_no,
            custName: r.cust_name,
            fatherName: r.father_name,
            custAddr: r.cust_addr,
            village: r.village,
            mandal: r.mandal,
            ownerMob: r.owner_mob,
            driverMob: r.driver_mob,
            regdNo: r.regd_no,
            engineNo: r.engine_no,
            tractorModel: r.tractor_model,
            dateOfDelivery: r.date_of_delivery,
            followupHistory,
          };
        });
      }
    } catch {
      // fall through to Firestore
    }
    return (await fsReadAll(FS_COLLECTIONS.customers)).map((r: any) => ({
      ...r,
      chassisNo: r.chassisNo || r.chassis || r['Chassis no'] || r.id,
      tractorModel: r.tractorModel || r.model || r.modelType || '',
    }));
  },
  getCustomers: async () => sqlApi.fetchCustomers(),

  saveCustomer: async (customer: any) => {
    try {
      const res = await safeRequestJson<{ success?: boolean }>('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      if (res && res.success) return res;
    } catch {
      // fall through to Firestore
    }
    return sqlApi.bulkUpsertCustomers([customer]);
  },

  bulkUpsertCustomers: async (rows: any[], replaceAll = false) => {
    try {
      const res = await safeRequestJson<{ success?: boolean }>('/api/customers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, replaceAll })
      });
      if (res && res.success) return res;
    } catch {
      // fall through to Firestore
    }
    const saved = await fsUpsertAll(
      FS_COLLECTIONS.customers,
      rows,
      (r) => r.chassisNo || r.chassis || r['Chassis no'] || r.chassisKey || r.id
    );
    return saved
      ? { success: true, count: rows.length, storage: 'firestore' }
      : { success: false, error: 'Could not save to backend or Firestore' };
  },
  saveCustomersBulk: async (rows: any[], replaceAll = false) => sqlApi.bulkUpsertCustomers(rows, replaceAll),

  deleteAllCustomers: async () => {
    try {
      const res = await safeRequestJson('/api/database/delete-all-customers', {
        method: 'POST',
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  // Spares
  fetchSpares: async () => {
    try {
      const data = await safeRequestJson<{ success: boolean; data: any[] }>('/api/spares');
      if (data && data.success && Array.isArray(data.data)) {
        return data.data.map((r: any) => {
          let fullData = {};
          try { fullData = typeof r.full_data === 'string' ? JSON.parse(r.full_data) : (r.full_data || {}); } catch {}
          return {
            ...fullData,
            id: r.id,
            partKey: r.part_key,
            partNo: r.part_no,
            partDesc: r.part_desc,
            mrp: r.mrp,
            category: r.category
          };
        });
      }
    } catch {
      // fall through to Firestore
    }
    return fsReadAll(FS_COLLECTIONS.spares);
  },
  getSpares: async () => sqlApi.fetchSpares(),

  saveSpare: async (spare: any) => sqlApi.bulkUpsertSpares([spare], false),

  bulkUpsertSpares: async (rows: any[], replaceAll = false) => {
    try {
      const res = await safeRequestJson<{ success?: boolean }>('/api/spares/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, replaceAll })
      });
      if (res && res.success) return res;
    } catch {
      // fall through to Firestore
    }
    const saved = await fsUpsertAll(
      FS_COLLECTIONS.spares,
      rows,
      (r) => r.partNo || r.partKey || r['Part No'] || r.id
    );
    return saved
      ? { success: true, count: rows.length, storage: 'firestore' }
      : { success: false, error: 'Could not save to backend or Firestore' };
  },
  saveSparesBulk: async (rows: any[], replaceAll = false) => sqlApi.bulkUpsertSpares(rows, replaceAll),

  // Jobcards
  fetchJobcards: async () => {
    try {
      const data = await safeRequestJson<{ success: boolean; data: any[] }>('/api/jobcards');
      if (data && data.success && Array.isArray(data.data)) {
        return data.data.map((r: any) => {
          let checkpoints = [];
          let repairRows = [];
          let partRows = [];
          let fullData: any = {};
          try { checkpoints = typeof r.checkpoints === 'string' ? JSON.parse(r.checkpoints) : (r.checkpoints || []); } catch {}
          try { repairRows = typeof r.repair_rows === 'string' ? JSON.parse(r.repair_rows) : (r.repair_rows || []); } catch {}
          try { partRows = typeof r.part_rows === 'string' ? JSON.parse(r.part_rows) : (r.part_rows || []); } catch {}
          try { fullData = typeof r.full_data === 'string' ? JSON.parse(r.full_data) : (r.full_data || {}); } catch {}

          return {
            ...fullData,
            id: r.id,
            jobNo: r.job_no,
            onlineJobCardNo: r.online_job_card_no,
            jobDate: r.job_date,
            dateTimeIn: r.date_time_in,
            dateTimeOut: r.date_time_out,
            expectedRepairTime: r.expected_repair_time,
            status: r.status,
            custName: r.cust_name,
            fatherName: r.father_name,
            custAddr: r.cust_addr,
            village: r.village,
            mandal: r.mandal,
            ownerMob: r.owner_mob,
            driverMob: r.driver_mob,
            regdNo: r.regd_no,
            chassisNo: r.chassis_no,
            engineNo: r.engine_no,
            model: r.model,
            modelType: r.model_type,
            serialNo: r.serial_no,
            hourMeter: r.hour_meter,
            serviceType: r.service_type,
            freeServiceList: r.free_service_list,
            extraRepairs: r.extra_repairs,
            mechanic: r.mechanic,
            mechanicName: r.mechanic,
            technicianName: r.mechanic,
            wsIncharge: r.ws_incharge,
            supervisor: r.ws_incharge,
            serviceLocation: r.service_location,
            billNo: r.bill_no,
            reasonsForAnalysis: r.reasons_for_analysis,
            telecalling: r.telecalling,
            warrantyOverride: r.warranty_override,
            totalLabour: r.total_labour,
            warrantyMaterial: r.warranty_material,
            nonWarrantyMaterial: r.non_warranty_material,
            gTotal: r.g_total,
            actualClosedDate: r.actual_closed_date,
            branch: r.branch || fullData.branch || '',
            historyFileNo: r.history_file_no || fullData.historyFileNo || '',
            complaintDate: r.complaint_date || fullData.complaintDate || '',
            installDate: r.install_date || r.date_of_delivery || fullData.installDate || '',
            dateOfDelivery: r.date_of_delivery || r.install_date || fullData.dateOfDelivery || '',
            distDealership: r.dist_dealership || fullData.distDealership || '',
            checkpoints,
            repairRows,
            partRows,
            createdBy: r.created_by,
            createdByEmail: r.created_by_email,
            createdAt: r.created_at,
          };
        });
      }
    } catch {
      // fall through to Firestore
    }
    return fsReadAll(FS_COLLECTIONS.jobCards);
  },
  getJobCards: async () => sqlApi.fetchJobcards(),

  saveJobcard: async (card: any) => {
    try {
      const res = await safeRequestJson<{ success?: boolean }>('/api/jobcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      });
      if (res && res.success) return res;
    } catch {
      // fall through to Firestore
    }
    return sqlApi.bulkUpsertJobcards([card]);
  },
  saveJobCard: async (card: any) => sqlApi.saveJobcard(card),

  deleteJobcard: async (id: string) => {
    try {
      const res = await safeRequestJson(`/api/jobcards/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },
  deleteJobCard: async (id: string) => sqlApi.deleteJobcard(id),

  bulkUpsertJobcards: async (cards: any[], replaceAll = false) => {
    try {
      const res = await safeRequestJson<{ success?: boolean }>('/api/jobcards/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards, replaceAll })
      });
      if (res && res.success) return res;
    } catch {
      // fall through to Firestore
    }
    const saved = await fsUpsertAll(
      FS_COLLECTIONS.jobCards,
      cards,
      (c) => c.jobNo || c.onlineJobCardNo || c.id
    );
    return saved
      ? { success: true, count: cards.length, storage: 'firestore' }
      : { success: false, error: 'Could not save to backend or Firestore' };
  },
  saveJobCardsBulk: async (cards: any[], replaceAll = false) => sqlApi.bulkUpsertJobcards(cards, replaceAll),

  bulkDeleteJobcards: async (ids: string[]) => {
    try {
      const res = await safeRequestJson('/api/database/delete-jobcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  // Complaints
  fetchComplaints: async () => {
    try {
      const data = await safeRequestJson<{ success: boolean; data: any[] }>('/api/complaints');
      if (data && data.success && Array.isArray(data.data)) {
        return data.data.map((r: any) => ({
          id: r.id,
          complaintNo: r.complaint_no || r.complaintNo || '',
          complaintDate: r.date || r.complaint_date || r.complaintDate || '',
          date: r.date || r.complaint_date || r.complaintDate || '',
          customerName: r.customer_name || r.customerName || '',
          mobileNumber: r.phone || r.mobile_number || r.mobileNumber || '',
          phone: r.phone || r.mobile_number || r.mobileNumber || '',
          village: r.village || '',
          mandal: r.mandal || '',
          tractorModel: r.tractor_model || r.tractorModel || '',
          chassisNo: r.chassis_no || r.chassisNo || '',
          hours: r.hours || '',
          complaintDetails: r.complaint_details || r.complaintDetails || '',
          assignedMechanic: r.mechanic || r.assigned_mechanic || r.assignedMechanic || '',
          mechanic: r.mechanic || r.assigned_mechanic || r.assignedMechanic || '',
          assignedSupervisor: r.supervisor || r.assigned_supervisor || r.assignedSupervisor || '',
          supervisor: r.supervisor || r.assigned_supervisor || r.assignedSupervisor || '',
          status: r.status || 'Open',
          jobCardNo: r.job_card_no || r.jobCardNo || '',
          closureDate: r.closure_date || r.closureDate || '',
          closedDate: r.closure_date || r.closureDate || '',
          resolution: r.remarks || r.resolution || '',
          remarks: r.remarks || r.resolution || '',
          createdAt: r.created_at || r.createdAt || ''
        }));
      }
    } catch {
      // fall through to Firestore
    }
    return fsReadAll(FS_COLLECTIONS.complaints);
  },
  getComplaints: async () => sqlApi.fetchComplaints(),

  saveComplaint: async (complaint: any) => {
    try {
      const res = await safeRequestJson<{ success?: boolean }>('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaint)
      });
      if (res && res.success) return res;
    } catch {
      // fall through to Firestore
    }
    return sqlApi.bulkUpsertComplaints([complaint]);
  },

  deleteComplaint: async (id: string) => {
    try {
      const res = await safeRequestJson(`/api/complaints/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  bulkUpsertComplaints: async (complaints: any[], replaceAll = false) => {
    try {
      const res = await safeRequestJson<{ success?: boolean }>('/api/complaints/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaints, replaceAll })
      });
      if (res && res.success) return res;
    } catch {
      // fall through to Firestore
    }
    const saved = await fsUpsertAll(
      FS_COLLECTIONS.complaints,
      complaints,
      (c) => c.id || c._id || c.complaintNo
    );
    return saved
      ? { success: true, count: complaints.length, storage: 'firestore' }
      : { success: false, error: 'Could not save to backend or Firestore' };
  },
  saveComplaintsBulk: async (complaints: any[], replaceAll = false) => sqlApi.bulkUpsertComplaints(complaints, replaceAll),

  // Staff
  fetchStaff: async () => {
    try {
      const data = await safeRequestJson<{ success: boolean; data: any[] }>('/api/staff');
      if (data && data.success && Array.isArray(data.data)) {
        return data.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          role: r.role || 'mechanic',
          phone: r.phone || r.mobile_number || '',
          mobileNumber: r.mobile_number || r.phone || '',
          fatherName: r.father_name || r.fatherName || '',
          village: r.village || '',
          mandal: r.mandal || '',
          dateOfJoining: r.date_of_joining || r.dateOfJoining || '',
          supervisor: r.supervisor || r.assigned_supervisor || '',
          assignedSupervisor: r.assigned_supervisor || r.supervisor || '',
          active: r.active === 'true' || r.active === true,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
      return [];
    } catch {
      return [];
    }
  },
  getStaff: async () => sqlApi.fetchStaff(),

  saveStaff: async (staff: any) => {
    try {
      const res = await safeRequestJson('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staff)
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  deleteStaff: async (id: string) => {
    try {
      const res = await safeRequestJson(`/api/staff/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  bulkUpsertStaff: async (staff: any[], replaceAll = false) => {
    try {
      const res = await safeRequestJson('/api/staff/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff, replaceAll })
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },
  saveStaffBulk: async (staff: any[], replaceAll = false) => sqlApi.bulkUpsertStaff(staff, replaceAll),

  // Attendance
  fetchAttendance: async () => {
    try {
      const data = await safeRequestJson<{ success: boolean; data: any }>('/api/attendance');
      if (data && data.success && data.data) {
        return data.data;
      }
      return {};
    } catch {
      return {};
    }
  },
  getAttendance: async () => sqlApi.fetchAttendance(),

  saveAttendance: async (date: string, records: any) => {
    try {
      const res = await safeRequestJson('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, records })
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  // App Settings
  fetchSettings: async () => {
    try {
      const data = await safeRequestJson<{ success: boolean; data: Record<string, string> }>('/api/settings');
      if (data && data.success && data.data) {
        return data.data;
      }
      return {};
    } catch {
      return {};
    }
  },
  getSettings: async () => sqlApi.fetchSettings(),

  saveSettings: async (key: string, value: string) => {
    try {
      const res = await safeRequestJson('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  // Master Backup
  fetchMasterBackup: async () => {
    try {
      const res = await safeRequestJson('/api/master-backup');
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  // Service Camps
  fetchServiceCamps: async () => {
    try {
      const data = await safeRequestJson<{ success: boolean; data: any[] }>('/api/service-camps');
      if (data && data.success && Array.isArray(data.data)) {
        return data.data.map((r: any) => ({
          id: r.id,
          dealershipCode: r.dealership_code || r.dealershipCode || '4731',
          branch: r.branch || '',
          mandal: r.mandal || '',
          village: r.village || '',
          campDate: r.camp_date || r.campDate || '',
          targetTractors: r.target_tractors || r.targetTractors || '',
          supervisor: r.supervisor || '',
          mechanic: r.mechanic || '',
          status: r.status || 'Upcoming',
          serviceTypeExpected: r.service_type_expected || r.serviceTypeExpected || '',
          offers: r.offers || '',
          contactPerson: r.contact_person || r.contactPerson || '',
          contactPhone: r.contact_phone || r.contactPhone || '',
          notes: r.notes || '',
          attendedCount: r.attended_count || r.attendedCount || '',
          createdAt: r.created_at || r.createdAt || ''
        }));
      }
      return [];
    } catch {
      return [];
    }
  },
  getServiceCamps: async () => sqlApi.fetchServiceCamps(),

  saveServiceCamp: async (camp: any) => {
    try {
      const res = await safeRequestJson('/api/service-camps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(camp)
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  deleteServiceCamp: async (id: string) => {
    try {
      const res = await safeRequestJson(`/api/service-camps/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  bulkUpsertServiceCamps: async (camps: any[], replaceAll = false) => {
    try {
      const res = await safeRequestJson('/api/service-camps/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camps, replaceAll })
      });
      return res || { success: false, error: 'Request failed' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }
};

export const sqlService = sqlApi;
