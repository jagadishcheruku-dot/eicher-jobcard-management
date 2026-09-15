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
  Maximize2,
  Lock,
  Unlock,
  AlertTriangle,
  Table as TableIcon
} from "lucide-react";
import { RowActionButtons } from "./RowActionButtons";
import * as XLSX from "xlsx";
import { formatDisplayDate, formatDeliveryDisplayDate, parseDateToTimestamp } from "../utils/dateFormatter";
import {
  BRANCH_DEFINITIONS,
  resolveBranchFromSupervisorOrCode,
  isRecordMatchingBranchOrSupervisor,
} from "../utils/supervisorBranchMapper";
import { Building2, UserCheck } from "lucide-react";

export interface SavedJobCardsExcelTableProps {
  cards: any[];
  allCards: any[];
  dealershipData?: any;
  language?: "te" | "en";
  selectedIds?: string[];
  mechanicsList?: string[];
  branchesList?: string[];
  serviceTypes?: string[];
  initialSearchQuery?: string;
  initialStatusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  onSelectAll?: (ids: string[]) => void;
  onSelectOne?: (id: string, checked: boolean) => void;
  onToggleSelect?: (id: string) => void;
  onSave: (id: string, updatedFields: any) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onBulkDelete?: (ids: string[]) => Promise<void> | void;
  onEdit: (card: any) => void;
  onPrint: (card: any) => void;
  onView: (card: any) => void;
  onRegisterComplaint?: (card: any) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

export const SavedJobCardsExcelTable: React.FC<SavedJobCardsExcelTableProps> = ({
  cards,
  allCards,
  language = "te",
  selectedIds = [],
  mechanicsList = [],
  branchesList = [],
  initialSearchQuery = "",
  initialStatusFilter = "all",
  onStatusFilterChange,
  serviceTypes = [
    "1st Service",
    "2nd Service",
    "3rd Service",
    "4th Service",
    "5th Service",
    "6th Service",
    "7th Service",
    "8th Service",
    "9th Service",
    "10th Service",
    "Running Repairs",
    "Breakdown",
    "Major Overhaul",
    "Free Checkup Camp",
    "Oil Change",
    "Warranty Claim"
  ],
  onSelectAll,
  onSelectOne,
  onToggleSelect,
  onSave,
  onDelete,
  onBulkDelete,
  onEdit,
  onPrint,
  onView,
  onRegisterComplaint,
  canEdit = true,
  canDelete = true,
  canCreate = true,
}) => {
  const isTe = language === "te";

  // Density mode: compact, normal, spacious
  const [rowDensity, setRowDensity] = useState<"compact" | "normal" | "spacious">("normal");

  // Global Search state
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery || "");

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
      setCurrentPage(1);
    }
  }, [initialSearchQuery]);

  // Status Filter ("all" | "Open" | "Closed" | "MissingOnline")
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || "all");

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
      setCurrentPage(1);
    }
  }, [initialStatusFilter]);

  // Lock Filters feature (🔒 / 🔓)
  const [isFiltersLocked, setIsFiltersLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sri_jobcards_filters_locked") === "true";
    } catch {
      return false;
    }
  });

  const toggleFiltersLock = () => {
    setIsFiltersLocked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sri_jobcards_filters_locked", String(next));
      } catch {}
      return next;
    });
  };

  const handleStatusFilterChange = (newStatus: string) => {
    if (isFiltersLocked) return;
    setStatusFilter(newStatus);
    setCurrentPage(1);
    if (onStatusFilterChange) {
      onStatusFilterChange(newStatus);
    }
  };

  // Dedicated Branch & Supervisor Filters (Sri Gayathri Automotives)
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState<string>("all");

  // Extract list of all unique supervisors for dropdown filter
  const uniqueSupervisors = useMemo(() => {
    const set = new Set<string>();
    allCards.forEach((c) => {
      const sup = String(c.supervisor || c.advisorName || c.createdBy || "").trim();
      if (sup && sup !== "—") set.add(sup);
    });
    return Array.from(set).sort();
  }, [allCards]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Sorting state: default to job card created / open date descending (today/newest first, older dates down)
  const [sortCol, setSortCol] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Column Filters state: Record<colKey, string[]>
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [filterSearchText, setFilterSearchText] = useState<string>("");
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  // Saving states for instant row-level feedback
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [savedSuccessRows, setSavedSuccessRows] = useState<Record<string, boolean>>({});
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
      cards.forEach((card) => {
        newMap[card.id] = true;
      });
      setExpandedRowKeys(newMap);
      setAllExpanded(true);
    }
  };

  // Local draft values for inline edits before save
  const [rowDrafts, setRowDrafts] = useState<Record<string, any>>({});

  // Standard unified date formatter (DD-MMM-YYYY e.g. 12-Mar-2026)
  const formatDate = (d: any) => {
    return formatDisplayDate(d, "");
  };

  const toInputDate = (d: any) => {
    if (!d) return "";
    try {
      const str = String(d).trim();
      if (str.includes("/")) {
        const parts = str.split("/");
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
      return str.split("T")[0];
    } catch {
      return "";
    }
  };

  // Rule: Job card is Closed ONLY when both Closed Date and Bill No are present! Otherwise Open!
  const isCardClosed = (card: any, draft?: any) => {
    const effClosed = (
      draft?.actualClosedDate !== undefined
        ? draft.actualClosedDate
        : card.actualClosedDate || card.dateTimeOut || ""
    ).toString().trim();

    const effBill = (
      draft?.billNo !== undefined
        ? draft.billNo
        : card.billNo || ""
    ).toString().trim();

    return !!(effClosed && effBill);
  };

  // Quick Counts
  const openCount = useMemo(() => {
    return allCards.filter((c) => !isCardClosed(c)).length;
  }, [allCards]);

  const closedCount = useMemo(() => {
    return allCards.filter((c) => isCardClosed(c)).length;
  }, [allCards]);

  const pendingOnlineCount = useMemo(() => {
    return allCards.filter((c) => !(c.onlineJobCardNo || "").toString().trim()).length;
  }, [allCards]);

  // Get current row value (either from local edit draft or from card object) for inputs
  const getCellEditValue = (card: any, colKey: string): string => {
    const draft = rowDrafts[card.id];
    if (draft && draft[colKey] !== undefined) {
      return String(draft[colKey] ?? "");
    }
    switch (colKey) {
      case "jobNo":
        return String(card.jobNo || card.onlineJobCardNo || "").trim();
      case "onlineJobCardNo":
        return String(card.onlineJobCardNo || "").trim();
      case "complaintDate":
        return toInputDate(card.complaintDate);
      case "jobDate":
      case "dateTimeIn":
        return toInputDate(card.jobDate || card.jobOpenDate || card.dateTimeIn);
      case "branch":
        return String(card.branch || "").trim();
      case "historyFileNo":
        return String(card.historyFileNo || card.fileNo || "").trim();
      case "model":
        return String(card.model || "").trim();
      case "modelType":
        return String(card.modelType || "").trim();
      case "chassisNo":
        return String(card.chassisNo || "").trim();
      case "engineNo":
        return String(card.engineNo || "").trim();
      case "dateOfDelivery":
        return toInputDate(card.dateOfDelivery || card.installDate);
      case "custName":
        return String(card.custName || "").trim();
      case "fatherName":
        return String(card.fatherName || "").trim();
      case "village":
        return String(card.village || "").trim();
      case "mandal":
        return String(card.mandal || "").trim();
      case "phoneNo":
        return String(card.phoneNo || card.ownerMob || card.phNo || "").trim();
      case "hourMeter":
        return String(card.hourMeter || card.hrsRun || "").trim();
      case "serviceType":
        return String(card.serviceType || "").trim();
      case "freeServiceList":
        return String(card.freeServiceList || "").trim();
      case "extraRepairs":
        return String(card.extraRepairs || card.problemDescription || "").trim();
      case "actualClosedDate":
        return toInputDate(card.actualClosedDate || card.dateTimeOut);
      case "mechanic":
        return String(card.mechanic || card.technicianName || "").trim();
      case "serviceLocation":
        return String(card.serviceLocation || card.servicePlace || "").trim();
      case "billNo":
        return String(card.billNo || "").trim();
      case "reasonsForAnalysis":
        return String(card.reasonsForAnalysis || card.problemDescription || "").trim();
      case "telecalling":
        return String(card.telecalling || "").trim();
      default:
        return String(card[colKey] || "").trim();
    }
  };

  // Helper to get printable string representation of a card column for search & filter
  const getCardColValue = (card: any, colKey: string): string => {
    const draft = rowDrafts[card.id];
    switch (colKey) {
      case "status":
        return isCardClosed(card, draft) ? "Closed" : "Open";
      case "jobNo":
        return String(draft?.jobNo !== undefined ? draft.jobNo : card.jobNo || card.onlineJobCardNo || "").trim();
      case "complaintDate":
        return formatDate(draft?.complaintDate !== undefined ? draft.complaintDate : card.complaintDate);
      case "onlineJobCardNo":
        return String(draft?.onlineJobCardNo !== undefined ? draft.onlineJobCardNo : card.onlineJobCardNo || "").trim();
      case "jobDate":
      case "dateTimeIn":
        return formatDate(draft?.jobDate !== undefined ? draft.jobDate : card.jobDate || card.jobOpenDate || card.dateTimeIn);
      case "branch":
        return String(draft?.branch !== undefined ? draft.branch : card.branch || "").trim();
      case "historyFileNo":
        return String(draft?.historyFileNo !== undefined ? draft.historyFileNo : card.historyFileNo || card.fileNo || "").trim();
      case "model":
        return String(draft?.model !== undefined ? draft.model : card.model || "").trim();
      case "modelType":
        return String(draft?.modelType !== undefined ? draft.modelType : card.modelType || "").trim();
      case "chassisNo":
        return String(draft?.chassisNo !== undefined ? draft.chassisNo : card.chassisNo || "").trim();
      case "engineNo":
        return String(draft?.engineNo !== undefined ? draft.engineNo : card.engineNo || "").trim();
      case "dateOfDelivery":
        return formatDeliveryDisplayDate(draft?.dateOfDelivery !== undefined ? draft.dateOfDelivery : card.dateOfDelivery || card.installDate, "");
      case "custName":
        return String(draft?.custName !== undefined ? draft.custName : card.custName || "").trim();
      case "fatherName":
        return String(draft?.fatherName !== undefined ? draft.fatherName : card.fatherName || "").trim();
      case "village":
        return String(draft?.village !== undefined ? draft.village : card.village || "").trim();
      case "mandal":
        return String(draft?.mandal !== undefined ? draft.mandal : card.mandal || "").trim();
      case "phoneNo":
        return String(draft?.phoneNo !== undefined ? draft.phoneNo : card.phoneNo || card.ownerMob || card.phNo || "").trim();
      case "hourMeter":
        return String(draft?.hourMeter !== undefined ? draft.hourMeter : card.hourMeter || card.hrsRun || "").trim();
      case "serviceType":
        return String(draft?.serviceType !== undefined ? draft.serviceType : card.serviceType || "").trim();
      case "freeServiceList":
        return String(draft?.freeServiceList !== undefined ? draft.freeServiceList : card.freeServiceList || "").trim();
      case "extraRepairs":
        return String(draft?.extraRepairs !== undefined ? draft.extraRepairs : card.extraRepairs || card.problemDescription || "").trim();
      case "actualClosedDate":
        return formatDate(draft?.actualClosedDate !== undefined ? draft.actualClosedDate : card.actualClosedDate || card.dateTimeOut);
      case "mechanic":
        return String(draft?.mechanic !== undefined ? draft.mechanic : card.mechanic || card.technicianName || "").trim();
      case "serviceLocation":
        return String(draft?.serviceLocation !== undefined ? draft.serviceLocation : card.serviceLocation || card.servicePlace || "").trim();
      case "billNo":
        return String(draft?.billNo !== undefined ? draft.billNo : card.billNo || "").trim();
      case "reasonsForAnalysis":
        return String(draft?.reasonsForAnalysis !== undefined ? draft.reasonsForAnalysis : card.reasonsForAnalysis || card.problemDescription || "").trim();
      case "telecalling":
        return String(draft?.telecalling !== undefined ? draft.telecalling : card.telecalling || "").trim();
      default:
        return String(draft?.[colKey] !== undefined ? draft[colKey] : card[colKey] || "").trim();
    }
  };

  // Detailed 26 Columns definition
  const detailedColumns = [
    { key: "jobNo", label: isTe ? "జాబ్ కార్డ్ (Job Card)" : "Job Card No", width: "min-w-[120px]" },
    { key: "complaintDate", label: isTe ? "కంప్లైంట్ తేదీ" : "Complaint Date", width: "min-w-[130px]" },
    { key: "onlineJobCardNo", label: isTe ? "ఆన్‌లైన్ జేసీ నెం." : "Online JC No", width: "min-w-[140px]" },
    { key: "jobDate", label: isTe ? "ఓపెన్ తేదీ" : "Open Date", width: "min-w-[130px]" },
    { key: "branch", label: isTe ? "బ్రాంచ్ (Branch)" : "Branch", width: "min-w-[120px]" },
    { key: "historyFileNo", label: isTe ? "ఫైల్ నెం." : "File No", width: "min-w-[100px]" },
    { key: "model", label: isTe ? "మోడల్ (Model)" : "Model", width: "min-w-[130px]" },
    { key: "modelType", label: isTe ? "మోడల్ రకం" : "Model Type", width: "min-w-[110px]" },
    { key: "chassisNo", label: isTe ? "ఛాసిస్ నెం." : "Chassis No", width: "min-w-[160px]" },
    { key: "engineNo", label: isTe ? "ఇంజన్ నెం." : "Engine No", width: "min-w-[140px]" },
    { key: "dateOfDelivery", label: isTe ? "డెలివరీ తేదీ" : "Delivery Date", width: "min-w-[130px]" },
    { key: "custName", label: isTe ? "కస్టమర్ పేరు" : "Customer Name", width: "min-w-[170px]" },
    { key: "fatherName", label: isTe ? "తండ్రి పేరు" : "Father's Name", width: "min-w-[150px]" },
    { key: "village", label: isTe ? "గ్రామం" : "Village", width: "min-w-[130px]" },
    { key: "mandal", label: isTe ? "మండలం" : "Mandal", width: "min-w-[120px]" },
    { key: "phoneNo", label: isTe ? "మొబైల్ ఫోన్" : "Phone No", width: "min-w-[130px]" },
    { key: "hourMeter", label: isTe ? "గంటలు (Hrs)" : "Hrs Run", width: "min-w-[90px]" },
    { key: "serviceType", label: isTe ? "సర్వీస్ రకం" : "Service Type", width: "min-w-[140px]" },
    { key: "freeServiceList", label: isTe ? "ఉచిత సర్వీస్" : "Free Service", width: "min-w-[120px]" },
    { key: "extraRepairs", label: isTe ? "అదనపు రిపేర్లు" : "Extra Repairs", width: "min-w-[200px]" },
    { key: "actualClosedDate", label: isTe ? "క్లోజ్డ్ తేదీ" : "Closed Date", width: "min-w-[130px]" },
    { key: "billNo", label: isTe ? "బిల్ నెం." : "Bill No", width: "min-w-[110px]" },
    { key: "mechanic", label: isTe ? "టెక్నీషియన్" : "Technician", width: "min-w-[140px]" },
    { key: "serviceLocation", label: isTe ? "సర్వీస్ ప్రదేశం" : "Location", width: "min-w-[120px]" },
    { key: "reasonsForAnalysis", label: isTe ? "కారణాలు / విశ్లేషణ" : "Analysis / Problem", width: "min-w-[220px]" },
    { key: "telecalling", label: isTe ? "టెలికాలింగ్" : "Telecalling", width: "min-w-[140px]" }
  ];

  // Handle local cell edit with auto-status calculation
  const handleRowFieldChange = (cardId: string, fieldKey: string, value: any) => {
    setRowDrafts((prev) => {
      const cardDraft = { ...(prev[cardId] || {}), [fieldKey]: value };
      const origCard = allCards.find((c) => c.id === cardId) || cards.find((c) => c.id === cardId) || {};

      // Auto-Status calculation: closed date AND bill no must both be present to be Closed!
      const effClosed = (
        cardDraft.actualClosedDate !== undefined
          ? cardDraft.actualClosedDate
          : origCard.actualClosedDate || origCard.dateTimeOut || ""
      ).toString().trim();

      const effBill = (
        cardDraft.billNo !== undefined
          ? cardDraft.billNo
          : origCard.billNo || ""
      ).toString().trim();

      if (fieldKey === "actualClosedDate" || fieldKey === "billNo") {
        if (effClosed && effBill) {
          cardDraft.status = "Closed";
        } else {
          cardDraft.status = "Open";
        }
      }

      return {
        ...prev,
        [cardId]: cardDraft
      };
    });
  };

  // Get next sequential job card number
  const getNextJobCardNumber = (): number => {
    const allNumbers: number[] = [];
    allCards.forEach((c) => {
      const jNo = c.jobNo || c.onlineJobCardNo;
      if (jNo) {
        const num = parseInt(String(jNo).replace(/\D/g, ""), 10);
        if (!isNaN(num)) allNumbers.push(num);
      }
    });
    return allNumbers.length > 0 ? Math.max(...allNumbers) + 1 : 1;
  };

  // Validate minimum data entry
  const validateMinimumData = (card: any, draft: any): { valid: boolean; errorMsg: string } => {
    const effCustName = (draft?.custName !== undefined ? draft.custName : card.custName || "").toString().trim();
    const effChassisNo = (draft?.chassisNo !== undefined ? draft.chassisNo : card.chassisNo || "").toString().trim();
    const effJobDate = (draft?.jobDate !== undefined ? draft.jobDate : card.jobDate || card.jobOpenDate || card.dateTimeIn || "").toString().trim();

    if (!effCustName) return { valid: false, errorMsg: "Customer name is required" };
    if (!effChassisNo) return { valid: false, errorMsg: "Chassis number is required" };
    if (!effJobDate) return { valid: false, errorMsg: "Job date is required" };

    return { valid: true, errorMsg: "" };
  };

  // Save row logic
  const handleSaveRow = async (card: any) => {
    const draft = rowDrafts[card.id];
    if (!draft || Object.keys(draft).length === 0) return;

    setSavingRows((prev) => ({ ...prev, [card.id]: true }));
    try {
      // Validate minimum data
      const validation = validateMinimumData(card, draft);
      if (!validation.valid) {
        alert(validation.errorMsg);
        setSavingRows((prev) => ({ ...prev, [card.id]: false }));
        return;
      }

      const payload: any = { ...draft };

      // Auto-generate jobNo if not provided (and card is new or jobNo is empty)
      const effJobNo = (draft.jobNo !== undefined ? draft.jobNo : card.jobNo || "").toString().trim();
      if (!effJobNo) {
        payload.jobNo = getNextJobCardNumber();
      } else if (draft.jobNo !== undefined) {
        payload.jobNo = draft.jobNo;
      }

      if (draft.onlineJobCardNo !== undefined) payload.onlineJobCardNo = draft.onlineJobCardNo;
      if (draft.hourMeter !== undefined) {
        payload.hourMeter = draft.hourMeter;
        payload.hrsRun = draft.hourMeter;
      }
      if (draft.extraRepairs !== undefined) {
        payload.extraRepairs = draft.extraRepairs;
        payload.problemDescription = draft.extraRepairs;
      }
      if (draft.reasonsForAnalysis !== undefined) {
        payload.reasonsForAnalysis = draft.reasonsForAnalysis;
      }
      if (draft.mechanic !== undefined) {
        payload.mechanic = draft.mechanic;
        payload.technicianName = draft.mechanic;
      }
      if (draft.phoneNo !== undefined) {
        payload.phoneNo = draft.phoneNo;
        payload.ownerMob = draft.phoneNo;
        payload.phNo = draft.phoneNo;
      }
      if (draft.actualClosedDate !== undefined) {
        payload.actualClosedDate = draft.actualClosedDate;
        payload.dateTimeOut = draft.actualClosedDate;
      }
      if (draft.billNo !== undefined) {
        payload.billNo = draft.billNo;
      }

      // Compute auto-status based on onlineJobCardNo
      const effOnlineJC = (
        payload.onlineJobCardNo !== undefined
          ? payload.onlineJobCardNo
          : card.onlineJobCardNo || ""
      ).toString().trim();

      const effClosed = (
        payload.actualClosedDate !== undefined
          ? payload.actualClosedDate
          : card.actualClosedDate || card.dateTimeOut || ""
      ).toString().trim();

      const effBill = (
        payload.billNo !== undefined
          ? payload.billNo
          : card.billNo || ""
      ).toString().trim();

      // Status logic:
      // - If onlineJobCardNo is empty: "pending"
      // - If onlineJobCardNo is filled and closed date+bill present: "Closed"
      // - Otherwise: "Open"
      if (!effOnlineJC) {
        payload.status = "pending";
      } else if (effClosed && effBill) {
        payload.status = "Closed";
      } else {
        payload.status = "Open";
      }

      await onSave(card.id, payload);

      setRowDrafts((prev) => {
        const copy = { ...prev };
        delete copy[card.id];
        return copy;
      });

      setSavedSuccessRows((prev) => ({ ...prev, [card.id]: true }));
      setTimeout(() => {
        setSavedSuccessRows((prev) => ({ ...prev, [card.id]: false }));
      }, 2000);
    } catch (err) {
      console.error("Save row error:", err);
    } finally {
      setSavingRows((prev) => ({ ...prev, [card.id]: false }));
    }
  };

  // Auto-save on blur
  const handleCellBlur = (card: any) => {
    const draft = rowDrafts[card.id];
    if (draft && Object.keys(draft).length > 0) {
      handleSaveRow(card);
    }
  };

  // Toggle status inline and trigger save
  const handleToggleStatus = async (card: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const draft = rowDrafts[card.id];
    const currentlyClosed = isCardClosed(card, draft);

    const updated: any = {};
    if (currentlyClosed) {
      // Reopen -> clear closed date & bill no
      updated.status = "Open";
      updated.actualClosedDate = "";
      updated.dateTimeOut = "";
      updated.billNo = "";
    } else {
      // Close -> set closed date to today and default bill no if empty
      updated.status = "Closed";
      const effClosed = (draft?.actualClosedDate || card.actualClosedDate || card.dateTimeOut || "").toString().trim();
      const effBill = (draft?.billNo || card.billNo || "").toString().trim();

      if (!effClosed) {
        updated.actualClosedDate = new Date().toISOString().split("T")[0];
        updated.dateTimeOut = updated.actualClosedDate;
      }
      if (!effBill) {
        updated.billNo = `B-${card.jobNo || Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    setSavingRows((prev) => ({ ...prev, [card.id]: true }));
    try {
      await onSave(card.id, updated);
      setRowDrafts((prev) => {
        const copy = { ...prev };
        delete copy[card.id];
        return copy;
      });
      setSavedSuccessRows((prev) => ({ ...prev, [card.id]: true }));
      setTimeout(() => {
        setSavedSuccessRows((prev) => ({ ...prev, [card.id]: false }));
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRows((prev) => ({ ...prev, [card.id]: false }));
    }
  };

  // Filter dropdown handler logic
  const isDateColumn = (colKey: string): boolean => {
    return colKey === "jobDate" || colKey === "complaintDate" || colKey === "dateOfDelivery" || colKey === "actualClosedDate";
  };

  const groupDatesByYearMonth = (colKey: string) => {
    const grouped: Record<string, Set<string>> = {};
    allCards.forEach((card) => {
      const dateStr = getCardColValue(card, colKey) || "";
      if (dateStr && dateStr !== "") {
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

  const handleToggleFilterValue = (colKey: string, val: string) => {
    if (isFiltersLocked) return;
    setColumnFilters((prev) => {
      const current = prev[colKey] || [];
      const exists = current.includes(val);
      const next = exists ? current.filter((x) => x !== val) : [...current, val];
      if (next.length === 0) {
        const copy = { ...prev };
        delete copy[colKey];
        return copy;
      }
      return { ...prev, [colKey]: next };
    });
    setCurrentPage(1);
  };

  const handleClearColumnFilter = (colKey: string) => {
    if (isFiltersLocked) return;
    setColumnFilters((prev) => {
      const copy = { ...prev };
      delete copy[colKey];
      return copy;
    });
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    if (isFiltersLocked) return;
    setColumnFilters({});
    setFilterSearchText("");
    setActiveFilterCol(null);
    setSearchQuery("");
    setStatusFilter("all");
    setSelectedBranchFilter("all");
    setSelectedSupervisorFilter("all");
    setCurrentPage(1);
    if (onStatusFilterChange) {
      onStatusFilterChange("all");
    }
  };

  // Compute unique values for active column filter
  const activeColUniqueValues = useMemo(() => {
    if (!activeFilterCol) return [];
    const valMap = new Map<string, number>();
    allCards.forEach((c) => {
      const val = getCardColValue(c, activeFilterCol);
      if (val) {
        valMap.set(val, (valMap.get(val) || 0) + 1);
      }
    });
    const arr = Array.from(valMap.entries()).map(([value, count]) => ({
      value,
      count
    }));
    arr.sort((a, b) => a.value.localeCompare(b.value));
    return arr;
  }, [activeFilterCol, allCards]);

  // Filtered values inside filter popup by filterSearchText
  const popupDisplayValues = useMemo(() => {
    if (!filterSearchText.trim()) return activeColUniqueValues;
    const q = filterSearchText.toLowerCase();
    return activeColUniqueValues.filter((item) =>
      item.value.toLowerCase().includes(q)
    );
  }, [activeColUniqueValues, filterSearchText]);

  // Apply column filters, status filter, and sorting to raw cards
  const processedCards = useMemo(() => {
    let result = [...cards];

    // Status Filter: "all" | "Open" | "Closed" | "pending" | "MissingOnline"
    if (statusFilter === "Open") {
      result = result.filter((c) => !isCardClosed(c) && c.status !== "pending");
    } else if (statusFilter === "Closed") {
      result = result.filter((c) => isCardClosed(c));
    } else if (statusFilter === "pending" || statusFilter === "MissingOnline") {
      // Show cards with pending status or missing online job card no
      result = result.filter((c) => c.status === "pending" || !(c.onlineJobCardNo || "").toString().trim());
    }

    // Branch & Supervisor Filters (Sri Gayathri Automotives)
    if (selectedBranchFilter && selectedBranchFilter !== "all") {
      result = result.filter((card) => {
        const branch = card.branch || card.dealershipBranch || "";
        const sup = card.supervisor || card.advisorName || card.createdBy || "";
        return isRecordMatchingBranchOrSupervisor(branch, sup, selectedBranchFilter);
      });
    }

    if (selectedSupervisorFilter && selectedSupervisorFilter !== "all") {
      result = result.filter((card) => {
        const sup = String(card.supervisor || card.advisorName || card.createdBy || "").toLowerCase().trim();
        const target = selectedSupervisorFilter.toLowerCase().trim();
        return sup === target || sup.includes(target);
      });
    }

    // Global Search Filter across all fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((card) => {
        return (
          detailedColumns.some((col) => {
            const val = getCardColValue(card, col.key);
            return val.toLowerCase().includes(q);
          }) ||
          (card.chassisNo && String(card.chassisNo).toLowerCase().includes(q)) ||
          (card.jobNo && String(card.jobNo).toLowerCase().includes(q)) ||
          (card.onlineJobCardNo && String(card.onlineJobCardNo).toLowerCase().includes(q)) ||
          (card.custName && String(card.custName).toLowerCase().includes(q)) ||
          (card.ownerMob && String(card.ownerMob).toLowerCase().includes(q))
        );
      });
    }

    // Apply active column filters
    const filterKeys = Object.keys(columnFilters);
    if (filterKeys.length > 0) {
      result = result.filter((card) => {
        return filterKeys.every((colKey) => {
          const selectedVals = columnFilters[colKey];
          if (!selectedVals || selectedVals.length === 0) return true;
          const cardVal = getCardColValue(card, colKey);
          return selectedVals.includes(cardVal);
        });
      });
    }

    // Apply sorting
    if (sortCol) {
      result.sort((a, b) => {
        const isDateCol =
          sortCol === "createdAt" ||
          sortCol === "complaintDate" ||
          sortCol === "jobDate" ||
          sortCol === "dateTimeIn" ||
          sortCol === "dateOfDelivery" ||
          sortCol === "actualClosedDate" ||
          sortCol.toLowerCase().includes("date");

        if (isDateCol) {
          const rawA =
            sortCol === "createdAt"
              ? (a.createdAt || a.jobDate || a.jobOpenDate || a.complaintDate || a.dateTimeIn)
              : (a[sortCol] || a.jobDate || a.jobOpenDate || a.complaintDate || a.createdAt);
          const rawB =
            sortCol === "createdAt"
              ? (b.createdAt || b.jobDate || b.jobOpenDate || b.complaintDate || b.dateTimeIn)
              : (b[sortCol] || b.jobDate || b.jobOpenDate || b.complaintDate || b.createdAt);

          const tsA = parseDateToTimestamp(rawA);
          const tsB = parseDateToTimestamp(rawB);
          if (tsA !== tsB) {
            if (tsA === -1) return 1;
            if (tsB === -1) return -1;
            return sortDir === "asc" ? tsA - tsB : tsB - tsA;
          }
        }

        const valA = getCardColValue(a, sortCol);
        const valB = getCardColValue(b, sortCol);
        if (valA === valB) return 0;
        const cmp = valA.localeCompare(valB, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    } else {
      // Default: sort by created date / job date descending (today/newest first, older dates down)
      result.sort((a, b) => {
        const tsA = parseDateToTimestamp(a.createdAt || a.jobDate || a.jobOpenDate || a.complaintDate || a.dateTimeIn);
        const tsB = parseDateToTimestamp(b.createdAt || b.jobDate || b.jobOpenDate || b.complaintDate || b.dateTimeIn);
        if (tsA !== tsB) {
          if (tsA === -1) return 1;
          if (tsB === -1) return -1;
          return tsB - tsA;
        }
        return 0;
      });
    }

    return result;
  }, [
    cards,
    statusFilter,
    selectedBranchFilter,
    selectedSupervisorFilter,
    searchQuery,
    columnFilters,
    sortCol,
    sortDir,
    detailedColumns,
  ]);

  // Chassis Match count specifically for search query
  const chassisMatchInfo = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const chassisMatches = allCards.filter((c) => {
      const ch = String(c.chassisNo || c.chassis || "").toLowerCase();
      return ch && ch.includes(q);
    });
    return {
      query: searchQuery.trim(),
      count: chassisMatches.length,
    };
  }, [searchQuery, allCards]);

  // Pagination slicing
  const totalPages = Math.ceil(processedCards.length / pageSize) || 1;
  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedCards.slice(start, start + pageSize);
  }, [processedCards, currentPage, pageSize]);

  // Comprehensive Export to Excel including 100% of all data fields
  const handleExportFilteredExcel = () => {
    const exportData = processedCards.map((c, i) => {
      // Format repair breakdown rows
      const repairSummary = Array.isArray(c.repairRows)
        ? c.repairRows
            .map((r: any) => `${r.repair || r.item || ""}${r.charge ? ` (₹${r.charge})` : ""}`)
            .filter(Boolean)
            .join("; ")
        : (c.repairsDone || "");

      // Format parts breakdown rows
      const partsSummary = Array.isArray(c.partRows)
        ? c.partRows
            .map((p: any) => `${p.partNo || ""} ${p.desc || p.name || ""}${p.qty ? ` [Qty:${p.qty}]` : ""}${p.amount ? ` [₹${p.amount}]` : ""}`)
            .filter(Boolean)
            .join("; ")
        : (c.partsIssued || "");

      return {
        SL_NO: i + 1,
        STATUS: isCardClosed(c) ? "Closed" : "Open",
        JOB_CARD_NO: c.jobNo || c.onlineJobCardNo || "",
        ONLINE_JC_NO: c.onlineJobCardNo || "",
        COMPLAINT_DATE: formatDate(c.complaintDate),
        JOB_OPEN_DATE: formatDate(c.jobDate || c.jobOpenDate || c.dateTimeIn),
        CREATED_AT: c.createdAt ? formatDate(c.createdAt) : "",
        BRANCH: c.branch || "",
        HISTORY_FILE_NO: c.historyFileNo || c.fileNo || "",
        TRACTOR_MODEL: c.model || "",
        MODEL_TYPE: c.modelType || "",
        CHASSIS_NO: c.chassisNo || "",
        ENGINE_NO: c.engineNo || "",
        REGISTRATION_NO: c.regdNo || "",
        DELIVERY_DATE: formatDeliveryDisplayDate(c.dateOfDelivery || c.installDate || c.deliveryDate, ""),
        CUSTOMER_NAME: c.custName || "",
        FATHER_NAME: c.fatherName || "",
        VILLAGE: c.village || "",
        MANDAL: c.mandal || "",
        CUSTOMER_ADDRESS: c.custAddr || c.address || "",
        MOBILE_NUMBER: c.phoneNo || c.ownerMob || c.phNo || "",
        DRIVER_MOBILE: c.driverMob || "",
        HOURS_RUN: c.hourMeter || c.hrsRun || "",
        SERVICE_TYPE: c.serviceType || "",
        FREE_SERVICE_LIST: c.freeServiceList || "",
        EXTRA_REPAIRS: c.extraRepairs || c.problemDescription || "",
        REPAIRS_LABOUR_DETAILS: repairSummary,
        PARTS_DETAILS: partsSummary,
        TOTAL_LABOUR_CHARGES: c.totalLabour || "",
        WARRANTY_MATERIAL_CHARGES: c.warrantyMaterial || "",
        NON_WARRANTY_MATERIAL_CHARGES: c.nonWarrantyMaterial || "",
        GRAND_TOTAL_AMOUNT: c.gTotal || c.grandTotal || "",
        ACTUAL_CLOSED_DATE: formatDate(c.actualClosedDate || c.dateTimeOut),
        BILL_NO: c.billNo || "",
        TECHNICIAN_NAME: c.mechanic || c.technicianName || c.mechanicName || "",
        SUPERVISOR_NAME: c.wsIncharge || c.supervisor || c.supervisorName || "",
        SERVICE_LOCATION: c.serviceLocation || c.servicePlace || "",
        WORKSHOP_REPORT: c.wsReport || "",
        REASONS_FOR_ANALYSIS: c.reasonsForAnalysis || c.problemDescription || "",
        TELECALLING: c.telecalling || "",
        CREATED_BY: c.createdBy || "",
        CREATED_BY_EMAIL: c.createdByEmail || ""
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Saved Job Cards");
    XLSX.writeFile(wb, `SriGayathri_Saved_JobCards_FullData_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Close filter dropdown on outside click
  const filterPopupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) {
        setActiveFilterCol(null);
      }
    };
    if (activeFilterCol) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeFilterCol]);

  // Row padding based on density
  const cellPadding =
    rowDensity === "compact"
      ? "py-1 px-1.5 text-[11px]"
      : rowDensity === "spacious"
      ? "py-2 px-2 text-xs"
      : "py-1.5 px-2 text-[11.5px]";

  // Helper Header Cell component with Excel-style AutoFilter Icon
  const renderHeaderFilterCell = (colKey: string, label: string, widthClass?: string) => {
    const isFiltered = (columnFilters[colKey] || []).length > 0;
    const isSorted = sortCol === colKey;

    return (
      <th
        key={colKey}
        className={`bg-slate-100 text-slate-800 font-extrabold uppercase tracking-wider text-[9.5px] border-r border-b-2 border-slate-300 p-1 select-none whitespace-nowrap group hover:bg-slate-200 transition-colors relative ${
          widthClass || "min-w-[120px]"
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => {
              if (sortCol === colKey) {
                setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
              } else {
                setSortCol(colKey);
                setSortDir("asc");
              }
            }}
            className="flex items-center gap-1 hover:text-emerald-800 transition-colors text-left font-extrabold flex-1 truncate cursor-pointer"
            title="Click to sort"
          >
            <span>{label}</span>
            {isSorted && (
              <span className="text-emerald-700">
                {sortDir === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isFiltersLocked) {
                alert(
                  isTe
                    ? "🔒 ఫిల్టర్లు లాక్ చేయబడ్డాయి. మార్చడానికి ముందుగా లాక్ తీయండి (అన్‌లాక్ చేయండి)."
                    : "🔒 Filters are currently locked. Unlock first to change filters."
                );
                return;
              }
              if (activeFilterCol === colKey) {
                setActiveFilterCol(null);
              } else {
                setActiveFilterCol(colKey);
                setFilterSearchText("");
              }
            }}
            className={`p-0.5 rounded transition-colors ${
              isFiltersLocked
                ? "cursor-not-allowed opacity-60 text-slate-400"
                : "cursor-pointer"
            } ${
              isFiltered
                ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-300/60"
            }`}
            title={isFiltersLocked ? "🔒 Filters Locked" : `Filter by ${label}`}
          >
            <Filter className="w-2.5 h-2.5" />
          </button>
        </div>

        {activeFilterCol === colKey && !isFiltersLocked && (
          <div
            ref={filterPopupRef}
            className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-2xl border border-slate-300 z-50 p-3 text-xs normal-case font-normal text-slate-800 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2 font-bold text-slate-800">
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-extrabold">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                {label} {isTe ? "ఫిల్టర్" : "Filter"}
              </span>
              <button
                type="button"
                onClick={() => setActiveFilterCol(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 border-b border-slate-150 pb-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setSortCol(colKey);
                  setSortDir("asc");
                  setActiveFilterCol(null);
                }}
                className="flex-1 py-1 px-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded font-bold text-[10px] text-center transition-colors cursor-pointer"
              >
                A → Z {isTe ? "ఆరోహణ" : "Asc"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortCol(colKey);
                  setSortDir("desc");
                  setActiveFilterCol(null);
                }}
                className="flex-1 py-1 px-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded font-bold text-[10px] text-center transition-colors cursor-pointer"
              >
                Z → A {isTe ? "అవరోహణ" : "Desc"}
              </button>
            </div>

            <div className="relative mb-2">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
              <input
                type="text"
                value={filterSearchText}
                onChange={(e) => setFilterSearchText(e.target.value)}
                placeholder={isTe ? "వెతకండి..." : "Search values..."}
                className="w-full bg-slate-50 border border-slate-200 rounded pl-7 pr-2 py-1 text-[11px] outline-none focus:border-emerald-500 focus:bg-white"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1 mb-2.5">
              {isDateColumn(colKey) ? (
                Object.entries(groupDatesByYearMonth(colKey)).map(([year, months]) => {
                  const isExpanded = expandedYears.has(year);
                  const filteredMonths = months.filter(m => m.toLowerCase().includes(filterSearchText.toLowerCase()));
                  return (
                    <div key={year}>
                      <div
                        className="flex items-center gap-1.5 px-1.5 py-0.5 hover:bg-emerald-50 rounded cursor-pointer text-[11px] font-semibold"
                        onClick={() => {
                          setExpandedYears((prev) => {
                            const next = new Set(prev);
                            if (next.has(year)) next.delete(year);
                            else next.add(year);
                            return next;
                          });
                        }}
                      >
                        <span className="text-emerald-600 font-bold">{isExpanded ? "−" : "+"}</span>
                        <span>{year}</span>
                      </div>
                      {isExpanded && filteredMonths.length > 0 && (
                        <div className="ml-4 space-y-0.5">
                          {filteredMonths.map((monthYear) => {
                            const dates = popupDisplayValues.filter(d => d.value.endsWith(`-${monthYear}`));
                            return (
                              <label key={monthYear} className="flex items-center justify-between p-1 hover:bg-emerald-50/50 rounded cursor-pointer text-[11px]">
                                <div className="flex items-center gap-2 truncate pr-1">
                                  <input
                                    type="checkbox"
                                    checked={dates.length > 0 && dates.every(d => (columnFilters[colKey] || []).includes(d.value))}
                                    onChange={() => {
                                      setColumnFilters((prev) => {
                                        const curr = prev[colKey] || [];
                                        const monthDates = popupDisplayValues.filter(d => d.value.endsWith(`-${monthYear}`)).map(d => d.value);
                                        const allSelected = monthDates.length > 0 && monthDates.every(d => curr.includes(d));
                                        const updated = allSelected
                                          ? curr.filter(x => !monthDates.includes(x))
                                          : [...new Set([...curr, ...monthDates])];
                                        if (updated.length === 0) {
                                          const next = { ...prev };
                                          delete next[colKey];
                                          return next;
                                        }
                                        return { ...prev, [colKey]: updated };
                                      });
                                      setCurrentPage(1);
                                    }}
                                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <span className="truncate text-slate-800 font-medium">{monthYear.split("-").reverse().join("/")}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : popupDisplayValues.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[11px]">
                  {isTe ? "విలువలు లేవు" : "No matching values"}
                </div>
              ) : (
                popupDisplayValues.map((item) => {
                  const isChecked = (columnFilters[colKey] || []).includes(item.value);
                  return (
                    <label
                      key={item.value}
                      className="flex items-center justify-between p-1 hover:bg-emerald-50/50 rounded cursor-pointer text-[11px]"
                    >
                      <div className="flex items-center gap-2 truncate pr-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleFilterValue(colKey, item.value)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="truncate text-slate-800 font-medium">{item.value}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                        {item.count}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px]">
              <button
                type="button"
                onClick={() => handleClearColumnFilter(colKey)}
                className="text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
              >
                {isTe ? "ఫిల్టర్ తొలగించు" : "Clear Filter"}
              </button>
              <button
                type="button"
                onClick={() => setActiveFilterCol(null)}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded shadow-xs cursor-pointer"
              >
                {isTe ? "సరే (OK)" : "OK"}
              </button>
            </div>
          </div>
        )}
      </th>
    );
  };

  return (
    <div className="w-full min-w-full space-y-3 flex flex-col min-h-0 bg-white rounded-3xl shadow-sm p-3 md:p-4 font-sans">
      {/* EXCEL SPREADSHEET TOOLBAR */}
      <div className="bg-slate-50 text-slate-800 p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
        </div>

        {/* Right Controls: Lock/Unlock 🔒, Clear Filters, Export XLSX */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lock / Unlock Filters Button 🔒 / 🔓 */}
          <button
            type="button"
            onClick={toggleFiltersLock}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              isFiltersLocked
                ? "bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-sm"
                : "bg-white hover:bg-slate-100 text-slate-600"
            }`}
            title={
              isFiltersLocked
                ? isTe
                  ? "ఫిల్టర్లు లాక్ చేయబడ్డాయి. అన్‌లాక్ చేయడానికి 🔒 నొక్కండి"
                  : "Filters are locked. Click 🔒 to unlock"
                : isTe
                ? "ఫిల్టర్లను లాక్ చేయడానికి 🔓 నొక్కండి"
                : "Click to lock filters 🔒"
            }
          >
            <span className="text-sm">{isFiltersLocked ? "🔒" : "🔓"}</span>
            <span className="whitespace-nowrap">
              {isFiltersLocked
                ? isTe
                  ? "లాక్ (Locked)"
                  : "Filters Locked"
                : isTe
                ? "అన్‌లాక్ (Unlocked)"
                : "Filters Unlocked"}
            </span>
          </button>

          {(Object.keys(columnFilters).length > 0 || searchQuery || statusFilter !== "all") && (
            <button
              type="button"
              disabled={isFiltersLocked}
              onClick={handleClearAllFilters}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                isFiltersLocked
                  ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-400"
                  : "bg-amber-400 hover:bg-amber-500 text-amber-950 cursor-pointer shadow-sm"
              }`}
              title="Reset all active filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isTe ? "ఫిల్టర్లు రీసెట్" : "Reset Filters"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportFilteredExcel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black transition-colors shadow-sm cursor-pointer"
            title="Export filtered records to Excel"
          >
            <Download className="w-4 h-4 text-white" />
            <span>{isTe ? "ఎక్సెల్ డౌన్‌లోడ్" : "Export Excel"}</span>
          </button>
        </div>
      </div>

      {/* QUICK STATUS FILTER TABS */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50 p-2 rounded-2xl">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            disabled={isFiltersLocked}
            onClick={() => handleStatusFilterChange("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400"
                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
            } ${isFiltersLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <span>{isTe ? "అన్నీ (All Cards)" : "All Cards"}</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[10px] font-mono font-bold">
              {allCards.length}
            </span>
          </button>

          <button
            type="button"
            disabled={isFiltersLocked}
            onClick={() => handleStatusFilterChange("Open")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === "Open"
                ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300 font-black"
                : "bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
            } ${isFiltersLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <span>🟢 {isTe ? "ఓపెన్ (Open JC)" : "Open JC"}</span>
            <span className="px-1.5 py-0.2 bg-emerald-200/80 text-emerald-950 rounded-full text-[10px] font-mono font-bold">
              {openCount}
            </span>
          </button>

          <button
            type="button"
            disabled={isFiltersLocked}
            onClick={() => handleStatusFilterChange("Closed")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === "Closed"
                ? "bg-rose-700 text-white border-rose-700 ring-2 ring-rose-300 font-black"
                : "bg-rose-50/70 hover:bg-rose-100 text-rose-900 border-rose-300"
            } ${isFiltersLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <span>🔒 {isTe ? "క్లోజ్డ్ (Closed JC)" : "Closed JC"}</span>
            <span className="px-1.5 py-0.2 bg-rose-200/80 text-rose-950 rounded-full text-[10px] font-mono font-bold">
              {closedCount}
            </span>
          </button>

          <button
            type="button"
            disabled={isFiltersLocked}
            onClick={() => handleStatusFilterChange("MissingOnline")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === "MissingOnline"
                ? "bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-300 font-black"
                : "bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300"
            } ${isFiltersLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <span>⚠️ {isTe ? "పెండింగ్ ఆన్‌లైన్ జేసీ (Pending Online JC)" : "Pending Online JC"}</span>
            <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 rounded-full text-[10px] font-mono font-bold">
              {pendingOnlineCount}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          {isTe
            ? "⚡ సెల్ లో నేరుగా టైప్ చేసి మార్పులు చేయవచ్చు (Auto-save on Blur)"
            : "⚡ Click any cell to edit directly (Auto-saves on blur/Enter)"}
        </div>
      </div>

      {/* PENDING ONLINE JC HELPER BANNER */}
      {statusFilter === "MissingOnline" && (
        <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-bold text-slate-900">
                {isTe
                  ? `ఆన్‌లైన్ జేసీ నెం. ఎంట్రీ అవ్వని జాబ్ కార్డులు (${processedCards.length}) చూపిస్తున్నాము.`
                  : `Showing Job Cards with Pending Online JC Number (${processedCards.length} records).`}
              </p>
              <p className="text-[11px] text-amber-800">
                {isTe
                  ? 'క్రింది షీట్‌లోని "ఆన్‌లైన్ జేసీ నెం." (Online JC No) సెల్‌లో నేరుగా టైప్ చేస్తే ఆటోమేటిక్‌గా సేవ్ అవుతుంది.'
                  : 'Type the Online JC No directly into the cells below and it will save automatically.'}
              </p>
            </div>
          </div>
          {!isFiltersLocked && (
            <button
              type="button"
              onClick={() => handleStatusFilterChange("all")}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              {isTe ? "అన్నీ చూపించు" : "Show All"}
            </button>
          )}
        </div>
      )}

      {/* SEARCH BAR & CHASSIS SEARCH COUNT BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
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
                ? isTe
                  ? "🔒 ఫిల్టర్లు లాక్ చేయబడ్డాయి (మార్చడానికి పైన 🔒 నొక్కండి)..."
                  : "🔒 Filters are locked (Click 🔒 to change)..."
                : isTe
                ? "🔍 ఛాసిస్ నెంబర్ (Chassis No), జాబ్ కార్డ్ నెం, కస్టమర్ పేరు, మొబైల్, మోడల్ తో సెర్చ్ చేయండి..."
                : "🔍 Search by Chassis No, Job Card No, Customer Name, Mobile, Village, Mechanic..."
            }
            className={`w-full pl-9 pr-8 py-1.5 rounded-xl text-xs font-semibold outline-none transition-all ${
              isFiltersLocked
                ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
                : "bg-emerald-50/40 focus:bg-white border border-emerald-200 focus:border-emerald-600 text-slate-900 placeholder:text-slate-400"
            }`}
          />
          {searchQuery && !isFiltersLocked && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Branch Filter Dropdown */}
        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1 shadow-2xs">
          <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
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
        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1 shadow-2xs">
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

        {searchQuery.trim() && (
          <div className="flex items-center gap-2 flex-wrap">
            {chassisMatchInfo && chassisMatchInfo.count > 0 && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-950 rounded-lg text-xs font-black border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                <span>🚜 Chassis "{chassisMatchInfo.query}": <strong>{chassisMatchInfo.count}</strong> Job Card(s) Found</span>
              </span>
            )}
            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200">
              Filtered: {processedCards.length} Cards
            </span>
          </div>
        )}
      </div>

      {/* ACTIVE COLUMN FILTERS BADGES STRIP */}
      {Object.keys(columnFilters).length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
          <span className="font-extrabold text-emerald-900 flex items-center gap-1 text-[11px]">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            {isTe ? "యాక్టివ్ ఫిల్టర్లు:" : "Active Filters:"}
          </span>
          {Object.entries(columnFilters).map(([colKey, vals]) => (
            <span
              key={colKey}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-900 font-bold text-[11px] shadow-2xs"
            >
              <span className="text-emerald-700 font-semibold">{colKey}:</span>
              <span>{vals.join(", ")}</span>
              {!isFiltersLocked && (
                <button
                  type="button"
                  onClick={() => handleClearColumnFilter(colKey)}
                  className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {!isFiltersLocked && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-[10.5px] font-bold text-rose-600 hover:text-rose-800 underline ml-1 cursor-pointer"
            >
              {isTe ? "అన్నీ తీసివేయి" : "Clear All"}
            </button>
          )}
        </div>
      )}

      {/* Bulk selection action bar */}
      {selectedIds.length > 0 && canDelete && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg">
          <span className="text-xs font-bold text-rose-900">
            {isTe
              ? `${selectedIds.length} వరుసలు ఎంపిక చేయబడ్డాయి`
              : `${selectedIds.length} row(s) selected`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectAll && onSelectAll([])}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 cursor-pointer"
            >
              {isTe ? "ఎంపిక తీసివేయి" : "Clear"}
            </button>
            <button
              type="button"
              onClick={() => {
                const msg = isTe
                  ? `${selectedIds.length} జాబ్ కార్డులను శాశ్వతంగా తొలగించాలనుకుంటున్నారా? ఇది వెనక్కి తీసుకోలేరు.`
                  : `Permanently delete ${selectedIds.length} job card(s)? This cannot be undone.`;
                if (window.confirm(msg)) {
                  if (onBulkDelete) onBulkDelete(selectedIds);
                  if (onSelectAll) onSelectAll([]);
                }
              }}
              className="px-3 py-1 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {isTe
                  ? `ఎంపిక చేసినవి తొలగించు (${selectedIds.length})`
                  : `Delete Selected (${selectedIds.length})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* SPREADSHEET TABLE CONTAINER - EXPANDED FULL DISPLAY */}
      <div className="w-full overflow-x-auto border border-slate-300 rounded-xl shadow-xs bg-white max-h-[calc(100vh-220px)] overflow-y-auto relative">
        <table className="w-full text-left text-slate-700 border-collapse border border-slate-300 font-sans min-w-max">
          {/* HEADER ROW */}
          <thead className="sticky top-0 z-30 shadow-xs">
            <tr>
              {/* Col 1: Sl No & Selection */}
              <th className="bg-slate-100 text-slate-800 font-extrabold uppercase tracking-wider text-[10.5px] border-r border-b-2 border-slate-300 p-2 text-center select-none w-14">
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedCards.length && paginatedCards.length > 0}
                    onChange={(e) => {
                      if (onSelectAll) {
                        if (e.target.checked) {
                          onSelectAll(paginatedCards.map((c) => c.id));
                        } else {
                          onSelectAll([]);
                        }
                      }
                    }}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>#</span>
                </div>
              </th>

              {/* Col 2: STATUS */}
              {renderHeaderFilterCell("status", isTe ? "స్టేటస్ (Status)" : "Status", "w-28 text-center")}

              {/* ALL 26 DETAILED COLUMNS */}
              {detailedColumns.map((col) => renderHeaderFilterCell(col.key, col.label, col.width))}

              {/* LAST COLUMN: ACTIONS */}
              <th className="bg-slate-100 text-slate-800 font-extrabold uppercase tracking-wider text-[10px] border-b-2 border-slate-300 py-2 px-1 text-center select-none w-20 min-w-[80px] sticky right-0 z-30 shadow-md">
                <div className="flex items-center justify-center gap-1">
                  <span>{isTe ? "చర్యలు" : "Actions"}</span>
                </div>
              </th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="divide-y divide-slate-200 font-medium">
            {paginatedCards.length === 0 ? (
              <tr>
                <td
                  colSpan={detailedColumns.length + 3}
                  className="py-16 text-center text-slate-400 bg-slate-50/50"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🔍</span>
                    <p className="font-bold text-slate-600 text-sm">
                      {isTe
                        ? "ఫిల్టర్‌కు తగిన జాబ్ కార్డ్స్ ఏవీ కనుగొనబడలేదు"
                        : "No matching job card records found."}
                    </p>
                    {(Object.keys(columnFilters).length > 0 || statusFilter !== "all") && !isFiltersLocked && (
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                      >
                        {isTe ? "ఫిల్టర్లు రీసెట్ చేయండి" : "Reset Filters"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCards.map((card, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                const isSelected = selectedIds.includes(card.id);
                const draft = rowDrafts[card.id];
                const isClosed = isCardClosed(card, draft);
                const isSaving = savingRows[card.id];
                const isSavedSuccess = savedSuccessRows[card.id];

                return (
                  <tr
                    key={card.id || `card-${idx}`}
                    className={`transition-colors group hover:bg-emerald-50/40 ${
                      isSelected ? "bg-emerald-50/70" : idx % 2 === 1 ? "bg-slate-50/30" : "bg-white"
                    }`}
                  >
                    {/* 1. SELECTION & SL NO */}
                    <td className={`${cellPadding} text-center font-mono border-r border-slate-200 select-none bg-slate-50/50`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (onSelectOne) {
                              onSelectOne(card.id, e.target.checked);
                            } else if (onToggleSelect) {
                              onToggleSelect(card.id);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-slate-400 text-[10.5px] font-bold">{globalIndex}</span>
                      </div>
                    </td>

                    {/* 2. STATUS (OPEN / CLOSED BADGE WITH AUTO STATUS & TOGGLE) */}
                    <td className={`${cellPadding} text-center border-r border-slate-200 select-none`}>
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(card, e)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase transition-all shadow-2xs cursor-pointer border flex items-center justify-center gap-1 mx-auto ${
                          isClosed
                            ? "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                        }`}
                        title={
                          isClosed
                            ? isTe
                              ? "స్టేటస్: క్లోజ్డ్ (ఓపెన్ చేయడానికి క్లిక్ చేయండి)"
                              : "Status: Closed (Click to reopen)"
                            : isTe
                            ? "స్టేటస్: ఓపెన్ (క్లోజ్డ్ తేదీ & బిల్ నెం నమోదు చేస్తే క్లోజ్ అవుతుంది)"
                            : "Status: Open (Enter Closed Date & Bill No to close)"
                        }
                      >
                        <span className="text-sm">{isClosed ? "🔒" : "🟢"}</span>
                      </button>
                    </td>

                    {/* DETAILED 26 EXCEL COLUMNS WITH LIVE INLINE EDITING */}
                    {detailedColumns.map((col) => {
                      const cellVal = getCellEditValue(card, col.key);
                      const isDirty = draft && draft[col.key] !== undefined;
                      const isDateCol =
                        col.key === "complaintDate" ||
                        col.key === "jobDate" ||
                        col.key === "dateOfDelivery" ||
                        col.key === "actualClosedDate";

                      let datalistId = "";
                      if (col.key === "branch") datalistId = "branches-list-options";
                      else if (col.key === "mechanic") datalistId = "mechanics-list-options";
                      else if (col.key === "serviceType") datalistId = "service-types-options";
                      else if (col.key === "serviceLocation") datalistId = "locations-list-options";

                      const isOnlineJC = col.key === "onlineJobCardNo";
                      const isOnlineJCEmpty = isOnlineJC && !cellVal.trim();

                      return (
                        <td
                          key={col.key}
                          className={`${cellPadding} border-r border-slate-200 p-0.5 relative ${
                            isDirty ? "bg-amber-50/60 ring-1 ring-amber-300" : ""
                          }`}
                        >
                          <input
                            type={isDateCol ? "date" : "text"}
                            list={datalistId || undefined}
                            value={cellVal}
                            onChange={(e) => handleRowFieldChange(card.id, col.key, e.target.value)}
                            onBlur={() => handleCellBlur(card)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            placeholder={
                              isOnlineJC
                                ? isTe
                                  ? "జేసీ నెం."
                                  : "Online JC #"
                                : col.key === "billNo"
                                ? isTe
                                  ? "బిల్ నెం."
                                  : "Bill #"
                                : ""
                            }
                            className={`w-full text-xs transition-all outline-none rounded px-1.5 py-1 ${
                              isOnlineJCEmpty
                                ? "bg-rose-50 hover:bg-white focus:bg-white text-rose-900 border border-rose-300 focus:border-rose-600 focus:ring-1 focus:ring-rose-500 font-mono font-black placeholder:text-rose-400 placeholder:font-sans"
                                : isOnlineJC
                                ? "bg-transparent hover:bg-white focus:bg-white text-slate-900 border border-transparent hover:border-emerald-300 focus:border-emerald-600 font-mono font-black"
                                : col.key === "chassisNo" || col.key === "jobNo"
                                ? "font-mono font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-emerald-300 focus:border-emerald-600"
                                : col.key === "custName"
                                ? "font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-emerald-300 focus:border-emerald-600"
                                : "text-slate-800 font-medium bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-emerald-300 focus:border-emerald-600"
                            }`}
                          />
                        </td>
                      );
                    })}

                    {/* LAST COLUMN: ACTIONS WITH ROW ACTION BUTTONS */}
                    <td className={`${cellPadding} text-center sticky right-0 z-20 bg-white group-hover:bg-emerald-50/90 shadow-md border-l border-slate-200`}>
                      <RowActionButtons
                        isExpanded={!!expandedRowKeys[card.id]}
                        onToggleExpand={() => toggleRowActions(card.id)}
                        language={language}
                        onView={() => onView(card)}
                        onEdit={() => onEdit(card)}
                        onPrint={() => onPrint(card)}
                        onSave={() => handleSaveRow(card)}
                        isSaving={isSaving}
                        isSaved={isSavedSuccess}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        canCreate={canCreate}
                        onRegisterComplaint={onRegisterComplaint ? () => onRegisterComplaint(card) : undefined}
                        onDelete={() => {
                          if (
                            window.confirm(
                              isTe
                                ? `ఈ జాబ్ కార్డ్ ని తొలగించాలనుకుంటున్నారా?`
                                : `Are you sure you want to delete this job card?`
                            )
                          ) {
                            onDelete(card.id);
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

      {/* SPREADSHEET BOTTOM STATUS BAR & PAGINATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-semibold text-[11px] flex-wrap">
          <span>
            {isTe ? "చూపిస్తున్నవి:" : "Showing"}{" "}
            <strong className="text-slate-900">
              {processedCards.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{" "}
            -{" "}
            <strong className="text-slate-900">
              {Math.min(currentPage * pageSize, processedCards.length)}
            </strong>{" "}
            of <strong className="text-slate-900">{processedCards.length}</strong>
          </span>
          {selectedIds.length > 0 && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-bold">
              {selectedIds.length} {isTe ? "ఎంపిక చేయబడ్డాయి" : "selected"}
            </span>
          )}
          {isFiltersLocked && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold flex items-center gap-1">
              <span>🔒</span>
              <span>{isTe ? "ఫిల్టర్లు లాక్ చేయబడ్డాయి" : "Filters Locked"}</span>
            </span>
          )}
        </div>

        {/* Page Size & Navigation Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-600 text-[11px]">
            <span>{isTe ? "పేజీకి:" : "Per page:"}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-slate-700 outline-none"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-[11px]"
            >
              «
            </button>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-[11px]"
            >
              ‹
            </button>
            <span className="px-2 text-slate-700 font-bold text-[11px]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-[11px]"
            >
              ›
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-[11px]"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* DATALISTS FOR INLINE SPREADSHEET INPUTS */}
      <datalist id="branches-list-options">
        {(branchesList.length > 0
          ? branchesList
          : ["Vuyyuru", "Vijayawada", "Machilipatnam", "Gudivada", "Nuzvid", "Tiruvuru"]
        ).map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      <datalist id="mechanics-list-options">
        {mechanicsList.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <datalist id="service-types-options">
        {serviceTypes.map((st) => (
          <option key={st} value={st} />
        ))}
      </datalist>

      <datalist id="locations-list-options">
        <option value="Workshop" />
        <option value="DSS / Field" />
        <option value="Event / Camp" />
      </datalist>
    </div>
  );
};
