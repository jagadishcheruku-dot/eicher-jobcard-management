import React, { useState, useMemo } from "react";
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  MessageCircle,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Download,
  Plus,
  ChevronRight,
  History,
  CheckSquare,
  Wrench,
  Sparkles,
  ChevronDown,
  X
} from "lucide-react";
import * as XLSX from "xlsx";
import { RowActionButtons } from "./RowActionButtons";
import { CustomerCallLogModal } from "./CustomerCallLogModal";
import { formatDisplayDate } from "../utils/dateFormatter";

export interface TelecallingDeskViewProps {
  language: "te" | "en";
  customers: any[];
  jobCards: any[];
  onSaveCallLog: (chassisNo: string, logData: {
    callDate: string;
    remarks: string;
    nextCallDate?: string;
    calledBy?: string;
    status?: string;
    rating?: string;
  }) => Promise<void> | void;
  onNavigateToJobCard?: (cust: any) => void;
  staffList?: any[];
  onRegisterComplaint?: (customer: any) => void;
}

export const TelecallingDeskView: React.FC<TelecallingDeskViewProps> = ({
  language = "te",
  customers = [],
  jobCards = [],
  onSaveCallLog,
  onNavigateToJobCard,
  staffList = [],
  onRegisterComplaint
}) => {
  const isTe = language === "te";
  const todayStr = new Date().toISOString().split("T")[0];

  // Primary filter tabs
  const [activeTab, setActiveTab] = useState<"due_today" | "overdue" | "upcoming" | "all_calls" | "all_customers">("all_calls");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<string>("all");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("all");
  const [selectedCallStatus, setSelectedCallStatus] = useState<string>("all");
  const [dateRangeFrom, setDateRangeFrom] = useState<string>("");
  const [dateRangeTo, setDateRangeTo] = useState<string>("");

  // Log Call Modal State
  const [loggingCustomer, setLoggingCustomer] = useState<any | null>(null);
  const [callFormDate, setCallFormDate] = useState<string>(todayStr);
  const [callFormRemarks, setCallFormRemarks] = useState<string>("");
  const [callFormNextDate, setCallFormNextDate] = useState<string>("");
  const [callFormStatus, setCallFormStatus] = useState<string>("Interested");
  const [callFormRating, setCallFormRating] = useState<string>("Good");
  const [callFormCalledBy, setCallFormCalledBy] = useState<string>("Executive");
  const [isSavingLog, setIsSavingLog] = useState<boolean>(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean>(false);

  const toggleRowActions = (rowKey: string) => {
    setExpandedRowKeys((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedRowKeys({});
      setAllExpanded(false);
    } else {
      const newMap: Record<string, boolean> = {};
      filteredCustomers.forEach((cust, idx) => {
        const rowKey = cust.chassisNumber || cust.chassisNo || cust.id || String(idx);
        newMap[rowKey] = true;
      });
      setExpandedRowKeys(newMap);
      setAllExpanded(true);
    }
  };

  // History Drawer State
  const [viewingHistoryCustomer, setViewingHistoryCustomer] = useState<any | null>(null);

  // Process and extract phone number cleanly
  const getCleanPhone = (cust: any): string => {
    const raw = cust.mobileNumber || cust["Mobile Numb"] || cust["Mobile No"] || cust.phoneNo || cust.ownerMob || cust.phNo || "";
    return String(raw).replace(/[^0-9]/g, "").slice(-10);
  };

  const getChassisNo = (cust: any): string => {
    return String(cust.chassisNo || cust["Chassis no"] || cust.chassis || cust.__chassisDisplay || "").trim();
  };

  const getCustomerName = (cust: any): string => {
    return String(cust.customerName || cust["Customer Name"] || cust.custName || "").trim() || "Customer";
  };

  const getVillage = (cust: any): string => {
    return String(cust.village || cust.Village || cust.VILLAGE || "").trim() || "—";
  };

  const getModel = (cust: any): string => {
    return String(cust.model || cust.Model || "").trim() || "Eicher Tractor";
  };

  // Build unified customer call list with scheduling metadata
  const enrichedCustomers = useMemo(() => {
    return customers.map((c) => {
      const chassis = getChassisNo(c);
      const phone = getCleanPhone(c);
      const name = getCustomerName(c);
      const village = getVillage(c);
      const model = getModel(c);
      const supervisor = String(c.supervisor || c.SUPERVISOR || "Unassigned").trim();

      // Related job cards for this chassis
      const relatedCards = jobCards.filter((jc) => {
        const jcCh = String(jc.chassisNo || jc.chassis || "").trim().toLowerCase();
        return jcCh && chassis && jcCh.includes(chassis.toLowerCase());
      });

      // Call logs history
      const raw = c.rec || c;
      let history: any[] = [];
      const histCandidate = c.followupHistory || raw.followupHistory || c.history;
      if (Array.isArray(histCandidate)) {
        history = histCandidate;
      } else if (typeof histCandidate === "string") {
        try {
          history = JSON.parse(histCandidate);
        } catch {
          history = [];
        }
      }

      const nextCallDate = String(
        c.lastNextCallDate || raw.lastNextCallDate || c.nextCallDate || (history[0]?.nextCallDate) || (history[0]?.preferredDate) || ""
      ).trim();
      const lastCallDate = String(
        c.lastCallDate || raw.lastCallDate || c.callDate || (history[0]?.callDate) || ""
      ).trim();
      const lastRemarks = String(
        c.lastRemarks || raw.lastRemarks || c.remarks || c.notes || (history[0]?.remarks) || (history[0]?.notes) || ""
      ).trim();
      const lastCalledBy = String(
        c.lastCalledBy || raw.lastCalledBy || c.calledBy || (history[0]?.calledBy) || ""
      ).trim();

      let scheduledStatus: "today" | "overdue" | "upcoming" | "no_schedule" = "no_schedule";
      if (nextCallDate) {
        if (nextCallDate === todayStr) {
          scheduledStatus = "today";
        } else if (nextCallDate < todayStr) {
          scheduledStatus = "overdue";
        } else {
          scheduledStatus = "upcoming";
        }
      }

      return {
        ...c,
        chassisNo: chassis,
        cleanPhone: phone,
        customerName: name,
        village,
        model,
        supervisor,
        history,
        relatedCards,
        nextCallDate,
        lastCallDate,
        lastRemarks,
        lastCalledBy,
        scheduledStatus
      };
    });
  }, [customers, jobCards, todayStr]);

  const activeViewingCustomer = useMemo(() => {
    if (!viewingHistoryCustomer) return null;
    const fresh = enrichedCustomers.find((c) => c.chassisNo === viewingHistoryCustomer.chassisNo);
    return fresh || viewingHistoryCustomer;
  }, [enrichedCustomers, viewingHistoryCustomer]);

  const activeViewingHistory = useMemo(() => {
    if (!activeViewingCustomer) return [];
    if (activeViewingCustomer.history && activeViewingCustomer.history.length > 0) {
      return activeViewingCustomer.history;
    }
    if (activeViewingCustomer.lastRemarks) {
      return [
        {
          callDate: activeViewingCustomer.lastCallDate || todayStr,
          remarks: activeViewingCustomer.lastRemarks,
          nextCallDate: activeViewingCustomer.nextCallDate,
          calledBy: activeViewingCustomer.lastCalledBy || "Staff"
        }
      ];
    }
    return [];
  }, [activeViewingCustomer, todayStr]);

  // Unique villages and supervisors
  const uniqueVillages = useMemo(() => {
    const set = new Set<string>();
    enrichedCustomers.forEach((c) => {
      if (c.village && c.village !== "—") set.add(c.village);
    });
    return Array.from(set).sort();
  }, [enrichedCustomers]);

  const uniqueSupervisors = useMemo(() => {
    const set = new Set<string>();
    enrichedCustomers.forEach((c) => {
      if (c.supervisor) set.add(c.supervisor);
    });
    return Array.from(set).sort();
  }, [enrichedCustomers]);

  // Filtered List based on active tab and search criteria
  const filteredCustomers = useMemo(() => {
    const result = enrichedCustomers.filter((c) => {
      // Tab matching
      if (activeTab === "due_today" && c.scheduledStatus !== "today") return false;
      if (activeTab === "overdue" && c.scheduledStatus !== "overdue") return false;
      if (activeTab === "upcoming" && c.scheduledStatus !== "upcoming") return false;
      if (activeTab === "all_calls" && !(c.lastRemarks || c.lastCallDate || (c.history && c.history.length > 0))) return false;

      // Village filter
      if (selectedVillage !== "all" && c.village.toLowerCase() !== selectedVillage.toLowerCase()) {
        return false;
      }

      // Supervisor filter
      if (selectedSupervisor !== "all" && c.supervisor.toLowerCase() !== selectedSupervisor.toLowerCase()) {
        return false;
      }

      // Search text filter
      if (searchText.trim()) {
        const q = searchText.toLowerCase().trim();
        const matches =
          c.customerName.toLowerCase().includes(q) ||
          c.cleanPhone.includes(q) ||
          c.chassisNo.toLowerCase().includes(q) ||
          c.village.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          c.lastRemarks.toLowerCase().includes(q) ||
          (Array.isArray(c.history) && c.history.some((h: any) => String(h.remarks || h.notes || "").toLowerCase().includes(q)));
        if (!matches) return false;
      }

      // Date range filter
      if (dateRangeFrom && c.nextCallDate && c.nextCallDate < dateRangeFrom) return false;
      if (dateRangeTo && c.nextCallDate && c.nextCallDate > dateRangeTo) return false;

      return true;
    });

    // In "All Calls" tab, show the most recently logged call first so a
    // freshly entered remark is immediately visible at the top instead of
    // being buried in the list.
    if (activeTab === "all_calls") {
      result.sort((a, b) => {
        const tA = a.history?.[0]?.timestamp ? Date.parse(a.history[0].timestamp) : 0;
        const tB = b.history?.[0]?.timestamp ? Date.parse(b.history[0].timestamp) : 0;
        return (tB || 0) - (tA || 0);
      });
    }

    return result;
  }, [
    enrichedCustomers,
    activeTab,
    selectedVillage,
    selectedSupervisor,
    searchText,
    dateRangeFrom,
    dateRangeTo
  ]);

  // Statistics
  const stats = useMemo(() => {
    const todayCount = enrichedCustomers.filter((c) => c.scheduledStatus === "today").length;
    const overdueCount = enrichedCustomers.filter((c) => c.scheduledStatus === "overdue").length;
    const upcomingCount = enrichedCustomers.filter((c) => c.scheduledStatus === "upcoming").length;
    const calledTodayCount = enrichedCustomers.filter((c) => c.lastCallDate === todayStr).length;
    const totalWithHistory = enrichedCustomers.filter((c) => Boolean(c.lastRemarks || (c.history && c.history.length > 0))).length;

    return {
      todayCount,
      overdueCount,
      upcomingCount,
      calledTodayCount,
      totalWithHistory,
      totalCustomers: enrichedCustomers.length
    };
  }, [enrichedCustomers, todayStr]);

  // Open Log Call Modal
  const handleOpenLogModal = (cust: any) => {
    setLoggingCustomer(cust);
    setCallFormDate(todayStr);
    setCallFormRemarks("");
    // Default next call in 15 days
    const next15 = new Date();
    next15.setDate(next15.getDate() + 15);
    setCallFormNextDate(next15.toISOString().split("T")[0]);
    setCallFormStatus("Answered - Interested");
    setCallFormRating("Good");
  };

  // Submit Call Log
  const handleSubmitCallLog = async () => {
    if (!loggingCustomer || !loggingCustomer.chassisNo) return;
    if (!callFormRemarks.trim()) {
      alert(isTe ? "దయచేసి కస్టమర్ రిమార్క్స్ రాయండి." : "Please enter call remarks / customer discussion details.");
      return;
    }

    setIsSavingLog(true);
    try {
      try {
        localStorage.setItem("telecaller_last_caller", callFormCalledBy);
      } catch {}

      await onSaveCallLog(loggingCustomer.chassisNo, {
        callDate: callFormDate,
        remarks: `[${callFormStatus}] ${callFormRemarks.trim()}`,
        nextCallDate: callFormNextDate,
        calledBy: callFormCalledBy,
        status: callFormStatus,
        rating: callFormRating
      });

      setLoggingCustomer(null);
    } catch (err) {
      console.error("Error saving call log:", err);
      alert("Error saving call log. Please try again.");
    } finally {
      setIsSavingLog(false);
    }
  };

  // WhatsApp Followup Reminder
  const handleSendWhatsApp = (cust: any) => {
    const phone = cust.cleanPhone;
    if (!phone || phone.length < 10) {
      alert(isTe ? "సరైన మొబైల్ నంబర్ అందుబాటులో లేదు." : "Valid 10-digit mobile number not found.");
      return;
    }

    const msg = isTe
      ? `నమస్కారం ${cust.customerName} గారు, శ్రీ గాయత్రి ఆటోమోటివ్స్ (ఐషర్ ట్రాక్టర్స్ వర్క్‌షాప్) నుండి మాట్లాడుతున్నాము. మీ ఐషర్ ట్రాక్టర్ (${cust.model} - ${cust.chassisNo}) సర్వీస్ & ఆయిల్ చెకప్ కొరకు సంప్రదించండి. మా హెల్ప్‌లైన్: 9848012345. ధన్యవాదాలు!`
      : `Dear ${cust.customerName}, Greetings from Sri Gayathri Automotives (Eicher Tractors Authorized Workshop). This is a friendly reminder for your tractor service (${cust.model} - ${cust.chassisNo}). For service booking, please call our workshop. Thank you!`;

    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) {
      alert("No telecalling records to export.");
      return;
    }

    const rows = filteredCustomers.map((c, i) => ({
      "S.No": i + 1,
      "Customer Name": c.customerName,
      "Mobile Number": c.cleanPhone,
      "Village": c.village,
      "Model": c.model,
      "Chassis No": c.chassisNo,
      "Supervisor": c.supervisor,
      "Scheduled Status": c.scheduledStatus.toUpperCase(),
      "Next Call Date": c.nextCallDate || "—",
      "Last Call Date": c.lastCallDate || "—",
      "Last Remarks": c.lastRemarks || "—",
      "Last Called By": c.lastCalledBy || "—",
      "Total Calls Logged": c.history.length,
      "Past Job Cards Count": c.relatedCards.length
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Telecalling Report");
    XLSX.writeFile(wb, `Telecalling_Report_${todayStr}.xlsx`);
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-800">
      {/* Top Header Card */}
      <div className="w-full bg-white border border-amber-200 rounded-2xl shadow-sm p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-amber-600 to-amber-500 text-white p-3 rounded-2xl shadow-md">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black text-slate-900 leading-tight">
                  {isTe ? "టెలికాలింగ్ & కస్టమర్ ఫాలో-అప్ డెస్క్" : "Telecalling & Customer Follow-up Desk"}
                </h2>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Live Desk
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {isTe
                  ? "రోజూ చేయవలసిన కస్టమర్ కాల్స్, రిమార్క్స్ రికార్డింగ్, తదుపరి కాల్ తేదీలు మరియు వాట్సాప్ రిమైండర్లు."
                  : "Daily scheduled call logs, overdue calls tracker, customer remarks history and direct WhatsApp reminders."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isTe ? "ఎక్సెల్ రిపోర్ట్" : "Export Excel"}</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
          {/* Due Today */}
          <div
            onClick={() => setActiveTab("due_today")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
              activeTab === "due_today"
                ? "bg-red-50 border-red-400 ring-2 ring-red-400 shadow-sm"
                : "bg-red-50/40 border-red-200 hover:bg-red-50"
            }`}
          >
            <div>
              <div className="text-[10px] font-extrabold uppercase text-red-800 tracking-wider">
                {isTe ? "ఈరోజే కాల్ చేయాలి" : "Due Today"}
              </div>
              <div className="text-[9px] font-extrabold text-red-600 underline">
                {isTe ? "లిస్ట్ చూడండి →" : "View calls →"}
              </div>
            </div>
            <div className="text-lg font-black text-red-950">{stats.todayCount}</div>
          </div>

          {/* Overdue */}
          <div
            onClick={() => setActiveTab("overdue")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
              activeTab === "overdue"
                ? "bg-orange-50 border-orange-400 ring-2 ring-orange-400 shadow-sm"
                : "bg-orange-50/40 border-orange-200 hover:bg-orange-50"
            }`}
          >
            <div>
              <div className="text-[10px] font-extrabold uppercase text-orange-800 tracking-wider">
                {isTe ? "గడువు దాటినవి (Overdue)" : "Overdue Calls"}
              </div>
              <div className="text-[9px] font-extrabold text-orange-600 underline">
                {isTe ? "లిస్ట్ చూడండి →" : "View overdue →"}
              </div>
            </div>
            <div className="text-lg font-black text-orange-950">{stats.overdueCount}</div>
          </div>

          {/* Upcoming */}
          <div
            onClick={() => setActiveTab("upcoming")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
              activeTab === "upcoming"
                ? "bg-blue-50 border-blue-400 ring-2 ring-blue-400 shadow-sm"
                : "bg-blue-50/40 border-blue-200 hover:bg-blue-50"
            }`}
          >
            <div>
              <div className="text-[10px] font-extrabold uppercase text-blue-800 tracking-wider">
                {isTe ? "రాబోయే కాల్స్" : "Upcoming Calls"}
              </div>
              <div className="text-[9px] font-extrabold text-blue-600 underline">
                {isTe ? "లిస్ట్ చూడండి →" : "View upcoming →"}
              </div>
            </div>
            <div className="text-lg font-black text-blue-950">{stats.upcomingCount}</div>
          </div>

          {/* Logged Calls */}
          <div
            onClick={() => setActiveTab("all_calls")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
              activeTab === "all_calls"
                ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400 shadow-sm"
                : "bg-amber-50/40 border-amber-200 hover:bg-amber-50"
            }`}
          >
            <div>
              <div className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider">
                {isTe ? "పూర్తయిన కాల్స్" : "Call History Log"}
              </div>
              <div className="text-[9px] font-extrabold text-amber-700 underline">
                {isTe ? "చరిత్ర చూడండి →" : "View logs →"}
              </div>
            </div>
            <div className="text-lg font-black text-amber-950">{stats.totalWithHistory}</div>
          </div>

          {/* All Customers */}
          <div
            onClick={() => setActiveTab("all_customers")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
              activeTab === "all_customers"
                ? "bg-purple-50 border-purple-400 ring-2 ring-purple-400 shadow-sm"
                : "bg-purple-50/40 border-purple-200 hover:bg-purple-50"
            }`}
          >
            <div>
              <div className="text-[10px] font-extrabold uppercase text-purple-900 tracking-wider">
                {isTe ? "మొత్తం కస్టమర్లు" : "All Master Directory"}
              </div>
              <div className="text-[9px] font-extrabold text-purple-700 underline">
                {isTe ? "అందరికీ కాల్ చేయండి →" : "Browse directory →"}
              </div>
            </div>
            <div className="text-lg font-black text-purple-950">{stats.totalCustomers}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={isTe ? "కస్టమర్ పేరు, ఫోన్, ఛాసిస్, ఊరు, మోడల్..." : "Search name, phone, chassis, village..."}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Village Filter */}
          <div>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">{isTe ? "🏠 అన్ని గ్రామాలు (All Villages)" : "🏠 All Villages"}</option>
              {uniqueVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Supervisor Filter */}
          <div>
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">{isTe ? "👷 అన్ని సూపర్‌వైజర్లు (All Supervisors)" : "👷 All Supervisors"}</option>
              {uniqueSupervisors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSearchText("");
                setSelectedVillage("all");
                setSelectedSupervisor("all");
                setDateRangeFrom("");
                setDateRangeTo("");
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isTe ? "రీసెట్" : "Reset"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Calling List Container */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Head Banner */}
        <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PhoneForwarded className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black tracking-wide uppercase">
              {activeTab === "due_today"
                ? isTe ? "ఈరోజు కాల్ చేయవలసిన కస్టమర్లు (Due Today)" : "Customers Due For Call Today"
                : activeTab === "overdue"
                ? isTe ? "గడువు దాటిన కాల్స్ (Overdue Calls)" : "Overdue Scheduled Calls"
                : activeTab === "upcoming"
                ? isTe ? "రాబోయే తేదీల కాల్స్ (Upcoming Scheduled)" : "Upcoming Scheduled Calls"
                : activeTab === "all_calls"
                ? isTe ? "కాల్ లాగ్ హిస్టరీ (All Logged Calls)" : "All Logged Call History"
                : isTe ? "కస్టమర్ల డైరెక్టరీ (All Customers)" : "Complete Customers Calling Directory"}
            </span>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-md text-amber-300 border border-slate-700">
            {filteredCustomers.length} {isTe ? "రికార్డులు" : "records"}
          </span>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead className="bg-slate-100 text-slate-800 sticky top-0 z-20 border-b border-slate-300">
              <tr className="text-[11px] font-extrabold uppercase tracking-wider">
                <th className="p-3 w-12 text-center border-r border-slate-200">#</th>
                <th className="p-3 w-48 border-r border-slate-200">{isTe ? "కస్టమర్ & మొబైల్" : "Customer & Phone"}</th>
                <th className="p-3 w-44 border-r border-slate-200">{isTe ? "గ్రామం & మండలం" : "Village & Mandal"}</th>
                <th className="p-3 w-48 border-r border-slate-200">{isTe ? "ట్రాక్టర్ మోడల్ & ఛాసిస్" : "Tractor Model & Chassis"}</th>
                <th className="p-3 w-36 border-r border-slate-200">{isTe ? "షెడ్యూల్ తేదీ" : "Scheduled Call Date"}</th>
                <th className="p-3 w-64 border-r border-slate-200">{isTe ? "చివరి రిమార్క్స్ & మాట్లాడిన వారు" : "Last Remarks & Caller"}</th>
                <th className="p-3 w-40 text-center sticky right-0 bg-slate-100 z-30 border-l border-slate-200">
                  <div className="flex items-center justify-center gap-1">
                    <span>{isTe ? "చర్యలు" : "Actions"}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-bold">
                    <p className="text-sm">
                      {isTe ? "ఎలాంటి కస్టమర్ రికార్డులు కనుగొనబడలేదు." : "No customer call records matching the current criteria."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, idx) => {
                  const rowKey = cust.chassisNumber || cust.chassisNo || cust.id || String(idx);
                  const isDueToday = cust.scheduledStatus === "today";
                  const isOverdue = cust.scheduledStatus === "overdue";

                  return (
                    <tr
                      key={`${cust.chassisNo}-${idx}`}
                      className={`hover:bg-amber-50/60 transition-colors ${
                        isDueToday
                          ? "bg-red-50/30"
                          : isOverdue
                          ? "bg-orange-50/20"
                          : ""
                      }`}
                    >
                      {/* S.No */}
                      <td className="p-3 text-center font-mono font-bold text-slate-400 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      {/* Customer & Phone */}
                      <td className="p-3 border-r border-slate-200">
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{cust.customerName}</span>
                        </div>
                        {cust.cleanPhone ? (
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={`tel:${cust.cleanPhone}`}
                              className="font-mono font-extrabold text-blue-700 hover:text-blue-900 hover:underline text-[11px] flex items-center gap-1"
                              title="Click to call customer"
                            >
                              <Phone className="w-3 h-3 text-blue-600" />
                              <span>{cust.cleanPhone}</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No phone</span>
                        )}
                      </td>

                      {/* Village & Mandal */}
                      <td className="p-3 border-r border-slate-200">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span>{cust.village}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-medium">
                          {cust.mandal || cust.Mandal || "—"}
                        </div>
                      </td>

                      {/* Model & Chassis */}
                      <td className="p-3 border-r border-slate-200">
                        <div className="font-extrabold text-indigo-950 flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span>{cust.model}</span>
                        </div>
                        <div className="font-mono font-bold text-[10.5px] text-slate-600">
                          {cust.chassisNo || "—"}
                        </div>
                      </td>

                      {/* Scheduled Call Date */}
                      <td className="p-3 border-r border-slate-200">
                        {cust.nextCallDate ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-extrabold text-[11px] ${
                                isDueToday
                                  ? "bg-red-600 text-white shadow-xs"
                                  : isOverdue
                                  ? "bg-orange-500 text-white shadow-xs"
                                  : "bg-blue-100 text-blue-900 border border-blue-200"
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>{cust.nextCallDate}</span>
                            </span>
                            <div className="text-[10px] font-bold">
                              {isDueToday && <span className="text-red-700 font-extrabold">🚨 {isTe ? "ఈరోజే కాల్ చేయాలి" : "Call Due Today"}</span>}
                              {isOverdue && <span className="text-orange-700 font-extrabold">⚠️ {isTe ? "గడువు ముగిసింది" : "Overdue"}</span>}
                              {!isDueToday && !isOverdue && <span className="text-blue-700">{isTe ? "రాబోయే కాల్" : "Upcoming"}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">
                            {isTe ? "షెడ్యూల్ కాలేదు" : "Not Scheduled"}
                          </span>
                        )}
                      </td>

                      {/* Last Remarks & Caller */}
                      <td className="p-3 border-r border-slate-200">
                        {cust.lastRemarks ? (
                          <div className="space-y-1">
                            <p className="text-[11px] font-medium text-slate-800 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-200">
                              "{cust.lastRemarks}"
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                              <span>📅 {cust.lastCallDate || "—"}</span>
                              <span>👤 {cust.lastCalledBy || "Staff"}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10.5px] text-slate-400 italic">
                            {isTe ? "ఇంతవరకు కాల్ చేయలేదు" : "No call logged yet"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center sticky right-0 z-20 bg-white group-hover:bg-amber-50/90 shadow-md border-l border-slate-200">
                        <RowActionButtons
                          isExpanded={!!expandedRowKeys[rowKey]}
                          onToggleExpand={() => toggleRowActions(rowKey)}
                          language={language}
                          hasPhone={!!cust.cleanPhone}
                          onCall={() => setLoggingCustomer(cust)}
                          onWhatsApp={cust.cleanPhone ? () => handleSendWhatsApp(cust) : undefined}
                          onRegisterComplaint={onRegisterComplaint ? () => onRegisterComplaint(cust) : undefined}
                          onHistory={() => setViewingHistoryCustomer(cust)}
                          onCopy={() => {
                            navigator.clipboard.writeText(JSON.stringify(cust, null, 2));
                            alert(isTe ? "కస్టమర్ వివరాలు కాపీ చేయబడ్డాయి!" : "Customer details copied!");
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Call Log & Full Profile Modal */}
      <CustomerCallLogModal
        isOpen={!!loggingCustomer}
        customer={loggingCustomer}
        allCards={jobCards}
        language={language}
        onClose={() => setLoggingCustomer(null)}
        onSaveCallLog={async (chassis, logData) => {
          if (onSaveCallLog) {
            await onSaveCallLog(chassis, logData);
          }
        }}
        onNewJobCard={(c) => {
          if (onNavigateToJobCard) {
            onNavigateToJobCard(c);
          }
        }}
      />

      {/* Customer Call & Service History Drawer */}
      {viewingHistoryCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black">
                    {activeViewingCustomer.customerName} - {isTe ? "కాల్స్ & సర్వీస్ చరిత్ర" : "Call & Service History"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Chassis: {activeViewingCustomer.chassisNo} | Phone: {activeViewingCustomer.cleanPhone || "—"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingHistoryCustomer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 md:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Telecalling History */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-amber-600" />
                  <span>{isTe ? "టెలికాలింగ్ లాగ్స్ చరిత్ర" : "Telecalling Log History"} ({activeViewingHistory.length})</span>
                </h4>
                {activeViewingHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {isTe ? "ఇంతవరకు కాల్ రిమార్క్స్ ఏవీ నమోదు కాలేదు." : "No telecalling call remarks have been logged yet."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeViewingHistory.map((log: any, i: number) => (
                      <div key={i} className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-amber-950">
                          <span>📅 Call Date: {formatDisplayDate(log.callDate)}</span>
                          <span className="text-[11px] text-slate-500">Called by: {log.calledBy || "Staff"}</span>
                        </div>
                        <p className="text-slate-800 font-medium bg-white p-2 rounded border border-amber-100">
                          {log.remarks || log.notes || "No remarks"}
                        </p>
                        {log.nextCallDate && (
                          <div className="text-[11px] text-blue-800 font-bold">
                            Next Follow-up Date: {formatDisplayDate(log.nextCallDate)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Related Job Cards */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-indigo-600" />
                  <span>{isTe ? "గత జాబ్ కార్డ్స్ & సర్వీసులు" : "Past Job Cards & Service Records"} ({activeViewingCustomer.relatedCards?.length || 0})</span>
                </h4>
                {(!activeViewingCustomer.relatedCards || activeViewingCustomer.relatedCards.length === 0) ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {isTe ? "ఈ ఛాసిస్‌పై ఇప్పటివరకు ఎలాంటి జాబ్ కార్డులు లేవు." : "No job cards on file for this chassis."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeViewingCustomer.relatedCards.map((jc: any, i: number) => (
                      <div key={i} className="bg-indigo-50/50 border border-indigo-200 p-3 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between font-extrabold text-indigo-950">
                          <span>Job #{jc.jobNo || jc.onlineJobCardNo || "—"} ({jc.serviceType || "Service"})</span>
                          <span className="font-mono text-slate-500">{jc.jobDate || jc.actualClosedDate || "—"}</span>
                        </div>
                        <div className="text-[11px] text-slate-700">
                          Hours: {jc.hourMeter || jc.hrsRun || "—"} | Mechanic: {jc.mechanic || jc.technicianName || "—"}
                        </div>
                        {jc.reasonsForAnalysis && (
                          <p className="text-[11px] text-slate-600 italic">
                            Work: {jc.reasonsForAnalysis}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const cust = viewingHistoryCustomer;
                  setViewingHistoryCustomer(null);
                  handleOpenLogModal(cust);
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{isTe ? "కొత్త కాల్ లాగ్ చేయండి" : "Log New Call"}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingHistoryCustomer(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                {isTe ? "మూసివేయి (Close)" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
