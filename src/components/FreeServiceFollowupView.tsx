import React, { useState, useMemo } from "react";
import {
  Wrench,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MessageCircle,
  Search,
  Filter,
  Download,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  MapPin,
  History,
  PhoneCall,
  User,
  PlusCircle,
  X
} from "lucide-react";
import * as XLSX from "xlsx";
import { RowActionButtons } from "./RowActionButtons";
import { CustomerCallLogModal } from "./CustomerCallLogModal";
import {
  formatDisplayDate,
  parseDateComponents,
  getCustomerRawDeliveryDate,
} from "../utils/dateFormatter";

export interface FreeServiceFollowupViewProps {
  language: "te" | "en";
  customers: any[];
  jobCards: any[];
  freeServicesMap?: {
    fs1?: any[];
    fs2?: any[];
    fs3?: any[];
    fs4?: any[];
    fs5?: any[];
    fs6?: any[];
    fs7?: any[];
    fs8?: any[];
    fs9?: any[];
    fs10?: any[];
    general_90?: any[];
    post_warranty?: any[];
    gear_1?: any[];
    gear_2?: any[];
  };
  onSaveCallLog: (chassisNo: string, logData: any) => Promise<void> | void;
  onCreateJobCard?: (customer: any, serviceType?: string) => void;
  onRegisterComplaint?: (customer: any) => void;
}

export const FreeServiceFollowupView: React.FC<FreeServiceFollowupViewProps> = ({
  language = "te",
  customers = [],
  jobCards = [],
  freeServicesMap,
  onSaveCallLog,
  onCreateJobCard,
  onRegisterComplaint
}) => {
  const isTe = language === "te";
  const todayStr = new Date().toISOString().split("T")[0];

  // Active Category Tab
  const [activeCategory, setActiveCategory] = useState<string>("fs1");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<string>("all");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("all");
  const [dueFilter, setDueFilter] = useState<"all" | "overdue" | "due_soon" | "upcoming">("all");

  // Call Modal state
  const [loggingCustomer, setLoggingCustomer] = useState<any | null>(null);
  const [callFormDate, setCallFormDate] = useState<string>(todayStr);
  const [callFormRemarks, setCallFormRemarks] = useState<string>("");
  const [callFormNextDate, setCallFormNextDate] = useState<string>("");
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
      filteredList.forEach((cust, idx) => {
        const rowKey = cust.chassisNumber || cust.chassisNo || cust.id || String(idx);
        newMap[rowKey] = true;
      });
      setExpandedRowKeys(newMap);
      setAllExpanded(true);
    }
  };

  // Helper date parser utilizing standard Indian format & future date auto-correction
  const parseAnyDate = (val: any): Date | null => {
    if (!val) return null;
    const comps = parseDateComponents(val);
    if (!comps) return null;
    return new Date(comps.year, comps.month, comps.day);
  };

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

  // Compute calculated free service stages if freeServicesMap not provided
  const computedStages = useMemo(() => {
    if (freeServicesMap) return freeServicesMap;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const categories: Record<string, any[]> = {
      fs1: [],
      fs2: [],
      fs3: [],
      fs4: [],
      fs5: [],
      fs6: [],
      fs7: [],
      fs8: [],
      fs9: [],
      fs10: [],
      gear_1: [],
      gear_2: [],
      general_90: [],
      post_warranty: []
    };

    const extractFreeServiceNo = (jc: any): number => {
      const text = `${jc.serviceType || ""} ${jc.freeServiceList || ""}`.toLowerCase();
      if (text.includes("10th") || text.includes("10 th")) return 10;
      if (text.includes("1st") || text.includes("1 st")) return 1;
      if (text.includes("2nd") || text.includes("2 nd")) return 2;
      if (text.includes("3rd") || text.includes("3 rd")) return 3;
      if (text.includes("4th") || text.includes("4 th")) return 4;
      if (text.includes("5th") || text.includes("5 th")) return 5;
      if (text.includes("6th") || text.includes("6 th")) return 6;
      if (text.includes("7th") || text.includes("7 th")) return 7;
      if (text.includes("8th") || text.includes("8 th")) return 8;
      if (text.includes("9th") || text.includes("9 th")) return 9;
      return 0;
    };

    customers.forEach((c) => {
      const chassis = getChassisNo(c);
      const delDate = parseAnyDate(c.dateOfDel || c["Date of del"] || c.dateOfDelivery || c.installDate);
      const cJobCards = jobCards.filter((jc) => {
        const jcCh = String(jc.chassisNo || jc.chassis || "").trim().toLowerCase();
        return jcCh && chassis && jcCh.includes(chassis.toLowerCase());
      });

      let daysSinceDelivery = -1;
      if (delDate) {
        daysSinceDelivery = Math.floor((now.getTime() - delDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Check max free service completed
      const completedServices: Record<number, { date: Date; card: any }> = {};
      cJobCards.forEach((jc) => {
        const fsNo = extractFreeServiceNo(jc);
        const closed = parseAnyDate(jc.actualClosedDate || jc.dateTimeOut || jc.jobDate);
        if (fsNo >= 1 && fsNo <= 10 && closed) {
          if (!completedServices[fsNo] || closed > completedServices[fsNo].date) {
            completedServices[fsNo] = { date: closed, card: jc };
          }
        }
      });

      let highestCompletedFs = 0;
      for (let i = 1; i <= 10; i++) {
        if (completedServices[i]) highestCompletedFs = i;
      }

      // 1st Free Service Due: Delivery within 2 years, no job cards yet or > 30 days
      if (delDate && daysSinceDelivery >= 0 && daysSinceDelivery <= 730) {
        if (highestCompletedFs === 0) {
          categories.fs1.push({
            ...c,
            targetStage: "1st Free Service",
            daysDue: 30 - daysSinceDelivery,
            lastCompleted: cJobCards.length > 0 ? "Previous Inspection" : "Brand New Tractor (No Service Done)"
          });
        } else if (highestCompletedFs < 10) {
          const nextStageNo = highestCompletedFs + 1;
          const lastDate = completedServices[highestCompletedFs].date;
          const daysSinceLast = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          const targetKey = `fs${nextStageNo}`;
          if (categories[targetKey]) {
            categories[targetKey].push({
              ...c,
              targetStage: `${nextStageNo}th Free Service`,
              daysDue: 90 - daysSinceLast,
              lastCompleted: `${highestCompletedFs}th Free Service on ${lastDate.toISOString().slice(0, 10)}`
            });
          }
        } else if (highestCompletedFs === 10) {
          const lastDate = completedServices[10].date;
          const daysSinceLast = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          categories.general_90.push({
            ...c,
            targetStage: "90-Day Periodic Maintenance",
            daysDue: 90 - daysSinceLast,
            lastCompleted: `10th Free Service on ${lastDate.toISOString().slice(0, 10)}`
          });
        }
      } else {
        // Post warranty
        if (cJobCards.length > 0) {
          categories.post_warranty.push({
            ...c,
            targetStage: "Post-Warranty Paid Service",
            daysDue: 0,
            lastCompleted: "Warranty Expired"
          });
        }
      }

      // Gear oil 1 year (365 days) and 2 year (730 days)
      if (daysSinceDelivery >= 330 && daysSinceDelivery <= 395) {
        categories.gear_1.push({
          ...c,
          targetStage: "1st Year Gear Oil Service",
          daysSinceDelivery,
          lastCompleted: "1st Year Maintenance Window"
        });
      }
      if (daysSinceDelivery >= 695 && daysSinceDelivery <= 765) {
        categories.gear_2.push({
          ...c,
          targetStage: "2nd Year Gear Oil & Major Checkup",
          daysSinceDelivery,
          lastCompleted: "2nd Year Maintenance Window"
        });
      }
    });

    return categories;
  }, [freeServicesMap, customers, jobCards]);

  // Current list for the active category tab
  const currentCategoryList = useMemo(() => {
    const rawList = (computedStages as any)[activeCategory] || [];
    return rawList.map((c: any) => ({
      ...c,
      chassisNo: getChassisNo(c),
      cleanPhone: getCleanPhone(c),
      customerName: getCustomerName(c),
      village: getVillage(c),
      model: getModel(c),
      supervisor: String(c.supervisor || c.SUPERVISOR || "Unassigned").trim()
    }));
  }, [computedStages, activeCategory]);

  // Unique villages and supervisors
  const uniqueVillages = useMemo(() => {
    const set = new Set<string>();
    currentCategoryList.forEach((c: any) => {
      if (c.village && c.village !== "—") set.add(c.village);
    });
    return Array.from(set).sort();
  }, [currentCategoryList]);

  const uniqueSupervisors = useMemo(() => {
    const set = new Set<string>();
    currentCategoryList.forEach((c: any) => {
      if (c.supervisor) set.add(c.supervisor);
    });
    return Array.from(set).sort();
  }, [currentCategoryList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return currentCategoryList.filter((c: any) => {
      if (selectedVillage !== "all" && c.village.toLowerCase() !== selectedVillage.toLowerCase()) {
        return false;
      }
      if (selectedSupervisor !== "all" && c.supervisor.toLowerCase() !== selectedSupervisor.toLowerCase()) {
        return false;
      }
      if (dueFilter === "overdue" && (c.daysDue ?? 0) >= 0) {
        return false;
      }
      if (dueFilter === "due_soon" && ((c.daysDue ?? 0) < 0 || (c.daysDue ?? 0) > 15)) {
        return false;
      }
      if (dueFilter === "upcoming" && (c.daysDue ?? 0) <= 15) {
        return false;
      }

      if (searchText.trim()) {
        const q = searchText.toLowerCase().trim();
        const matches =
          c.customerName.toLowerCase().includes(q) ||
          c.cleanPhone.includes(q) ||
          c.chassisNo.toLowerCase().includes(q) ||
          c.village.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [currentCategoryList, selectedVillage, selectedSupervisor, dueFilter, searchText]);

  // Service Tab Definitions
  const serviceTabs = [
    { key: "fs1", label: isTe ? "1వ ఉచిత సర్వీస్ (1st Free)" : "1st Free Service", count: computedStages.fs1?.length || 0, badgeColor: "bg-blue-600" },
    { key: "fs2", label: isTe ? "2వ ఉచిత సర్వీస్ (2nd Free)" : "2nd Free Service", count: computedStages.fs2?.length || 0, badgeColor: "bg-indigo-600" },
    { key: "fs3", label: isTe ? "3వ ఉచిత సర్వీస్ (3rd Free)" : "3rd Free Service", count: computedStages.fs3?.length || 0, badgeColor: "bg-purple-600" },
    { key: "fs4", label: isTe ? "4వ ఉచిత సర్వీస్ (4th Free)" : "4th Free Service", count: computedStages.fs4?.length || 0, badgeColor: "bg-teal-600" },
    { key: "fs5", label: isTe ? "5వ ఉచిత సర్వీస్ (5th Free)" : "5th Free Service", count: computedStages.fs5?.length || 0, badgeColor: "bg-emerald-600" },
    { key: "fs6", label: isTe ? "6వ ఉచిత సర్వీస్ (6th Free)" : "6th Free Service", count: computedStages.fs6?.length || 0, badgeColor: "bg-cyan-600" },
    { key: "fs7", label: isTe ? "7వ ఉచిత సర్వీస్ (7th Free)" : "7th Free Service", count: computedStages.fs7?.length || 0, badgeColor: "bg-amber-600" },
    { key: "fs8", label: isTe ? "8వ ఉచిత సర్వీస్ (8th Free)" : "8th Free Service", count: computedStages.fs8?.length || 0, badgeColor: "bg-orange-600" },
    { key: "fs9", label: isTe ? "9వ ఉచిత సర్వీస్ (9th Free)" : "9th Free Service", count: computedStages.fs9?.length || 0, badgeColor: "bg-rose-600" },
    { key: "fs10", label: isTe ? "10వ ఉచిత సర్వీస్ (10th Free)" : "10th Free Service", count: computedStages.fs10?.length || 0, badgeColor: "bg-pink-600" },
    { key: "gear_1", label: isTe ? "1వ సం. గేర్ ఆయిల్ (Gear Oil 1Yr)" : "1st Year Gear Oil", count: computedStages.gear_1?.length || 0, badgeColor: "bg-amber-700" },
    { key: "gear_2", label: isTe ? "2వ సం. గేర్ ఆయిల్ (Gear Oil 2Yr)" : "2nd Year Gear Oil", count: computedStages.gear_2?.length || 0, badgeColor: "bg-red-700" },
    { key: "general_90", label: isTe ? "90-రోజుల జనరల్ సర్వీస్" : "90-Day Periodic Check", count: computedStages.general_90?.length || 0, badgeColor: "bg-slate-700" },
    { key: "post_warranty", label: isTe ? "పోస్ట్ వారంటీ వాహనాలు" : "Post-Warranty", count: computedStages.post_warranty?.length || 0, badgeColor: "bg-slate-900" }
  ];

  // Send WhatsApp Free Service Notice
  const handleSendWhatsApp = (cust: any) => {
    const phone = cust.cleanPhone;
    if (!phone || phone.length < 10) {
      alert(isTe ? "సరైన మొబైల్ నంబర్ అందుబాటులో లేదు." : "Valid 10-digit mobile number not found.");
      return;
    }

    const currentTabObj = serviceTabs.find((t) => t.key === activeCategory);
    const serviceName = currentTabObj?.label || "Free Service";

    const msg = isTe
      ? `నమస్కారం ${cust.customerName} గారు, శ్రీ గాయత్రి ఆటోమోటివ్స్ (ఐషర్ అధీకృత డీలర్) నుండి. మీ ఐషర్ ట్రాక్టర్ (${cust.model} - ఛాసిస్: ${cust.chassisNo}) కు సంబంధించి "${serviceName}" సమయం ఆసన్నమైనది. దయచేసి సమీప వర్క్‌షాప్‌ను సంప్రదించండి లేదా సర్వీస్ వ్యాన్ బుక్ చేయండి. ఫోన్: 9848012345. ధన్యవాదాలు!`
      : `Dear ${cust.customerName}, Greetings from Sri Gayathri Automotives (Authorized Eicher Tractors Workshop). This is a reminder that your tractor (${cust.model} - Chassis: ${cust.chassisNo}) is due for "${serviceName}". Please contact our service workshop or book a door-step service van. Thank you!`;

    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Log Call Modal Open
  const handleOpenLogCall = (cust: any) => {
    setLoggingCustomer(cust);
    setCallFormDate(todayStr);
    setCallFormRemarks(`Free Service Followup (${serviceTabs.find((t) => t.key === activeCategory)?.label || "Service"}): `);
    const next10 = new Date();
    next10.setDate(next10.getDate() + 10);
    setCallFormNextDate(next10.toISOString().split("T")[0]);
  };

  const handleSaveLogCall = async () => {
    if (!loggingCustomer || !loggingCustomer.chassisNo) return;
    if (!callFormRemarks.trim()) {
      alert("Please enter customer discussion remarks.");
      return;
    }

    setIsSavingLog(true);
    try {
      try {
        localStorage.setItem("telecaller_last_caller", callFormCalledBy);
      } catch {}

      await onSaveCallLog(loggingCustomer.chassisNo, {
        callDate: callFormDate,
        remarks: callFormRemarks.trim(),
        nextCallDate: callFormNextDate,
        calledBy: callFormCalledBy
      });

      setLoggingCustomer(null);
    } catch (err) {
      console.error(err);
      alert("Error saving log.");
    } finally {
      setIsSavingLog(false);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      alert("No records to export.");
      return;
    }

    const currentTabObj = serviceTabs.find((t) => t.key === activeCategory);
    const rows = filteredList.map((c: any, i: number) => ({
      "S.No": i + 1,
      "Customer Name": c.customerName,
      "Mobile Number": c.cleanPhone,
      "Village": c.village,
      "Model": c.model,
      "Chassis No": c.chassisNo,
      "Service Stage": currentTabObj?.label || activeCategory,
      "Days Due": c.daysDue !== undefined ? (c.daysDue < 0 ? `Overdue by ${Math.abs(c.daysDue)} days` : `Due in ${c.daysDue} days`) : "—",
      "Last Completed Stage": c.lastCompleted || "—",
      "Supervisor": c.supervisor
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Free Service Due");
    XLSX.writeFile(wb, `Free_Service_Due_${activeCategory}_${todayStr}.xlsx`);
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-800">
      {/* Top Banner */}
      <div className="w-full bg-white border border-teal-200 rounded-2xl shadow-sm p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-teal-700 to-emerald-600 text-white p-3 rounded-2xl shadow-md">
              <Wrench className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black text-slate-900 leading-tight">
                  {isTe ? "ఉచిత సర్వీస్ & పిరియాడిక్ మెయింటెనెన్స్ ట్రాకర్" : "Free Service & Periodic Maintenance Tracker"}
                </h2>
                <span className="bg-teal-100 text-teal-900 border border-teal-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Service Due Engine
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {isTe
                  ? "1 నుండి 10 వరకు ఉచిత సర్వీసులు, గేర్ ఆయిల్ మార్పిడి (1st & 2nd Year) మరియు 90-రోజుల సర్వీస్ గడువు వివరాలు."
                  : "Track 1st to 10th free services, 1st & 2nd year gear oil changes, overdue alerts and direct job card creation."}
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

        {/* Free Service Stages Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {serviceTabs.map((tab) => {
            const isActive = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-teal-500"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full text-white ${tab.badgeColor}`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Enhanced Search Header */}
      <div className="w-full bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-lg p-4 mb-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="text-3xl">🚜</div>
            <div>
              <h2 className="text-white font-black text-lg">EICHER CUSTOMER LOOKUP</h2>
              <p className="text-slate-300 text-[10px]">{isTe ? "చాసిస్ నం, కస్టమర్ పేరు లేదా ఫోన్ నంబర్ వెతకండి" : "Search by Chassis No, Customer Name or Mobile Number"}</p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute left-4 top-3.5 flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-400" />
            <div className="w-px h-6 bg-slate-600"></div>
          </div>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={isTe ? "ఛాసిస్ నం, కస్టమర్ పేరు, ఫోన్ నంబర్ నమోదు చేయండి..." : "Enter Chassis No, Customer Name or Mobile Number..."}
            className="w-full bg-white border-2 border-teal-400 rounded-xl pl-16 pr-10 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-200 transition-all"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText("")}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-1"
              title={isTe ? "సార్చ్ క్లియర్ చేయండి" : "Clear search"}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5">

          {/* Due Status Filter */}
          <div>
            <select
              value={dueFilter}
              onChange={(e: any) => setDueFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">{isTe ? "⏱️ అన్ని గడువులు (All Due Status)" : "⏱️ All Due Status"}</option>
              <option value="overdue">{isTe ? "🚨 గడువు దాటినవి (Overdue)" : "🚨 Overdue (< 0 Days)"}</option>
              <option value="due_soon">{isTe ? "⚡ త్వరలో రాబోయేవి (Due in 15 Days)" : "⚡ Due Soon (0-15 Days)"}</option>
              <option value="upcoming">{isTe ? "📅 రాబోయే తేదీలు (Upcoming > 15 Days)" : "📅 Upcoming (> 15 Days)"}</option>
            </select>
          </div>

          {/* Village Filter */}
          <div>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">{isTe ? "🏠 అన్ని గ్రామాలు" : "🏠 All Villages"}</option>
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
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">{isTe ? "👷 అన్ని సూపర్‌వైజర్లు" : "👷 All Supervisors"}</option>
              {uniqueSupervisors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Free Service Table */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-black tracking-wide uppercase">
              {serviceTabs.find((t) => t.key === activeCategory)?.label || activeCategory} — {isTe ? "సర్వీస్ చేయవలసిన ట్రాక్టర్లు" : "Tractors Due For Service"}
            </span>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-md text-teal-300 border border-slate-700">
            {filteredList.length} {isTe ? "ట్రాక్టర్లు" : "tractors"}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead className="bg-slate-100 text-slate-800 sticky top-0 z-20 border-b border-slate-300">
              <tr className="text-[11px] font-extrabold uppercase tracking-wider">
                <th className="p-3 w-12 text-center border-r border-slate-200">#</th>
                <th className="p-3 w-52 border-r border-slate-200">{isTe ? "కస్టమర్ & మొబైల్" : "Customer & Phone"}</th>
                <th className="p-3 w-48 border-r border-slate-200">{isTe ? "గ్రామం & మండలం" : "Village & Mandal"}</th>
                <th className="p-3 w-48 border-r border-slate-200">{isTe ? "మోడల్ & ఛాసిస్" : "Model & Chassis"}</th>
                <th className="p-3 w-44 border-r border-slate-200">{isTe ? "గడువు స్థితి (Due Status)" : "Due Status & Days"}</th>
                <th className="p-3 w-60 border-r border-slate-200">{isTe ? "గతంలో జరిగిన సర్వీస్" : "Last Service Record"}</th>
                <th className="p-3 w-40 text-center sticky right-0 bg-slate-100 z-30 border-l border-slate-200">
                  <div className="flex items-center justify-center gap-1">
                    <span>{isTe ? "చర్యలు" : "Actions"}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-bold">
                    <p className="text-sm">
                      {isTe ? "ఈ విభాగంలో సర్వీస్ గడువు ఉన్న ట్రాక్టర్లు లేవు." : "No tractors due in this service category matching current filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((cust: any, idx: number) => {
                  const rowKey = cust.chassisNumber || cust.chassisNo || cust.id || String(idx);
                  const daysDue = cust.daysDue ?? 0;
                  const isOverdue = daysDue < 0;
                  const isDueSoon = daysDue >= 0 && daysDue <= 15;

                  return (
                    <tr
                      key={`${cust.chassisNo}-${idx}`}
                      className={`hover:bg-teal-50/60 transition-colors ${
                        isOverdue
                          ? "bg-rose-50/30"
                          : isDueSoon
                          ? "bg-amber-50/30"
                          : ""
                      }`}
                    >
                      {/* S.No */}
                      <td className="p-3 text-center font-mono font-bold text-slate-400 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      {/* Customer & Phone */}
                      <td className="p-3 border-r border-slate-200">
                        <div className="font-extrabold text-slate-950 text-xs">
                          {cust.customerName}
                        </div>
                        {cust.cleanPhone ? (
                          <a
                            href={`tel:${cust.cleanPhone}`}
                            className="font-mono font-extrabold text-teal-800 hover:text-teal-950 hover:underline text-[11px] flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3 text-teal-600" />
                            <span>{cust.cleanPhone}</span>
                          </a>
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

                      {/* Due Status & Days */}
                      <td className="p-3 border-r border-slate-200">
                        <div className="space-y-1">
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10.5px] bg-rose-600 text-white shadow-xs">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Overdue by {Math.abs(daysDue)} Days</span>
                            </span>
                          ) : isDueSoon ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10.5px] bg-amber-500 text-amber-950 shadow-xs">
                              <Clock className="w-3 h-3" />
                              <span>Due in {daysDue} Days</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10.5px] bg-teal-100 text-teal-900 border border-teal-200">
                              <Calendar className="w-3 h-3" />
                              <span>Due in {daysDue} Days</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Last Service Record */}
                      <td className="p-3 border-r border-slate-200">
                        <p className="text-[11px] font-medium text-slate-800 bg-slate-50 p-1.5 rounded border border-slate-200">
                          {cust.lastCompleted || "No previous records"}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center sticky right-0 z-20 bg-white group-hover:bg-teal-50/90 shadow-md border-l border-slate-200">
                        <RowActionButtons
                          isExpanded={!!expandedRowKeys[rowKey]}
                          onToggleExpand={() => toggleRowActions(rowKey)}
                          language={language}
                          hasPhone={!!cust.cleanPhone}
                          onCall={() => setLoggingCustomer(cust)}
                          onNewJobCard={onCreateJobCard ? () => {
                            const stageName = serviceTabs.find((t) => t.key === activeCategory)?.label || "Free Service";
                            onCreateJobCard(cust, stageName);
                          } : undefined}
                          onRegisterComplaint={onRegisterComplaint ? () => onRegisterComplaint(cust) : undefined}
                          onWhatsApp={cust.cleanPhone ? () => handleSendWhatsApp(cust) : undefined}
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
        onNewJobCard={onCreateJobCard ? (c) => onCreateJobCard(c) : undefined}
      />
    </div>
  );
};
