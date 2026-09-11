import React, { useState, useMemo } from "react";
import {
  X,
  Package,
  Search,
  Download,
  Calendar,
  Phone,
  PlusCircle,
  FileText,
  User,
  ExternalLink,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  Tractor,
} from "lucide-react";
import { formatDisplayDate } from "../utils/dateFormatter";

export interface ThisMonthDeliveriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: any[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onCreateJobCard: (cust: any) => void;
  onViewSavedCards: (cust: any) => void;
  onViewFollowup: (cust: any) => void;
  onOpenMonthFollowup: () => void;
  onExportCSV: () => void;
  reportedChassisSet: Set<string>;
  language?: "te" | "en";
  monthString?: string;
}

export const ThisMonthDeliveriesModal: React.FC<ThisMonthDeliveriesModalProps> = ({
  isOpen,
  onClose,
  deliveries,
  searchTerm,
  onSearchChange,
  onCreateJobCard,
  onViewSavedCards,
  onViewFollowup,
  onOpenMonthFollowup,
  onExportCSV,
  reportedChassisSet,
  language = "te",
  monthString,
}) => {
  const isTe = language === "te";
  const [filterTab, setFilterTab] = useState<"all" | "reported" | "pending">("all");

  const normalizeChassis = (val: any) =>
    String(val || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const getCustomerField = (cust: any, type: string) => {
    switch (type) {
      case "name":
        return cust["Customer Name"] || cust.custName || cust.name || cust.customerName || "";
      case "mobile":
        return cust["Mobile No"] || cust.phNo || cust.mobile || cust.mobileNumber || "";
      case "model":
        return cust.Model || cust.model || cust.tractorModel || "";
      case "chassis":
        return cust["Chassis no"] || cust.__chassisDisplay || cust.chassis || cust.chassisNo || "";
      case "engine":
        return cust["Engine no"] || cust.engineNo || cust.engine || "";
      case "village":
        return cust.Village || cust.village || "";
      case "mandal":
        return cust.Mandal || cust.mandal || "";
      case "date":
        return cust["Date of del"] || cust.dateOfDel || cust.dateOfDelivery || cust.installDate || "";
      default:
        return "";
    }
  };

  const safeReportedSet = useMemo(() => {
    return reportedChassisSet instanceof Set ? reportedChassisSet : new Set<string>();
  }, [reportedChassisSet]);

  // Filtered records
  const filteredList = useMemo(() => {
    let list = deliveries || [];

    // Filter by tab
    if (filterTab === "reported") {
      list = list.filter((c) => {
        const ch = normalizeChassis(getCustomerField(c, "chassis"));
        return safeReportedSet.has(ch);
      });
    } else if (filterTab === "pending") {
      list = list.filter((c) => {
        const ch = normalizeChassis(getCustomerField(c, "chassis"));
        return !safeReportedSet.has(ch);
      });
    }

    // Filter by search term
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((c) => {
        const name = getCustomerField(c, "name").toLowerCase();
        const mobile = getCustomerField(c, "mobile").toLowerCase();
        const chassis = getCustomerField(c, "chassis").toLowerCase();
        const village = getCustomerField(c, "village").toLowerCase();
        const model = getCustomerField(c, "model").toLowerCase();
        return (
          name.includes(q) ||
          mobile.includes(q) ||
          chassis.includes(q) ||
          village.includes(q) ||
          model.includes(q)
        );
      });
    }

    return list;
  }, [deliveries, filterTab, searchTerm, safeReportedSet]);

  const counts = useMemo(() => {
    let reported = 0;
    let pending = 0;
    (deliveries || []).forEach((c) => {
      const ch = normalizeChassis(getCustomerField(c, "chassis"));
      if (safeReportedSet.has(ch)) {
        reported++;
      } else {
        pending++;
      }
    });
    return { total: (deliveries || []).length, reported, pending };
  }, [deliveries, safeReportedSet]);

  if (!isOpen) return null;

  const currentMonthDisplay =
    monthString ||
    new Date().toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 text-white shadow-inner">
              <Package className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-wide text-white">
                  {isTe ? "ఈ నెల డెలివరీలు" : "This Month Deliveries"}
                </h3>
                <span className="bg-amber-400 text-slate-950 text-[11px] font-black px-2.5 py-0.5 rounded-full font-mono shadow-xs">
                  {currentMonthDisplay}
                </span>
                <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                  {counts.total} {isTe ? "ట్రాక్టర్లు" : "Tractors"}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5 font-medium">
                {isTe
                  ? "ఈ నెలలో డెలివరీ చేయబడిన ట్రాక్టర్ల వివరాలు & జాబ్ కార్డ్ స్థితి"
                  : "Tractor delivery details & job card reporting status for the current month"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-indigo-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Summary Badges */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterTab === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-indigo-700 hover:bg-slate-100"
              }`}
            >
              <span>{isTe ? "మొత్తం డెలివరీలు" : "All Deliveries"}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filterTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {counts.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("reported")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterTab === "reported"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-emerald-700 hover:bg-slate-100"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isTe ? "జాబ్ కార్డ్ రికార్డ్ అయినవి" : "Job Card Created"}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filterTab === "reported"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {counts.reported}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterTab === "pending"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-amber-700 hover:bg-slate-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{isTe ? "జాబ్ కార్డ్ పెండింగ్" : "Pending Job Card"}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filterTab === "pending"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {counts.pending}
              </span>
            </button>
          </div>

          {/* Action buttons on top right */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onExportCSV}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title={isTe ? "ఎక్సెల్ / CSV డౌన్‌లోడ్" : "Export CSV"}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTe ? "CSV ఎగుమతి" : "Export CSV"}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMonthFollowup}
              className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-900 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title={isTe ? "ఫాలో-అప్ టేబుల్‌లో తెరవండి" : "Open in Follow-up View"}
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isTe ? "ఫాలో-అప్ వ్యూ" : "Follow-up View"}</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-3 sm:px-5 bg-white border-b border-slate-100 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                isTe
                  ? "కస్టమర్ పేరు, మొబైల్, ఛాసిస్ నెం, గ్రామం లేదా మోడల్ ద్వారా వెతకండి..."
                  : "Search by Customer Name, Mobile, Chassis No, Village, or Model..."
              }
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 hover:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-slate-500 font-bold font-mono shrink-0 whitespace-nowrap">
            {filteredList.length} / {counts.total}
          </span>
        </div>

        {/* Deliveries List Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50/50">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-400 mb-3">
                <Package className="w-10 h-10" />
              </div>
              <h4 className="text-sm font-black text-slate-800">
                {isTe ? "ఎలాంటి డెలివరీ రికార్డులు కనుగొనబడలేదు" : "No Delivery Records Found"}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {searchTerm
                  ? isTe
                    ? "శోధన పదానికి తగిన రికార్డులు ఏవీ లేవు. దయచేసి శోధన పదాన్ని మార్చి ప్రయత్నించండి."
                    : "No records matched your search query. Try clearing the search."
                  : isTe
                  ? "ఈ నెలకు సంబంధించిన డెలివరీ రికార్డులు కస్టమర్ డేటాబేస్‌లో లేవు."
                  : "There are no deliveries recorded for this month in the database."}
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="mt-3 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  {isTe ? "శోధన తొలగించండి" : "Clear Search"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-black text-[11px] border-b border-slate-200 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3">{isTe ? "కస్టమర్ & మొబైల్" : "Customer & Mobile"}</th>
                      <th className="py-2.5 px-3">{isTe ? "ట్రాక్టర్ మోడల్ & ఛాసిస్" : "Tractor Model & Chassis"}</th>
                      <th className="py-2.5 px-3">{isTe ? "గ్రామం / మండలం" : "Village / Mandal"}</th>
                      <th className="py-2.5 px-3">{isTe ? "డెలివరీ తేదీ" : "Delivery Date"}</th>
                      <th className="py-2.5 px-3 text-center">{isTe ? "సర్వీస్ స్థితి" : "Service Status"}</th>
                      <th className="py-2.5 px-3 text-right">{isTe ? "చర్యలు" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.map((cust, idx) => {
                      const name = getCustomerField(cust, "name") || "Unknown";
                      const mobile = getCustomerField(cust, "mobile");
                      const model = getCustomerField(cust, "model");
                      const chassis = getCustomerField(cust, "chassis");
                      const engine = getCustomerField(cust, "engine");
                      const village = getCustomerField(cust, "village");
                      const mandal = getCustomerField(cust, "mandal");
                      const date = getCustomerField(cust, "date");
                      const normChassis = normalizeChassis(chassis);
                      const hasJobCard = safeReportedSet.has(normChassis);

                      return (
                        <tr
                          key={cust.id || cust._id || normChassis || idx}
                          className="hover:bg-indigo-50/40 transition-colors group"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono font-bold text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              <span>{name}</span>
                            </div>
                            {mobile && (
                              <a
                                href={`tel:${mobile}`}
                                className="text-[11px] font-mono text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-0.5"
                                title="Click to call"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                <span>{mobile}</span>
                              </a>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <Tractor className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{model || "Eicher Tractor"}</span>
                            </div>
                            <div className="text-[10.5px] font-mono font-bold text-slate-600 mt-0.5">
                              Chassis: <span className="text-slate-900">{chassis || "—"}</span>
                            </div>
                            {engine && (
                              <div className="text-[10px] font-mono text-slate-400">
                                Eng: {engine}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-800">{village || "—"}</div>
                            {mandal && (
                              <div className="text-[10.5px] text-slate-500">{mandal}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-mono text-slate-700 font-bold flex items-center gap-1 text-[11px]">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatDisplayDate(date)}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {hasJobCard ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{isTe ? "జాబ్ కార్డ్ ఉంది" : "Reporting"}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>{isTe ? "పెండింగ్" : "Non-Reporting"}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onCreateJobCard(cust)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                title={isTe ? "నూతన జాబ్ కార్డ్ ప్రారంభించండి" : "Create New Job Card"}
                              >
                                <PlusCircle className="w-3 h-3" />
                                <span>{isTe ? "జాబ్ కార్డ్" : "Job Card"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onViewSavedCards(cust)}
                                className="p-1.5 bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-600 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border border-slate-200"
                                title={isTe ? "సేవ్ చేసిన జాబ్ కార్డులు చూడండి" : "View Saved Job Cards"}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onViewFollowup(cust)}
                                className="p-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-600 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border border-slate-200"
                                title={isTe ? "కస్టమర్ వివరాలు / ఫాలో-అప్" : "Customer Registry & Follow-up"}
                              >
                                <User className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2.5">
                {filteredList.map((cust, idx) => {
                  const name = getCustomerField(cust, "name") || "Unknown";
                  const mobile = getCustomerField(cust, "mobile");
                  const model = getCustomerField(cust, "model");
                  const chassis = getCustomerField(cust, "chassis");
                  const village = getCustomerField(cust, "village");
                  const mandal = getCustomerField(cust, "mandal");
                  const date = getCustomerField(cust, "date");
                  const normChassis = normalizeChassis(chassis);
                  const hasJobCard = safeReportedSet.has(normChassis);

                  return (
                    <div
                      key={cust.id || cust._id || normChassis || idx}
                      className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-black text-slate-400 mr-1.5">
                            #{idx + 1}
                          </span>
                          <span className="font-black text-slate-900 text-xs">{name}</span>
                          {mobile && (
                            <a
                              href={`tel:${mobile}`}
                              className="text-[11px] font-mono text-blue-600 flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>{mobile}</span>
                            </a>
                          )}
                        </div>

                        {hasJobCard ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{isTe ? "జాబ్ కార్డ్ ఉంది" : "Reporting"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{isTe ? "పెండింగ్" : "Non-Reporting"}</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400 text-[10px] block">
                            {isTe ? "మోడల్ / ఛాసిస్" : "Model / Chassis"}
                          </span>
                          <span className="font-bold text-slate-800">{model || "Eicher"}</span>
                          <span className="font-mono text-slate-600 block text-[10px] truncate">
                            {chassis || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">
                            {isTe ? "గ్రామం / తేదీ" : "Village / Date"}
                          </span>
                          <span className="font-medium text-slate-700 truncate block">
                            {village || "—"} {mandal ? `(${mandal})` : ""}
                          </span>
                          <span className="font-mono text-slate-600 block text-[10px]">
                            {formatDisplayDate(date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewSavedCards(cust)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer"
                          >
                            {isTe ? "కార్డులు" : "Cards"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewFollowup(cust)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer"
                          >
                            {isTe ? "వివరాలు" : "Details"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onCreateJobCard(cust)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>{isTe ? "+ జాబ్ కార్డ్" : "+ Job Card"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-600 font-medium hidden sm:inline">
            {isTe
              ? "ఏదైనా కస్టమర్ రికార్డుపై '+ జాబ్ కార్డ్' క్లిక్ చేసి వెంటనే జాబ్ కార్డ్ నమోదు చేయవచ్చు"
              : "Click '+ Job Card' on any customer row to instantly open a new job card entry form"}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-md transition-all ml-auto cursor-pointer"
          >
            {isTe ? "మూసివేయండి (Close)" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
