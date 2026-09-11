import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  Printer,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  User,
  Wrench,
  CheckSquare,
  Sparkles,
  MapPin,
  Tag
} from "lucide-react";
import { formatDisplayDate } from "../utils/dateFormatter";

interface JobCardFiveBoxRowProps {
  card: any;
  cardIdx: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEditFull: (card: any) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedFields: Record<string, any>) => Promise<boolean | void>;
  language: "te" | "en";
  mechanicsList?: string[];
  serviceTypes?: string[];
  branchesList?: string[];
  boxHeight?: string;
}

function toInputDate(val: any): string {
  if (!val) return "";
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split("-");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const dateObj = new Date(val);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().slice(0, 10);
  }
  return "";
}

function formatDateDisplay(val: any): string {
  return formatDisplayDate(val, "—");
}

export const JobCardFiveBoxRow: React.FC<JobCardFiveBoxRowProps> = ({
  card,
  cardIdx,
  isSelected,
  onToggleSelect,
  onEditFull,
  onDelete,
  onUpdate,
  language,
  mechanicsList = [],
  serviceTypes = [
    "1st Free",
    "2nd Free",
    "3rd Free",
    "4th Free",
    "5th Free",
    "6th Free",
    "7th Free",
    "8th Free",
    "9th Free",
    "10th Free",
    "Paid Service",
    "Paid Repairs",
    "Running Repair",
    "Under Wty Repairs",
    "Major Overhaul",
    "PDI",
    "Breakdown Service",
    "Campaign"
  ],
  branchesList = ["Vuyyuru", "Vijayawada", "Machilipatnam", "Gudivada", "Nuzvid", "Tiruvuru"],
  boxHeight = "2cm"
}) => {
  const isTelugu = language === "te";
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const effectiveHeight = isExpanded ? "auto" : (boxHeight || "2cm");
  const is2cm = !isExpanded && (effectiveHeight === "2cm" || effectiveHeight === "76px");

  // Editable draft state for Box 1, Box 4, Box 5
  const [draft, setDraft] = useState({
    onlineJobCardNo: card.onlineJobCardNo || card.jobNo || "",
    jobDate: toInputDate(card.jobDate),
    complaintDate: toInputDate(card.complaintDate),
    status: card.status || "Open",
    dateTimeIn: card.dateTimeIn || "",
    branch: card.branch || "",

    hourMeter: card.hourMeter ?? card.hrsRun ?? "",
    serviceType: card.serviceType || "",
    freeServiceList: card.freeServiceList || "",
    extraRepairs: card.extraRepairs || card.problemDescription || "",
    gTotal: card.gTotal ?? "",

    actualClosedDate: toInputDate(card.actualClosedDate || card.dateTimeOut),
    mechanic: card.mechanic || card.technicianName || "",
    billNo: card.billNo || "",
    serviceLocation: card.serviceLocation || "workshop",
    reasonsForAnalysis: card.reasonsForAnalysis || "",
    telecalling: card.telecalling || ""
  });

  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Sync draft if parent card changes externally
  useEffect(() => {
    setDraft({
      onlineJobCardNo: card.onlineJobCardNo || card.jobNo || "",
      jobDate: toInputDate(card.jobDate),
      complaintDate: toInputDate(card.complaintDate),
      status: card.status || "Open",
      dateTimeIn: card.dateTimeIn || "",
      branch: card.branch || "",

      hourMeter: card.hourMeter ?? card.hrsRun ?? "",
      serviceType: card.serviceType || "",
      freeServiceList: card.freeServiceList || "",
      extraRepairs: card.extraRepairs || card.problemDescription || "",
      gTotal: card.gTotal ?? "",

      actualClosedDate: toInputDate(card.actualClosedDate || card.dateTimeOut),
      mechanic: card.mechanic || card.technicianName || "",
      billNo: card.billNo || "",
      serviceLocation: card.serviceLocation || "workshop",
      reasonsForAnalysis: card.reasonsForAnalysis || "",
      telecalling: card.telecalling || ""
    });
  }, [card]);

  // Check if anything has been modified
  const isDirty =
    draft.onlineJobCardNo !== (card.onlineJobCardNo || card.jobNo || "") ||
    draft.jobDate !== toInputDate(card.jobDate) ||
    draft.complaintDate !== toInputDate(card.complaintDate) ||
    draft.status !== (card.status || "Open") ||
    draft.dateTimeIn !== (card.dateTimeIn || "") ||
    draft.branch !== (card.branch || "") ||
    String(draft.hourMeter) !== String(card.hourMeter ?? card.hrsRun ?? "") ||
    draft.serviceType !== (card.serviceType || "") ||
    draft.freeServiceList !== (card.freeServiceList || "") ||
    draft.extraRepairs !== (card.extraRepairs || card.problemDescription || "") ||
    String(draft.gTotal) !== String(card.gTotal ?? "") ||
    draft.actualClosedDate !== toInputDate(card.actualClosedDate || card.dateTimeOut) ||
    draft.mechanic !== (card.mechanic || card.technicianName || "") ||
    draft.billNo !== (card.billNo || "") ||
    draft.serviceLocation !== (card.serviceLocation || "workshop") ||
    draft.reasonsForAnalysis !== (card.reasonsForAnalysis || "") ||
    draft.telecalling !== (card.telecalling || "");

  const handleFieldChange = (field: string, value: any) => {
    setDraft(prev => {
      const next = { ...prev, [field]: value };
      // If user sets an actual closed date and status is still Open, auto-switch to Closed
      if (field === "actualClosedDate" && value && next.status === "Open") {
        next.status = "Closed";
      }
      return next;
    });
  };

  const handleSaveUpdate = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        onlineJobCardNo: draft.onlineJobCardNo,
        jobNo: draft.onlineJobCardNo,
        jobDate: draft.jobDate,
        complaintDate: draft.complaintDate,
        status: draft.status,
        dateTimeIn: draft.dateTimeIn,
        branch: draft.branch,

        hourMeter: draft.hourMeter,
        hrsRun: draft.hourMeter,
        serviceType: draft.serviceType,
        freeServiceList: draft.freeServiceList,
        extraRepairs: draft.extraRepairs,
        problemDescription: draft.extraRepairs || card.problemDescription || "",
        gTotal: draft.gTotal,

        actualClosedDate: draft.actualClosedDate,
        dateTimeOut: draft.actualClosedDate,
        mechanic: draft.mechanic,
        technicianName: draft.mechanic,
        billNo: draft.billNo,
        serviceLocation: draft.serviceLocation,
        reasonsForAnalysis: draft.reasonsForAnalysis,
        telecalling: draft.telecalling
      };

      await onUpdate(card.id, payload);
      setIsSaving(false);
      setJustSaved(true);
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setTimeout(() => setJustSaved(false), 4000);
    } catch (err) {
      console.error("Save failed:", err);
      setIsSaving(false);
    }
  };

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  const cleanPhone = String(card.ownerMob || card.phNo || card.custPhone || card.mobileNumber || "").replace(/\D/g, "");
  const isCardClosed = draft.status === "Closed";
  const isWtyCard = card.warrantyStatus === "Under Warranty" || (card.warranty && String(card.warranty).toLowerCase().includes("under"));

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-150 p-2.5 space-y-2 shadow-xs hover:shadow-md ${
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/10"
          : isDirty
          ? "border-amber-400 ring-2 ring-amber-100"
          : justSaved
          ? "border-emerald-400 ring-2 ring-emerald-100"
          : "border-slate-200 hover:border-indigo-300"
      }`}
    >
      {/* CARD TOP HEADER & ACTION CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 pb-1.5 bg-slate-50/80 -mx-2.5 -mt-2.5 p-2 rounded-t-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(card.id)}
            className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="px-2 py-0.5 bg-slate-800 text-white rounded font-mono font-bold text-[10px]">
            #{cardIdx}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
              isCardClosed
                ? "bg-slate-100 text-slate-700 border-slate-300"
                : "bg-emerald-100 text-emerald-800 border-emerald-300"
            }`}
          >
            {isCardClosed ? (isTelugu ? "🔘 క్లోజ్డ్" : "🔘 Closed") : (isTelugu ? "🟢 ఓపెన్" : "🟢 Open")}
          </span>

          <span className="text-xs font-black text-slate-900 font-mono">
            JC: {draft.onlineJobCardNo || card.jobNo || "Draft"}
          </span>

          {card.custName && (
            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[160px]" title={card.custName}>
              👤 {card.custName}
            </span>
          )}

          {draft.branch && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 rounded font-bold text-[9px] uppercase border border-blue-200">
              {draft.branch}
            </span>
          )}

          {/* Horizontal movement prompt badge */}
          <div className="hidden sm:flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[9.5px] font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
            <span>↔️ {isTelugu ? "1 లైన్‌లో 5 బాక్సులు (ఎడమ/కుడికి జరపండి)" : "5 Boxes in 1 Row (Scroll Left/Right)"}</span>
          </div>
        </div>

        {/* TOP ACTIONS & UPDATE BUTTON */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Scroll Nav Buttons */}
          <div className="flex items-center bg-white border border-slate-300 rounded-md p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={scrollLeft}
              className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors cursor-pointer"
              title={isTelugu ? "ఎడమవైపుకు జరపండి (Box 1-3)" : "Scroll Left (Box 1-3)"}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[9px] font-bold text-slate-500 px-1">1→5</span>
            <button
              type="button"
              onClick={scrollRight}
              className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors cursor-pointer"
              title={isTelugu ? "కుడివైపుకు జరపండి (Box 4-5)" : "Scroll Right (Box 4-5)"}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* PRIMARY UPDATE BUTTON */}
          <button
            type="button"
            onClick={handleSaveUpdate}
            disabled={isSaving}
            className={`px-3 py-1 rounded-md transition-all font-black text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer ${
              justSaved
                ? "bg-emerald-600 text-white ring-2 ring-emerald-300 animate-pulse"
                : isDirty
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-300 font-extrabold"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
            title={isTelugu ? "బాక్స్ 1, 4, 5 లో మార్చిన వివరాలను సేవ్ చేయండి" : "Update & Save changes in Box 1, 4, 5"}
          >
            {isSaving ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{isTelugu ? "సేవ్ అవుతోంది..." : "Saving..."}</span>
              </>
            ) : justSaved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>{isTelugu ? "✅ అప్‌డేట్ అయ్యింది!" : "✅ Saved!"}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isDirty ? (isTelugu ? "💾 Update (సేవ్ చేయండి)" : "💾 Update Changes") : (isTelugu ? "💾 Update" : "💾 Update")}</span>
              </>
            )}
          </button>

          {/* Box Height Toggle Button (2 cm vs Full) */}
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className={`px-2 py-1 rounded border transition-all font-bold text-[10px] flex items-center gap-1 cursor-pointer ${
              isExpanded
                ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
            }`}
            title={
              isExpanded
                ? (isTelugu ? "బాక్సులను 2 cm కి కుదించండి" : "Collapse boxes to 2 cm")
                : (isTelugu ? "బాక్సులను పూర్తి సైజ్ కు విస్తరించండి" : "Expand boxes to Full")
            }
          >
            <span>{isExpanded ? "📏" : "↕️"}</span>
            <span>{isExpanded ? (isTelugu ? "2 cm కుదించు" : "2 cm Size") : (isTelugu ? "పూర్తి సైజ్" : "Expand")}</span>
          </button>

          {/* Full Form Edit Button */}
          <button
            type="button"
            onClick={() => onEditFull(card)}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-all font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            title={isTelugu ? "పూర్తి ఎంట్రీ ఫారమ్ లో ఎడిట్ చేయండి" : "Open Full Entry Form"}
          >
            <Edit3 className="w-3 h-3" />
            <span>{isTelugu ? "ఫారమ్" : "Full Form"}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={() => {
              onEditFull(card);
              setTimeout(() => {
                window.print();
              }, 250);
            }}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-all font-bold text-[10px] flex items-center gap-1 cursor-pointer"
            title={isTelugu ? "ఈ జాబ్ కార్డును ప్రింట్ చేయండి" : "Print this Job Card"}
          >
            <Printer className="w-3 h-3" />
            <span>{isTelugu ? "ప్రింట్" : "Print"}</span>
          </button>

          {/* WhatsApp Button */}
          {cleanPhone && (
            <a
              href={`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
                `Namaste ${card.custName || "Customer"} garu, Sri Gayathri Automotives Eicher Tractor Service update for JC #${
                  draft.onlineJobCardNo || card.jobNo || ""
                }. Chassis: ${card.chassisNo || ""}, Service: ${draft.serviceType || ""}, Hours: ${draft.hourMeter || ""} Hrs. Status: ${
                  draft.status || "Open"
                }. Contact us for any queries.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-[10px] flex items-center gap-1 transition-all shadow-2xs"
              title="Send WhatsApp update to customer"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            className="p-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded border border-red-200 transition-all cursor-pointer"
            title="Delete this Job Card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* DIRTY / SAVE SUCCESS BANNER */}
      {justSaved && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isTelugu
                ? `✅ జాబ్ కార్డ్ (${draft.onlineJobCardNo || card.jobNo}) వివరాలు క్లౌడ్ డేటాబేస్ లో విజయవంతంగా సేవ్ అయ్యాయి!`
                : `✅ Job card (${draft.onlineJobCardNo || card.jobNo}) details saved and updated successfully!`}
            </span>
          </div>
          {lastSavedTime && (
            <span className="text-[10px] text-emerald-700 font-mono">
              {isTelugu ? `సమయం: ${lastSavedTime}` : `Saved at: ${lastSavedTime}`}
            </span>
          )}
        </div>
      )}

      {isDirty && !justSaved && (
        <div className="bg-amber-50 border border-amber-300 text-amber-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all animate-pulse">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {isTelugu
                ? "⚠️ బాక్స్ 1, 4 లేదా 5 లో మార్పులు ఉన్నాయి. డేటాను భద్రపరచడానికి పైన ఉన్న 'Update' బటన్ నొక్కండి."
                : "⚠️ Changes detected in Box 1, 4, or 5. Click the 'Update' button to save to the database."}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSaveUpdate}
            disabled={isSaving}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-extrabold text-[10.5px] cursor-pointer"
          >
            {isTelugu ? "ఇప్పుడే సేవ్ చేయండి" : "Save Now"}
          </button>
        </div>
      )}

      {/* 5 BOXES IN 1 HORIZONTAL LINE - SIDE-BY-SIDE WITH HORIZONTAL SCROLL */}
      <div
        ref={scrollContainerRef}
        className="flex flex-nowrap overflow-x-auto gap-2.5 pb-2 pt-0.5 items-stretch scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
      >
        {/* ========================================================================= */}
        {/* BOX 1: జాబ్ & తేదీల వివరాలు (JOB & DATES) - [EDITABLE DIRECTLY] */}
        {/* ========================================================================= */}
        <div
          style={isExpanded ? undefined : { height: effectiveHeight, minHeight: effectiveHeight, maxHeight: effectiveHeight }}
          className={`min-w-[285px] w-[285px] shrink-0 bg-blue-50/70 border-2 border-blue-300/80 rounded-xl flex flex-col justify-between text-[11px] shadow-2xs ${
            is2cm ? "p-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300" : "p-2.5"
          }`}
        >
          <div className={is2cm ? "space-y-1" : "space-y-2"}>
            {/* Box 1 Header */}
            <div className={`flex items-center justify-between border-b border-blue-200 ${is2cm ? "pb-0.5" : "pb-1"}`}>
              <div className="flex items-center gap-1.5">
                <span className={`font-black uppercase tracking-wider text-blue-950 bg-blue-200/90 rounded ${is2cm ? "text-[9px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5 rounded-md"}`}>
                  {isTelugu ? "📦 బాక్స్ 1: జాబ్ & తేదీలు" : "📦 Box 1: Job & Dates"}
                </span>
              </div>
              <span className={`font-bold text-blue-800 bg-white rounded border border-blue-200 ${is2cm ? "text-[8px] px-1 py-0.2" : "text-[9px] px-1.5 py-0.5"}`}>
                ✏️ {isTelugu ? "ఎడిట్" : "Editable"}
              </span>
            </div>

            {/* Field: Online JC No */}
            <div>
              <label className={`block font-extrabold text-blue-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "ఆన్‌లైన్ జాబ్ నెం (JC No):" : "Online Job Card No:"}
              </label>
              <input
                type="text"
                value={draft.onlineJobCardNo}
                onChange={e => handleFieldChange("onlineJobCardNo", e.target.value)}
                placeholder="e.g. JC-2024-001"
                className={`w-full bg-white border border-blue-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 rounded font-black font-mono text-slate-900 shadow-2xs ${
                  is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                }`}
              />
            </div>

            {/* Field: Job Date */}
            <div>
              <label className={`block font-extrabold text-blue-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "జాబ్ తేదీ (Job Date):" : "Job Date:"}
              </label>
              <input
                type="date"
                value={draft.jobDate}
                onChange={e => handleFieldChange("jobDate", e.target.value)}
                className={`w-full bg-white border border-blue-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 rounded font-bold text-slate-900 shadow-2xs ${
                  is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                }`}
              />
            </div>

            {/* Field: Complaint Date */}
            <div>
              <label className={`block font-extrabold text-blue-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "ఫిర్యాదు తేదీ (Complaint Date):" : "Complaint Date:"}
              </label>
              <input
                type="date"
                value={draft.complaintDate}
                onChange={e => handleFieldChange("complaintDate", e.target.value)}
                className={`w-full bg-white border border-blue-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 rounded font-bold text-slate-900 shadow-2xs ${
                  is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                }`}
              />
            </div>

            {/* Field: Status */}
            <div>
              <label className={`block font-extrabold text-blue-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "జాబ్ స్థితి (Status):" : "Job Status:"}
              </label>
              <select
                value={draft.status}
                onChange={e => handleFieldChange("status", e.target.value)}
                className={`w-full border rounded font-extrabold shadow-2xs ${
                  is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                } ${
                  draft.status === "Closed"
                    ? "bg-slate-100 text-slate-800 border-slate-300"
                    : "bg-emerald-50 text-emerald-900 border-emerald-400"
                }`}
              >
                <option value="Open">🟢 {isTelugu ? "ఓపెన్ (Open)" : "Open"}</option>
                <option value="Closed">🔘 {isTelugu ? "క్లోజ్డ్ (Closed)" : "Closed"}</option>
              </select>
            </div>

            {/* Field: Branch */}
            <div>
              <label className={`block font-extrabold text-blue-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "బ్రాంచ్ (Branch):" : "Branch:"}
              </label>
              <select
                value={draft.branch}
                onChange={e => handleFieldChange("branch", e.target.value)}
                className={`w-full bg-white border border-blue-300 rounded font-bold text-slate-800 ${
                  is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                }`}
              >
                <option value="">-- {isTelugu ? "బ్రాంచ్ ఎంచుకోండి" : "Select Branch"} --</option>
                {branchesList.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={`border-t border-blue-200/80 flex items-center justify-between text-blue-900 font-semibold ${
            is2cm ? "pt-1 mt-1 text-[8.5px]" : "pt-2 mt-2 text-[9.5px]"
          }`}>
            <span>{isTelugu ? "ఇన్ టైమ్:" : "Time In:"} {draft.dateTimeIn || "—"}</span>
            <button
              type="button"
              onClick={handleSaveUpdate}
              disabled={isSaving}
              className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
            >
              {isDirty ? (isTelugu ? "Save చేయండి" : "Save Changes") : (isTelugu ? "తాజాకరణ" : "Update")}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOX 2: కస్టమర్ వివరాలు (CUSTOMER DETAILS) - [VIEW DISPLAY] */}
        {/* ========================================================================= */}
        <div
          style={isExpanded ? undefined : { height: effectiveHeight, minHeight: effectiveHeight, maxHeight: effectiveHeight }}
          className={`min-w-[280px] w-[280px] shrink-0 bg-slate-50 border-2 border-slate-300/80 rounded-xl flex flex-col justify-between text-[11px] shadow-2xs ${
            is2cm ? "p-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300" : "p-2.5"
          }`}
        >
          <div className={is2cm ? "space-y-1" : "space-y-2"}>
            {/* Box 2 Header */}
            <div className={`flex items-center justify-between border-b border-slate-200 ${is2cm ? "pb-0.5" : "pb-1"}`}>
              <span className={`font-black uppercase tracking-wider text-slate-900 bg-slate-200 rounded ${is2cm ? "text-[9px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5 rounded-md"}`}>
                {isTelugu ? "📦 బాక్స్ 2: కస్టమర్" : "📦 Box 2: Customer"}
              </span>
              <span className={`font-mono font-bold text-slate-600 bg-white rounded border border-slate-200 ${is2cm ? "text-[8.5px] px-1 py-0.2" : "text-[9.5px] px-1.5 py-0.5"}`}>
                HF: {card.historyFileNo || "—"}
              </span>
            </div>

            {/* Customer Name */}
            <div>
              <span className={`font-bold text-slate-500 uppercase block ${is2cm ? "text-[8px] leading-tight" : "text-[9.5px]"}`}>
                {isTelugu ? "రైతు / కస్టమర్ పేరు:" : "Customer Name:"}
              </span>
              <div className={`font-black text-slate-950 leading-tight break-words ${is2cm ? "text-xs" : "text-sm"}`} title={card.custName}>
                👤 {card.custName || "—"}
              </div>
              {card.fatherName && (
                <div className={`font-semibold text-slate-600 ${is2cm ? "text-[8.5px]" : "text-[10px]"}`}>
                  {isTelugu ? `తండ్రి: ${card.fatherName}` : `S/o ${card.fatherName}`}
                </div>
              )}
            </div>

            {/* Address / Village / Mandal */}
            <div>
              <span className={`font-bold text-slate-500 uppercase block ${is2cm ? "text-[8px] leading-tight" : "text-[9.5px]"}`}>
                {isTelugu ? "గ్రామం / మండలం:" : "Village & Mandal:"}
              </span>
              <div className="text-slate-800 font-bold flex items-start gap-1 leading-snug">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span className={is2cm ? "truncate text-[10px]" : "line-clamp-2"}>
                  {[card.village, card.mandal, card.custAddr].filter(Boolean).join(", ") || "—"}
                </span>
              </div>
            </div>

            {/* Contact Mobile */}
            <div>
              <span className={`font-bold text-slate-500 uppercase block ${is2cm ? "text-[8px] leading-tight" : "text-[9.5px]"}`}>
                {isTelugu ? "మొబైల్ నంబర్:" : "Contact Phone:"}
              </span>
              {cleanPhone ? (
                <div className="flex items-center justify-between pt-0.5">
                  <a
                    href={`tel:${cleanPhone}`}
                    className={`font-mono font-black text-blue-700 hover:underline flex items-center gap-1 ${is2cm ? "text-[10px]" : "text-xs"}`}
                  >
                    <Phone className="w-3 h-3 text-blue-600" />
                    {cleanPhone}
                  </a>
                  <a
                    href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded flex items-center gap-1 font-bold ${is2cm ? "p-0.5 text-[8.5px]" : "p-1 text-[9.5px]"}`}
                    title="Open WhatsApp"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                    Chat
                  </a>
                </div>
              ) : (
                <span className="text-slate-400 font-medium">—</span>
              )}
            </div>
          </div>

          <div className={`border-t border-slate-200/80 flex justify-between text-slate-500 ${is2cm ? "pt-1 mt-1 text-[8.5px]" : "pt-2 mt-2 text-[9.5px]"}`}>
            <span>{isTelugu ? "బ్రాంచ్:" : "Branch:"} {card.branch || "—"}</span>
            <span className="text-slate-400 font-mono">ID: {String(card.id).slice(-5)}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOX 3: ట్రాక్టర్ వివరాలు (TRACTOR DETAILS) - [VIEW DISPLAY] */}
        {/* ========================================================================= */}
        <div
          style={isExpanded ? undefined : { height: effectiveHeight, minHeight: effectiveHeight, maxHeight: effectiveHeight }}
          className={`min-w-[280px] w-[280px] shrink-0 bg-amber-50/70 border-2 border-amber-300/80 rounded-xl flex flex-col justify-between text-[11px] shadow-2xs ${
            is2cm ? "p-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-300" : "p-2.5"
          }`}
        >
          <div className={is2cm ? "space-y-1" : "space-y-2"}>
            {/* Box 3 Header */}
            <div className={`flex items-center justify-between border-b border-amber-200 ${is2cm ? "pb-0.5" : "pb-1"}`}>
              <span className={`font-black uppercase tracking-wider text-amber-950 bg-amber-200 rounded ${is2cm ? "text-[9px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5 rounded-md"}`}>
                {isTelugu ? "📦 బాక్స్ 3: ట్రాక్టర్" : "📦 Box 3: Tractor"}
              </span>
              <span
                className={`font-black rounded ${is2cm ? "text-[8px] px-1 py-0.2" : "text-[9px] px-1.5 py-0.5"} ${
                  isWtyCard ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : "bg-slate-200 text-slate-700"
                }`}
              >
                {isWtyCard ? (isTelugu ? "వారంటీ ఉంది" : "Under Wty") : (isTelugu ? "పోస్ట్ వారంటీ" : "Post Wty")}
              </span>
            </div>

            {/* Tractor Model */}
            <div>
              <span className={`font-bold text-amber-900 uppercase block ${is2cm ? "text-[8px] leading-tight" : "text-[9.5px]"}`}>
                {isTelugu ? "ట్రాక్టర్ మోడల్:" : "Tractor Model:"}
              </span>
              <div className={`font-black text-amber-950 leading-tight ${is2cm ? "text-xs" : "text-sm"}`}>
                🚜 {card.model || "—"}{" "}
                {card.modelType && (
                  <span className={`font-bold text-amber-800 bg-white rounded border border-amber-200 ${is2cm ? "text-[9px] px-1 py-0.2" : "text-[10px] px-1 py-0.2"}`}>
                    {card.modelType}
                  </span>
                )}
              </div>
            </div>

            {/* Chassis Number */}
            <div>
              <span className={`font-bold text-amber-900 uppercase block ${is2cm ? "text-[8px] leading-tight" : "text-[9.5px]"}`}>
                {isTelugu ? "ఛాసిస్ నెం (Chassis):" : "Chassis Number:"}
              </span>
              <div className={`font-mono font-black text-amber-950 bg-white rounded border border-amber-300 shadow-2xs tracking-wider ${is2cm ? "text-[10.5px] px-1.5 py-0.5" : "text-xs px-2 py-1"}`}>
                {card.chassisNo || "—"}
              </div>
            </div>

            {/* Engine No & Delivery Date */}
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between items-center">
                <span className={`text-amber-900 font-bold ${is2cm ? "text-[8.5px]" : "text-[9.5px]"}`}>{isTelugu ? "ఇంజన్ నెం:" : "Engine No:"}</span>
                <span className="font-mono font-bold text-slate-900">{card.engineNo || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-amber-900 font-bold ${is2cm ? "text-[8.5px]" : "text-[9.5px]"}`}>{isTelugu ? "డెలివరీ తేదీ:" : "Delivery Date:"}</span>
                <span className="font-bold text-slate-900">{formatDateDisplay(card.dateOfDelivery || card.installDate)}</span>
              </div>
            </div>
          </div>

          <div className={`border-t border-amber-200/80 flex items-center justify-between text-amber-900 font-bold ${is2cm ? "pt-1 mt-1 text-[8.5px]" : "pt-2 mt-2 text-[9.5px]"}`}>
            <span>{isTelugu ? "మోడల్:" : "Model:"} {card.modelCode || card.model || "—"}</span>
            <span className="text-amber-800">{card.hoursRun ? `${card.hoursRun} hrs` : ""}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOX 4: సర్వీస్ & రిపేర్లు (SERVICE & REPAIRS) - [EDITABLE DIRECTLY] */}
        {/* ========================================================================= */}
        <div
          style={isExpanded ? undefined : { height: effectiveHeight, minHeight: effectiveHeight, maxHeight: effectiveHeight }}
          className={`min-w-[305px] w-[305px] shrink-0 bg-emerald-50/70 border-2 border-emerald-300/80 rounded-xl flex flex-col justify-between text-[11px] shadow-2xs ${
            is2cm ? "p-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-300" : "p-2.5"
          }`}
        >
          <div className={is2cm ? "space-y-1" : "space-y-2"}>
            {/* Box 4 Header */}
            <div className={`flex items-center justify-between border-b border-emerald-200 ${is2cm ? "pb-0.5" : "pb-1"}`}>
              <span className={`font-black uppercase tracking-wider text-emerald-950 bg-emerald-200/90 rounded ${is2cm ? "text-[9px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5 rounded-md"}`}>
                {isTelugu ? "📦 బాక్స్ 4: సర్వీస్" : "📦 Box 4: Service & Repairs"}
              </span>
              <span className={`font-bold text-emerald-800 bg-white rounded border border-emerald-200 ${is2cm ? "text-[8px] px-1 py-0.2" : "text-[9px] px-1.5 py-0.5"}`}>
                ✏️ {isTelugu ? "ఎడిట్" : "Editable"}
              </span>
            </div>

            {/* Hour Meter & Service Type Grid */}
            <div className={`grid grid-cols-2 ${is2cm ? "gap-1" : "gap-1.5"}`}>
              <div>
                <label className={`block font-extrabold text-emerald-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                  {isTelugu ? "గంటలు (Hrs):" : "Hour Meter:"}
                </label>
                <input
                  type="number"
                  value={draft.hourMeter}
                  onChange={e => handleFieldChange("hourMeter", e.target.value)}
                  placeholder="Hrs"
                  className={`w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded font-black font-mono text-slate-900 shadow-2xs ${
                    is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                  }`}
                />
              </div>

              <div>
                <label className={`block font-extrabold text-emerald-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                  {isTelugu ? "సర్వీస్ రకం:" : "Service Type:"}
                </label>
                <select
                  value={draft.serviceType}
                  onChange={e => handleFieldChange("serviceType", e.target.value)}
                  className={`w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded font-bold text-slate-900 shadow-2xs ${
                    is2cm ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-1 text-xs"
                  }`}
                >
                  <option value="">-- {isTelugu ? "రకం" : "Select"} --</option>
                  {serviceTypes.map(st => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field: Free Service List / Count */}
            <div>
              <label className={`block font-extrabold text-emerald-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "ఫ్రీ సర్వీస్ (Free Service):" : "Free Service Done:"}
              </label>
              <input
                type="text"
                value={draft.freeServiceList}
                onChange={e => handleFieldChange("freeServiceList", e.target.value)}
                placeholder="e.g. 1st Free"
                className={`w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded font-bold text-slate-800 shadow-2xs ${
                  is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                }`}
              />
            </div>

            {/* Field: Extra Other Repairs Done */}
            <div>
              <label className={`block font-extrabold text-emerald-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "అదనపు రిపేర్లు (Extra Repairs):" : "Extra Other Repairs Done:"}
              </label>
              {is2cm ? (
                <input
                  type="text"
                  value={draft.extraRepairs}
                  onChange={e => handleFieldChange("extraRepairs", e.target.value)}
                  placeholder={isTelugu ? "అదనపు పనులు..." : "Extra repairs..."}
                  className="w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 shadow-2xs leading-snug"
                />
              ) : (
                <textarea
                  rows={2}
                  value={draft.extraRepairs}
                  onChange={e => handleFieldChange("extraRepairs", e.target.value)}
                  placeholder={isTelugu ? "చేసిన అదనపు పనులు లేదా రిపేర్లు..." : "Extra repairs or work carried out..."}
                  className="w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs leading-snug resize-none"
                />
              )}
            </div>

            {/* Field: Grand Total Amount */}
            <div>
              <label className={`block font-extrabold text-emerald-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "బిల్ అమౌంట్ (Grand Total ₹):" : "Grand Total Amount (₹):"}
              </label>
              <div className="relative">
                <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-black ${is2cm ? "text-[9px]" : "text-xs"}`}>₹</span>
                <input
                  type="number"
                  value={draft.gTotal}
                  onChange={e => handleFieldChange("gTotal", e.target.value)}
                  placeholder="0.00"
                  className={`w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded pl-5 pr-2 font-black text-emerald-950 shadow-2xs ${
                    is2cm ? "py-0.5 text-[10px]" : "py-1 text-xs"
                  }`}
                />
              </div>
            </div>
          </div>

          <div className={`border-t border-emerald-200/80 flex items-center justify-between ${is2cm ? "pt-1 mt-1 text-[8.5px]" : "pt-2 mt-2 text-[9.5px]"}`}>
            <span className="font-extrabold text-emerald-900">
              {draft.gTotal ? `₹${Number(draft.gTotal).toLocaleString("en-IN")}` : "₹ 0"}
            </span>
            <button
              type="button"
              onClick={handleSaveUpdate}
              disabled={isSaving}
              className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
            >
              {isDirty ? (isTelugu ? "Save చేయండి" : "Save Changes") : (isTelugu ? "తాజాకరణ" : "Update")}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOX 5: క్లోజర్ & టెక్నీషియన్ (CLOSURE & TECHNICIAN) - [EDITABLE DIRECTLY] */}
        {/* ========================================================================= */}
        <div
          style={isExpanded ? undefined : { height: effectiveHeight, minHeight: effectiveHeight, maxHeight: effectiveHeight }}
          className={`min-w-[310px] w-[310px] shrink-0 bg-purple-50/70 border-2 border-purple-300/80 rounded-xl flex flex-col justify-between text-[11px] shadow-2xs ${
            is2cm ? "p-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300" : "p-2.5"
          }`}
        >
          <div className={is2cm ? "space-y-1" : "space-y-2"}>
            {/* Box 5 Header */}
            <div className={`flex items-center justify-between border-b border-purple-200 ${is2cm ? "pb-0.5" : "pb-1"}`}>
              <span className={`font-black uppercase tracking-wider text-purple-950 bg-purple-200/90 rounded ${is2cm ? "text-[9px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5 rounded-md"}`}>
                {isTelugu ? "📦 బాక్స్ 5: క్లోజర్" : "📦 Box 5: Closure & Technician"}
              </span>
              <span className={`font-bold text-purple-800 bg-white rounded border border-purple-200 ${is2cm ? "text-[8px] px-1 py-0.2" : "text-[9px] px-1.5 py-0.5"}`}>
                ✏️ {isTelugu ? "ఎడిట్" : "Editable"}
              </span>
            </div>

            {/* Closed Date & Bill No Grid */}
            <div className={`grid grid-cols-2 ${is2cm ? "gap-1" : "gap-1.5"}`}>
              <div>
                <label className={`block font-extrabold text-purple-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                  {isTelugu ? "పూర్తయిన తేదీ:" : "Actual Closed Date:"}
                </label>
                <input
                  type="date"
                  value={draft.actualClosedDate}
                  onChange={e => handleFieldChange("actualClosedDate", e.target.value)}
                  className={`w-full bg-white border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-500 rounded font-bold text-slate-900 shadow-2xs ${
                    is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-1.5 py-1 text-xs"
                  }`}
                />
              </div>

              <div>
                <label className={`block font-extrabold text-purple-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                  {isTelugu ? "బిల్ నంబర్:" : "Bill Number:"}
                </label>
                <input
                  type="text"
                  value={draft.billNo}
                  onChange={e => handleFieldChange("billNo", e.target.value)}
                  placeholder="e.g. BL-5021"
                  className={`w-full bg-white border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-500 rounded font-bold font-mono text-slate-900 shadow-2xs ${
                    is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                  }`}
                />
              </div>
            </div>

            {/* Field: Mechanic / Technician */}
            <div>
              <label className={`block font-extrabold text-purple-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "మెకానిక్ / టెక్నీషియన్:" : "Mechanic / Technician:"}
              </label>
              <input
                type="text"
                list={`mechanics-list-${card.id}`}
                value={draft.mechanic}
                onChange={e => handleFieldChange("mechanic", e.target.value)}
                placeholder={isTelugu ? "మెకానిక్ పేరు" : "Select or type mechanic..."}
                className={`w-full bg-white border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-500 rounded font-bold text-slate-800 shadow-2xs ${
                  is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                }`}
              />
              <datalist id={`mechanics-list-${card.id}`}>
                {Array.from(new Set(mechanicsList || [])).map((m, idx) => (
                  <option key={`mech-opt-${card.id}-${m}-${idx}`} value={m} />
                ))}
              </datalist>
            </div>

            {/* Field: Service Location */}
            <div>
              <label className={`block font-extrabold text-purple-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "సర్వీస్ స్థలం:" : "Service Location:"}
              </label>
              <select
                value={draft.serviceLocation}
                onChange={e => handleFieldChange("serviceLocation", e.target.value)}
                className={`w-full bg-white border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-500 rounded font-bold text-slate-800 shadow-2xs ${
                  is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                }`}
              >
                <option value="workshop">🏭 {isTelugu ? "వర్క్‌షాప్ (Workshop)" : "Workshop"}</option>
                <option value="doorstep">🚜 {isTelugu ? "రైతు ఇంటి వద్ద (DSS)" : "Doorstep (DSS)"}</option>
                <option value="field">🌾 {isTelugu ? "పొలంలో / ఫీల్డ్ (Field)" : "Field"}</option>
                <option value="camp">⛺ {isTelugu ? "క్యాంప్ (Camp)" : "Service Camp"}</option>
              </select>
            </div>

            {/* Field: Reasons for Analysis / Problem Remarks */}
            <div>
              <label className={`block font-extrabold text-purple-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "విశ్లేషణ / రిమార్క్స్:" : "Reasons for Analysis / Remarks:"}
              </label>
              {is2cm ? (
                <input
                  type="text"
                  value={draft.reasonsForAnalysis}
                  onChange={e => handleFieldChange("reasonsForAnalysis", e.target.value)}
                  placeholder={isTelugu ? "విశ్లేషణ వివరాలు..." : "Analysis notes..."}
                  className="w-full bg-white border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-500 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 shadow-2xs leading-snug"
                />
              ) : (
                <textarea
                  rows={2}
                  value={draft.reasonsForAnalysis}
                  onChange={e => handleFieldChange("reasonsForAnalysis", e.target.value)}
                  placeholder={isTelugu ? "విశ్లేషణ లేదా రిమార్క్స్ వివరాలు..." : "Analysis notes or customer feedback..."}
                  className="w-full bg-white border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-500 rounded px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs leading-snug resize-none"
                />
              )}
            </div>

            {/* Field: Telecalling Status */}
            <div>
              <label className={`block font-extrabold text-purple-950 uppercase ${is2cm ? "text-[8.5px] mb-0.2" : "text-[9.5px] mb-0.5"}`}>
                {isTelugu ? "టెలికాలింగ్ నోట్స్:" : "Telecalling Status / Notes:"}
              </label>
              <input
                type="text"
                value={draft.telecalling}
                onChange={e => handleFieldChange("telecalling", e.target.value)}
                placeholder={isTelugu ? "కాల్ స్థితి..." : "e.g. Satisfied, Followup"}
                className={`w-full bg-white border border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-500 rounded font-semibold text-slate-800 shadow-2xs ${
                  is2cm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                }`}
              />
            </div>
          </div>

          <div className={`border-t border-purple-200/80 flex items-center justify-between ${is2cm ? "pt-1 mt-1 text-[8.5px]" : "pt-2 mt-2 text-[9.5px]"}`}>
            <span className="font-bold text-purple-900">
              {draft.actualClosedDate ? (isTelugu ? "క్లోజ్డ్ తేదీ ఉంది" : "Closed date set") : (isTelugu ? "పెండింగ్" : "Pending")}
            </span>
            <button
              type="button"
              onClick={handleSaveUpdate}
              disabled={isSaving}
              className="text-purple-800 hover:text-purple-950 font-bold underline cursor-pointer"
            >
              {isDirty ? (isTelugu ? "Save చేయండి" : "Save Changes") : (isTelugu ? "తాజాకరణ" : "Update")}
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER BAR WITH UPDATE BUTTON CONFIRMATION */}
      <div className="pt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span>{isTelugu ? "బాక్స్ 1, 4, 5 లో మార్పులు చేసి 'Update' నొక్కండి" : "Edit values in Box 1, 4, or 5 and click 'Update'"}</span>
          {lastSavedTime && (
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {isTelugu ? `చివరిగా సేవ్ చేయబడిన సమయం: ${lastSavedTime}` : `Last saved: ${lastSavedTime}`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={() => {
                // reset to original
                setDraft({
                  onlineJobCardNo: card.onlineJobCardNo || card.jobNo || "",
                  jobDate: toInputDate(card.jobDate),
                  complaintDate: toInputDate(card.complaintDate),
                  status: card.status || "Open",
                  dateTimeIn: card.dateTimeIn || "",
                  branch: card.branch || "",

                  hourMeter: card.hourMeter ?? card.hrsRun ?? "",
                  serviceType: card.serviceType || "",
                  freeServiceList: card.freeServiceList || "",
                  extraRepairs: card.extraRepairs || card.problemDescription || "",
                  gTotal: card.gTotal ?? "",

                  actualClosedDate: toInputDate(card.actualClosedDate || card.dateTimeOut),
                  mechanic: card.mechanic || card.technicianName || "",
                  billNo: card.billNo || "",
                  serviceLocation: card.serviceLocation || "workshop",
                  reasonsForAnalysis: card.reasonsForAnalysis || "",
                  telecalling: card.telecalling || ""
                });
              }}
              className="text-[10.5px] font-bold text-slate-500 hover:text-slate-700 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              {isTelugu ? "రీసెట్" : "Reset"}
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveUpdate}
            disabled={isSaving}
            className={`px-4 py-1.5 rounded-lg transition-all font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer ${
              justSaved
                ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
                : isDirty
                ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300 animate-pulse"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isSaving ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{isTelugu ? "సేవ్ అవుతోంది..." : "Saving..."}</span>
              </>
            ) : justSaved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>{isTelugu ? "✅ సేవ్ అయ్యింది!" : "✅ Saved Successfully!"}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isTelugu ? "💾 Update (సేవ్ చేయండి)" : "💾 Update Job Card"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
