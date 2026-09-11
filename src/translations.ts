export type Language = 'te' | 'en';

export interface TranslationDict {
  [key: string]: {
    te: string;
    en: string;
  };
}

export const translations = {
  // Brand & General
  appName: { te: 'శ్రీ గాయత్రి ఆటోమోటివ్స్', en: 'SRI GAYATHRI AUTOMOTIVES' },
  appTagline: { te: 'ట్రాక్టర్ సర్వీస్ & స్పేర్స్ మేనేజ్‌మెంట్', en: 'Tractor Service & Spares Management' },
  language: { te: 'భాష', en: 'Language' },
  telugu: { te: 'తెలుగు', en: 'Telugu' },
  english: { te: 'English', en: 'English' },

  // Navigation
  dashboard: { te: 'డ్యాష్‌బోర్డ్', en: 'Dashboard' },
  serviceCampPlanning: { te: '⛺ సర్వీస్ క్యాంప్ ప్లానింగ్', en: '⛺ Service Camp Planning' },
  newJobEntry: { te: 'కొత్త జాబ్ కార్డ్ ఎంట్రీ', en: 'New Job Entry' },
  customersAndJobCards: { te: '👥 కస్టమర్లు & జాబ్ కార్డులు', en: '👥 Customers & Job Cards' },
  savedJobCards: { te: 'సేవ్ చేసిన జాబ్ కార్డులు', en: 'Saved Job Cards' },
  reportsAnalytics: { te: 'రిపోర్ట్స్ & ఎనలిటిక్స్', en: 'Reports & Analytics' },
  customerData: { te: 'కస్టమర్ డేటా & ఫాలో-అప్', en: 'Customer Data' },
  teleCalling: { te: 'టెలి కాలింగ్', en: 'Tele Calling' },
  freeServiceFollowup: { te: 'ఉచిత సర్వీస్ ఫాలో-అప్', en: 'Free Service Follow-up' },
  complaintRegister: { te: 'కంప్లైంట్ రిజిస్టర్', en: 'Complaint Register' },
  staffAttendance: { te: 'సిబ్బంది హాజరు (Attendance)', en: 'Staff Attendance' },
  masterDatabases: { te: 'మాస్టర్ డేటాబేసెస్ & బ్యాకప్', en: 'Master Databases' },

  // Actions
  save: { te: 'సేవ్ చేయండి', en: 'Save' },
  saveAndPrint: { te: 'సేవ్ చేసి ప్రింట్ చేయండి', en: 'Save & Print' },
  update: { te: 'అప్‌డేట్ చేయండి', en: 'Update' },
  delete: { te: 'తొలగించండి (Delete)', en: 'Delete' },
  edit: { te: 'ఎడిట్ చేయండి', en: 'Edit' },
  view: { te: 'చూడండి (View)', en: 'View' },
  print: { te: 'ప్రింట్ చేయండి', en: 'Print' },
  cancel: { te: 'రద్దు చేయండి (Cancel)', en: 'Cancel' },
  close: { te: 'మూసివేయండి (Close)', en: 'Close' },
  clear: { te: 'క్లియర్ చేయండి', en: 'Clear' },
  search: { te: 'శోధించండి (Search)...', en: 'Search...' },
  filter: { te: 'ఫిల్టర్', en: 'Filter' },
  exportExcel: { te: 'ఎక్సెల్ డౌన్‌లోడ్', en: 'Export Excel' },
  refresh: { te: 'రిఫ్రెష్', en: 'Refresh' },
  loading: { te: 'లోడ్ అవుతోంది...', en: 'Loading...' },
  actions: { te: 'చర్యలు (Actions)', en: 'Actions' },
  status: { te: 'స్థితి (Status)', en: 'Status' },
  open: { te: 'ఓపెన్ (Open)', en: 'Open' },
  closed: { te: 'క్లోజ్డ్ (Closed)', en: 'Closed' },
  pending: { te: 'పెండింగ్ (Pending)', en: 'Pending' },
  resolved: { te: 'పరిష్కరించబడింది (Resolved)', en: 'Resolved' },
  all: { te: 'అన్నీ (All)', en: 'All' },
  yes: { te: 'అవును (Yes)', en: 'Yes' },
  no: { te: 'కాదు (No)', en: 'No' },

  // Job Card Form
  jobCardHeader: { te: 'జాబ్ కార్డ్ వివరాల నమోదు', en: 'Job Card Details Entry' },
  jobCardNo: { te: 'జాబ్ కార్డ్ నెం.', en: 'Job Card No.' },
  onlineJobCardNo: { te: 'ఆన్‌లైన్ జాబ్ కార్డ్ నెం.', en: 'Online Job Card No.' },
  jobDate: { te: 'తేదీ (Date)', en: 'Date' },
  dateTimeIn: { te: 'వచ్చిన సమయం (In Time)', en: 'Time In' },
  dateTimeOut: { te: 'వెళ్ళిన సమయం (Out Time)', en: 'Time Out' },
  serviceLocation: { te: 'సర్వీస్ ప్రదేశం', en: 'Service Location' },
  workshop: { te: 'వర్క్‌షాప్ (Workshop)', en: 'Workshop' },
  doorstep: { te: 'డోర్‌స్టెప్ (Doorstep / DSS)', en: 'Doorstep (DSS)' },
  event: { te: 'ఈవెంట్ / క్యాంప్ (Event / Camp)', en: 'Event / Camp' },

  // Customer Information
  customerInfo: { te: 'కస్టమర్ వివరాలు', en: 'Customer Information' },
  searchCustomerPlaceholder: { te: 'ఛాసిస్ / మొబైల్ / పేరు / రిజిస్ట్రేషన్ ద్వారా వెతకండి...', en: 'Search by Chassis / Mobile / Name / Reg No...' },
  customerName: { te: 'కస్టమర్ పేరు', en: 'Customer Name' },
  fatherName: { te: 'తండ్రి పేరు (S/o)', en: "Father's Name" },
  custAddress: { te: 'చిరునామా (Address)', en: 'Address' },
  village: { te: 'గ్రామం (Village)', en: 'Village' },
  mandal: { te: 'మండలం (Mandal)', en: 'Mandal' },
  ownerMobile: { te: 'యజమాని మొబైల్', en: 'Owner Mobile' },
  driverMobile: { te: 'డ్రైవర్ మొబైల్', en: 'Driver Mobile' },

  // Tractor Information
  tractorInfo: { te: 'ట్రాక్టర్ వివరాలు', en: 'Tractor Details' },
  regdNo: { te: 'రిజిస్ట్రేషన్ నెం.', en: 'Registration No.' },
  chassisNo: { te: 'ఛాసిస్ నెం.', en: 'Chassis No.' },
  engineNo: { te: 'ఇంజన్ నెం.', en: 'Engine No.' },
  tractorModel: { te: 'మోడల్ (Model)', en: 'Model' },
  modelType: { te: 'మోడల్ రకం (Type)', en: 'Model Type' },
  hourMeter: { te: 'రీడింగ్ (Hours / Kms)', en: 'Hour Meter Reading' },
  serviceType: { te: 'సర్వీస్ రకం (Service Type)', en: 'Service Type' },
  freeServiceCoupon: { te: 'ఉచిత సర్వీస్ కూపన్', en: 'Free Service Coupon' },
  selectService: { te: '-- సర్వీస్ ఎంచుకోండి --', en: '-- Select Service --' },
  freeService1: { te: '1st Free Service (50 Hrs / 1 Month)', en: '1st Free Service (50 Hrs / 1 Month)' },
  freeService2: { te: '2nd Free Service (250 Hrs / 6 Months)', en: '2nd Free Service (250 Hrs / 6 Months)' },
  freeService3: { te: '3rd Free Service (500 Hrs / 12 Months)', en: '3rd Free Service (500 Hrs / 12 Months)' },
  freeService4: { te: '4th Free Service (750 Hrs / 18 Months)', en: '4th Free Service (750 Hrs / 18 Months)' },
  freeService5: { te: '5th Free Service (1000 Hrs / 24 Months)', en: '5th Free Service (1000 Hrs / 24 Months)' },
  paidService: { te: 'పెయిడ్ సర్వీస్ (Paid Service)', en: 'Paid Service' },
  runningRepair: { te: 'రన్నింగ్ రిపేర్ (Running Repair)', en: 'Running Repair' },
  breakdown: { te: 'బ్రేక్‌డౌన్ (Breakdown Service)', en: 'Breakdown Service' },
  majorOverhaul: { te: 'మేజర్ ఓవర్‌హాల్ (Major Overhaul)', en: 'Major Overhaul' },
  pdi: { te: 'PDI (డెలివరీకి ముందు తనిఖీ)', en: 'PDI (Pre-Delivery Inspection)' },

  // Work & Spares
  workRepairs: { te: 'రిపేర్లు & పని వివరాలు', en: 'Repairs & Work Description' },
  workDescription: { te: 'కంప్లైంట్ / చేసిన పని వివరాలు', en: 'Complaint / Work Done' },
  mechanic: { te: 'మెకానిక్ పేరు', en: 'Mechanic Name' },
  supervisor: { te: 'వర్క్‌షాప్ ఇన్‌ఛార్జ్ / సూపర్వైజర్', en: 'Workshop Incharge / Supervisor' },
  sparesUsed: { te: 'ఉపయోగించిన స్పేర్ పార్ట్స్', en: 'Spare Parts Used' },
  searchSparesPlaceholder: { te: 'పార్ట్ నెం. లేదా పార్ట్ పేరు శోధించండి...', en: 'Search Part No or Description...' },
  partNo: { te: 'పార్ట్ నెం.', en: 'Part No.' },
  partDesc: { te: 'పార్ట్ వివరణ', en: 'Part Description' },
  qty: { te: 'పరిమాణం (Qty)', en: 'Quantity' },
  rate: { te: 'ధర (Rate ₹)', en: 'Rate (₹)' },
  amount: { te: 'మొత్తం (Amount ₹)', en: 'Amount (₹)' },
  addPart: { te: '+ స్పేర్ పార్ట్ జోడించండి', en: '+ Add Spare Part' },
  addRepairRow: { te: '+ రిపేర్ వరుస జోడించండి', en: '+ Add Repair Row' },

  // Billing
  billingSummary: { te: 'బిల్లింగ్ సారాంశం (Summary)', en: 'Billing Summary' },
  totalLabour: { te: 'మొత్తం లేబర్ ఛార్జీలు (₹)', en: 'Total Labour Charges (₹)' },
  warrantySpares: { te: 'వారంటీ స్పేర్స్ మొత్తం (₹)', en: 'Warranty Spares Total (₹)' },
  nonWarrantySpares: { te: 'నాన్-వారంటీ స్పేర్స్ మొత్తం (₹)', en: 'Customer Payable Spares (₹)' },
  grandTotal: { te: 'మొత్తం బిల్లు (Grand Total ₹)', en: 'Grand Total (₹)' },
  billNo: { te: 'బిల్ నెం. (Bill No)', en: 'Bill No.' },
  closedDate: { te: 'క్లోజ్ చేసిన తేదీ', en: 'Closed Date' },

  // Saved Cards
  savedCardsTitle: { te: 'సేవ్ చేసిన జాబ్ కార్డుల జాబితా', en: 'Saved Job Cards Register' },
  totalCards: { te: 'మొత్తం జాబ్ కార్డులు', en: 'Total Job Cards' },
  fromDate: { te: 'ప్రారంభ తేదీ (From)', en: 'From Date' },
  toDate: { te: 'ముగింపు తేదీ (To)', en: 'To Date' },
  filterByStatus: { te: 'స్థితి ఫిల్టర్', en: 'Status Filter' },
  filterByMechanic: { te: 'మెకానిక్ ఫిల్టర్', en: 'Mechanic Filter' },
  missingOnlineNo: { te: 'ఆన్‌లైన్ నెం. లేనివి (Missing Online No.)', en: 'Missing Online No.' },
  slNo: { te: 'క్రమ సంఖ్య (S.No)', en: 'S.No' },

  // Dashboard
  todayJobs: { te: 'ఈ రోజు జాబ్ కార్డులు', en: 'Today Job Cards' },
  monthlyJobs: { te: 'ఈ నెల మొత్తం జాబ్స్', en: 'This Month Total Jobs' },
  pendingComplaints: { te: 'పెండింగ్ కంప్లైంట్లు', en: 'Pending Complaints' },
  staffPresent: { te: 'హాజరైన సిబ్బంది', en: 'Staff Present Today' },
  quickActions: { te: 'త్వరిత చర్యలు (Quick Actions)', en: 'Quick Actions' },

  // Complaints
  complaintTitle: { te: 'కంప్లైంట్ రిజిస్ట్రేషన్ & ట్రాకింగ్', en: 'Complaint Registration & Tracking' },
  registerNewComplaint: { te: '+ కొత్త కంప్లైంట్ నమోదు', en: '+ Register New Complaint' },
  complaintNo: { te: 'కంప్లైంట్ నెం.', en: 'Complaint No.' },
  complaintDate: { te: 'కంప్లైంట్ తేదీ', en: 'Complaint Date' },
  complaintDetails: { te: 'కంప్లైంట్ పూర్తి వివరాలు', en: 'Complaint Details' },
  assignedMechanic: { te: 'కేటాయించిన మెకానిక్', en: 'Assigned Mechanic' },
  linkJobCard: { te: 'జాబ్ కార్డ్ నెం. అనుసంధానం', en: 'Link Job Card No.' },
  resolutionRemarks: { te: 'పరిష్కార వివరాలు / రిమార్క్స్', en: 'Resolution Remarks' },

  // Staff & Attendance
  staffList: { te: 'సిబ్బంది జాబితా (Staff Members)', en: 'Staff Members' },
  addStaff: { te: '+ కొత్త ఉద్యోగిని జోడించండి', en: '+ Add New Staff' },
  staffName: { te: 'సిబ్బంది పేరు', en: 'Staff Name' },
  role: { te: 'హోదా (Designation / Role)', en: 'Role / Designation' },
  mobileNo: { te: 'ఫోన్ నెంబర్', en: 'Phone Number' },
  activeStaff: { te: 'యాక్టివ్ (Active)', en: 'Active' },
  inactiveStaff: { te: 'ఇన్‌యాక్టివ్ (Inactive)', en: 'Inactive' },
  markAttendance: { te: 'రోజువారీ హాజరు నమోదు', en: 'Daily Attendance Entry' },
  attendanceDate: { te: 'హాజరు తేదీ', en: 'Attendance Date' },
  present: { te: 'హాజరు (Present)', en: 'Present' },
  absent: { te: 'గైర్హాజరు (Absent)', en: 'Absent' },
  halfDay: { te: 'హాఫ్ డే (Half Day)', en: 'Half Day' },
  leave: { te: 'సెలవు (Leave)', en: 'Leave' },
  remarks: { te: 'రిమార్క్స్', en: 'Remarks' },
  saveAttendance: { te: 'హాజరు సేవ్ చేయండి', en: 'Save Attendance' },
  monthlySummary: { te: 'నెలవారీ హాజరు సారాంశం', en: 'Monthly Attendance Summary' },

  // Master Databases & Sync
  masterTitle: { te: 'మాస్టర్ డేటాబేస్ & క్లౌడ్ బ్యాకప్ మేనేజ్‌మెంట్', en: 'Master Database & Cloud Backup Management' },
  customerMaster: { te: 'కస్టమర్ మాస్టర్ డేటా', en: 'Customer Master Data' },
  customerDetails: { te: 'కస్టమర్ వివరాలు', en: 'Customer Details' },
  sparesMaster: { te: 'స్పేర్స్ మాస్టర్ డేటా', en: 'Spares Master Data' },
  importCustomerExcel: { te: 'కస్టమర్ ఎక్సెల్ ఫైల్ అప్‌లోడ్ (Import)', en: 'Import Customer Excel File' },
  importSparesExcel: { te: 'స్పేర్స్ ఎక్సెల్ ఫైల్ అప్‌లోడ్ (Import)', en: 'Import Spares Excel File' },
  masterBackupDownload: { te: 'మాస్టర్ ఎక్సెల్ ఫైల్ డౌన్‌లోడ్ (Excel)', en: 'Download Master Backup (Excel)' },
  masterRestoreUpload: { te: 'మాస్టర్ ఫైల్ అప్‌లోడ్ (Restore)', en: 'Upload Master Backup (Restore)' },
  cloudDbStatus: { te: 'Cloud SQL శాశ్వత డేటాబేస్ (అపరిమిత నిల్వ)', en: 'Cloud SQL Permanent Database (Unlimited)' },
  googleSheetsSync: { te: 'గూగుల్ షీట్స్ లైవ్ సింక్రొనైజేషన్', en: 'Google Sheets Live Synchronization' },
  connectSheets: { te: 'గూగుల్ షీట్స్ కనెక్ట్ చేయండి', en: 'Connect Google Sheets' },
  disconnectSheets: { te: 'షీట్స్ డిస్‌కనెక్ట్ చేయండి', en: 'Disconnect Sheets' },

  // Alerts & Confirmations
  saveSuccess: { te: '✅ వివరాలు విజయవంతంగా సేవ్ చేయబడ్డాయి!', en: '✅ Details saved successfully!' },
  deleteConfirm: { te: 'మీరు ఖచ్చితంగా ఈ రికార్డును తొలగించాలనుకుంటున్నారా?', en: 'Are you sure you want to delete this record?' },
  restoreConfirm: { te: 'దీని ద్వారా మీ డేటా మొత్తం అప్‌లోడ్ చేసిన ఫైల్‌తో మారుతుంది (Replace అవుతుంది). కొనసాగించాలా?', en: 'This will replace current data with the uploaded file. Do you want to proceed?' },
  fillRequired: { te: 'దయచేసి అవసరమైన వివరాలను పూరించండి.', en: 'Please fill in the required fields.' },
};

export function getTranslation(key: keyof typeof translations, lang: Language): string {
  const item = translations[key];
  if (!item) return key;
  return item[lang] || item['en'] || key;
}
