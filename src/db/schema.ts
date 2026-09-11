import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (linked to Firebase Auth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Customers Master Database
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  chassisKey: text('chassis_key').notNull().unique(),
  chassisNo: text('chassis_no').notNull(),
  custName: text('cust_name'),
  fatherName: text('father_name'),
  custAddr: text('cust_addr'),
  village: text('village'),
  mandal: text('mandal'),
  ownerMob: text('owner_mob'),
  driverMob: text('driver_mob'),
  regdNo: text('regd_no'),
  engineNo: text('engine_no'),
  tractorModel: text('tractor_model'),
  dateOfDelivery: text('date_of_delivery'),
  followupHistory: text('followup_history'),
  fullData: text('full_data'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Spare Parts Price List
export const spares = pgTable('spares', {
  id: serial('id').primaryKey(),
  partKey: text('part_key').notNull().unique(),
  partNo: text('part_no').notNull(),
  partDesc: text('part_desc'),
  mrp: text('mrp'),
  category: text('category'),
  fullData: text('full_data'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Job Cards
export const jobcards = pgTable('jobcards', {
  id: text('id').primaryKey(),
  jobNo: text('job_no'),
  onlineJobCardNo: text('online_job_card_no'),
  jobDate: text('job_date'),
  dateTimeIn: text('date_time_in'),
  dateTimeOut: text('date_time_out'),
  expectedRepairTime: text('expected_repair_time'),
  status: text('status'),
  custName: text('cust_name'),
  fatherName: text('father_name'),
  custAddr: text('cust_addr'),
  village: text('village'),
  mandal: text('mandal'),
  ownerMob: text('owner_mob'),
  driverMob: text('driver_mob'),
  regdNo: text('regd_no'),
  chassisNo: text('chassis_no'),
  engineNo: text('engine_no'),
  model: text('model'),
  modelType: text('model_type'),
  serialNo: text('serial_no'),
  hourMeter: text('hour_meter'),
  serviceType: text('service_type'),
  freeServiceList: text('free_service_list'),
  extraRepairs: text('extra_repairs'),
  mechanic: text('mechanic'),
  wsIncharge: text('ws_incharge'),
  serviceLocation: text('service_location'),
  billNo: text('bill_no'),
  reasonsForAnalysis: text('reasons_for_analysis'),
  telecalling: text('telecalling'),
  warrantyOverride: text('warranty_override'),
  totalLabour: text('total_labour'),
  warrantyMaterial: text('warranty_material'),
  nonWarrantyMaterial: text('non_warranty_material'),
  gTotal: text('g_total'),
  actualClosedDate: text('actual_closed_date'),
  branch: text('branch'),
  historyFileNo: text('history_file_no'),
  complaintDate: text('complaint_date'),
  installDate: text('install_date'),
  dateOfDelivery: text('date_of_delivery'),
  distDealership: text('dist_dealership'),
  fullData: text('full_data'),
  checkpoints: text('checkpoints'),
  repairRows: text('repair_rows'),
  partRows: text('part_rows'),
  createdBy: text('created_by'),
  createdByEmail: text('created_by_email'),
  createdAt: text('created_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Customer Complaints
export const complaints = pgTable('complaints', {
  id: text('id').primaryKey(),
  complaintNo: text('complaint_no'),
  date: text('date'),
  customerName: text('customer_name'),
  phone: text('phone'),
  village: text('village'),
  mandal: text('mandal'),
  tractorModel: text('tractor_model'),
  chassisNo: text('chassis_no'),
  hours: text('hours'),
  complaintDetails: text('complaint_details'),
  mechanic: text('mechanic'),
  status: text('status'),
  jobCardNo: text('job_card_no'),
  closureDate: text('closure_date'),
  remarks: text('remarks'),
  createdAt: text('created_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Staff / Mechanics / Supervisors
export const staff = pgTable('staff', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  phone: text('phone'),
  fatherName: text('father_name'),
  village: text('village'),
  mandal: text('mandal'),
  mobileNumber: text('mobile_number'),
  dateOfJoining: text('date_of_joining'),
  supervisor: text('supervisor'),
  active: text('active').default('true'),
  assignedSupervisor: text('assigned_supervisor'),
  createdAt: text('created_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Daily Staff Attendance
export const staffAttendance = pgTable('staff_attendance', {
  id: serial('id').primaryKey(),
  date: text('date').notNull().unique(),
  records: text('records').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Application Settings (Key-Value)
export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Service Camp Planning Table
export const serviceCamps = pgTable('service_camps', {
  id: text('id').primaryKey(),
  dealershipCode: text('dealership_code'),
  branch: text('branch'),
  mandal: text('mandal'),
  village: text('village'),
  campDate: text('camp_date'),
  targetTractors: text('target_tractors'),
  supervisor: text('supervisor'),
  mechanic: text('mechanic'),
  status: text('status'),
  serviceTypeExpected: text('service_type_expected'),
  offers: text('offers'),
  contactPerson: text('contact_person'),
  contactPhone: text('contact_phone'),
  notes: text('notes'),
  attendedCount: text('attended_count'),
  createdAt: text('created_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

