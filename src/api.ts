export async function apiFetchJobCards(): Promise<any[]> {
  try {
    const res = await fetch('/api/jobcards');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.map((row: any) => ({
        id: row.id,
        jobNo: row.job_no,
        onlineJobCardNo: row.online_job_card_no,
        jobDate: row.job_date,
        dateTimeIn: row.date_time_in,
        dateTimeOut: row.date_time_out,
        expectedRepairTime: row.expected_repair_time,
        status: row.status,
        custName: row.cust_name,
        fatherName: row.father_name,
        custAddr: row.cust_addr,
        village: row.village,
        mandal: row.mandal,
        ownerMob: row.owner_mob,
        driverMob: row.driver_mob,
        regdNo: row.regd_no,
        chassisNo: row.chassis_no,
        engineNo: row.engine_no,
        model: row.model,
        modelType: row.model_type,
        serialNo: row.serial_no,
        hourMeter: row.hour_meter,
        serviceType: row.service_type,
        freeServiceList: row.free_service_list,
        extraRepairs: row.extra_repairs,
        mechanic: row.mechanic,
        wsIncharge: row.ws_incharge,
        serviceLocation: row.service_location,
        billNo: row.bill_no,
        reasonsForAnalysis: row.reasons_for_analysis,
        telecalling: row.telecalling,
        warrantyOverride: row.warranty_override,
        totalLabour: row.total_labour,
        warrantyMaterial: row.warranty_material,
        nonWarrantyMaterial: row.non_warranty_material,
        gTotal: row.g_total,
        actualClosedDate: row.actual_closed_date,
        checkpoints: typeof row.checkpoints === 'string' ? JSON.parse(row.checkpoints || '[]') : (row.checkpoints || []),
        repairRows: typeof row.repair_rows === 'string' ? JSON.parse(row.repair_rows || '[]') : (row.repair_rows || []),
        partRows: typeof row.part_rows === 'string' ? JSON.parse(row.part_rows || '[]') : (row.part_rows || []),
        createdBy: row.created_by,
        createdByEmail: row.created_by_email,
        createdAt: row.created_at
      }));
    }
  } catch (err) {
    console.warn('API fetch jobcards notice:', err);
  }
  return [];
}

export async function apiSaveJobCard(card: any): Promise<boolean> {
  try {
    const res = await fetch('/api/jobcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API save job card error:', err);
    return false;
  }
}

export async function apiDeleteJobCard(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/jobcards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API delete job card error:', err);
    return false;
  }
}

export async function apiSaveJobCardsBulk(cards: any[], replaceAll = false): Promise<boolean> {
  try {
    const res = await fetch('/api/jobcards/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards, replaceAll }),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API bulk save jobcards error:', err);
    return false;
  }
}

// Complaints API
export async function apiFetchComplaints(): Promise<any[]> {
  try {
    const res = await fetch('/api/complaints');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.map((row: any) => ({
        id: row.id,
        complaintNo: row.complaint_no,
        date: row.date,
        customerName: row.customer_name,
        phone: row.phone,
        village: row.village,
        mandal: row.mandal,
        tractorModel: row.tractor_model,
        chassisNo: row.chassis_no,
        hours: row.hours,
        complaintDetails: row.complaint_details,
        mechanic: row.mechanic,
        status: row.status,
        jobCardNo: row.job_card_no,
        closureDate: row.closure_date,
        remarks: row.remarks,
        createdAt: row.created_at
      }));
    }
  } catch (err) {
    console.warn('API fetch complaints notice:', err);
  }
  return [];
}

export async function apiSaveComplaint(comp: any): Promise<boolean> {
  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comp),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API save complaint error:', err);
    return false;
  }
}

export async function apiDeleteComplaint(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API delete complaint error:', err);
    return false;
  }
}

export async function apiSaveComplaintsBulk(complaints: any[], replaceAll = false): Promise<boolean> {
  try {
    const res = await fetch('/api/complaints/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaints, replaceAll }),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API bulk save complaints error:', err);
    return false;
  }
}

// Staff API
export async function apiFetchStaff(): Promise<any[]> {
  try {
    const res = await fetch('/api/staff');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.map((row: any) => ({
        id: row.id,
        name: row.name,
        role: row.role || 'mechanic',
        phone: row.phone || row.mobile_number || row.mobileNumber || '',
        mobileNumber: row.mobileNumber || row.mobile_number || row.phone || '',
        fatherName: row.fatherName || row.father_name || '',
        village: row.village || '',
        mandal: row.mandal || '',
        dateOfJoining: row.dateOfJoining || row.date_of_joining || '',
        supervisor: row.supervisor || row.assignedSupervisor || row.assigned_supervisor || '',
        assignedSupervisor: row.assignedSupervisor || row.assigned_supervisor || row.supervisor || '',
        active: String(row.active) === 'true' || row.active === true || row.active === undefined || row.active === '1',
        createdAt: row.createdAt || row.created_at || '',
        updatedAt: row.updatedAt || row.updated_at || ''
      }));
    }
  } catch (err) {
    console.warn('API fetch staff notice:', err);
  }
  return [];
}

export async function apiSaveStaff(st: any): Promise<boolean> {
  try {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(st),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API save staff error:', err);
    return false;
  }
}

export async function apiDeleteStaff(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/staff/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API delete staff error:', err);
    return false;
  }
}

export async function apiSaveStaffBulk(staffList: any[], replaceAll = false): Promise<boolean> {
  try {
    const res = await fetch('/api/staff/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffList, replaceAll }),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API bulk save staff error:', err);
    return false;
  }
}

// Attendance API
export async function apiFetchAttendance(): Promise<Record<string, any>> {
  try {
    const res = await fetch('/api/attendance');
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('API fetch attendance notice:', err);
  }
  return {};
}

export async function apiSaveAttendance(date: string, records: any): Promise<boolean> {
  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, records }),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API save attendance error:', err);
    return false;
  }
}

// Customers API
export async function apiFetchCustomers(): Promise<any[]> {
  try {
    const res = await fetch('/api/customers');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.warn('API fetch customers notice:', err);
  }
  return [];
}

export async function apiSaveCustomersBulk(rows: any[], replaceAll = false): Promise<boolean> {
  try {
    const res = await fetch('/api/customers/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, replaceAll }),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API bulk save customers error:', err);
    return false;
  }
}

// Spares API
export async function apiFetchSpares(): Promise<any[]> {
  try {
    const res = await fetch('/api/spares');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.warn('API fetch spares notice:', err);
  }
  return [];
}

export async function apiSaveSparesBulk(rows: any[], replaceAll = false): Promise<boolean> {
  try {
    const res = await fetch('/api/spares/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, replaceAll }),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API bulk save spares error:', err);
    return false;
  }
}

// Service Camps API
export async function apiFetchServiceCamps(): Promise<any[]> {
  try {
    const res = await fetch('/api/service-camps');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.map((row: any) => ({
        id: row.id,
        dealershipCode: row.dealership_code || row.dealershipCode || '',
        branch: row.branch || '',
        mandal: row.mandal || '',
        village: row.village || '',
        campDate: row.camp_date || row.campDate || '',
        targetTractors: row.target_tractors || row.targetTractors || '',
        supervisor: row.supervisor || '',
        mechanic: row.mechanic || '',
        status: row.status || 'Upcoming',
        serviceTypeExpected: row.service_type_expected || row.serviceTypeExpected || '',
        offers: row.offers || '',
        contactPerson: row.contact_person || row.contactPerson || '',
        contactPhone: row.contact_phone || row.contactPhone || '',
        notes: row.notes || '',
        attendedCount: row.attended_count || row.attendedCount || '',
        createdAt: row.created_at || row.createdAt || ''
      }));
    }
  } catch (err) {
    console.warn('API fetch service camps notice:', err);
  }
  return [];
}

export async function apiSaveServiceCamp(camp: any): Promise<boolean> {
  try {
    const res = await fetch('/api/service-camps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(camp),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API save service camp error:', err);
    return false;
  }
}

export async function apiDeleteServiceCamp(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/service-camps/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API delete service camp error:', err);
    return false;
  }
}

export async function apiSaveServiceCampsBulk(camps: any[], replaceAll = false): Promise<boolean> {
  try {
    const res = await fetch('/api/service-camps/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ camps, replaceAll }),
    });
    const json = await res.json();
    return !!json.success;
  } catch (err) {
    console.warn('API bulk save service camps error:', err);
    return false;
  }
}

