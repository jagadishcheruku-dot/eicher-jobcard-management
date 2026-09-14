import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Eye,
  PenLine,
  Printer,
  Save,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Search,
  RotateCcw,
  Download,
  Trash2,
  Phone,
  PhoneCall,
  Calendar,
  Clock,
  FileText,
  PlusCircle,
  MessageSquare,
  User,
  Wrench,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  TrendingUp,
  Users,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Building2,
  UserCheck,
  Play,
  ChevronDown,
  UserPlus
} from "lucide-react";
import * as XLSX from "xlsx";
import { RowActionButtons } from "./RowActionButtons";
import { CustomerCallLogModal } from "./CustomerCallLogModal";

// Import standard unified date formatter
import {
  parseDateToTimestamp,
  formatDisplayDate,
  formatDisplayDateDMY,
  getCustomerDeliveryTimestamp,
  getCustomerRawDeliveryDate,
  isDeliveryOutOfWarranty,
  getDeliveryWarrantyStatus,
} from "../utils/dateFormatter";
import {
  BRANCH_DEFINITIONS,
  resolveBranchFromSupervisorOrCode,
  isRecordMatchingBranchOrSupervisor,
} from "../utils/supervisorBranchMapper";

// Re-export for compatibility with other consumers
export {
  parseDateToTimestamp,
  formatDisplayDate,
  formatDisplayDateDMY,
  getCustomerDeliveryTimestamp,
  getCustomerRawDeliveryDate,
  isDeliveryOutOfWarranty,
  getDeliveryWarrantyStatus,
};

export interface MasterCustomerExcelTableProps {
  customers: any[];
  allCards?: any[];
  language?: "te" | "en";
  onSave: (chassisNo: string, updatedFields: any) => void;
  onDelete?: (chassisNo: string) => void;
  onView?: (customer: any) => void;
  onEdit?: (customer: any) => void;
  onNewJobCard?: (customer: any) => void;
  onRegisterComplaint?: (customer: any) => void;
  onSaveCallLog?: (callLog: any) => void;
  onViewJobCardsForChassis?: (chassisNo: string) => void;
  onViewCard?: (card: any) => void;
  onAddNewCustomer?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

export const MasterCustomerExcelTable: React.FC<MasterCustomerExcelTableProps> = ({
  customers,
  allCards = [],
  language = "te",
  onSave,
  onDelete,
  onView,
  onEdit,
  onNewJobCard,
  onRegisterComplaint,
  onSaveCallLog,
  onViewJobCardsForChassis,
  onViewCard,
  onAddNewCustomer,
  canEdit = true,
  canDelete = true,
  canCreate = true,
}) => {
  const isTe = language === "te";

  // Density & View mode
  const [rowDensity, setRowDensity] = useState<"compact" | "normal" | "spacious">("normal");

  // Global Search
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quick Filter via Compact Value Boxes ("all" | "reporting" | "not_reporting" | "duplicate" | "out_of_wty" | "in_wty")
  const [quickFilter, setQuickFilter] = useState<
    "all" | "reporting" | "not_reporting" | "duplicate" | "out_of_wty" | "in_wty"
  >("all");

  // Dedicated Branch & Supervisor Filters (Sri Gayathri Automotives)
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(100);

  // Sorting state: Default by Date of del descending (Recent delivery at top)
  const [sortCol, setSortCol] = useState<string>("Date of del");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Column Filters state
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [filterSearchText, setFilterSearchText] = useState<string>("");
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  // Lock Filters feature (🔒 / 🔓)
  const [isFiltersLocked, setIsFiltersLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sri_customer_filters_locked") === "true";
    } catch {
      return false;
    }
  });

  const toggleFiltersLock = () => {
    setIsFiltersLocked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sri_customer_filters_locked", String(next));
      } catch {}
      return next;
    });
  };

  // Saving states
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [savedSuccessRows, setSavedSuccessRows] = useState<Record<string, boolean>>({});
  const [rowDrafts, setRowDrafts] = useState<Record<string, any>>({});

  // Modal states for Quick Call Log, Customer History, and Chassis Job Cards
  const [expandedRowKeys, setExpandedRowKeys] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean>(false);

  const toggleRowActions = (rowKey: string) => {
    setExpandedRowKeys((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  const [selectedCallCustomer, setSelectedCallCustomer] = useState<any | null>(null);
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<any | null>(null);
  const [selectedChassisModal, setSelectedChassisModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editModalSaving, setEditModalSaving] = useState<boolean>(false);

  // Call log form state
  const [callStatus, setCallStatus] = useState<string>("Interested");
  const [callNotes, setCallNotes] = useState<string>("");
  const [callPreferredDate, setCallPreferredDate] = useState<string>("");
  const [callSaving, setCallSaving] = useState<boolean>(false);
  const [callSavedSuccess, setCallSavedSuccess] = useState<boolean>(false);

  // Auto clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const getRowKey = (cust: any, globalIdx: number) => {
    const chassis = String(
      cust["Chassis no"] || cust.chassisNo || cust.chassis || cust.__chassisDisplay || ""
    ).trim();
    if (chassis) return `chassis_${chassis}`;
    return `row_${globalIdx}_${String(cust["Customer Name"] || cust.custName || "").trim()}`;
  };

  const cleanKey = (k: string) =>
    String(k || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  // Comprehensive column getter that matches exact keys, sanitized keys, camelCase, and fallbacks
  const getColDisplayValue = (cust: any, colKey: string): string => {
    if (!cust) return "";
    const fd = cust.fullData || cust.full_data || cust._raw || {};
    const ck = cleanKey(colKey);

    // 0. Delivery date columns check
    const isDeliveryDateCol =
      colKey === "Date of del" ||
      colKey === "Date of Delivery" ||
      colKey === "dateOfDel" ||
      colKey === "dateOfDelivery" ||
      colKey === "DEL DATE" ||
      colKey === "DATE OF DEL" ||
      colKey === "DATE OF DELIVERY" ||
      colKey === "DELIVERY DATE" ||
      colKey === "Delivery Date" ||
      colKey === "Del Date" ||
      colKey === "Del. Date" ||
      colKey === "DOD" ||
      colKey === "dod" ||
      colKey === "installDate" ||
      colKey === "install_date" ||
      ck === "dateofdel" ||
      ck === "dateofdelivery" ||
      ck === "deldate" ||
      ck === "deliverydate" ||
      ck === "dod" ||
      ck === "installdate" ||
      ck.includes("deldate") ||
      ck.includes("dateofdel") ||
      ck.includes("dateofdelivery") ||
      ck.includes("deliverydate") ||
      ck.includes("installdate");

    if (isDeliveryDateCol) {
      const rawDel =
        cust[colKey] ||
        (fd && fd[colKey]) ||
        cust["Date of del"] ||
        cust["Date of Delivery"] ||
        cust["DATE OF DEL"] ||
        cust["DATE OF DELIVERY"] ||
        cust["DEL DATE"] ||
        cust["DELIVERY DATE"] ||
        cust["Delivery Date"] ||
        cust["Del Date"] ||
        cust["Del. Date"] ||
        cust["DOD"] ||
        cust["dod"] ||
        cust.dateOfDel ||
        cust.dateOfDelivery ||
        cust.deliveryDate ||
        cust.date_of_delivery ||
        cust.date_of_del ||
        cust.installDate ||
        cust.install_date ||
        cust.delDate ||
        cust.rawDateOfDel ||
        (fd && (
          fd["Date of del"] ||
          fd["Date of Delivery"] ||
          fd["DATE OF DEL"] ||
          fd["DATE OF DELIVERY"] ||
          fd["DEL DATE"] ||
          fd["DELIVERY DATE"] ||
          fd["Delivery Date"] ||
          fd["Del Date"] ||
          fd["Del. Date"] ||
          fd["DOD"] ||
          fd["dod"] ||
          fd.dateOfDel ||
          fd.dateOfDelivery ||
          fd.deliveryDate ||
          fd.date_of_delivery ||
          fd.date_of_del ||
          fd.installDate ||
          fd.install_date ||
          ""
        )) ||
        "";
      if (!rawDel) return "";
      const rawStr = String(rawDel).trim();
      // Always normalize to the standard DD-MMM-YYYY format regardless of how it was uploaded
      return formatDisplayDate(rawDel, rawStr);
    }

    // Other date columns
    const isOtherDateCol = ck.endsWith("date") || ck.includes("date");
    if (isOtherDateCol) {
      const rawVal = cust[colKey] ?? (fd && fd[colKey]) ?? cust[ck] ?? (fd && fd[ck]) ?? "";
      if (rawVal !== "" && rawVal !== undefined && rawVal !== null) {
        return formatDisplayDate(rawVal, String(rawVal));
      }
    }

    // 1. Direct match on cust or fd
    if (cust[colKey] !== undefined && cust[colKey] !== null && String(cust[colKey]).trim() !== "") {
      return String(cust[colKey]).trim();
    }
    if (fd[colKey] !== undefined && fd[colKey] !== null && String(fd[colKey]).trim() !== "") {
      return String(fd[colKey]).trim();
    }

    // 2. Normalized sanitized match
    if (cust[ck] !== undefined && cust[ck] !== null && String(cust[ck]).trim() !== "") {
      return String(cust[ck]).trim();
    }
    if (fd[ck] !== undefined && fd[ck] !== null && String(fd[ck]).trim() !== "") {
      return String(fd[ck]).trim();
    }

    // 3. Detailed column specific mappings
    switch (colKey) {
      case "SUPERVISOR":
        return String(
          cust.SUPERVISOR ||
            cust.supervisor ||
            cust.wsIncharge ||
            cust.supervisorName ||
            fd.SUPERVISOR ||
            fd.supervisor ||
            fd.supervisorName ||
            ""
        ).trim();
      case "BRANCH":
      case "Branch": {
        const directBranch = String(
          cust.BRANCH ||
            cust.Branch ||
            cust.branch ||
            cust.location ||
            fd.BRANCH ||
            fd.Branch ||
            fd.branch ||
            ""
        ).trim();
        if (directBranch) return directBranch;
        const sup = String(
          cust.SUPERVISOR ||
            cust.supervisor ||
            cust.wsIncharge ||
            cust.supervisorName ||
            fd.SUPERVISOR ||
            fd.supervisor ||
            fd.supervisorName ||
            ""
        ).trim();
        const resolved = resolveBranchFromSupervisorOrCode(sup, directBranch);
        return resolved.isMatched ? resolved.branchName : directBranch;
      }
      case "SL.NO":
        return String(
          cust["SL.NO"] ||
            cust["SL. No"] ||
            cust["S.No"] ||
            cust["S.No."] ||
            cust["S.NO"] ||
            cust.slNo ||
            cust.sNo ||
            cust.serialNo ||
            fd["SL.NO"] ||
            fd["SL. No"] ||
            fd["S.No"] ||
            fd.slNo ||
            ""
        ).trim();
      case "Model":
      case "model":
        return String(
          cust.Model ||
            cust.model ||
            cust.tractorModel ||
            cust.vehicleModel ||
            fd.Model ||
            fd.model ||
            ""
        ).trim();
      case "MODEL TYPE":
      case "modelType":
        return String(
          cust["MODEL TYPE"] ||
            cust["Model Type"] ||
            cust.modelType ||
            cust.type ||
            cust.variant ||
            fd["MODEL TYPE"] ||
            fd.modelType ||
            ""
        ).trim();
      case "Chassis no":
      case "chassisNo":
        return String(
          cust["Chassis no"] ||
            cust["Chassis No"] ||
            cust["CHASSIS NO"] ||
            cust.chassisNo ||
            cust.chassis ||
            cust.__chassisDisplay ||
            fd["Chassis no"] ||
            fd.chassisNo ||
            fd.chassis ||
            ""
        ).trim();
      case "Engine No:":
      case "Engine No":
      case "engineNo":
        return String(
          cust["Engine No:"] ||
            cust["Engine No"] ||
            cust["ENGINE NO:"] ||
            cust["Engine no"] ||
            cust.engineNo ||
            cust.engine ||
            fd["Engine No:"] ||
            fd["Engine No"] ||
            fd.engineNo ||
            ""
        ).trim();
      case "Date of del":
      case "Date of Delivery":
      case "dateOfDel":
      case "dateOfDelivery":
      case "deliveryDate":
      case "DEL DATE":
      case "DATE OF DEL":
      case "DATE OF DELIVERY":
      case "DELIVERY DATE":
      case "Delivery Date":
      case "Del Date":
      case "Del. Date":
      case "DOD":
      case "dod":
      case "installDate":
      case "install_date":
        const rawDel =
          cust["Date of del"] ||
          cust["Date of Delivery"] ||
          cust["DATE OF DEL"] ||
          cust["DATE OF DELIVERY"] ||
          cust["DEL DATE"] ||
          cust["DELIVERY DATE"] ||
          cust["Delivery Date"] ||
          cust["Del Date"] ||
          cust["Del. Date"] ||
          cust["DOD"] ||
          cust["dod"] ||
          cust.dateOfDel ||
          cust.dateOfDelivery ||
          cust.deliveryDate ||
          cust.date_of_delivery ||
          cust.date_of_del ||
          cust.installDate ||
          cust.install_date ||
          cust.delDate ||
          cust.rawDateOfDel ||
          (fd && (
            fd["Date of del"] ||
            fd["Date of Delivery"] ||
            fd["DATE OF DEL"] ||
            fd["DATE OF DELIVERY"] ||
            fd["DEL DATE"] ||
            fd["DELIVERY DATE"] ||
            fd["Delivery Date"] ||
            fd["Del Date"] ||
            fd["Del. Date"] ||
            fd["DOD"] ||
            fd["dod"] ||
            fd.dateOfDel ||
            fd.dateOfDelivery ||
            fd.deliveryDate ||
            fd.date_of_delivery ||
            fd.date_of_del ||
            fd.installDate ||
            fd.install_date ||
            ""
          )) ||
          "";
        if (!rawDel) return "";
        const rawDelStr = String(rawDel).trim();
        // Always normalize to the standard DD-MMM-YYYY format regardless of how it was uploaded
        return formatDisplayDate(rawDel, rawDelStr);
      case "Customer Name":
      case "custName":
        return String(
          cust["Customer Name"] ||
            cust["Customer name"] ||
            cust["CUSTOMER NAME"] ||
            cust.custName ||
            cust.customerName ||
            cust.name ||
            cust.__custNameDisplay ||
            fd["Customer Name"] ||
            fd.custName ||
            fd.customerName ||
            ""
        ).trim();
      case "FATHER NAME":
      case "Father":
      case "fatherName":
        return String(
          cust["FATHER NAME"] ||
            cust["Father Name"] ||
            cust["Father"] ||
            cust.fatherName ||
            cust.father ||
            cust.guardian ||
            fd["FATHER NAME"] ||
            fd["Father Name"] ||
            fd.fatherName ||
            ""
        ).trim();
      case "ADDRESS":
      case "address":
        return String(
          cust.ADDRESS ||
            cust.Address ||
            cust.address ||
            cust.custAddr ||
            cust.__custAddrDisplay ||
            fd.ADDRESS ||
            fd.Address ||
            fd.address ||
            fd.custAddr ||
            ""
        ).trim();
      case "VILLAGE":
      case "Village":
      case "village":
        return String(
          cust.VILLAGE ||
            cust.Village ||
            cust.village ||
            cust.place ||
            fd.VILLAGE ||
            fd.Village ||
            fd.village ||
            ""
        ).trim();
      case "Mandal":
      case "mandal":
        return String(
          cust.Mandal ||
            cust.mandal ||
            cust.taluk ||
            cust.block ||
            fd.Mandal ||
            fd.mandal ||
            ""
        ).trim();
      case "Mobile Number":
      case "mobileNumber":
      case "phone":
        return String(
          cust["Mobile Number"] ||
            cust["Mobile"] ||
            cust["PHONE"] ||
            cust.mobileNumber ||
            cust.phone ||
            cust.mobile ||
            cust.ownerMob ||
            cust.__custPhoneDisplay ||
            fd["Mobile Number"] ||
            fd.mobileNumber ||
            fd.phone ||
            ""
        ).trim();
      case "Distict":
      case "District":
      case "district":
        return String(
          cust.Distict ||
            cust.District ||
            cust.district ||
            fd.Distict ||
            fd.District ||
            fd.district ||
            ""
        ).trim();
      case "PIN CODE":
      case "pinCode":
        return String(
          cust["PIN CODE"] ||
            cust["Pin Code"] ||
            cust.pinCode ||
            cust.pincode ||
            cust.pin ||
            fd["PIN CODE"] ||
            fd.pinCode ||
            ""
        ).trim();
      case "DSP Name":
      case "dspName":
        return String(
          cust["DSP Name"] ||
            cust["DSP"] ||
            cust.dspName ||
            cust.dsp ||
            fd["DSP Name"] ||
            fd.dspName ||
            ""
        ).trim();
      case "EXCHANGE BRAND":
      case "exchangeBrand":
        return String(
          cust["EXCHANGE BRAND"] ||
            cust["Exchange Brand"] ||
            cust.exchangeBrand ||
            fd["EXCHANGE BRAND"] ||
            fd.exchangeBrand ||
            ""
        ).trim();
      case "EXCHANGE TRACTOR MODELS":
      case "exchangeModels":
        return String(
          cust["EXCHANGE TRACTOR MODELS"] ||
            cust["Exchange Models"] ||
            cust.exchangeModels ||
            cust.exchangeModel ||
            fd["EXCHANGE TRACTOR MODELS"] ||
            fd.exchangeModels ||
            ""
        ).trim();
      case "Last Service Date":
      case "lastServiceDate": {
        const chassisNorm = normalizeChassisStr(
          cust["Chassis no"] ||
            cust["Chassis No"] ||
            cust["CHASSIS NO"] ||
            cust.chassisNo ||
            cust.chassis ||
            cust.__chassisDisplay ||
            ""
        );
        if (!chassisNorm) return "";
        const matchingCards = (allCards || []).filter((card) => {
          const cardChassis = normalizeChassisStr(card.chassisNo || card.chassis || "");
          return cardChassis === chassisNorm;
        });
        if (matchingCards.length === 0) return "";
        const sorted = matchingCards.sort((a, b) => {
          const dateA = new Date(a.jobDate || a.date || "").getTime();
          const dateB = new Date(b.jobDate || b.date || "").getTime();
          return dateB - dateA;
        });
        const lastCard = sorted[0];
        const lastDate = lastCard.jobDate || lastCard.date || "";
        return lastDate ? formatDisplayDate(lastDate, String(lastDate)) : "";
      }
      case "Last Service Hours":
      case "lastServiceHours": {
        const chassisNorm = normalizeChassisStr(
          cust["Chassis no"] ||
            cust["Chassis No"] ||
            cust["CHASSIS NO"] ||
            cust.chassisNo ||
            cust.chassis ||
            cust.__chassisDisplay ||
            ""
        );
        if (!chassisNorm) return "";
        const matchingCards = (allCards || []).filter((card) => {
          const cardChassis = normalizeChassisStr(card.chassisNo || card.chassis || "");
          return cardChassis === chassisNorm;
        });
        if (matchingCards.length === 0) return "";
        const sorted = matchingCards.sort((a, b) => {
          const dateA = new Date(a.jobDate || a.date || "").getTime();
          const dateB = new Date(b.jobDate || b.date || "").getTime();
          return dateB - dateA;
        });
        const lastCard = sorted[0];
        const hours = lastCard.hoursRun || lastCard.hourMeter || lastCard.hours || "";
        return hours ? String(hours).trim() : "";
      }
      case "Last Service Type":
      case "lastServiceType": {
        const chassisNorm = normalizeChassisStr(
          cust["Chassis no"] ||
            cust["Chassis No"] ||
            cust["CHASSIS NO"] ||
            cust.chassisNo ||
            cust.chassis ||
            cust.__chassisDisplay ||
            ""
        );
        if (!chassisNorm) return "";
        const matchingCards = (allCards || []).filter((card) => {
          const cardChassis = normalizeChassisStr(card.chassisNo || card.chassis || "");
          return cardChassis === chassisNorm;
        });
        if (matchingCards.length === 0) return "";
        const sorted = matchingCards.sort((a, b) => {
          const dateA = new Date(a.jobDate || a.date || "").getTime();
          const dateB = new Date(b.jobDate || b.date || "").getTime();
          return dateB - dateA;
        });
        const lastCard = sorted[0];

        // Check if it's a free service
        const freeServiceValue = lastCard.freeServiceList || lastCard.free_service_list || "";
        if (freeServiceValue && String(freeServiceValue).trim()) {
          // It's a free service - show the service count
          const freeServiceStr = String(freeServiceValue).trim();
          // Count total free services for this customer
          const freeServices = matchingCards.filter((card) => {
            const freeVal = card.freeServiceList || card.free_service_list || "";
            return freeVal && String(freeVal).trim();
          });
          const ordinalNum = freeServices.length;
          const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
          const ordinal = ordinals[ordinalNum - 1] || `${ordinalNum}th`;
          return `${ordinal} Free Service`;
        }

        // It's a paid service - show warranty status or service type
        const warrantyStatus = lastCard.warrantyStatus || lastCard.warranty_status || "";
        const underWty = lastCard.underWarranty || lastCard.under_warranty || false;
        const serviceType = lastCard.serviceType || lastCard.service_type || "";

        let statusPart = "Paid Service";
        if (underWty || (warrantyStatus && String(warrantyStatus).toLowerCase().includes("wty"))) {
          statusPart = "Paid Service (Under Wty)";
        } else if (warrantyStatus && String(warrantyStatus).trim()) {
          statusPart = `Paid Service (${String(warrantyStatus).trim()})`;
        }

        return statusPart;
      }
      case "Service Due Status":
      case "serviceDueStatus": {
        const chassisNorm = normalizeChassisStr(
          cust["Chassis no"] ||
            cust["Chassis No"] ||
            cust["CHASSIS NO"] ||
            cust.chassisNo ||
            cust.chassis ||
            cust.__chassisDisplay ||
            ""
        );
        if (!chassisNorm) return isTe ? "━━ డేటా లేదు" : "━━ No Data";
        const matchingCards = (allCards || []).filter((card) => {
          const cardChassis = normalizeChassisStr(card.chassisNo || card.chassis || "");
          return cardChassis === chassisNorm;
        });
        if (matchingCards.length === 0) return isTe ? "━━ సేవ నేను" : "━━ No Service";
        const sorted = matchingCards.sort((a, b) => {
          const dateA = new Date(a.jobDate || a.date || "").getTime();
          const dateB = new Date(b.jobDate || b.date || "").getTime();
          return dateB - dateA;
        });
        const lastCard = sorted[0];
        const lastDate = new Date(lastCard.jobDate || lastCard.date || "");
        const today = new Date();
        const daysSinceService = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        // Service reminder logic:
        // - If < 15 days: Recently serviced (Green)
        // - If 15-60 days: Normal (Gray)
        // - If 60-180 days: Due soon (Yellow)
        // - If > 180 days: Overdue (Red)
        if (daysSinceService < 0) {
          return isTe ? "📅 ఫ్యూచర్ డేట్" : "📅 Future Date";
        } else if (daysSinceService <= 15) {
          return isTe ? `✅ ${daysSinceService} రోజుల ముందు` : `✅ ${daysSinceService} days ago`;
        } else if (daysSinceService <= 60) {
          return isTe ? `📋 ${daysSinceService} రోజుల ముందు` : `📋 ${daysSinceService} days ago`;
        } else if (daysSinceService <= 180) {
          return isTe ? `⚠️ సేవ వద్దు! ${daysSinceService} రోజులు` : `⚠️ Due Soon! ${daysSinceService} days`;
        } else {
          return isTe ? `🔴 చెల్లిపోయిన! ${daysSinceService} రోజులు` : `🔴 Overdue! ${daysSinceService} days`;
        }
      }
      default: {
        const val = cust[colKey] !== undefined ? cust[colKey] : (fd && fd[colKey] !== undefined ? fd[colKey] : "");
        if (typeof colKey === "string" && (colKey.toLowerCase().includes("date") || colKey.toLowerCase().includes("del") || colKey.toLowerCase() === "dod")) {
          if (!val) return "";
          const valStr = String(val).trim();
          if (valStr.includes("/") || valStr.includes("-") || valStr.includes(".")) {
            return valStr;
          }
          return formatDisplayDate(val, valStr);
        }
        return val != null ? String(val).trim() : "";
      }
    }
  };

  // Helper to extract normalized alphanumeric chassis string
  const normalizeChassisStr = (val: any): string =>
    String(val || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .trim();

  // Extract all possible chassis variants for a customer object
  const getCustChassisVariants = (cust: any): string[] => {
    if (!cust) return [];
    const set = new Set<string>();
    const fd = cust.fullData || cust.full_data || cust._raw || {};
    [
      cust["Chassis no"],
      cust["Chassis No"],
      cust["CHASSIS NO"],
      cust["CHASIS NO"],
      cust["Chasis no"],
      cust.chassisNo,
      cust.chassis_no,
      cust.chassis,
      cust.__chassisDisplay,
      getColDisplayValue(cust, "Chassis no"),
      fd["Chassis no"],
      fd["Chassis No"],
      fd["CHASIS NO"],
      fd["CHASSIS NO"],
      fd.chassisNo,
      fd.chassis,
    ].forEach((raw) => {
      if (raw) {
        const norm = normalizeChassisStr(raw);
        if (norm) {
          set.add(norm);
          if (norm.length >= 6) {
            set.add(norm.slice(-6));
          }
        }
      }
    });
    return Array.from(set);
  };

  // Extract all possible chassis variants for a job card object
  const getCardChassisVariants = (card: any): string[] => {
    if (!card) return [];
    const set = new Set<string>();
    const fd = card.fullData || card.full_data || card._raw || {};
    [
      card.chassisNo,
      card.chassis_no,
      card.chassis,
      card["CHASIS NO"],
      card["CHASSIS NO"],
      card["Chassis No"],
      card["Chassis no"],
      card.chasisNo,
      card.chasis_no,
      fd["CHASIS NO"],
      fd["CHASSIS NO"],
      fd["Chassis No"],
      fd["Chassis no"],
      fd.chassisNo,
      fd.chassis,
    ].forEach((raw) => {
      if (raw) {
        const norm = normalizeChassisStr(raw);
        if (norm) {
          set.add(norm);
          if (norm.length >= 6) {
            set.add(norm.slice(-6));
          }
        }
      }
    });
    return Array.from(set);
  };

  // Fast chassis -> job card index, built once per allCards change instead of
  // re-scanning every card for every customer (was O(customers * cards), froze
  // the browser tab once real data volume hit a few thousand records).
  const cardChassisIndex = useMemo(() => {
    const byVariant = new Map<string, any[]>();
    const byDigits5 = new Map<string, any[]>();
    (allCards || []).forEach((card) => {
      const variants = getCardChassisVariants(card);
      variants.forEach((v) => {
        if (!byVariant.has(v)) byVariant.set(v, []);
        byVariant.get(v)!.push(card);
        const digits = v.replace(/\D/g, "");
        if (digits.length >= 5) {
          const key = digits.slice(-5);
          if (!byDigits5.has(key)) byDigits5.set(key, []);
          byDigits5.get(key)!.push(card);
        }
      });
    });
    return { byVariant, byDigits5 };
  }, [allCards]);

  // Helper to get matching job cards for a customer strictly matched by chassis number
  const getCustomerJobCards = (cust: any) => {
    if (!cust || !allCards || allCards.length === 0) return [];
    const custChassisList = getCustChassisVariants(cust);
    if (custChassisList.length === 0) return [];

    const { byVariant, byDigits5 } = cardChassisIndex;
    const seen = new Set<any>();
    const result: any[] = [];
    const add = (card: any) => {
      if (!seen.has(card)) {
        seen.add(card);
        result.push(card);
      }
    };
    custChassisList.forEach((cCh) => {
      (byVariant.get(cCh) || []).forEach(add);
      const digits = cCh.replace(/\D/g, "");
      if (digits.length >= 5) {
        (byDigits5.get(digits.slice(-5)) || []).forEach(add);
      }
    });
    return result;
  };

  // Pre-calculate Duplicates set
  const duplicateSet = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach((c) => {
      const ch = getColDisplayValue(c, "Chassis no").toUpperCase().trim();
      if (ch) {
        counts[ch] = (counts[ch] || 0) + 1;
      }
    });
    const set = new Set<string>();
    Object.keys(counts).forEach((k) => {
      if (counts[k] > 1) set.add(k);
    });
    return set;
  }, [customers]);

  // Metric counts for the compact value boxes
  const metrics = useMemo(() => {
    const totalDeliveries = customers.length;
    let reportingCount = 0;
    let duplicateCount = 0;
    let outOfWtyCount = 0;
    let inWtyCount = 0;

    customers.forEach((c) => {
      const cards = getCustomerJobCards(c);
      if (cards.length > 0) {
        reportingCount++;
      }
      const ch = getColDisplayValue(c, "Chassis no").toUpperCase().trim();
      if (ch && duplicateSet.has(ch)) {
        duplicateCount++;
      }
      const delTs = getCustomerDeliveryTimestamp(c);
      if (delTs > 0) {
        if (isDeliveryOutOfWarranty(delTs, 2)) {
          outOfWtyCount++;
        } else {
          inWtyCount++;
        }
      }
    });

    const notReportingCount = Math.max(0, totalDeliveries - reportingCount);
    const reportingRate = totalDeliveries > 0 ? ((reportingCount / totalDeliveries) * 100).toFixed(1) : "0.0";

    return {
      totalDeliveries,
      reportingCount,
      notReportingCount,
      duplicateCount,
      reportingRate,
      outOfWtyCount,
      inWtyCount,
    };
  }, [customers, allCards, duplicateSet]);

  // Extract list of all unique supervisors for dropdown filter
  const uniqueSupervisors = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      const sup = getColDisplayValue(c, "SUPERVISOR");
      if (sup && sup !== "—") set.add(sup);
    });
    return Array.from(set).sort();
  }, [customers]);

  // Master Column Definitions
  const detailedCols = [
    { key: "SUPERVISOR", label: "SUPERVISOR", width: "w-36 min-w-[140px]" },
    { key: "BRANCH", label: "BRANCH", width: "w-32 min-w-[130px]" },
    { key: "SL.NO", label: "SL.NO", width: "w-20 min-w-[80px]" },
    { key: "Model", label: "Model", width: "w-36 min-w-[140px]" },
    { key: "MODEL TYPE", label: "MODEL TYPE", width: "w-36 min-w-[140px]" },
    { key: "Chassis no", label: "Chassis no", width: "w-44 min-w-[170px]" },
    { key: "Engine No:", label: "Engine No:", width: "w-40 min-w-[160px]" },
    { key: "Date of del", label: "Date of del", width: "w-32 min-w-[130px]" },
    { key: "Customer Name", label: "Customer Name", width: "w-52 min-w-[200px]" },
    { key: "FATHER NAME", label: "FATHER NAME", width: "w-48 min-w-[190px]" },
    { key: "ADDRESS", label: "ADDRESS", width: "w-56 min-w-[220px]" },
    { key: "VILLAGE", label: "VILLAGE", width: "w-40 min-w-[160px]" },
    { key: "Mandal", label: "Mandal", width: "w-36 min-w-[140px]" },
    { key: "Mobile Number", label: "Mobile Number", width: "w-36 min-w-[140px]" },
    { key: "Last Service Date", label: isTe ? "చివరి సేవ తేదీ" : "Last Service Date", width: "w-32 min-w-[130px]" },
    { key: "Last Service Hours", label: isTe ? "చివరి సేవ గంటలు" : "Last Service Hours", width: "w-28 min-w-[110px]" },
    { key: "Last Service Type", label: isTe ? "చివరి సేవ రకం" : "Last Service Type", width: "w-40 min-w-[160px]" },
    { key: "Service Due Status", label: isTe ? "సేవ సమితి స్థితి" : "Service Due Status", width: "w-36 min-w-[140px]" },
    { key: "Distict", label: "Distict", width: "w-32 min-w-[130px]" },
    { key: "PIN CODE", label: "PIN CODE", width: "w-28 min-w-[110px]" },
    { key: "DSP Name", label: "DSP Name", width: "w-36 min-w-[140px]" },
    { key: "EXCHANGE BRAND", label: "EXCHANGE BRAND", width: "w-40 min-w-[160px]" },
    { key: "EXCHANGE TRACTOR MODELS", label: "EXCHANGE TRACTOR MODELS", width: "w-48 min-w-[190px]" },
  ];

  // Editable row values helper
  const getCustValue = (cust: any, colKey: string, globalIdx: number): string => {
    const key = getRowKey(cust, globalIdx);
    if (rowDrafts[key] && rowDrafts[key][colKey] !== undefined) {
      return rowDrafts[key][colKey];
    }
    return getColDisplayValue(cust, colKey);
  };

  const handleFieldChange = (
    cust: any,
    globalIdx: number,
    colKey: string,
    newValue: string
  ) => {
    const key = getRowKey(cust, globalIdx);
    setRowDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [colKey]: newValue,
      },
    }));
  };

  const handleSaveRow = async (cust: any, globalIdx: number) => {
    const key = getRowKey(cust, globalIdx);
    const drafts = rowDrafts[key] || {};
    const chassisNo = (drafts["Chassis no"] !== undefined
      ? drafts["Chassis no"]
      : getColDisplayValue(cust, "Chassis no")
    ).trim();

    if (!chassisNo) {
      alert("⚠️ Chassis No is required to identify and save this customer.");
      return;
    }

    setSavingRows((prev) => ({ ...prev, [key]: true }));
    try {
      await onSave(chassisNo, drafts);
      setSavedSuccessRows((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setSavedSuccessRows((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 2500);
      showToast(isTe ? "✅ రికార్డ్ విజయవంతంగా సేవ్ అయ్యింది!" : "✅ Customer record saved successfully!");
    } catch (err) {
      console.error("Save row error:", err);
      alert("Failed to save row changes.");
    } finally {
      setSavingRows((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Open Edit Customer Modal with populated data
  const handleOpenEditCustomer = (cust: any) => {
    if (onEdit) {
      onEdit(cust);
    }
    const fd = cust.fullData || cust.full_data || cust._raw || {};
    setEditForm({
      slNo: getColDisplayValue(cust, "SL.NO") || cust.slNo || "",
      supervisor: getColDisplayValue(cust, "SUPERVISOR") || cust.supervisor || "",
      branch: getColDisplayValue(cust, "BRANCH") || cust.branch || "",
      model: getColDisplayValue(cust, "Model") || cust.model || "",
      modelType: getColDisplayValue(cust, "MODEL TYPE") || cust.modelType || "",
      chassisNo: getColDisplayValue(cust, "Chassis no") || cust.chassisNo || "",
      engineNo: getColDisplayValue(cust, "Engine no") || getColDisplayValue(cust, "Engine No:") || cust.engineNo || "",
      dateOfDelivery: getColDisplayValue(cust, "Date of Delivery") || getColDisplayValue(cust, "Date of del") || cust.dateOfDelivery || "",
      customerName: getColDisplayValue(cust, "Customer Name") || cust.customerName || cust.custName || "",
      fatherName: getColDisplayValue(cust, "Father Name") || getColDisplayValue(cust, "FATHER NAME") || cust.fatherName || "",
      village: getColDisplayValue(cust, "Village") || getColDisplayValue(cust, "VILLAGE") || cust.village || "",
      mandal: getColDisplayValue(cust, "Mandal") || cust.mandal || "",
      district: getColDisplayValue(cust, "DISTRICT") || getColDisplayValue(cust, "Distict") || cust.district || "",
      pinCode: getColDisplayValue(cust, "Pin code") || cust.pinCode || "",
      mobileNumber: getColDisplayValue(cust, "Mobile Number") || cust.mobileNumber || "",
      address: getColDisplayValue(cust, "ADDRESS") || cust.address || "",
      dspName: getColDisplayValue(cust, "DSP Name") || cust.dspName || "",
      exchangeBrand: getColDisplayValue(cust, "EXCHANGE BRAND") || cust.exchangeBrand || "",
      exchangeModel: getColDisplayValue(cust, "EXCHANGE TRACTOR MODELS") || cust.exchangeModel || "",
    });
    setEditingCustomer(cust);
  };

  // Save Edit Customer Modal Submit
  const handleSaveEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const targetChassis = (editForm.chassisNo || getColDisplayValue(editingCustomer, "Chassis no")).trim();
    if (!targetChassis) {
      alert(isTe ? "⚠️ ఛాసిస్ నంబర్ తప్పనిసరి." : "⚠️ Chassis Number is required.");
      return;
    }

    setEditModalSaving(true);
    try {
      const updatedFields: Record<string, string> = {
        "SL.NO": editForm.slNo,
        "SUPERVISOR": editForm.supervisor,
        "BRANCH": editForm.branch,
        "Model": editForm.model,
        "MODEL TYPE": editForm.modelType,
        "Chassis no": editForm.chassisNo,
        "Engine no": editForm.engineNo,
        "Date of Delivery": editForm.dateOfDelivery,
        "Date of del": editForm.dateOfDelivery,
        "Customer Name": editForm.customerName,
        "Father Name": editForm.fatherName,
        "FATHER NAME": editForm.fatherName,
        "Village": editForm.village,
        "VILLAGE": editForm.village,
        "Mandal": editForm.mandal,
        "DISTRICT": editForm.district,
        "Pin code": editForm.pinCode,
        "Mobile Number": editForm.mobileNumber,
        "ADDRESS": editForm.address,
        "DSP Name": editForm.dspName,
        "EXCHANGE BRAND": editForm.exchangeBrand,
        "EXCHANGE TRACTOR MODELS": editForm.exchangeModel,
      };

      const key = getRowKey(editingCustomer, editingCustomer.__origIndex || 0);
      setRowDrafts((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          ...updatedFields,
        },
      }));

      await onSave(targetChassis, updatedFields);
      setEditingCustomer(null);
      showToast(isTe ? "✅ కస్టమర్ వివరాలు విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి!" : "✅ Customer details updated successfully!");
    } catch (err) {
      console.error("Save edit customer error:", err);
      alert("Failed to update customer details.");
    } finally {
      setEditModalSaving(false);
    }
  };

  // Copy customer details
  const handleCopyCustomer = (cust: any) => {
    const name = getColDisplayValue(cust, "Customer Name");
    const father = getColDisplayValue(cust, "FATHER NAME");
    const village = getColDisplayValue(cust, "VILLAGE");
    const mandal = getColDisplayValue(cust, "Mandal");
    const phone = getColDisplayValue(cust, "Mobile Number");
    const chassis = getColDisplayValue(cust, "Chassis no");
    const model = getColDisplayValue(cust, "Model");
    const delDate = getColDisplayValue(cust, "Date of del");
    const supervisor = getColDisplayValue(cust, "SUPERVISOR");
    const branch = getColDisplayValue(cust, "BRANCH");

    const text = `📋 SRI GAYATHRI AUTOMOTIVES - CUSTOMER DETAILS
👤 Customer: ${name} ${father ? `(S/o ${father})` : ""}
📱 Mobile: ${phone}
📍 Village: ${village}, Mandal: ${mandal}
🚜 Model: ${model} | Chassis: ${chassis}
📅 Delivery Date: ${delDate}
🏢 Branch: ${branch} | Supervisor: ${supervisor}`;

    navigator.clipboard.writeText(text).then(() => {
      showToast(isTe ? "✅ వివరాలు కాపీ చేయబడ్డాయి!" : "✅ Customer details copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy details.");
    });
  };

  // Print Customer Master Record & Service Summary
  const handlePrintCustomer = (cust: any) => {
    const chassis = getColDisplayValue(cust, "Chassis no");
    const name = getColDisplayValue(cust, "Customer Name");
    const father = getColDisplayValue(cust, "FATHER NAME");
    const mobile = getColDisplayValue(cust, "Mobile Number");
    const village = getColDisplayValue(cust, "VILLAGE");
    const mandal = getColDisplayValue(cust, "Mandal");
    const district = getColDisplayValue(cust, "Distict");
    const model = getColDisplayValue(cust, "Model");
    const modelType = getColDisplayValue(cust, "MODEL TYPE");
    const engineNo = getColDisplayValue(cust, "Engine No:");
    const delDate = getColDisplayValue(cust, "Date of del");
    const supervisor = getColDisplayValue(cust, "SUPERVISOR");
    const branch = getColDisplayValue(cust, "BRANCH");
    const dsp = getColDisplayValue(cust, "DSP Name");
    const exchangeBrand = getColDisplayValue(cust, "EXCHANGE BRAND");
    const exchangeModel = getColDisplayValue(cust, "EXCHANGE TRACTOR MODELS");
    const jobCards = getCustomerJobCards(cust);

    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Profile - ${name} (${chassis})</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #581c87; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 800; color: #581c87; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 600; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .card-title { font-size: 12px; font-weight: 800; color: #581c87; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          .row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
          .label { font-weight: 600; color: #475569; }
          .val { font-weight: 700; color: #0f172a; text-align: right; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: 800; color: #334155; }
          .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">SRI GAYATHRI AUTOMOTIVES</div>
          <div class="subtitle">EICHER TRACTORS AUTHORIZED DEALERSHIP • CUSTOMER PROFILE</div>
        </div>
        <div class="grid">
          <div class="card">
            <div class="card-title">Customer Information</div>
            <div class="row"><span class="label">Customer Name:</span><span class="val">${name}</span></div>
            <div class="row"><span class="label">Father Name:</span><span class="val">${father || "—"}</span></div>
            <div class="row"><span class="label">Mobile Number:</span><span class="val">${mobile}</span></div>
            <div class="row"><span class="label">Village / Mandal:</span><span class="val">${village}, ${mandal}</span></div>
            <div class="row"><span class="label">District:</span><span class="val">${district}</span></div>
          </div>
          <div class="card">
            <div class="card-title">Tractor & Delivery Details</div>
            <div class="row"><span class="label">Model & Type:</span><span class="val">${model} ${modelType ? `(${modelType})` : ""}</span></div>
            <div class="row"><span class="label">Chassis Number:</span><span class="val" style="font-family: monospace;">${chassis}</span></div>
            <div class="row"><span class="label">Engine Number:</span><span class="val" style="font-family: monospace;">${engineNo || "—"}</span></div>
            <div class="row"><span class="label">Delivery Date:</span><span class="val">${delDate}</span></div>
            <div class="row"><span class="label">Branch / Supervisor:</span><span class="val">${branch} / ${supervisor}</span></div>
          </div>
        </div>
        ${
          exchangeBrand || exchangeModel || dsp
            ? `<div class="card" style="margin-bottom: 16px;">
                <div class="card-title">DSP & Exchange Information</div>
                <div class="row"><span class="label">DSP Name:</span><span class="val">${dsp || "—"}</span></div>
                <div class="row"><span class="label">Exchange Brand & Model:</span><span class="val">${exchangeBrand || "—"} - ${exchangeModel || "—"}</span></div>
              </div>`
            : ""
        }
        <div style="font-weight: 800; font-size: 13px; color: #581c87; margin-top: 16px;">
          Service History & Job Cards (${jobCards.length})
        </div>
        ${
          jobCards.length === 0
            ? `<p style="font-size: 12px; color: #64748b; font-style: italic; margin-top: 4px;">No service records / job cards logged yet.</p>`
            : `<table>
                <thead>
                  <tr>
                    <th>Job No</th>
                    <th>Date</th>
                    <th>Service Type</th>
                    <th>Hours</th>
                    <th>Mechanic</th>
                    <th>Total (₹)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${jobCards
                    .map(
                      (jc, i) => `
                    <tr>
                      <td style="font-family: monospace; font-weight: bold;">${jc.jobNo || jc.jobCardNo || `JC-${i + 1}`}</td>
                      <td>${formatDisplayDate(jc.complaintDate || jc.date || jc.jobDate)}</td>
                      <td>${jc.serviceType || "General Service"}</td>
                      <td>${jc.hoursRun || jc.hourMeter || "—"}</td>
                      <td>${jc.mechanicName || jc.technician || "—"}</td>
                      <td style="font-weight: bold;">₹${Number(jc.grandTotal || jc.totalAmount || 0).toLocaleString()}</td>
                      <td>${jc.status || "Closed"}</td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>`
        }
        <div class="footer">
          Generated on ${new Date().toLocaleString()} • Sri Gayathri Automotives Eicher Service Portal
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  // Handle Save Call Log
  const handleSaveCallLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallCustomer) return;
    setCallSaving(true);
    const chassis = getColDisplayValue(selectedCallCustomer, "Chassis no");
    const custName = getColDisplayValue(selectedCallCustomer, "Customer Name");
    const phone = getColDisplayValue(selectedCallCustomer, "Mobile Number");

    const logEntry = {
      id: `call_${Date.now()}`,
      chassisNo: chassis,
      customerName: custName,
      mobileNumber: phone,
      callDate: formatDisplayDate(new Date()),
      status: callStatus,
      notes: callNotes,
      preferredDate: callPreferredDate,
      timestamp: new Date().toISOString(),
    };

    try {
      if (onSaveCallLog) {
        onSaveCallLog(logEntry);
      }
      setCallSavedSuccess(true);
      setTimeout(() => {
        setCallSavedSuccess(false);
        setSelectedCallCustomer(null);
        setCallNotes("");
        setCallPreferredDate("");
      }, 1200);
      showToast(isTe ? "✅ కాల్ లాగ్ సేవ్ చేయబడింది!" : "✅ Call Log saved successfully!");
    } catch (err) {
      console.error("Save call log error:", err);
      alert("Failed to save call log.");
    } finally {
      setCallSaving(false);
    }
  };

  // Filter and Sort Pipeline
  const processedCustomers = useMemo(() => {
    let list = customers.map((c, i) => ({ ...c, __origIndex: i + 1 }));

    // 1. Quick Filter from Compact Value Boxes
    if (quickFilter === "reporting") {
      list = list.filter((c) => getCustomerJobCards(c).length > 0);
    } else if (quickFilter === "not_reporting") {
      list = list.filter((c) => getCustomerJobCards(c).length === 0);
    } else if (quickFilter === "duplicate") {
      list = list.filter((c) => {
        const ch = getColDisplayValue(c, "Chassis no").toUpperCase().trim();
        return ch && duplicateSet.has(ch);
      });
    } else if (quickFilter === "out_of_wty") {
      list = list.filter((c) => {
        const ts = getCustomerDeliveryTimestamp(c);
        return ts > 0 && isDeliveryOutOfWarranty(ts, 2);
      });
    } else if (quickFilter === "in_wty") {
      list = list.filter((c) => {
        const ts = getCustomerDeliveryTimestamp(c);
        return ts > 0 && !isDeliveryOutOfWarranty(ts, 2);
      });
    }

    // 2. Branch & Supervisor Filters (Sri Gayathri Automotives)
    if (selectedBranchFilter && selectedBranchFilter !== "all") {
      list = list.filter((cust) => {
        const branch = getColDisplayValue(cust, "BRANCH");
        const sup = getColDisplayValue(cust, "SUPERVISOR");
        return isRecordMatchingBranchOrSupervisor(branch, sup, selectedBranchFilter);
      });
    }

    if (selectedSupervisorFilter && selectedSupervisorFilter !== "all") {
      list = list.filter((cust) => {
        const sup = getColDisplayValue(cust, "SUPERVISOR").toLowerCase().trim();
        const target = selectedSupervisorFilter.toLowerCase().trim();
        return sup === target || sup.includes(target);
      });
    }

    // 3. Global search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((cust) => {
        const name = getColDisplayValue(cust, "Customer Name").toLowerCase();
        const chassis = getColDisplayValue(cust, "Chassis no").toLowerCase();
        const phone = getColDisplayValue(cust, "Mobile Number").toLowerCase();
        const village = getColDisplayValue(cust, "VILLAGE").toLowerCase();
        const model = getColDisplayValue(cust, "Model").toLowerCase();
        const sup = getColDisplayValue(cust, "SUPERVISOR").toLowerCase();
        const branch = getColDisplayValue(cust, "BRANCH").toLowerCase();
        const eng = getColDisplayValue(cust, "Engine No:").toLowerCase();
        return (
          name.includes(q) ||
          chassis.includes(q) ||
          phone.includes(q) ||
          village.includes(q) ||
          model.includes(q) ||
          sup.includes(q) ||
          branch.includes(q) ||
          eng.includes(q)
        );
      });
    }

    // 3. Column filters
    Object.keys(columnFilters).forEach((colKey) => {
      const selectedVals = columnFilters[colKey];
      if (selectedVals && selectedVals.length > 0) {
        list = list.filter((cust) => {
          const val = getColDisplayValue(cust, colKey) || "(Blank)";
          return selectedVals.includes(val);
        });
      }
    });

    // 4. Sorting (Chronological delivery date sorting: present to past by default)
    if (sortCol) {
      list.sort((a, b) => {
        const valA = getColDisplayValue(a, sortCol);
        const valB = getColDisplayValue(b, sortCol);

        // Date sorting (e.g. "Date of del", "Date of Delivery", "DOD")
        if (
          sortCol === "Date of del" ||
          sortCol === "Date of Delivery" ||
          sortCol.toLowerCase().includes("date") ||
          sortCol.toLowerCase().includes("del") ||
          sortCol.toLowerCase() === "dod"
        ) {
          const tsA = getCustomerDeliveryTimestamp(a);
          const tsB = getCustomerDeliveryTimestamp(b);
          if (tsA !== tsB) {
            if (tsA === -1) return 1;
            if (tsB === -1) return -1;
            return sortDir === "asc" ? tsA - tsB : tsB - tsA;
          }
        }

        // Numeric sorting for SL.NO
        if (sortCol === "SL.NO" || sortCol === "SL. No" || sortCol === "slNo") {
          const numA = Number(valA.replace(/\D/g, "")) || 0;
          const numB = Number(valB.replace(/\D/g, "")) || 0;
          if (numA !== numB) {
            return sortDir === "asc" ? numA - numB : numB - numA;
          }
        }

        const comp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
        return sortDir === "asc" ? comp : -comp;
      });
    } else {
      // Default: sort delivery date from present date backwards (descending timestamp: newest first)
      list.sort((a, b) => {
        const tsA = getCustomerDeliveryTimestamp(a);
        const tsB = getCustomerDeliveryTimestamp(b);
        if (tsA !== tsB) {
          if (tsA === -1) return 1;
          if (tsB === -1) return -1;
          return tsB - tsA; // Newest / latest delivery date first!
        }
        return 0;
      });
    }

    return list;
  }, [
    customers,
    quickFilter,
    selectedBranchFilter,
    selectedSupervisorFilter,
    searchQuery,
    columnFilters,
    sortCol,
    sortDir,
    allCards,
    duplicateSet,
  ]);

  // Paginated records
  const totalPages = Math.ceil(processedCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    if (pageSize >= 999999) return processedCustomers;
    const start = (currentPage - 1) * pageSize;
    return processedCustomers.slice(start, start + pageSize);
  }, [processedCustomers, currentPage, pageSize]);

  // Unique values for column filter dropdown
  const getUniqueColumnValues = (colKey: string): string[] => {
    const set = new Set<string>();
    customers.forEach((cust) => {
      const v = getColDisplayValue(cust, colKey) || "(Blank)";
      set.add(v);
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  };

  const isDateColumn = (colKey: string): boolean => {
    return colKey === "Date of del" || colKey === "Date of Delivery" || colKey === "DOD" || colKey === "Last Service Date";
  };

  const groupDatesByYearMonth = (colKey: string) => {
    const grouped: Record<string, Set<string>> = {};
    customers.forEach((cust) => {
      const dateStr = getColDisplayValue(cust, colKey) || "";
      if (dateStr && dateStr !== "(Blank)") {
        const parts = dateStr.split("-");
        if (parts.length >= 3) {
          const day = parts[0];
          const month = parts[1];
          const year = parts[2];
          if (!grouped[year]) grouped[year] = new Set();
          grouped[year].add(`${month}-${year}`);
        }
      }
    });
    const result: Record<string, string[]> = {};
    Object.keys(grouped).sort().reverse().forEach((year) => {
      result[year] = Array.from(grouped[year]).sort();
    });
    return result;
  };

  const handleToggleColumnFilterValue = (colKey: string, val: string) => {
    setColumnFilters((prev) => {
      const curr = prev[colKey] || [];
      const updated = curr.includes(val)
        ? curr.filter((x) => x !== val)
        : [...curr, val];
      if (updated.length === 0) {
        const next = { ...prev };
        delete next[colKey];
        return next;
      }
      return { ...prev, [colKey]: updated };
    });
    setCurrentPage(1);
  };

  const handleSelectAllColValues = (colKey: string, values: string[]) => {
    setColumnFilters((prev) => ({
      ...prev,
      [colKey]: values,
    }));
    setCurrentPage(1);
  };

  const handleClearColFilter = (colKey: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[colKey];
      return next;
    });
    setCurrentPage(1);
  };

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colKey);
      setSortDir(colKey === "Date of del" ? "desc" : "asc");
    }
  };

  const handleExportExcel = () => {
    const exportData = processedCustomers.map((c, i) => {
      const row: any = { "#": i + 1 };
      detailedCols.forEach((col) => {
        row[col.label] = getColDisplayValue(c, col.key);
      });

      // Find matching job cards for chassis/phone
      const cleanCh = (getColDisplayValue(c, "Chassis no") || "").toLowerCase().trim();
      const cleanPhone = (getColDisplayValue(c, "Mobile Number") || "").toLowerCase().trim();
      const matchingCards = allCards.filter((card) => {
        const cCh = String(card.chassisNo || card.chassis || "").toLowerCase().trim();
        const cPh = String(card.ownerMob || card.phoneNo || card.phNo || "").toLowerCase().trim();
        return (cleanCh && cCh && cCh === cleanCh) || (cleanPhone && cPh && cPh === cleanPhone);
      });

      row["TOTAL JOB CARDS"] = matchingCards.length;
      row["SERVICE STATUS"] = matchingCards.length > 0 ? "Reporting" : "Not Reporting";
      if (matchingCards.length > 0) {
        const sorted = [...matchingCards].sort((a, b) => {
          const tA = parseDateToTimestamp(a.jobDate || a.jobOpenDate || a.createdAt);
          const tB = parseDateToTimestamp(b.jobDate || b.jobOpenDate || b.createdAt);
          return tB - tA;
        });
        const latest = sorted[0];
        row["LATEST JOB CARD NO"] = latest.jobNo || latest.onlineJobCardNo || "";
        row["LAST SERVICE DATE"] = formatDisplayDate(latest.jobDate || latest.jobOpenDate || latest.createdAt || "");
        row["LAST SERVICE TYPE"] = latest.serviceType || "";
        row["LAST HRS RUN"] = latest.hourMeter || latest.hrsRun || "";
      } else {
        row["LATEST JOB CARD NO"] = "";
        row["LAST SERVICE DATE"] = "";
        row["LAST SERVICE TYPE"] = "";
        row["LAST HRS RUN"] = "";
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master_Customers");
    XLSX.writeFile(
      wb,
      `Customer_Master_Spreadsheet_FullData_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Cell padding based on density
  const cellPadding =
    rowDensity === "compact"
      ? "py-1 px-1.5 text-xs"
      : rowDensity === "spacious"
      ? "py-2.5 px-3 text-sm"
      : "py-1.5 px-2 text-xs";

  // Selected Chassis Job Cards lookup (strictly matched by chassis number)
  const selectedChassisCustomer = useMemo(() => {
    if (!selectedChassisModal) return null;
    const targetNorm = normalizeChassisStr(selectedChassisModal);
    return customers.find((c) => {
      const variants = getCustChassisVariants(c);
      return variants.includes(targetNorm) || variants.some(v => v === targetNorm || (v.length >= 6 && targetNorm.length >= 6 && v.slice(-6) === targetNorm.slice(-6)));
    }) || null;
  }, [selectedChassisModal, customers]);

  const selectedChassisCards = useMemo(() => {
    if (!selectedChassisModal) return [];
    if (selectedChassisCustomer) {
      return getCustomerJobCards(selectedChassisCustomer);
    }
    const targetNorm = normalizeChassisStr(selectedChassisModal);
    return allCards.filter((card) => {
      const cardVariants = getCardChassisVariants(card);
      return cardVariants.some(v => v === targetNorm || (v.length >= 6 && targetNorm.length >= 6 && v.slice(-6) === targetNorm.slice(-6)));
    });
  }, [selectedChassisModal, selectedChassisCustomer, allCards]);

  return (
    <div className="w-full space-y-3 bg-white shadow-sm p-3 md:p-4 rounded-3xl print:p-0 print:border-none print:shadow-none">
      {/* Toast message popup */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900/95 backdrop-blur text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP COMPACT METRICS BAR (5 Value Boxes: ~1cm x 2cm proportions) */}
      <div className="w-full flex items-center gap-1.5 sm:gap-2 flex-wrap bg-slate-50 p-1.5 sm:p-2 rounded-2xl">
        {/* Box 1: Total Deliveries */}
        <button
          type="button"
          onClick={() => {
            setQuickFilter("all");
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[130px] max-w-[220px] h-10 px-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-left ${
            quickFilter === "all"
              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30"
              : "bg-blue-50/90 hover:bg-blue-100/80 border-blue-200 text-blue-950"
          }`}
          title="Click to show All Customer Deliveries"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Users className={`w-3.5 h-3.5 shrink-0 ${quickFilter === "all" ? "text-blue-100" : "text-blue-600"}`} />
            <span className={`text-[10px] font-black uppercase tracking-wider truncate ${quickFilter === "all" ? "text-blue-100" : "text-blue-700"}`}>
              {isTe ? "మొత్తం డెలివరీలు" : "Total Deliveries"}
            </span>
          </div>
          <span className="text-xs font-black shrink-0 font-mono">
            {metrics.totalDeliveries.toLocaleString()}
          </span>
        </button>

        {/* Box 2: Reporting Customers */}
        <button
          type="button"
          onClick={() => {
            setQuickFilter("reporting");
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[130px] max-w-[220px] h-10 px-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-left ${
            quickFilter === "reporting"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/30"
              : "bg-emerald-50/90 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950"
          }`}
          title="Click to filter Reporting Customers (≥1 Job Card)"
        >
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${quickFilter === "reporting" ? "text-emerald-100" : "text-emerald-600"}`} />
            <span className={`text-[10px] font-black uppercase tracking-wider truncate ${quickFilter === "reporting" ? "text-emerald-100" : "text-emerald-700"}`}>
              {isTe ? "రిపోర్టింగ్ కస్టమర్లు" : "Reporting"}
            </span>
          </div>
          <span className="text-xs font-black shrink-0 font-mono">
            {metrics.reportingCount.toLocaleString()}
          </span>
        </button>

        {/* Box 3: Not Reporting Customers */}
        <button
          type="button"
          onClick={() => {
            setQuickFilter("not_reporting");
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[130px] max-w-[220px] h-10 px-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-left ${
            quickFilter === "not_reporting"
              ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/30"
              : "bg-rose-50/90 hover:bg-rose-100/80 border-rose-200 text-rose-950"
          }`}
          title="Click to filter Not Reporting Customers (0 Job Cards)"
        >
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${quickFilter === "not_reporting" ? "text-rose-100" : "text-rose-600"}`} />
            <span className={`text-[10px] font-black uppercase tracking-wider truncate ${quickFilter === "not_reporting" ? "text-rose-100" : "text-rose-700"}`}>
              {isTe ? "నాట్ రిపోర్టింగ్" : "Not Reporting"}
            </span>
          </div>
          <span className="text-xs font-black shrink-0 font-mono">
            {metrics.notReportingCount.toLocaleString()}
          </span>
        </button>

        {/* Box 4: Duplicate Entries */}
        <button
          type="button"
          onClick={() => {
            setQuickFilter("duplicate");
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[130px] max-w-[220px] h-10 px-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-left ${
            quickFilter === "duplicate"
              ? "bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/30"
              : "bg-amber-50/90 hover:bg-amber-100/80 border-amber-200 text-amber-950"
          }`}
          title="Click to filter Duplicate Chassis / Customers"
        >
          <div className="flex items-center gap-1.5 truncate">
            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${quickFilter === "duplicate" ? "text-amber-100" : "text-amber-600"}`} />
            <span className={`text-[10px] font-black uppercase tracking-wider truncate ${quickFilter === "duplicate" ? "text-amber-100" : "text-amber-700"}`}>
              {isTe ? "డూప్లికేట్ ఎంట్రీలు" : "Duplicates"}
            </span>
          </div>
          <span className="text-xs font-black shrink-0 font-mono">
            {metrics.duplicateCount.toLocaleString()}
          </span>
        </button>

        {/* Box 5: Reporting Rate */}
        <div
          className="flex-1 min-w-[120px] max-w-[200px] h-9 px-2.5 rounded-lg border border-purple-200 bg-purple-50/90 text-purple-950 flex items-center justify-between"
          title="Percentage of delivered tractors serviced at dealership"
        >
          <div className="flex items-center gap-1.5 truncate">
            <TrendingUp className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 truncate">
              {isTe ? "రిపోర్టింగ్ రేటు" : "Rate"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-black font-mono text-purple-950">
              {metrics.reportingRate}%
            </span>
          </div>
        </div>

        {/* Box 6: Out of Warranty (>2 Years) - Highlighted in Red */}
        <button
          type="button"
          onClick={() => {
            setQuickFilter("out_of_wty");
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[145px] max-w-[230px] h-10 px-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-left ${
            quickFilter === "out_of_wty"
              ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/30"
              : "bg-red-50/95 hover:bg-red-100 border-red-300 text-red-950"
          }`}
          title={isTe ? "వారంటీ ముగిసిన కస్టమర్లు (> 2 సంవత్సరాలు) - క్లిక్ చేయండి" : "Click to filter Out of Warranty (> 2 Years)"}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 ring-2 ring-red-200" />
            <span className={`text-[10px] font-black uppercase tracking-wider truncate ${quickFilter === "out_of_wty" ? "text-white font-extrabold" : "text-red-700"}`}>
              {isTe ? "వారంటీ ముగిసింది (>2 సం)" : "Out of Wty (>2Y)"}
            </span>
          </div>
          <span className={`text-xs font-black shrink-0 font-mono ${quickFilter === "out_of_wty" ? "text-white" : "text-red-700"}`}>
            {metrics.outOfWtyCount.toLocaleString()}
          </span>
        </button>

        {/* Box 7: In Warranty (<=2 Years) - Standard Black */}
        <button
          type="button"
          onClick={() => {
            setQuickFilter("in_wty");
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[130px] max-w-[200px] h-10 px-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between text-left ${
            quickFilter === "in_wty"
              ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-600/30"
              : "bg-slate-100/90 hover:bg-slate-200/80 border-slate-300 text-slate-900"
          }`}
          title={isTe ? "వారంటీ లో ఉన్న కస్టమర్లు (≤ 2 సంవత్సరాలు) - క్లిక్ చేయండి" : "Click to filter In Warranty (≤ 2 Years)"}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0 ring-2 ring-slate-300" />
            <span className={`text-[10px] font-black uppercase tracking-wider truncate ${quickFilter === "in_wty" ? "text-white font-extrabold" : "text-slate-800"}`}>
              {isTe ? "ఇన్ వారంటీ (≤2 సం)" : "In Wty (≤2Y)"}
            </span>
          </div>
          <span className="text-xs font-black shrink-0 font-mono">
            {metrics.inWtyCount.toLocaleString()}
          </span>
        </button>
      </div>

      {/* 2. CONTROLS TOOLBAR: Search, Active Quick Filter Chip, Pagination, View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          {/* Global Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              disabled={isFiltersLocked}
              value={searchQuery}
              onChange={(e) => {
                if (isFiltersLocked) return;
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                isFiltersLocked
                  ? (isTe ? "🔒 ఫిల్టర్లు లాక్ చేయబడ్డాయి (మార్చడానికి 🔒 నొక్కండి)..." : "🔒 Filters are locked (Click 🔒 to change)...")
                  : (isTe
                    ? "కస్టమర్ పేరు, ఛాసిస్ నెం, మొబైల్, గ్రామం, మోడల్ ద్వారా వెతకండి..."
                    : "Search customer, chassis, mobile, village, model...")
              }
              className={`w-full pl-8 pr-7 py-2 text-xs font-semibold rounded-full outline-none transition-all placeholder:text-slate-400 ${
                isFiltersLocked
                  ? "bg-slate-100 text-slate-500 border border-slate-300 cursor-not-allowed"
                  : "bg-slate-100 hover:bg-slate-100 focus:bg-white text-slate-900 focus:ring-2 focus:ring-purple-500/40"
              }`}
            />
            {searchQuery && !isFiltersLocked && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Branch Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <select
              value={selectedBranchFilter}
              disabled={isFiltersLocked}
              onChange={(e) => {
                if (isFiltersLocked) return;
                setSelectedBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="all">{isTe ? "🏢 అన్ని బ్రాంచెలు (All Branches)" : "🏢 All Branches"}</option>
              {BRANCH_DEFINITIONS.map((b) => (
                <option key={b.branchId} value={b.branchName}>
                  {b.branchName} ({b.teluguName}) [{b.supervisorCodes.slice(0, 2).map((c) => c.toUpperCase()).join("/")}]
                </option>
              ))}
            </select>
          </div>

          {/* Supervisor Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedSupervisorFilter}
              disabled={isFiltersLocked}
              onChange={(e) => {
                if (isFiltersLocked) return;
                setSelectedSupervisorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer max-w-[150px]"
            >
              <option value="all">{isTe ? "👤 సూపర్వైజర్: అన్నీ" : "👤 All Supervisors"}</option>
              {uniqueSupervisors.map((sup) => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>
          </div>

          {/* Lock / Unlock Filters Button 🔒 / 🔓 */}
          <button
            type="button"
            onClick={toggleFiltersLock}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
              isFiltersLocked
                ? "bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400 ring-2 ring-amber-400/60"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
            }`}
            title={
              isFiltersLocked
                ? (isTe ? "ఫిల్టర్లు లాక్ చేయబడ్డాయి. అన్‌లాక్ చేయడానికి 🔒 నొక్కండి" : "Filters are locked. Click 🔒 to unlock")
                : (isTe ? "ఫిల్టర్లను లాక్ చేయడానికి 🔓 నొక్కండి" : "Click to lock filters 🔒")
            }
          >
            <span className="text-sm">{isFiltersLocked ? "🔒" : "🔓"}</span>
            <span className="whitespace-nowrap">
              {isFiltersLocked
                ? (isTe ? "లాక్ (Locked)" : "Locked")
                : (isTe ? "అన్‌లాక్ (Unlocked)" : "Unlocked")}
            </span>
          </button>

          {/* Active Quick Filter Indicator */}
          {quickFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-950 text-[11px] font-black rounded-lg border border-purple-300">
              <span>
                Filter:{" "}
                {quickFilter === "reporting"
                  ? "Reporting"
                  : quickFilter === "not_reporting"
                  ? "Not Reporting"
                  : quickFilter === "duplicate"
                  ? "Duplicates"
                  : quickFilter === "out_of_wty"
                  ? (isTe ? "వారంటీ ముగిసింది (>2 సం)" : "Out of Warranty (>2 Yrs)")
                  : (isTe ? "ఇన్ వారంటీ (≤2 సం)" : "In Warranty (≤2 Yrs)")}
              </span>
              {!isFiltersLocked && (
                <button
                  type="button"
                  onClick={() => setQuickFilter("all")}
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {/* Reset Filters button */}
          {(Object.keys(columnFilters).length > 0 ||
            searchQuery ||
            quickFilter !== "all" ||
            selectedBranchFilter !== "all" ||
            selectedSupervisorFilter !== "all") && (
            <button
              type="button"
              disabled={isFiltersLocked}
              onClick={() => {
                if (isFiltersLocked) return;
                setColumnFilters({});
                setSearchQuery("");
                setQuickFilter("all");
                setSelectedBranchFilter("all");
                setSelectedSupervisorFilter("all");
                setSortCol("Date of del");
                setSortDir("desc");
                setCurrentPage(1);
              }}
              className={`px-2 py-1 text-xs font-bold rounded-lg border flex items-center gap-1 transition-colors ${
                isFiltersLocked
                  ? "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                  : "text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 cursor-pointer"
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isTe ? "ఫిల్టర్లు క్లియర్ చేయండి" : "Reset All"}</span>
            </button>
          )}
        </div>

        {/* View Density, Page Size, and Export Options */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Add New Customer button */}
          {onAddNewCustomer && (
            <button
              type="button"
              onClick={onAddNewCustomer}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
              title={isTe ? "కొత్త కస్టమర్‌ను నమోదు చేయండి" : "Add New Customer"}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isTe ? "+ కొత్త కస్టమర్" : "+ Add Customer"}</span>
            </button>
          )}

          {/* Row Density switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-bold">
            <button
              type="button"
              onClick={() => setRowDensity("compact")}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                rowDensity === "compact"
                  ? "bg-white text-purple-950 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Compact rows"
            >
              {isTe ? "కుదించిన" : "Compact"}
            </button>
            <button
              type="button"
              onClick={() => setRowDensity("normal")}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                rowDensity === "normal"
                  ? "bg-white text-purple-950 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Normal rows"
            >
              {isTe ? "సాధారణ" : "Normal"}
            </button>
          </div>

          {/* Page size dropdown */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>{isTe ? "పేజీకి:" : "Show:"}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={999999}>{isTe ? "అన్నీ (All)" : "All"}</option>
            </select>
          </div>

          {/* Export Excel button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isTe ? "ఎక్సెల్ డౌన్‌లోడ్" : "Export Excel"}</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN SPREADSHEET TABLE (Excel Style with Sticky Headers and Action Column) */}
      <div className="w-full overflow-x-auto border border-slate-200 rounded-xl max-h-[72vh] shadow-inner bg-slate-50/40">
        <table className="w-full border-collapse text-left text-slate-900 min-w-[2800px] text-xs">
          {/* Header Row */}
          <thead className="bg-gradient-to-r from-slate-800 to-slate-900 text-white sticky top-0 z-20 select-none shadow-sm text-xs font-bold">
            <tr>
              <th className="py-2 px-2 text-center w-12 min-w-[48px] border-r border-purple-800 bg-purple-950 font-mono text-[11px]">
                #
              </th>
              {detailedCols.map((col) => {
                const isFiltered = !!columnFilters[col.key];
                const isSorted = sortCol === col.key;
                return (
                  <th
                    key={col.key}
                    className={`py-2 px-2.5 font-bold border-r border-purple-800 relative group transition-colors ${col.width}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      {/* Sortable Header Label */}
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 hover:text-purple-200 truncate cursor-pointer font-bold uppercase tracking-wider text-[11px]"
                      >
                        <span className="truncate">{col.label}</span>
                        {isSorted && (
                          <span className="text-yellow-400">
                            {sortDir === "asc" ? (
                              <ArrowUp className="w-3 h-3 inline" />
                            ) : (
                              <ArrowDown className="w-3 h-3 inline" />
                            )}
                          </span>
                        )}
                      </button>

                      {/* Column Filter Icon / Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isFiltersLocked) {
                              showToast(isTe ? "🔒 ఫిల్టర్లు లాక్ చేయబడ్డాయి. మార్చడానికి పైన 🔒 బటన్ నొక్కండి." : "🔒 Filters are locked. Click 🔒 above to unlock.");
                              return;
                            }
                            setActiveFilterCol(
                              activeFilterCol === col.key ? null : col.key
                            );
                            setFilterSearchText("");
                          }}
                          className={`p-1 rounded hover:bg-purple-800 transition-colors ${
                            isFiltersLocked ? "cursor-not-allowed opacity-75" : "cursor-pointer"
                          } ${
                            isFiltered ? "bg-amber-400 text-purple-950" : "text-purple-200"
                          }`}
                          title={isFiltersLocked ? "🔒 Filters Locked" : `Filter by ${col.label}`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>

                        {/* Dropdown for Column Filter */}
                        {activeFilterCol === col.key && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 w-60 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 z-50 p-2.5 text-xs font-normal"
                          >
                            <div className="flex items-center justify-between border-b border-slate-150 pb-1.5 mb-1.5 font-bold text-slate-800">
                              <span>Filter {col.label}</span>
                              <button
                                type="button"
                                onClick={() => setActiveFilterCol(null)}
                                className="text-slate-400 hover:text-slate-700"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={filterSearchText}
                              onChange={(e) => setFilterSearchText(e.target.value)}
                              placeholder="Search values..."
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded mb-2 outline-none focus:border-purple-600"
                            />
                            <div className="max-h-60 overflow-y-auto space-y-0.5 mb-2">
                              {isDateColumn(col.key) ? (
                                Object.entries(groupDatesByYearMonth(col.key)).map(([year, months]) => {
                                  const isExpanded = expandedYears.has(year);
                                  const filteredMonths = months.filter(m => m.toLowerCase().includes(filterSearchText.toLowerCase()));
                                  return (
                                    <div key={year}>
                                      <div
                                        className="flex items-center gap-1.5 px-1.5 py-0.5 hover:bg-purple-50 rounded cursor-pointer text-xs font-semibold"
                                        onClick={() => {
                                          setExpandedYears((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(year)) next.delete(year);
                                            else next.add(year);
                                            return next;
                                          });
                                        }}
                                      >
                                        <span className="text-purple-600 font-bold text-sm">{isExpanded ? "−" : "+"}</span>
                                        <span>{year}</span>
                                      </div>
                                      {isExpanded && filteredMonths.length > 0 && (
                                        <div className="ml-4 space-y-0.5">
                                          {filteredMonths.map((monthYear) => {
                                            const dates = getUniqueColumnValues(col.key).filter(d => d.endsWith(`-${monthYear}`));
                                            return (
                                              <label key={monthYear} className="flex items-center gap-1.5 px-1.5 py-0.5 hover:bg-purple-50 rounded cursor-pointer text-xs">
                                                <input
                                                  type="checkbox"
                                                  checked={dates.length > 0 && dates.every(d => (columnFilters[col.key] || []).includes(d))}
                                                  onChange={() => {
                                                    setColumnFilters((prev) => {
                                                      const curr = prev[col.key] || [];
                                                      const monthDates = getUniqueColumnValues(col.key).filter(d => d.endsWith(`-${monthYear}`));
                                                      const allSelected = monthDates.length > 0 && monthDates.every(d => curr.includes(d));
                                                      const updated = allSelected
                                                        ? curr.filter(x => !monthDates.includes(x))
                                                        : [...new Set([...curr, ...monthDates])];
                                                      if (updated.length === 0) {
                                                        const next = { ...prev };
                                                        delete next[col.key];
                                                        return next;
                                                      }
                                                      return { ...prev, [col.key]: updated };
                                                    });
                                                    setCurrentPage(1);
                                                  }}
                                                  className="rounded text-purple-600"
                                                />
                                                <span className="truncate">{monthYear.split("-").reverse().join("/")}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                getUniqueColumnValues(col.key)
                                  .filter((v) =>
                                    v.toLowerCase().includes(filterSearchText.toLowerCase())
                                  )
                                  .map((val) => {
                                    const isChecked = (columnFilters[col.key] || []).includes(val);
                                    return (
                                      <label
                                        key={val}
                                        className="flex items-center gap-1.5 px-1.5 py-0.5 hover:bg-purple-50 rounded cursor-pointer text-xs"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() =>
                                            handleToggleColumnFilterValue(col.key, val)
                                          }
                                          className="rounded text-purple-600"
                                        />
                                        <span className="truncate">{val}</span>
                                      </label>
                                    );
                                  })
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-150 text-[11px] font-bold">
                              <button
                                type="button"
                                onClick={() => handleClearColFilter(col.key)}
                                className="text-rose-600 hover:underline"
                              >
                                Clear
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveFilterCol(null)}
                                className="px-2 py-0.5 bg-purple-900 text-white rounded hover:bg-purple-950"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
              {/* Sticky Action Header Column */}
              <th className="py-2 px-1 text-center w-20 min-w-[80px] sticky right-0 bg-purple-950 text-white z-30 font-bold border-l border-purple-800 shadow-md text-xs">
                {isTe ? "చర్యలు" : "Actions"}
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 bg-white font-medium">
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan={detailedCols.length + 2}
                  className="py-12 text-center text-slate-500 font-bold"
                >
                  <p className="text-sm">
                    {isTe
                      ? "ఎలాంటి కస్టమర్ రికార్డులు కనుగొనబడలేదు."
                      : "No customer records match your filter / search query."}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((cust, idx) => {
                const rowUniqueIndex = cust.__origIndex || (currentPage - 1) * pageSize + idx + 1;
                const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                const key = getRowKey(cust, rowUniqueIndex);
                const isSaving = savingRows[key];
                const isSaved = savedSuccessRows[key];
                const custJobCards = getCustomerJobCards(cust);
                const chassisNo = getColDisplayValue(cust, "Chassis no");
                const isDuplicate = chassisNo && duplicateSet.has(chassisNo.toUpperCase().trim());

                // Calculate Delivery Warranty Status (2 Years from delivery date)
                const custDelTs = getCustomerDeliveryTimestamp(cust);
                const isOutOfWty = custDelTs > 0 && isDeliveryOutOfWarranty(custDelTs, 2);

                return (
                  <tr
                    key={key}
                    className={`transition-colors group ${
                      isDuplicate
                        ? "bg-amber-50/40 hover:bg-amber-50/70"
                        : isOutOfWty
                        ? "bg-red-50/25 hover:bg-red-50/50"
                        : "hover:bg-purple-50/50"
                    }`}
                  >
                    {/* Row Index */}
                    <td
                      className={`${cellPadding} text-center font-mono font-bold border-r border-slate-200 ${
                        isOutOfWty
                          ? "text-red-700 bg-red-50/60"
                          : "text-slate-400 bg-slate-50/60"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span>{globalIdx}</span>
                        {isOutOfWty && (
                          <span
                            className="text-[8px] font-black uppercase text-red-600 tracking-tighter leading-none mt-0.5"
                            title={isTe ? "వారంటీ ముగిసింది (>2 సంవత్సరాలు)" : "Out of Warranty (>2 Years)"}
                          >
                            OOW
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Data Columns */}
                    {detailedCols.map((col) => {
                      // Interactive / Display Cell: Chassis no
                      if (col.key === "Chassis no") {
                        const chassisVal = getCustValue(cust, col.key, rowUniqueIndex);
                        return (
                          <td
                            key={col.key}
                            className={`${cellPadding} border-r border-slate-200`}
                          >
                            <div className="flex items-center gap-1.5 flex-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChassisModal(chassisVal);
                                }}
                                className={`font-mono font-bold text-xs px-2 py-0.5 rounded border shadow-2xs whitespace-nowrap cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-purple-400 ${
                                  isOutOfWty
                                    ? "text-red-700 bg-red-100/90 border-red-300 font-extrabold hover:bg-red-200"
                                    : "text-slate-900 bg-slate-100 border-slate-200 hover:bg-purple-100"
                                }`}
                                title={isTe ? "జాబ్ కార్డులు & కస్టమర్ వివరాలు చూడటానికి క్లిక్ చేయండి" : "Click to view Job Cards & Customer details"}
                              >
                                {chassisVal || "—"}
                              </button>
                              {isOutOfWty && (
                                <span
                                  className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 shadow-2xs"
                                  title={isTe ? "వారంటీ ముగిసింది (డెలివరీ అయి 2 సంవత్సరాలు దాటింది)" : "Out of 2-Year Warranty"}
                                >
                                  {isTe ? "వారంటీ ముగిసింది" : "OUT OF WTY"}
                                </span>
                              )}
                              {custJobCards.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedChassisModal(chassisVal);
                                  }}
                                  className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-300 shadow-2xs whitespace-nowrap cursor-pointer transition-transform hover:scale-105"
                                  title={isTe ? `${custJobCards.length} జాబ్ కార్డులు ఉన్నాయి. వివరాలు చూడటానికి క్లిక్ చేయండి` : `${custJobCards.length} Job Cards recorded. Click to view details`}
                                >
                                  {custJobCards.length} JC
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Dedicated Delivery Date Column: with warranty indicator
                      if (
                        col.key === "Date of del" ||
                        col.key === "Date of Delivery" ||
                        col.key.toLowerCase() === "dod"
                      ) {
                        const delVal = getCustValue(cust, col.key, rowUniqueIndex);
                        return (
                          <td
                            key={col.key}
                            className={`${cellPadding} border-r border-slate-200`}
                          >
                            <div className="flex items-center gap-1.5 min-w-[140px]">
                              <input
                                type="text"
                                value={delVal}
                                onChange={(e) =>
                                  handleFieldChange(cust, rowUniqueIndex, col.key, e.target.value)
                                }
                                className={`w-full text-xs rounded px-1.5 py-1 outline-none transition-all font-mono ${
                                  isOutOfWty
                                    ? "text-red-600 font-black bg-red-50/40 hover:bg-white focus:bg-white border border-transparent hover:border-red-300 focus:border-red-600"
                                    : "text-slate-900 font-bold bg-slate-50/50 hover:bg-white focus:bg-white border border-transparent hover:border-purple-300 focus:border-purple-600"
                                }`}
                                placeholder="DD-MMM-YYYY"
                              />
                              {custDelTs > 0 && (
                                isOutOfWty ? (
                                  <span
                                    className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-300 uppercase tracking-wider shrink-0 whitespace-nowrap"
                                    title={isTe ? "డెలివరీ నుండి 2 ఏళ్లు దాటింది (వారంటీ ముగిసింది)" : "> 2 Years from Delivery (Out of Warranty)"}
                                  >
                                    &gt;2Y
                                  </span>
                                ) : (
                                  <span
                                    className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-300 uppercase tracking-wider shrink-0 whitespace-nowrap"
                                    title={isTe ? "డెలివరీ నుండి 2 ఏళ్ల లోపు (వారంటీ ఉంది)" : "≤ 2 Years from Delivery (In Warranty)"}
                                  >
                                    ≤2Y
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Standard Inline Editable Cell for all other columns (Red if OOW, Black if In Warranty)
                      return (
                        <td
                          key={col.key}
                          className={`${cellPadding} border-r border-slate-200`}
                        >
                          <input
                            type="text"
                            value={getCustValue(cust, col.key, rowUniqueIndex)}
                            onChange={(e) =>
                              handleFieldChange(cust, rowUniqueIndex, col.key, e.target.value)
                            }
                            className={`w-full text-xs rounded px-1.5 py-1 outline-none transition-all ${
                              isOutOfWty
                                ? "text-red-600 font-bold bg-red-50/20 hover:bg-white focus:bg-white border border-transparent hover:border-red-300 focus:border-red-600"
                                : "text-slate-900 font-medium bg-slate-50/50 hover:bg-white focus:bg-white border border-transparent hover:border-purple-300 focus:border-purple-600"
                            }`}
                          />
                        </td>
                      );
                    })}

                    {/* 4. ACTIONS COLUMN WITH TRIANGLE TOGGLE BUTTON */}
                    <td
                      className={`${cellPadding} text-center sticky right-0 z-20 ${
                        isOutOfWty
                          ? "bg-red-50/40 group-hover:bg-red-100/60"
                          : "bg-white group-hover:bg-purple-50/90"
                      } shadow-md border-l border-slate-200`}
                    >
                      <RowActionButtons
                        isExpanded={!!expandedRowKeys[rowUniqueIndex]}
                        onToggleExpand={() => toggleRowActions(rowUniqueIndex)}
                        language={language}
                        onRegisterComplaint={() => {
                          if (onRegisterComplaint) {
                            onRegisterComplaint(cust);
                          } else {
                            alert(`Register complaint for ${getColDisplayValue(cust, "Customer Name")} (${chassisNo})`);
                          }
                        }}
                        onCopy={() => handleCopyCustomer(cust)}
                        onEdit={() => handleOpenEditCustomer(cust)}
                        onNewJobCard={onNewJobCard ? () => onNewJobCard(cust) : undefined}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        canCreate={canCreate}
                        onSave={() => handleSaveRow(cust, rowUniqueIndex)}
                        isSaving={isSaving}
                        isSaved={isSaved}
                        onDelete={() => {
                          if (chassisNo && window.confirm(isTe ? `కస్టమర్ ${chassisNo} ని తొలగించాలనుకుంటున్నారా?` : `Are you sure you want to delete customer ${chassisNo}?`)) {
                            if (onDelete) onDelete(chassisNo);
                          }
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

      {/* 4. PAGINATION FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-700 font-bold">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-800 font-semibold">
            {pageSize >= 999999 || processedCustomers.length <= pageSize
              ? `Showing All ${processedCustomers.length} customers`
              : `Showing ${(currentPage - 1) * pageSize + 1} - ${Math.min(
                  currentPage * pageSize,
                  processedCustomers.length
                )} of ${processedCustomers.length} customers`}
          </span>
        </div>

        {/* Page navigation controls */}
        {pageSize < 999999 && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold cursor-pointer"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold cursor-pointer"
            >
              Prev
            </button>
            <span className="px-3 py-1 bg-purple-900 text-white rounded font-black font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold cursor-pointer"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded text-slate-700 font-bold cursor-pointer"
            >
              »
            </button>
          </div>
        )}
      </div>

      {/* MODAL 1: EDIT CUSTOMER DETAILS MODAL (TRIGGERED ON CLICKING EDIT BUTTON) */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-purple-950 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-900 text-purple-200 rounded-xl">
                  <PenLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black flex items-center gap-2">
                    <span>{isTe ? "కస్టమర్ వివరాల సవరణ" : "Edit Customer Details"}</span>
                    <span className="font-mono bg-yellow-400 text-slate-950 px-2 py-0.5 rounded text-[11px] font-black">
                      {editForm.chassisNo || getColDisplayValue(editingCustomer, "Chassis no")}
                    </span>
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    {isTe
                      ? "వివరాలను సవరించి డేటాబేస్ లో సేవ్ చేయండి"
                      : "Update customer records and save changes"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-purple-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEditCustomerSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* 1. Customer Personal Information */}
              <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 space-y-3">
                <p className="font-black text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-700" />
                  <span>{isTe ? "కస్టమర్ ప్రాథమిక వివరాలు" : "Customer Basic Info"}</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "కస్టమర్ పేరు (Customer Name) *" : "Customer Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.customerName || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, customerName: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "తండ్రి పేరు (Father Name)" : "Father Name"}
                    </label>
                    <input
                      type="text"
                      value={editForm.fatherName || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, fatherName: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "మొబైల్ నంబర్ (Mobile Number) *" : "Mobile Number *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.mobileNumber || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Address & Location */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <p className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-700" />
                  <span>{isTe ? "చిరునామా & లొకేషన్ వివరాలు" : "Address & Location"}</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "గ్రామం (Village)" : "Village"}
                    </label>
                    <input
                      type="text"
                      value={editForm.village || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, village: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "మండలం (Mandal)" : "Mandal"}
                    </label>
                    <input
                      type="text"
                      value={editForm.mandal || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, mandal: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "జిల్లా (District)" : "District"}
                    </label>
                    <input
                      type="text"
                      value={editForm.district || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, district: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "పిన్ కోడ్ (Pin Code)" : "Pin Code"}
                    </label>
                    <input
                      type="text"
                      value={editForm.pinCode || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, pinCode: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isTe ? "పూర్తి చిరునామా (Full Address)" : "Full Address"}
                  </label>
                  <input
                    type="text"
                    value={editForm.address || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* 3. Tractor Details */}
              <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 space-y-3">
                <p className="font-black text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-purple-700" />
                  <span>{isTe ? "ట్రాక్టర్ వివరాలు" : "Tractor Specifications"}</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "ఛాసిస్ నంబర్ (Chassis No) *" : "Chassis No *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.chassisNo || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, chassisNo: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-black text-purple-950 outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "ఇంజన్ నంబర్ (Engine No)" : "Engine No"}
                    </label>
                    <input
                      type="text"
                      value={editForm.engineNo || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, engineNo: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "డెలివరీ తేదీ (Date of Delivery)" : "Date of Delivery"}
                    </label>
                    <input
                      type="text"
                      value={editForm.dateOfDelivery || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, dateOfDelivery: e.target.value }))}
                      placeholder="DD/MM/YYYY"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "మోడల్ (Model)" : "Model"}
                    </label>
                    <input
                      type="text"
                      value={editForm.model || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, model: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "మోడల్ టైప్ (Model Type)" : "Model Type"}
                    </label>
                    <input
                      type="text"
                      value={editForm.modelType || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, modelType: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "DSP పేరు (DSP Name)" : "DSP Name"}
                    </label>
                    <input
                      type="text"
                      value={editForm.dspName || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, dspName: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Dealership & Exchange Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <p className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-700" />
                  <span>{isTe ? "డీలర్‌షిప్ & ఎక్స్ఛేంజ్ వివరాలు" : "Branch & Exchange Details"}</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "బ్రాంచ్ (Branch)" : "Branch"}
                    </label>
                    <input
                      type="text"
                      value={editForm.branch || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, branch: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "సూపర్‌వైజర్ (Supervisor)" : "Supervisor"}
                    </label>
                    <input
                      type="text"
                      value={editForm.supervisor || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, supervisor: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "ఎక్స్ఛేంజ్ బ్రాండ్" : "Exchange Brand"}
                    </label>
                    <input
                      type="text"
                      value={editForm.exchangeBrand || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, exchangeBrand: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "ఎక్స్ఛేంజ్ మోడల్" : "Exchange Model"}
                    </label>
                    <input
                      type="text"
                      value={editForm.exchangeModel || ""}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, exchangeModel: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  {isTe ? "రద్దు చేయి (Cancel)" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={editModalSaving}
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl font-black flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{editModalSaving ? (isTe ? "సేవ్ అవుతోంది..." : "Saving...") : (isTe ? "వివరాలు సేవ్ చేయండి" : "Save Changes")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UNIFIED CUSTOMER PROFILE, SERVICE HISTORY & TELECALLING LOGGER BOX (TRIGGERED ON CALL BUTTON) */}
      {selectedCallCustomer && (() => {
        const callChassis = getColDisplayValue(selectedCallCustomer, "Chassis no");
        const callCards = getCustomerJobCards(selectedCallCustomer);
        const callPhone = getColDisplayValue(selectedCallCustomer, "Mobile Number");
        const callCustName = getColDisplayValue(selectedCallCustomer, "Customer Name");
        const callModel = getColDisplayValue(selectedCallCustomer, "Model");

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
              {/* Top Banner */}
              <div className="bg-purple-950 text-white p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black flex items-center gap-2">
                      <span>{callCustName}</span>
                      <span className="font-mono bg-yellow-400 text-slate-950 px-2 py-0.5 rounded text-xs font-black">
                        {callChassis}
                      </span>
                    </h3>
                    <p className="text-xs text-purple-200 flex items-center gap-3 mt-0.5">
                      <span>🚜 {callModel}</span>
                      <span>•</span>
                      <span>🏢 {getColDisplayValue(selectedCallCustomer, "BRANCH") || "Main Branch"}</span>
                      {callPhone && (
                        <>
                          <span>•</span>
                          <a
                            href={`tel:${callPhone}`}
                            className="text-emerald-400 hover:text-emerald-300 font-mono font-bold flex items-center gap-1 underline"
                          >
                            <Phone className="w-3 h-3" />
                            {callPhone}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCallCustomer(null)}
                  className="text-purple-300 hover:text-white p-1.5 rounded-lg hover:bg-purple-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* 1. CUSTOMER & TRACTOR PROFILE BANNER */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: Supervisor & Branch */}
                  <div className="space-y-2.5 border-b md:border-b-0 md:border-r-2 border-purple-200/80 pb-3 md:pb-0 md:pr-4">
                    <p className="font-black text-purple-950 uppercase tracking-widest text-[11px] bg-purple-100 px-2 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
                      <Building2 className="w-4 h-4 text-purple-700" />
                      <span>{isTe ? "🏢 బ్రాంచ్" : "🏢 Branch"}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-black text-purple-950 text-base">{getColDisplayValue(selectedCallCustomer, "BRANCH") || "Main Branch"}</span>
                    </p>

                    <p className="font-black text-slate-900 uppercase tracking-widest text-[11px] bg-amber-100 px-2 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
                      <User className="w-4 h-4 text-amber-700" />
                      <span>{isTe ? "👤 సూపర్" : "👤 Supervisor"}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-black text-slate-900">{getColDisplayValue(selectedCallCustomer, "SUPERVISOR") || "Unassigned"}</span>
                    </p>

                    <p className="font-black text-slate-900 uppercase tracking-widest text-[11px] bg-blue-100 px-2 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
                      <span>{isTe ? "👷 DSP" : "👷 DSP"}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-bold">{getColDisplayValue(selectedCallCustomer, "DSP Name") || "—"}</span>
                    </p>
                  </div>

                  {/* Center: Customer Name & Address */}
                  <div className="space-y-2.5 border-b md:border-b-0 md:border-r-2 border-purple-200/80 pb-3 md:pb-0 md:pr-4">
                    <p className="font-black text-slate-900 uppercase tracking-widest text-[11px] bg-slate-200 px-2 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
                      <User className="w-4 h-4 text-slate-700" />
                      <span>{isTe ? "👤 నామం" : "👤 Name"}</span>
                    </p>
                    <p className="text-lg font-black text-slate-900 leading-tight">
                      {callCustName}
                    </p>

                    <p className="font-black text-slate-900 uppercase tracking-widest text-[11px] bg-slate-200 px-2 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
                      <span>{isTe ? "👨 S/o" : "👨 Father"}</span>
                    </p>
                    <p className="text-sm font-bold">
                      {getColDisplayValue(selectedCallCustomer, "FATHER NAME") || getColDisplayValue(selectedCallCustomer, "Father Name") || "—"}
                    </p>

                    <p className="font-black text-slate-900 uppercase tracking-widest text-[11px] bg-teal-100 px-2 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
                      <MapPin className="w-4 h-4 text-teal-700" />
                      <span>{isTe ? "📍 చిరునామా" : "📍 Location"}</span>
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {getColDisplayValue(selectedCallCustomer, "VILLAGE") || getColDisplayValue(selectedCallCustomer, "Village")}, {getColDisplayValue(selectedCallCustomer, "Mandal")}
                    </p>
                    <p className="text-xs text-slate-600 font-bold">
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">Dist: {getColDisplayValue(selectedCallCustomer, "DISTRICT") || getColDisplayValue(selectedCallCustomer, "Distict") || "—"}</span>
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded ml-1">PIN: {getColDisplayValue(selectedCallCustomer, "Pin code") || "—"}</span>
                    </p>
                  </div>

                  {/* Right: Tractor Details */}
                  <div className="space-y-2.5">
                    <p className="font-black text-slate-900 uppercase tracking-widest text-[11px] bg-orange-100 px-2 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
                      <Wrench className="w-4 h-4 text-orange-700" />
                      <span>{isTe ? "🚜 మోడల్" : "🚜 Model"}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-black text-slate-900 text-base">{callModel}</span>
                      <span className="text-xs text-slate-600 ml-1">({getColDisplayValue(selectedCallCustomer, "MODEL TYPE")})</span>
                    </p>

                    <p className="font-black text-slate-900 uppercase tracking-widest text-[11px] bg-pink-100 px-2 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
                      <span>{isTe ? "⚙️ ఇంజిన్" : "⚙️ Engine"}</span>
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-800">
                      {getColDisplayValue(selectedCallCustomer, "Engine No:") || getColDisplayValue(selectedCallCustomer, "Engine no") || "—"}
                    </p>

                    <p className="font-black text-slate-900 uppercase tracking-widest text-[11px] bg-green-100 px-2 py-1.5 rounded-lg inline-flex items-center gap-1.5 w-fit">
                      <Calendar className="w-4 h-4 text-green-700" />
                      <span>{isTe ? "📅 డెలివరీ" : "📅 Delivery"}</span>
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-800">
                      {getColDisplayValue(selectedCallCustomer, "Date of del") || getColDisplayValue(selectedCallCustomer, "Date of Delivery") || "—"}
                    </p>
                  </div>
                </div>

                {/* 2. SERVICE & JOB CARD HISTORY SECTION */}
                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-700" />
                      <h4 className="font-black text-slate-900 text-xs">
                        {isTe ? "సర్వీస్ & జాబ్ కార్డుల చరిత్ర" : "Service & Job Card History"} ({callCards.length})
                      </h4>
                    </div>
                    {onNewJobCard && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCallCustomer(null);
                          onNewJobCard(selectedCallCustomer);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isTe ? "+ కొత్త జాబ్ కార్డ్" : "+ New Job Card"}</span>
                      </button>
                    )}
                  </div>

                  {callCards.length === 0 ? (
                    <div className="py-4 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
                      <p className="text-xs font-bold text-slate-700">
                        {isTe ? "ఈ ఛాసిస్ నెంబర్ పై ఎలాంటి జాబ్ కార్డులు లేవు." : "No past Job Cards recorded for this customer."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                      <table className="w-full text-xs text-left text-slate-900 border-collapse">
                        <thead className="bg-slate-100 font-black text-slate-800 border-b border-slate-200 text-[11px]">
                          <tr>
                            <th className="py-2 px-2.5">Job No</th>
                            <th className="py-2 px-2.5">Date</th>
                            <th className="py-2 px-2.5">Service Type</th>
                            <th className="py-2 px-2.5">Hours</th>
                            <th className="py-2 px-2.5">Mechanic</th>
                            <th className="py-2 px-2.5">Total (₹)</th>
                            <th className="py-2 px-2.5">Status</th>
                            <th className="py-2 px-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {callCards.map((card, idx) => (
                            <tr key={card.id || idx} className="hover:bg-purple-50/40">
                              <td className="py-2 px-2.5 font-bold font-mono text-purple-950">
                                {card.jobNo || card.onlineJobCardNo || card.onlineJobNo || card.jobCardNo || `JC-${idx + 1}`}
                              </td>
                              <td className="py-2 px-2.5 font-mono">
                                {formatDisplayDate(card.complaintDate || card.jobDate || card.date)}
                              </td>
                              <td className="py-2 px-2.5 font-bold text-slate-900">
                                {card.serviceType || card.freeServiceList || "General Service"}
                              </td>
                              <td className="py-2 px-2.5 font-mono">
                                {card.hourMeter || card.hoursRun || card.hrsRun || "—"}
                              </td>
                              <td className="py-2 px-2.5 text-slate-700">
                                {card.mechanic || card.technicianName || card.mechanicName || card.technician || "—"}
                              </td>
                              <td className="py-2 px-2.5 font-mono font-bold text-purple-950">
                                ₹{Number(card.grandTotal || card.gTotal || card.totalAmount || card.billAmount || 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    card.status === "Closed"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-amber-100 text-amber-900 border border-amber-300"
                                  }`}
                                >
                                  {card.status || "Open"}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 text-right">
                                {onViewCard && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCallCustomer(null);
                                      onViewCard(card);
                                    }}
                                    className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                    title="View Job Card"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>{isTe ? "చూడండి" : "View"}</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. TELECALLING FOLLOW-UP LOGGER FORM */}
                <form onSubmit={handleSaveCallLogSubmit} className="bg-purple-50/40 border border-purple-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-black text-purple-950 text-xs">
                      {isTe ? "టెలికాలింగ్ కాల్ నమోదు & ఫాలో-అప్ (Log Telecalling Call)" : "Log Telecalling Call & Follow-up"}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        {isTe ? "కాల్ ఫలితం / స్థితి (Call Status)" : "Call Outcome / Status"}
                      </label>
                      <select
                        value={callStatus}
                        onChange={(e) => setCallStatus(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                      >
                        <option value="Interested">Interested in Service (సర్వీస్ చేయించుకుంటారు)</option>
                        <option value="Appointment Fixed">Appointment Fixed (తేదీ నిర్ణయించారు)</option>
                        <option value="RNR">RNR / Not Reachable (ఫోన్ ఎత్తలేదు)</option>
                        <option value="Serviced Outside">Serviced Outside (బయట చేయించుకున్నారు)</option>
                        <option value="Sold Tractor">Sold Tractor (ట్రాక్టర్ అమ్మేశారు)</option>
                        <option value="Not Interested">Not Interested (ఆసక్తి లేదు)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        {isTe ? "కస్టమర్ కోరిన సర్వీస్ తేదీ (Preferred Date)" : "Customer Preferred Service Date"}
                      </label>
                      <input
                        type="date"
                        value={callPreferredDate}
                        onChange={(e) => setCallPreferredDate(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      {isTe ? "కాల్ రిమార్క్స్ / వివరాలు (Remarks / Notes)" : "Call Remarks / Notes"}
                    </label>
                    <textarea
                      rows={2}
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      placeholder={
                        isTe
                          ? "కస్టమర్ ఏమన్నారు? సమస్యలు లేదా సర్వీస్ వివరాలు రాయండి..."
                          : "Enter conversation notes, requested services, or issues discussed..."
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-normal text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {callPhone && (
                        <a
                          href={`tel:${callPhone}`}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{isTe ? "డైరెక్ట్ కాల్ చేయండి" : "Call Now"}</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyCustomer(selectedCallCustomer)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isTe ? "వివరాలు కాపీ" : "Copy Details"}</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={callSaving}
                      className={`px-4 py-1.5 rounded-lg text-white font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 ${
                        callSavedSuccess ? "bg-emerald-600" : "bg-purple-900 hover:bg-purple-950"
                      }`}
                    >
                      {callSavedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{callSavedSuccess ? (isTe ? "సేవ్ అయ్యింది!" : "Saved!") : (isTe ? "కాల్ లాగ్ సేవ్ చేయండి" : "Save Call Note")}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-100 p-3 flex justify-between items-center border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const cust = selectedCallCustomer;
                    setSelectedCallCustomer(null);
                    handleOpenEditCustomer(cust);
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>{isTe ? "కస్టమర్ వివరాలు ఎడిట్ చేయండి" : "Edit Customer Details"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCallCustomer(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  {isTe ? "మూసివేయి (Close)" : "Close"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DEDICATED CHASSIS JOB CARDS MODAL */}
      {selectedChassisModal && (() => {
        const cust = selectedChassisCustomer;
        const cards = selectedChassisCards;
        const custName = cust ? getColDisplayValue(cust, "Customer Name") : "—";
        const fatherName = cust ? getColDisplayValue(cust, "FATHER NAME") : "";
        const mobile = cust ? getColDisplayValue(cust, "Mobile Number") : "—";
        const village = cust ? getColDisplayValue(cust, "VILLAGE") : "—";
        const mandal = cust ? getColDisplayValue(cust, "Mandal") : "—";
        const model = cust ? getColDisplayValue(cust, "Model") : "—";
        const engineNo = cust ? getColDisplayValue(cust, "Engine No:") : "—";
        const delDate = cust ? getColDisplayValue(cust, "Date of del") : "—";
        const isOutOfWty = cust ? isDeliveryOutOfWarranty(cust) : false;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-purple-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-4 flex items-center justify-between shrink-0 border-b border-purple-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-700/50 flex items-center justify-center text-purple-200 border border-purple-500/40 shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                        <span>🚜 {isTe ? "ఛాసిస్ నెం:" : "Chassis No:"}</span>
                        <span className="font-mono bg-purple-800/80 px-2.5 py-0.5 rounded-lg border border-purple-600 text-amber-300">
                          {selectedChassisModal}
                        </span>
                      </h3>
                      <span className="bg-purple-800 text-purple-200 text-xs font-black px-2.5 py-0.5 rounded-full border border-purple-600">
                        {cards.length} {isTe ? "జాబ్ కార్డులు లభించాయి" : "Job Cards Recorded"}
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/80 font-medium mt-0.5">
                      {custName} {fatherName ? `(S/o ${fatherName})` : ""} • {village} {mandal ? `, ${mandal}` : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedChassisModal(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Customer Details Ribbon */}
              <div className="bg-purple-50/70 border-b border-purple-200 p-3.5 shrink-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">{isTe ? "కస్టమర్" : "Customer"}</span>
                  <span className="font-bold text-slate-900 truncate block">{custName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">{isTe ? "మొబైల్ నెం." : "Mobile"}</span>
                  <span className="font-mono font-bold text-slate-900">{mobile}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">{isTe ? "మోడల్" : "Model"}</span>
                  <span className="font-bold text-indigo-900">{model}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">{isTe ? "ఇంజన్ నెం." : "Engine No"}</span>
                  <span className="font-mono text-slate-800">{engineNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">{isTe ? "డెలివరీ తేదీ" : "Delivery Date"}</span>
                  <span className="font-mono font-bold text-slate-900">{delDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">{isTe ? "వారంటీ స్థితి" : "Warranty"}</span>
                  {isOutOfWty ? (
                    <span className="inline-block bg-red-100 text-red-800 border border-red-300 font-black text-[10px] px-2 py-0.5 rounded-md">
                      {isTe ? "ముగిసింది" : "Out of Wty"}
                    </span>
                  ) : (
                    <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[10px] px-2 py-0.5 rounded-md">
                      {isTe ? "వారంటీలో ఉంది" : "In Warranty"}
                    </span>
                  )}
                </div>
              </div>

              {/* Job Cards Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>📋 {isTe ? "ఈ ఛాసిస్ నెంబర్ పై రికార్డ్ అయిన జాబ్ కార్డులు:" : "Recorded Job Cards for this Chassis:"}</span>
                    <span className="bg-purple-100 text-purple-900 text-xs font-black px-2 py-0.5 rounded-full">
                      {cards.length}
                    </span>
                  </h4>

                  <div className="flex items-center gap-2">
                    {onNewJobCard && cust && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetCust = cust;
                          setSelectedChassisModal(null);
                          onNewJobCard(targetCust);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isTe ? "+ కొత్త జాబ్ కార్డ్" : "+ New Job Card"}</span>
                      </button>
                    )}
                    {onViewJobCardsForChassis && (
                      <button
                        type="button"
                        onClick={() => {
                          const ch = selectedChassisModal;
                          setSelectedChassisModal(null);
                          onViewJobCardsForChassis(ch);
                        }}
                        className="px-3 py-1.5 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{isTe ? "🔍 జాబ్ కార్డుల టేబుల్‌లో తెరవండి" : "🔍 Open in Job Cards Table"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {cards.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {isTe ? "ఈ ఛాసిస్ నెంబర్ పై ఎలాంటి జాబ్ కార్డులు నమోదు కాలేదు." : "No Job Cards found matching this chassis number."}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isTe ? "ఈ కస్టమర్ ట్రాక్టర్‌కు కొత్త జాబ్ కార్డ్ నమోదు చేయడానికి పైనున్న '+ కొత్త జాబ్ కార్డ్' బటన్ నొక్కండి." : "Click '+ New Job Card' to record a new service for this tractor."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
                    <table className="w-full text-xs text-left text-slate-900 border-collapse">
                      <thead className="bg-slate-100 font-black text-slate-800 border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Job No</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Service Type</th>
                          <th className="py-2.5 px-3">Hours Run</th>
                          <th className="py-2.5 px-3">Technician / Mechanic</th>
                          <th className="py-2.5 px-3">Bill Amount (₹)</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {cards.map((card, idx) => (
                          <tr key={card.id || idx} className="hover:bg-purple-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-bold font-mono text-purple-950">
                              <div className="flex flex-col">
                                <span>{card.jobNo || card.onlineJobCardNo || card.onlineJobNo || card.jobCardNo || `JC-${idx + 1}`}</span>
                                {card.onlineJobCardNo && card.jobNo && card.onlineJobCardNo !== card.jobNo && (
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    Online: {card.onlineJobCardNo}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-800">
                              {formatDisplayDate(card.jobDate || card.complaintDate || card.date)}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              <div className="flex flex-col">
                                <span>{card.serviceType || "General Service"}</span>
                                {card.freeServiceList && (
                                  <span className="text-[10px] text-emerald-700 font-medium">
                                    {card.freeServiceList}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {card.hourMeter || card.hoursRun || card.hrsRun || "—"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {card.mechanic || card.technicianName || card.mechanicName || card.technician || "—"}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-purple-950 text-sm">
                              ₹{Number(card.grandTotal || card.gTotal || card.totalAmount || card.billAmount || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${
                                  card.status === "Closed"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : "bg-amber-100 text-amber-900 border border-amber-300"
                                }`}
                              >
                                {card.status || "Open"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {onViewCard && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedChassisModal(null);
                                      onViewCard(card);
                                    }}
                                    className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                    title="View Full Job Card"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{isTe ? "వివరాలు" : "View"}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-100 p-3.5 flex items-center justify-between border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                  {cust && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = cust;
                        setSelectedChassisModal(null);
                        setSelectedCallCustomer(target);
                        setCallStatus("Interested");
                        setCallNotes("");
                        setCallPreferredDate("");
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-300 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                      <span>{isTe ? "📞 టెలికాలింగ్ లాగ్ చేయండి" : "📞 Log Telecall"}</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedChassisModal(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-colors"
                >
                  {isTe ? "మూసివేయి (Close)" : "Close"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
