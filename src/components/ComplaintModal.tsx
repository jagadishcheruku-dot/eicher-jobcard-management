import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Tractor,
  Wrench,
  FileText,
  Clock,
  MapPin,
  CheckCircle2,
  PlusCircle,
  Save,
  PenLine,
  Sparkles,
  Search,
  Check,
  ChevronDown
} from "lucide-react";

export interface ComplaintData {
  id?: string;
  complaintNo?: string;
  complaintDate?: string;
  date?: string;
  createdDate?: string;
  createdAt?: string;
  chassisNo?: string;
  customerName?: string;
  mobileNumber?: string;
  phone?: string;
  tractorModel?: string;
  village?: string;
  mandal?: string;
  complaintDetails?: string;
  assignedMechanic?: string;
  mechanic?: string;
  assignedSupervisor?: string;
  supervisor?: string;
  status?: "Open" | "Running" | "Closed" | string;
  resolution?: string;
  closureDate?: string;
  closedDate?: string;
  actualClosedDate?: string;
  jobCardNo?: string;
  hours?: number | string;
  remarks?: string;
  createdBy?: string;
}

interface ComplaintModalProps {
  isOpen: boolean;
  isViewOnly?: boolean;
  complaint: ComplaintData | null;
  language: "te" | "en";
  mechanicsList?: string[];
  supervisorsList?: string[];
  customersList?: any[];
  customersMap?: Record<string, any>;
  jobCardsList?: any[];
  onLookupCustomer?: (query: string) => any;
  onClose: () => void;
  onSave: (data: ComplaintData) => Promise<void> | void;
  onCreateJobCard?: (complaint: ComplaintData) => void;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  isViewOnly = false,
  complaint,
  language = "te",
  mechanicsList = [],
  supervisorsList = [],
  customersList = [],
  customersMap = {},
  jobCardsList = [],
  onLookupCustomer,
  onClose,
  onSave,
  onCreateJobCard,
}) => {
  const isTe = language === "te";
  const todayStr = new Date().toISOString().split("T")[0];

  const [viewOnly, setViewOnly] = useState(isViewOnly);

  useEffect(() => {
    setViewOnly(isViewOnly);
  }, [isViewOnly, isOpen]);

  const [formData, setFormData] = useState<ComplaintData>({
    id: "",
    complaintNo: "",
    complaintDate: todayStr,
    chassisNo: "",
    customerName: "",
    mobileNumber: "",
    tractorModel: "Eicher 380",
    village: "",
    mandal: "",
    complaintDetails: "",
    assignedMechanic: "",
    assignedSupervisor: "",
    status: "Open",
    resolution: "",
    closureDate: "",
    jobCardNo: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Auto-fill state
  const [activeDropdown, setActiveDropdown] = useState<"chassis" | "name" | "mobile" | null>(null);
  const [autoFilledNotice, setAutoFilledNotice] = useState<{
    name: string;
    chassis?: string;
    mobile?: string;
    source?: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync state when complaint prop changes
  useEffect(() => {
    if (!isOpen) return;

    if (complaint && (complaint.id || complaint.complaintNo || complaint.customerName || complaint.chassisNo)) {
      const createdDateVal =
        complaint.complaintDate ||
        complaint.createdDate ||
        complaint.date ||
        (complaint.createdAt ? complaint.createdAt.split("T")[0] : todayStr);

      const closedDateVal =
        complaint.closureDate ||
        complaint.closedDate ||
        complaint.actualClosedDate ||
        "";

      setFormData({
        id: complaint.id || "",
        complaintNo: complaint.complaintNo || "",
        complaintDate: createdDateVal,
        chassisNo: complaint.chassisNo || "",
        customerName: complaint.customerName || "",
        mobileNumber: complaint.mobileNumber || complaint.phone || "",
        tractorModel: complaint.tractorModel || "Eicher 380",
        village: complaint.village || "",
        mandal: complaint.mandal || "",
        complaintDetails: complaint.complaintDetails || "",
        assignedMechanic: complaint.assignedMechanic || complaint.mechanic || "",
        assignedSupervisor: complaint.assignedSupervisor || complaint.supervisor || "",
        status: complaint.status || (closedDateVal ? "Closed" : "Open"),
        resolution: complaint.resolution || complaint.remarks || "",
        closureDate: closedDateVal,
        jobCardNo: complaint.jobCardNo || "",
      });
    } else {
      setFormData({
        id: "",
        complaintNo: "",
        complaintDate: todayStr,
        chassisNo: "",
        customerName: "",
        mobileNumber: "",
        tractorModel: "Eicher 380",
        village: "",
        mandal: "",
        complaintDetails: "",
        assignedMechanic: "",
        assignedSupervisor: "",
        status: "Open",
        resolution: "",
        closureDate: "",
        jobCardNo: "",
      });
    }
    setValidationError("");
    setAutoFilledNotice(null);
    setActiveDropdown(null);
  }, [complaint, isOpen]);

  // Clean strings for fuzzy / case-insensitive matching
  const cleanStr = (val: any) =>
    String(val || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const cleanPhone = (val: any) =>
    String(val || "").replace(/\D/g, "");

  // Normalize customer record fields from Customer Master or Job Card
  const extractCustomerFields = (record: any) => {
    if (!record) return null;
    const raw = record.full_data || record.fullData || record;

    const chassis =
      record.__chassisDisplay ||
      record.chassisNo ||
      record["Chassis no"] ||
      record["Chassis No"] ||
      record["CHASSIS NO"] ||
      record.chassis ||
      record.chassis_no ||
      raw.chassisNo ||
      raw["Chassis no"] ||
      raw["Chassis No"] ||
      raw.chassis ||
      "";

    const name =
      record.__custNameDisplay ||
      record["Customer Name"] ||
      record["Customer name"] ||
      record["CUSTOMER NAME"] ||
      record.custName ||
      record.customerName ||
      record.name ||
      raw["Customer Name"] ||
      raw.custName ||
      raw.customerName ||
      "";

    const mobile =
      record.__custPhoneDisplay ||
      record["Mobile Number"] ||
      record["Mobile Numb"] ||
      record["Mobile No"] ||
      record.mobileNumber ||
      record.ownerMob ||
      record.phone ||
      record.phoneNo ||
      record.mobile ||
      raw["Mobile Number"] ||
      raw.mobileNumber ||
      raw.phone ||
      "";

    const model =
      record.model ||
      record.Model ||
      record["MODEL"] ||
      record.tractorModel ||
      record.modelType ||
      record["MODEL TYPE"] ||
      record["Model Type"] ||
      raw.model ||
      raw.Model ||
      raw.tractorModel ||
      "";

    const village =
      record.village ||
      record.Village ||
      record.VILLAGE ||
      record.custAddr ||
      record.address ||
      raw.village ||
      raw.Village ||
      raw.custAddr ||
      "";

    const mandal =
      record.mandal ||
      record.Mandal ||
      record.MANDAL ||
      record.tehsil ||
      raw.mandal ||
      raw.Mandal ||
      "";

    const supervisor =
      record.supervisor ||
      record.SUPERVISOR ||
      record["Supervisor Name"] ||
      record["SUPERVISOR"] ||
      record.assignedSupervisor ||
      raw.supervisor ||
      raw.SUPERVISOR ||
      "";

    return {
      chassis: String(chassis || "").trim(),
      name: String(name || "").trim(),
      mobile: String(mobile || "").trim(),
      model: String(model || "").trim(),
      village: String(village || "").trim(),
      mandal: String(mandal || "").trim(),
      supervisor: String(supervisor || "").trim(),
      source: record.cardNo || record.jobCardNo ? "Job Card" : "Customer Master",
    };
  };

  // Build a merged customer pool from customersList, customersMap, and jobCardsList
  const allCustomerRecords = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    // 1. Master customer list
    (customersList || []).forEach((c) => {
      if (!c) return;
      const parsed = extractCustomerFields(c);
      if (!parsed || (!parsed.chassis && !parsed.name && !parsed.mobile)) return;
      const key = `${cleanStr(parsed.chassis)}_${cleanPhone(parsed.mobile)}_${cleanStr(parsed.name)}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ ...parsed, raw: c });
      }
    });

    // 2. Map values if not already present
    if (customersMap && typeof customersMap === "object") {
      Object.values(customersMap).forEach((c: any) => {
        if (!c) return;
        const parsed = extractCustomerFields(c);
        if (!parsed || (!parsed.chassis && !parsed.name && !parsed.mobile)) return;
        const key = `${cleanStr(parsed.chassis)}_${cleanPhone(parsed.mobile)}_${cleanStr(parsed.name)}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ ...parsed, raw: c });
        }
      });
    }

    // 3. Saved Job cards
    (jobCardsList || []).forEach((jc) => {
      if (!jc) return;
      const parsed = extractCustomerFields(jc);
      if (!parsed || (!parsed.chassis && !parsed.name && !parsed.mobile)) return;
      const key = `${cleanStr(parsed.chassis)}_${cleanPhone(parsed.mobile)}_${cleanStr(parsed.name)}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ ...parsed, raw: jc });
      }
    });

    return list;
  }, [customersList, customersMap, jobCardsList]);

  // Apply matched customer details into form state
  const applyCustomerData = (record: any, matchReason?: string) => {
    const info = extractCustomerFields(record);
    if (!info) return;

    // Match supervisor case-insensitively with supervisorsList
    let matchedSupervisor = "";
    if (info.supervisor && supervisorsList.length > 0) {
      const cleanSpv = cleanStr(info.supervisor);
      const found = supervisorsList.find((s) => cleanStr(s) === cleanSpv);
      if (found) {
        matchedSupervisor = found;
      } else {
        matchedSupervisor = info.supervisor;
      }
    } else if (info.supervisor) {
      matchedSupervisor = info.supervisor;
    }

    setFormData((prev) => ({
      ...prev,
      chassisNo: info.chassis || prev.chassisNo,
      customerName: info.name || prev.customerName,
      mobileNumber: info.mobile || prev.mobileNumber,
      tractorModel: info.model || prev.tractorModel || "Eicher 380",
      village: info.village || prev.village,
      mandal: info.mandal || prev.mandal,
      assignedSupervisor: matchedSupervisor || prev.assignedSupervisor,
    }));

    setAutoFilledNotice({
      name: info.name || "Customer",
      chassis: info.chassis,
      mobile: info.mobile,
      source: matchReason || info.source,
    });

    setActiveDropdown(null);
  };

  // Find exact or best customer match for a given query
  const findCustomerMatch = (query: string, fieldType: "chassis" | "name" | "mobile") => {
    const raw = (query || "").trim();
    if (!raw) return null;

    // 1. If onLookupCustomer prop provided, try it
    if (onLookupCustomer) {
      const res = onLookupCustomer(raw);
      if (res) return res;
    }

    const clean = cleanStr(raw);
    const digits = cleanPhone(raw);

    // 2. Direct map lookup
    if (fieldType === "chassis") {
      const direct =
        customersMap[clean] ||
        customersMap[raw.toUpperCase()] ||
        customersMap[raw] ||
        customersMap["chassis_" + clean];
      if (direct) return direct;
    } else if (fieldType === "mobile") {
      const direct =
        customersMap["mob_" + digits] ||
        customersMap["mob_" + clean] ||
        customersMap[digits];
      if (direct) return direct;
    } else if (fieldType === "name") {
      const direct = customersMap["name_" + clean] || customersMap[clean];
      if (direct) return direct;
    }

    // 3. Search in customer pool
    if (fieldType === "chassis" && clean.length >= 3) {
      return allCustomerRecords.find((c) => {
        const ch = cleanStr(c.chassis);
        return ch === clean || (clean.length >= 4 && ch.endsWith(clean)) || ch.includes(clean);
      });
    }

    if (fieldType === "mobile" && digits.length >= 5) {
      return allCustomerRecords.find((c) => {
        const ph = cleanPhone(c.mobile);
        return ph === digits || ph.endsWith(digits) || (digits.length >= 7 && ph.includes(digits));
      });
    }

    if (fieldType === "name" && clean.length >= 3) {
      return allCustomerRecords.find((c) => {
        const nm = cleanStr(c.name);
        return nm === clean || nm.startsWith(clean) || nm.includes(clean);
      });
    }

    return null;
  };

  // Suggestions for currently active field
  const suggestions = useMemo(() => {
    if (!activeDropdown) return [];

    if (activeDropdown === "chassis") {
      const q = cleanStr(formData.chassisNo);
      if (q.length < 2) return [];
      return allCustomerRecords
        .filter((c) => {
          const ch = cleanStr(c.chassis);
          return ch.includes(q) || (q.length >= 3 && ch.endsWith(q));
        })
        .slice(0, 8);
    }

    if (activeDropdown === "name") {
      const q = cleanStr(formData.customerName);
      if (q.length < 2) return [];
      return allCustomerRecords
        .filter((c) => {
          const nm = cleanStr(c.name);
          return nm.includes(q);
        })
        .slice(0, 8);
    }

    if (activeDropdown === "mobile") {
      const d = cleanPhone(formData.mobileNumber);
      if (d.length < 3) return [];
      return allCustomerRecords
        .filter((c) => {
          const ph = cleanPhone(c.mobile);
          return ph.includes(d);
        })
        .slice(0, 8);
    }

    return [];
  }, [activeDropdown, formData.chassisNo, formData.customerName, formData.mobileNumber, allCustomerRecords]);

  // Handle Chassis input & auto-lookup
  const handleChassisChange = (val: string) => {
    setFormData((prev) => ({ ...prev, chassisNo: val }));
    setActiveDropdown("chassis");

    const clean = cleanStr(val);
    // If exact or full chassis (usually 6-8+ chars), try auto-fill immediately
    if (clean.length >= 5) {
      const match = findCustomerMatch(val, "chassis");
      if (match) {
        const info = extractCustomerFields(match);
        if (info && (!formData.customerName || !formData.mobileNumber)) {
          applyCustomerData(match, isTe ? "ఛాసిస్ నంబర్ ఆధారంగా" : "Matched by Chassis No");
        }
      }
    }
  };

  // Handle Chassis Blur
  const handleChassisBlur = () => {
    // Delay hiding dropdown so clicks register
    setTimeout(() => {
      if (activeDropdown === "chassis") setActiveDropdown(null);
    }, 250);

    const raw = (formData.chassisNo || "").trim();
    if (raw.length >= 3 && (!formData.customerName || !formData.mobileNumber)) {
      const match = findCustomerMatch(raw, "chassis");
      if (match) {
        applyCustomerData(match, isTe ? "ఛాసిస్ నంబర్ ఆధారంగా" : "Matched by Chassis No");
      }
    }
  };

  // Handle Customer Name input & auto-lookup
  const handleNameChange = (val: string) => {
    setFormData((prev) => ({ ...prev, customerName: val }));
    setActiveDropdown("name");

    const clean = cleanStr(val);
    if (clean.length >= 4) {
      // Check for exact name match
      const exactMatch = allCustomerRecords.find((c) => cleanStr(c.name) === clean);
      if (exactMatch && (!formData.chassisNo || !formData.mobileNumber)) {
        applyCustomerData(exactMatch, isTe ? "కస్టమర్ పేరు ఆధారంగా" : "Matched by Customer Name");
      }
    }
  };

  // Handle Customer Name Blur
  const handleNameBlur = () => {
    setTimeout(() => {
      if (activeDropdown === "name") setActiveDropdown(null);
    }, 250);

    const raw = (formData.customerName || "").trim();
    if (raw.length >= 3 && (!formData.chassisNo || !formData.mobileNumber)) {
      const match = findCustomerMatch(raw, "name");
      if (match) {
        applyCustomerData(match, isTe ? "కస్టమర్ పేరు ఆధారంగా" : "Matched by Customer Name");
      }
    }
  };

  // Handle Mobile input & auto-lookup
  const handleMobileChange = (val: string) => {
    setFormData((prev) => ({ ...prev, mobileNumber: val }));
    setActiveDropdown("mobile");

    const digits = cleanPhone(val);
    // If full 10 digit mobile is entered, auto-fill instantly!
    if (digits.length >= 10) {
      const match = findCustomerMatch(digits, "mobile");
      if (match) {
        applyCustomerData(match, isTe ? "మొబైల్ నంబర్ ఆధారంగా" : "Matched by Mobile Number");
      }
    }
  };

  // Handle Mobile Blur
  const handleMobileBlur = () => {
    setTimeout(() => {
      if (activeDropdown === "mobile") setActiveDropdown(null);
    }, 250);

    const digits = cleanPhone(formData.mobileNumber);
    if (digits.length >= 5 && (!formData.customerName || !formData.chassisNo)) {
      const match = findCustomerMatch(digits, "mobile");
      if (match) {
        applyCustomerData(match, isTe ? "మొబైల్ నంబర్ ఆధారంగా" : "Matched by Mobile Number");
      }
    }
  };

  const handleInputChange = (field: keyof ComplaintData, val: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === "closureDate" && val && String(val).trim() !== "") {
        updated.status = "Closed";
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName?.trim()) {
      setValidationError(isTe ? "దయచేసి కస్టమర్ పేరు నమోదు చేయండి" : "Please enter Customer Name");
      return;
    }
    if (!formData.complaintDetails?.trim()) {
      setValidationError(isTe ? "దయచేసి కంప్లైంట్ వివరాలు నమోదు చేయండి" : "Please enter Complaint Details");
      return;
    }

    let finalStatus = formData.status || "Open";
    let finalClosureDate = formData.closureDate || "";
    if (finalClosureDate && finalClosureDate.trim() !== "") {
      finalStatus = "Closed";
    }
    if (finalStatus === "Closed" && !finalClosureDate) {
      finalClosureDate = todayStr;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        status: finalStatus,
        closureDate: finalClosureDate,
        closedDate: finalClosureDate,
      });
    } catch (err) {
      console.error("Error submitting complaint:", err);
      setValidationError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:hidden animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl border border-white/20">
              <AlertCircle className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {viewOnly
                    ? isTe
                      ? "కంప్లైంట్ పూర్తి వివరాలు"
                      : "Complaint Details"
                    : formData.id
                    ? isTe
                      ? "కంప్లైంట్ ఎడిట్ చేయండి"
                      : "Edit Customer Complaint"
                    : isTe
                    ? "కొత్త కంప్లైంట్ నమోదు చేయండి"
                    : "Add Customer Complaint"}
                </h3>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Auto-fill Ready</span>
                </span>
              </div>
              <p className="text-[11px] text-red-100 font-medium">
                {formData.complaintNo
                  ? `No: ${formData.complaintNo}`
                  : (isTe
                    ? "శ్రీ గాయత్రి ఆటోమోటివ్స్ కంప్లైంట్ రిజిస్టర్"
                    : "Sri Gayathri Automotives Complaint Register")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCreateJobCard && (
              <button
                type="button"
                onClick={() => onCreateJobCard(formData)}
                className="px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                title={isTe ? "ఈ కంప్లైంట్ కోసం జాబ్ కార్డ్ ఓపెన్ చేయండి" : "Open / Create Job Card for this complaint"}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isTe ? "జాబ్ కార్డ్" : "Job Card"}</span>
              </button>
            )}
            {viewOnly && (
              <button
                type="button"
                onClick={() => setViewOnly(false)}
                className="px-2.5 py-1.5 bg-white text-red-700 hover:bg-red-50 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                title={isTe ? "సవరించు (Edit)" : "Edit"}
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>{isTe ? "సవరించు" : "Edit"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-5 py-2 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Auto-filled Notification Banner */}
        {autoFilledNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-4 sm:px-5 py-2 text-xs font-semibold flex items-center justify-between shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                <Check className="w-3 h-3" /> Auto-filled
              </span>
              <span>
                {isTe ? "కస్టమర్ వివరాలు నింపబడ్డాయి:" : "Customer details loaded:"}
                <strong className="text-emerald-950 ml-1">{autoFilledNotice.name}</strong>
              </span>
              {autoFilledNotice.chassis && (
                <span className="text-emerald-700 font-mono text-[11px]">
                  (Chassis: {autoFilledNotice.chassis})
                </span>
              )}
              {autoFilledNotice.mobile && (
                <span className="text-emerald-700 font-mono text-[11px]">
                  (Mob: {autoFilledNotice.mobile})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAutoFilledNotice(null)}
              className="text-emerald-700 hover:text-emerald-950 text-xs font-bold underline cursor-pointer shrink-0 ml-2"
            >
              {isTe ? "సరే (OK)" : "Dismiss"}
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Helpful Auto-fill Info Prompt */}
          {!viewOnly && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 text-slate-600">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-[11px] font-medium leading-tight">
                  {isTe
                    ? "సూచన: ఛాసిస్ నెం, కస్టమర్ పేరు లేదా మొబైల్ నంబర్ ఎంటర్ చేస్తే డేటాబేస్ నుండి మిగిలిన వివరాలు ఆటోమేటిక్‌గా ఫిల్ అవుతాయి."
                    : "Tip: Type Chassis No, Customer Name, or Mobile Number to auto-fill all details from the database."}
                </span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                {allCustomerRecords.length} records
              </span>
            </div>
          )}

          {/* Row 1: Date & Chassis No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTe ? "కంప్లైంట్ తేదీ (Date) *" : "Complaint Date *"}
              </label>
              <div className="relative">
                <input
                  type="date"
                  disabled={viewOnly}
                  value={formData.complaintDate || todayStr}
                  onChange={(e) => handleInputChange("complaintDate", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all disabled:opacity-80"
                  required
                />
              </div>
            </div>

            {/* Chassis No with Instant Auto-fill */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <span>{isTe ? "ఛాసిస్ నెం. (Chassis No)" : "Chassis No"}</span>
                </label>
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                  <span>Auto-fill</span>
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  disabled={viewOnly}
                  value={formData.chassisNo || ""}
                  placeholder="e.g. 10183182"
                  onChange={(e) => handleChassisChange(e.target.value)}
                  onFocus={() => {
                    if (formData.chassisNo && cleanStr(formData.chassisNo).length >= 2) {
                      setActiveDropdown("chassis");
                    }
                  }}
                  onBlur={handleChassisBlur}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-red-600 focus:bg-white uppercase transition-all disabled:opacity-80 pr-8"
                />
                <Tractor className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Suggestions Dropdown for Chassis */}
              {!viewOnly && activeDropdown === "chassis" && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-1.5 bg-slate-100/90 px-3 text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>{isTe ? "సరిపోలే కస్టమర్లు (క్లిక్ చేయండి):" : "Matching Customers (Click to auto-fill):"}</span>
                    <span>{suggestions.length} found</span>
                  </div>
                  {suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyCustomerData(item, isTe ? "ఛాసిస్ ఎంపిక" : "Chassis Selected");
                      }}
                      className="p-2.5 hover:bg-red-50/80 cursor-pointer transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs truncate">
                          <User className="w-3 h-3 text-red-600 shrink-0" />
                          <span>{item.name || "Unknown"}</span>
                          {item.village && (
                            <span className="text-slate-400 font-normal text-[10px] truncate">
                              • {item.village}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-red-700 bg-red-100/60 px-1 rounded">
                            Chassis: {item.chassis || "—"}
                          </span>
                          {item.mobile && (
                            <span className="text-slate-500 flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {item.mobile}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                          {item.model || "Eicher"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Customer Name & Mobile Number (Both with instant Auto-fill) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Customer Name Field */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <span>{isTe ? "కస్టమర్ పేరు (Customer Name) *" : "Customer Name *"}</span>
                </label>
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                  <span>Auto-fill</span>
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  disabled={viewOnly}
                  value={formData.customerName || ""}
                  placeholder="Enter or search customer name"
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => {
                    if (formData.customerName && cleanStr(formData.customerName).length >= 2) {
                      setActiveDropdown("name");
                    }
                  }}
                  onBlur={handleNameBlur}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all disabled:opacity-80 pr-8"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Suggestions Dropdown for Customer Name */}
              {!viewOnly && activeDropdown === "name" && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-1.5 bg-slate-100/90 px-3 text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>{isTe ? "సరిపోలే కస్టమర్లు (క్లిక్ చేయండి):" : "Matching Customers (Click to auto-fill):"}</span>
                    <span>{suggestions.length} found</span>
                  </div>
                  {suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyCustomerData(item, isTe ? "పేరు ఎంపిక" : "Name Selected");
                      }}
                      className="p-2.5 hover:bg-red-50/80 cursor-pointer transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs truncate">
                          <User className="w-3 h-3 text-red-600 shrink-0" />
                          <span className="text-red-700 font-bold">{item.name}</span>
                          {item.village && (
                            <span className="text-slate-400 font-normal text-[10px] truncate">
                              • {item.village}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 flex items-center gap-2 mt-0.5">
                          {item.chassis && (
                            <span className="font-semibold text-slate-700">
                              Chassis: {item.chassis}
                            </span>
                          )}
                          {item.mobile && (
                            <span className="text-slate-500 flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {item.mobile}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                          {item.model || "Eicher"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Number Field */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <span>{isTe ? "మొబైల్ నంబర్ (Mobile Number)" : "Mobile Number"}</span>
                </label>
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                  <span>Auto-fill</span>
                </span>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  disabled={viewOnly}
                  value={formData.mobileNumber || ""}
                  placeholder="10-digit mobile number"
                  onChange={(e) => handleMobileChange(e.target.value)}
                  onFocus={() => {
                    if (formData.mobileNumber && cleanPhone(formData.mobileNumber).length >= 3) {
                      setActiveDropdown("mobile");
                    }
                  }}
                  onBlur={handleMobileBlur}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all disabled:opacity-80 pr-8"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Suggestions Dropdown for Mobile Number */}
              {!viewOnly && activeDropdown === "mobile" && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-1.5 bg-slate-100/90 px-3 text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>{isTe ? "సరిపోలే కస్టమర్లు (క్లిక్ చేయండి):" : "Matching Customers (Click to auto-fill):"}</span>
                    <span>{suggestions.length} found</span>
                  </div>
                  {suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyCustomerData(item, isTe ? "మొబైల్ ఎంపిక" : "Mobile Selected");
                      }}
                      className="p-2.5 hover:bg-red-50/80 cursor-pointer transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs truncate">
                          <User className="w-3 h-3 text-red-600 shrink-0" />
                          <span>{item.name || "Unknown"}</span>
                          {item.village && (
                            <span className="text-slate-400 font-normal text-[10px] truncate">
                              • {item.village}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-emerald-700 bg-emerald-100/60 px-1 rounded flex items-center gap-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            {item.mobile}
                          </span>
                          {item.chassis && (
                            <span className="text-slate-500 font-semibold">
                              Chassis: {item.chassis}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                          {item.model || "Eicher"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Tractor Model & Village */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTe ? "ట్రాక్టర్ మోడల్ (Model)" : "Tractor Model"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={viewOnly}
                  value={formData.tractorModel || ""}
                  placeholder="e.g. Eicher 380 Super DI"
                  onChange={(e) => handleInputChange("tractorModel", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all disabled:opacity-80"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTe ? "గ్రామం / ఊరు (Village & Mandal)" : "Village & Mandal"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={viewOnly}
                  value={formData.village || ""}
                  placeholder="Village and Mandal"
                  onChange={(e) => handleInputChange("village", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all disabled:opacity-80"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 4: Complaint Details */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isTe ? "కంప్లైంట్ / సమస్య వివరాలు (Complaint Details) *" : "Complaint Details / Problem Reported *"}
            </label>
            <textarea
              rows={3}
              disabled={viewOnly}
              value={formData.complaintDetails || ""}
              placeholder={
                isTe
                  ? "ట్రాక్టర్ సమస్యలు, లోపాలు లేదా కస్టమర్ ఫిర్యాదు నమోదు చేయండి..."
                  : "Describe the complaint in detail..."
              }
              onChange={(e) => handleInputChange("complaintDetails", e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all disabled:opacity-80 resize-y"
              required
            />
          </div>

          {/* Row 5: Assigned Mechanic & Supervisor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTe ? "మెకానిక్ (Assigned Mechanic)" : "Assigned Mechanic"}
              </label>
              <div className="relative">
                <select
                  disabled={viewOnly}
                  value={formData.assignedMechanic || ""}
                  onChange={(e) => handleInputChange("assignedMechanic", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 outline-none focus:border-red-600 cursor-pointer disabled:opacity-80"
                >
                  <option value="">{isTe ? "-- మెకానిక్ ఎంచుకోండి --" : "-- Select Mechanic --"}</option>
                  {mechanicsList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTe ? "సూపర్‌వైజర్ (Supervisor)" : "Assigned Supervisor"}
              </label>
              <div className="relative">
                <select
                  disabled={viewOnly}
                  value={formData.assignedSupervisor || ""}
                  onChange={(e) => handleInputChange("assignedSupervisor", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 outline-none focus:border-red-600 cursor-pointer disabled:opacity-80"
                >
                  <option value="">{isTe ? "-- సూపర్‌వైజర్ ఎంచుకోండి --" : "-- Select Supervisor --"}</option>
                  {supervisorsList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 6: Status & Closure Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTe ? "స్టేటస్ (Complaint Status)" : "Status"}
              </label>
              <select
                disabled={viewOnly}
                value={formData.status || "Open"}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:border-red-600 cursor-pointer disabled:opacity-80"
              >
                <option value="Open">🔴 Open (పెండింగ్)</option>
                <option value="Running">🟡 Running (పని జరుగుతుంది)</option>
                <option value="Closed">🟢 Closed (పరిష్కరించబడింది)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isTe ? "ముగింపు తేదీ (Closure Date)" : "Closure Date"}
              </label>
              <input
                type="date"
                disabled={viewOnly}
                value={formData.closureDate || ""}
                onChange={(e) => handleInputChange("closureDate", e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 outline-none focus:border-red-600 transition-all disabled:opacity-80"
              />
            </div>
          </div>

          {/* Row 7: Resolution Remarks */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isTe ? "పరిష్కార వివరాలు (Resolution / Action Taken)" : "Resolution Remarks"}
            </label>
            <input
              type="text"
              disabled={viewOnly}
              value={formData.resolution || ""}
              placeholder={isTe ? "ఏం పని చేశారు లేదా రిమార్క్స్..." : "Action taken / parts replaced / remarks..."}
              onChange={(e) => handleInputChange("resolution", e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all disabled:opacity-80"
            />
          </div>

          {/* Buttons Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 shrink-0">
            <div>
              {onCreateJobCard && (
                <button
                  type="button"
                  onClick={() => onCreateJobCard(formData)}
                  className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                  title={isTe ? "ఈ కంప్లైంట్ వివరాలతో జాబ్ కార్డ్ ఓపెన్ చేయండి" : "Open / Create Job Card for this complaint"}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isTe ? "జాబ్ కార్డ్ ప్రారంభించండి (Add Job Card)" : "Open / Add Job Card"}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
              >
                {isTe ? "రద్దు (Cancel)" : "Cancel"}
              </button>

              {viewOnly ? (
                <button
                  type="button"
                  onClick={() => setViewOnly(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <PenLine className="w-4 h-4" />
                  <span>{isTe ? "సవరించు (Edit Complaint)" : "Edit Complaint"}</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? (isTe ? "సేవ్ అవుతోంది..." : "Saving...")
                      : (isTe ? "సేవ్ చేయండి" : "Save Complaint")}
                  </span>
                </button>
              )}
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
export default ComplaintModal;
