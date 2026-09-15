import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Phone,
  PhoneCall,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  MessageCircle,
  Copy,
  PenLine,
  Check,
  Save,
  X,
  Wrench,
  Tractor,
  ExternalLink,
  ShieldCheck,
  Building2,
  Camera
} from "lucide-react";
import { formatDisplayDate, isDeliveryOutOfWarranty } from "../utils/dateFormatter";

export interface CustomerCallLogModalProps {
  isOpen: boolean;
  customer: any | null;
  allCards?: any[];
  language?: "te" | "en";
  onClose: () => void;
  onSaveCallLog?: (chassisNo: string, logData: any) => Promise<void> | void;
  onNewJobCard?: (customer: any) => void;
  onEditCustomer?: (customer: any) => void;
  onRegisterComplaint?: (customer: any) => void;
}

export const CustomerCallLogModal: React.FC<CustomerCallLogModalProps> = ({
  isOpen,
  customer,
  allCards = [],
  language = "te",
  onClose,
  onSaveCallLog,
  onNewJobCard,
  onEditCustomer,
  onRegisterComplaint,
}) => {
  const isTe = language === "te";
  const todayStr = new Date().toISOString().split("T")[0];

  const [callStatus, setCallStatus] = useState<string>("Interested");
  const [callNotes, setCallNotes] = useState<string>("");
  const [callPreferredDate, setCallPreferredDate] = useState<string>("");
  const [calledBy, setCalledBy] = useState<string>(() => {
    try {
      return localStorage.getItem("telecaller_last_caller") || "Service Advisor";
    } catch {
      return "Service Advisor";
    }
  });
  const [callSaving, setCallSaving] = useState<boolean>(false);
  const [callSavedSuccess, setCallSavedSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [customCallStatuses, setCustomCallStatuses] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("custom_call_statuses") || "[]");
    } catch {
      return [];
    }
  });
  const [showAddStatus, setShowAddStatus] = useState<boolean>(false);
  const [newStatusName, setNewStatusName] = useState<string>("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const customerPhotoKey = (cust: any): string => {
    const raw = cust?.rec || cust || {};
    const chassis = String(
      cust?.chassisNo || cust?.["Chassis no"] || cust?.chassis_no || cust?.chassis ||
      raw.chassisNo || raw["Chassis no"] || raw.chassis || ""
    ).trim().toUpperCase();
    return chassis ? `customer_photo_${chassis}` : "";
  };

  // Sync state on open
  useEffect(() => {
    if (customer) {
      setCallStatus("Interested");
      setCallNotes("");
      setCallPreferredDate(customer.nextCallDate || customer.preferredDate || "");
      setCallSavedSuccess(false);
      setCopied(false);
      try {
        const key = customerPhotoKey(customer);
        setPhotoDataUrl(key ? localStorage.getItem(key) : null);
      } catch {
        setPhotoDataUrl(null);
      }
    }
  }, [customer, isOpen]);

  const handlePhotoSelected = (file: File) => {
    const key = customerPhotoKey(customer);
    if (!key || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 200;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        try {
          localStorage.setItem(key, dataUrl);
          setPhotoDataUrl(dataUrl);
        } catch {
          alert(isTe ? "ఫోటో సేవ్ చేయడంలో విఫలమైంది (స్టోరేజ్ నిండింది)." : "Could not save photo (storage full).");
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    const key = customerPhotoKey(customer);
    if (!key) return;
    try {
      localStorage.removeItem(key);
    } catch {}
    setPhotoDataUrl(null);
  };

  // Extract past followup & call history.
  // NOTE: every hook must run BEFORE the `isOpen` early return below. Otherwise the
  // hook count changes between renders and React throws error #310
  // ("Rendered more hooks than during the previous render"), which the ErrorBoundary
  // turns into the "reload" screen for the whole Free Service Followup view.
  const existingFollowups: any[] = useMemo(() => {
    if (!customer) return [];
    const hist = customer.followupHistory || customer.history || customer.rec?.followupHistory;
    let list: any[] = [];
    if (Array.isArray(hist)) list = hist;
    else if (typeof hist === "string") {
      try {
        list = JSON.parse(hist);
      } catch {
        list = [];
      }
    }
    if (list.length === 0 && (customer.lastRemarks || customer.remarks || customer.notes)) {
      list = [{
        callDate: customer.lastCallDate || customer.callDate || "",
        remarks: customer.lastRemarks || customer.remarks || customer.notes,
        nextCallDate: customer.nextCallDate || customer.preferredDate,
        calledBy: customer.lastCalledBy || customer.calledBy || "Staff",
        status: customer.lastCallStatus || customer.status || "Completed"
      }];
    }
    return list;
  }, [customer]);

  if (!isOpen || !customer) return null;

  // Helper extraction - also checks customer.rec, since some callers (the
  // Free Service Followup / Telecalling customer lists) only flatten a
  // subset of fields onto the top-level object and keep the rest nested
  // under .rec (the original raw record).
  const getVal = (keys: string[]): string => {
    const raw = customer.rec || {};
    for (const k of keys) {
      if (customer[k] !== undefined && customer[k] !== null && String(customer[k]).trim() !== "") {
        return String(customer[k]).trim();
      }
      if (raw[k] !== undefined && raw[k] !== null && String(raw[k]).trim() !== "") {
        return String(raw[k]).trim();
      }
    }
    return "";
  };

  const custName = getVal(["customerName", "Customer Name", "custName", "name"]) || "Customer";
  const chassisNo = getVal(["chassisNo", "Chassis no", "chassis_no", "chassis", "__chassisDisplay"]);
  const rawPhone = getVal(["mobileNumber", "Mobile Number", "Mobile Numb", "Mobile No", "phoneNo", "ownerMob", "phone"]);
  const cleanPhone = rawPhone.replace(/[^0-9]/g, "").slice(-10);
  const village = getVal(["village", "Village", "VILLAGE", "custAddr", "address"]);
  const mandal = getVal(["mandal", "Mandal", "MANDAL"]);
  const model = getVal(["model", "Model", "tractorModel", "MODEL"]) || "Eicher Tractor";
  const modelType = getVal(["modelType", "MODEL TYPE", "model_type"]);
  const engineNo = getVal(["engineNo", "Engine No:", "Engine no", "engine_no"]);
  const delDate = getVal(["dateOfDel", "Date of del", "Date of Delivery", "installDate"]);
  const supervisor = getVal(["supervisor", "SUPERVISOR", "assignedSupervisor"]);
  const branch = getVal(["branch", "BRANCH"]);
  const historyFileNo = getVal(["historyFileNo", "fileNo", "HFN"]);
  const fatherName = getVal(["fatherName", "FATHER NAME", "Father Name", "father"]);
  const dspName = getVal(["dspName", "DSP Name", "DSP NAME"]);
  const district = getVal(["district", "District", "DISTRICT", "Distict"]);
  const pinCode = getVal(["pinCode", "PIN CODE", "PIN CO", "Pin code"]);
  const isOutOfWarranty = delDate ? isDeliveryOutOfWarranty(delDate, 2) : false;

  // Find job cards for this chassis
  const relatedCards = allCards.filter((c) => {
    const cardCh = String(c.chassisNo || c.chassis || "").trim().toLowerCase();
    return cardCh && chassisNo && cardCh.includes(chassisNo.toLowerCase());
  });

  // Handle Save
  const handleSaveCallLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCallSaving(true);

    const logEntry = {
      id: `call_${Date.now()}`,
      chassisNo: chassisNo,
      customerName: custName,
      mobileNumber: cleanPhone,
      callDate: todayStr,
      status: callStatus,
      notes: callNotes,
      remarks: callNotes,
      preferredDate: callPreferredDate,
      nextCallDate: callPreferredDate,
      calledBy: calledBy,
      timestamp: new Date().toISOString(),
    };

    try {
      try {
        localStorage.setItem("telecaller_last_caller", calledBy);
      } catch {}

      if (onSaveCallLog) {
        await onSaveCallLog(chassisNo, logEntry);
      }
      setCallSavedSuccess(true);
      setTimeout(() => {
        setCallSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Save call log error:", err);
      alert("Failed to save call log.");
    } finally {
      setCallSaving(false);
    }
  };

  // Handle Add Custom Call Status
  const handleAddCustomStatus = () => {
    const trimmed = newStatusName.trim();
    if (!trimmed) {
      alert(isTe ? "దయచేసి సర్వీస్ కారణం నమోదు చేయండి" : "Please enter a status reason");
      return;
    }
    if (customCallStatuses.includes(trimmed)) {
      alert(isTe ? "ఈ కారణం ఇప్పటికే ఉంది" : "This status already exists");
      return;
    }
    const updated = [...customCallStatuses, trimmed];
    setCustomCallStatuses(updated);
    try {
      localStorage.setItem("custom_call_statuses", JSON.stringify(updated));
    } catch {}
    setNewStatusName("");
    setShowAddStatus(false);
    setCallStatus(trimmed);
  };

  // Get latest mechanic from related cards
  const latestMechanic = relatedCards.length > 0
    ? (relatedCards[0]?.mechanicName || relatedCards[0]?.technician || "—")
    : "—";

  // Handle Copy
  const handleCopyDetails = () => {
    const text = `*Sri Gayathri Automotives Customer Details*
Customer: ${custName}
Phone: ${cleanPhone}
Chassis: ${chassisNo}
Model: ${model} ${modelType ? `(${modelType})` : ""}
Engine No: ${engineNo || "—"}
Village: ${village}
Mandal: ${mandal}
Del Date: ${delDate || "—"}
Supervisor: ${supervisor || "—"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle WhatsApp
  const handleSendWhatsApp = () => {
    if (!cleanPhone) return;
    const msg = `నమస్కారం ${custName} గారు, శ్రీ గాయత్రి ఆటోమోటివ్స్ (ఐషర్ ట్రాక్టర్స్) నుండి సంప్రదిస్తున్నాము. మీ ట్రాక్టర్ (${model} - ${chassisNo}) సర్వీసింగ్ మరియు మెయింటెనెన్స్ కోసం మమ్మల్ని సంప్రదించండి. ఫోన్: 98480xxxxx.`;
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">

        {/* Header - kept minimal on purpose: full details are already shown
            in the profile banner below, so this bar only carries the icon,
            quick actions, and close button to avoid repeating the same
            info twice. */}
        <div className="bg-indigo-50 border-b border-indigo-100 p-3 flex items-center justify-between shrink-0 gap-2">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            {onNewJobCard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewJobCard(customer);
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isTe ? "జాబ్ కార్డ్" : "Job Card"}</span>
              </button>
            )}
            {onRegisterComplaint && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRegisterComplaint(customer);
                }}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{isTe ? "కంప్లైంట్" : "Complaint"}</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-5 overflow-y-auto max-h-[75vh] space-y-4 text-xs">

          {/* 1. Customer & Tractor Profile Banner - compact, one heading color */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Left: Photo, Branch, Supervisor, DSP */}
            <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-2.5 md:pb-0 md:pr-3">
              <div className="flex items-center gap-2.5 mb-1">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoSelected(file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="relative w-14 h-14 rounded-xl border-2 border-dashed border-indigo-300 bg-white overflow-hidden shrink-0 flex items-center justify-center hover:border-indigo-500 transition-colors cursor-pointer group"
                  title={isTe ? "ఫోటో జోడించండి" : "Add customer photo"}
                >
                  {photoDataUrl ? (
                    <img src={photoDataUrl} alt={custName} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-indigo-300 group-hover:text-indigo-500" />
                  )}
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer text-left"
                  >
                    {photoDataUrl ? (isTe ? "మార్చు" : "Change") : (isTe ? "+ ఫోటో జోడించు" : "+ Add Photo")}
                  </button>
                  {photoDataUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer text-left"
                    >
                      {isTe ? "తీసివేయి" : "Remove"}
                    </button>
                  )}
                </div>
              </div>

              <p className="font-bold text-indigo-800 uppercase tracking-wide text-[10px] bg-indigo-100 px-1.5 py-1 rounded-md inline-flex items-center gap-1 w-fit">
                <Building2 className="w-3 h-3" />
                <span>{isTe ? "బ్రాంచ్" : "Branch"}</span>
              </p>
              <p className="font-bold text-slate-900 text-sm">{branch || "Main Branch"}</p>

              <p className="font-bold text-indigo-800 uppercase tracking-wide text-[10px] bg-indigo-100 px-1.5 py-1 rounded-md inline-flex items-center gap-1 w-fit">
                <User className="w-3 h-3" />
                <span>{isTe ? "సూపర్" : "Supervisor"}</span>
              </p>
              <p className="font-bold text-slate-900 text-sm">{supervisor || "Unassigned"}</p>

              <p className="font-bold text-indigo-800 uppercase tracking-wide text-[10px] bg-indigo-100 px-1.5 py-1 rounded-md inline-flex items-center gap-1 w-fit">
                <span>DSP</span>
              </p>
              <p className="font-bold text-slate-900 text-sm">{dspName || "—"}</p>
            </div>

            {/* Center: Name, Father, Location */}
            <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-2.5 md:pb-0 md:pr-3">
              <p className="font-bold text-indigo-800 uppercase tracking-wide text-[10px] bg-indigo-100 px-1.5 py-1 rounded-md inline-flex items-center gap-1 w-fit">
                <User className="w-3 h-3" />
                <span>{isTe ? "నామం" : "Name"}</span>
              </p>
              <p className="font-black text-slate-900 text-sm leading-tight">{custName}</p>
              {cleanPhone && (
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-mono font-black text-xs hover:bg-emerald-200 transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  {cleanPhone}
                </a>
              )}

              <p className="font-bold text-indigo-800 uppercase tracking-wide text-[10px] bg-indigo-100 px-1.5 py-1 rounded-md inline-flex items-center gap-1 w-fit">
                <span>{isTe ? "S/o" : "Father"}</span>
              </p>
              <p className="font-bold text-slate-900 text-sm">{fatherName || "—"}</p>

              <p className="font-bold text-indigo-800 uppercase tracking-wide text-[10px] bg-indigo-100 px-1.5 py-1 rounded-md inline-flex items-center gap-1 w-fit">
                <MapPin className="w-3 h-3" />
                <span>{isTe ? "చిరునామా" : "Location"}</span>
              </p>
              <p className="font-semibold text-slate-800 text-xs">
                {village || "—"}{mandal ? `, ${mandal}` : ""}
              </p>
              <p className="text-[10px] text-slate-600 font-bold">
                <span className="bg-gray-100 px-1 py-0.5 rounded">Dist: {district || "—"}</span>
                <span className="bg-gray-100 px-1 py-0.5 rounded ml-1">PIN: {pinCode || "—"}</span>
              </p>
            </div>

            {/* Right: Model, Chassis, Engine, Delivery, Warranty */}
            <div className="space-y-1.5">
              <p className="font-bold text-indigo-800 uppercase tracking-wide text-[10px] bg-indigo-100 px-1.5 py-1 rounded-md inline-flex items-center gap-1 w-fit">
                <Wrench className="w-3 h-3" />
                <span>{isTe ? "మోడల్" : "Model"}</span>
              </p>
              <p className="font-black text-slate-900 text-sm">
                {model}
                {modelType && <span className="text-[10px] font-normal text-slate-600 ml-1">({modelType})</span>}
              </p>

              <p className="font-bold text-indigo-800 uppercase tracking-wide text-[10px] bg-indigo-100 px-1.5 py-1 rounded-md inline-flex items-center gap-1 w-fit">
                <span>{isTe ? "ఛాసిస్ నెం." : "Chassis No"}</span>
              </p>
              <p className="font-mono font-bold text-slate-800 text-sm">{chassisNo || "—"}</p>

              <p className="font-bold text-indigo-800 uppercase tracking-wide text-[10px] bg-indigo-100 px-1.5 py-1 rounded-md inline-flex items-center gap-1 w-fit">
                <span>{isTe ? "ఇంజిన్" : "Engine"}</span>
              </p>
              <p className="font-mono font-bold text-slate-800 text-sm">{engineNo || "—"}</p>

              <p className="font-bold text-indigo-800 uppercase tracking-wide text-[10px] bg-indigo-100 px-1.5 py-1 rounded-md inline-flex items-center gap-1 w-fit">
                <Calendar className="w-3 h-3" />
                <span>{isTe ? "డెలివరీ" : "Delivery"}</span>
              </p>
              <p className="font-mono font-bold text-slate-800 text-sm">{formatDisplayDate(delDate) || "—"}</p>

              <p className="font-bold text-indigo-800 uppercase tracking-wide text-[10px] bg-indigo-100 px-1.5 py-1 rounded-md inline-flex items-center gap-1 w-fit">
                <ShieldCheck className="w-3 h-3" />
                <span>{isTe ? "వారంటీ" : "Warranty"}</span>
              </p>
              {delDate ? (
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isOutOfWarranty
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}
                >
                  {isOutOfWarranty ? (isTe ? "వారంటీ ముగిసింది" : "Out of Warranty") : (isTe ? "వారంటీలో ఉంది" : "In Warranty")}
                </span>
              ) : (
                <p className="font-bold text-slate-500 text-sm">—</p>
              )}
            </div>
          </div>

          {historyFileNo && (
            <div className="flex justify-end -mt-2">
              <span className="font-mono font-bold text-[10.5px] bg-indigo-100 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-md">
                HFN: {historyFileNo}
              </span>
            </div>
          )}

          {/* 2. Service & Job Card History */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-700" />
              <h4 className="font-black text-slate-900 text-xs">
                {isTe ? "సర్వీస్ & జాబ్ కార్డుల చరిత్ర" : "Service & Job Card History"} ({relatedCards.length})
              </h4>
            </div>

            {relatedCards.length === 0 ? (
              <div className="py-3.5 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-600">
                  {isTe ? "ఈ ఛాసిస్ నెంబర్ పై గతంలో ఎలాంటి జాబ్ కార్డులు లేవు." : "No past Job Cards recorded for this customer."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left text-slate-900 border-collapse">
                  <thead className="bg-slate-100 font-black text-slate-800 border-b border-slate-200 text-[11px] sticky top-0">
                    <tr>
                      <th className="py-1.5 px-2.5">Job No</th>
                      <th className="py-1.5 px-2.5">Date</th>
                      <th className="py-1.5 px-2.5">Service Type</th>
                      <th className="py-1.5 px-2.5">Hours</th>
                      <th className="py-1.5 px-2.5">Mechanic</th>
                      <th className="py-1.5 px-2.5">Total (₹)</th>
                      <th className="py-1.5 px-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {relatedCards.map((card, idx) => (
                      <tr key={card.id || idx} className="hover:bg-purple-50/40">
                        <td className="py-1.5 px-2.5 font-bold font-mono text-purple-950">
                          {card.jobNo || card.onlineJobNo || card.jobCardNo || `JC-${idx + 1}`}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono">
                          {formatDisplayDate(card.complaintDate || card.date || card.jobDate)}
                        </td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">
                          {card.serviceType || "General Service"}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono">
                          {card.hoursRun || card.hourMeter || "—"}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-700">
                          {card.mechanicName || card.technician || "—"}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono font-bold text-purple-950">
                          ₹{Number(card.grandTotal || card.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2.5">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Past Call / Telecalling History */}
          <div className="border border-amber-200 rounded-xl p-3.5 space-y-2.5 bg-amber-50/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-amber-700" />
                <h4 className="font-black text-slate-900 text-xs">
                  {isTe ? "టెలికాలింగ్ చరిత్ర" : "Telecalling History"} ({existingFollowups.length})
                </h4>
              </div>
              {existingFollowups[0]?.callDate && (
                <span className="text-[10px] font-bold text-slate-500">
                  {isTe ? "చివరి కాల్:" : "Last called:"} {formatDisplayDate(existingFollowups[0].callDate)}
                </span>
              )}
            </div>

            {existingFollowups.length === 0 ? (
              <div className="py-3.5 text-center text-slate-500 bg-white rounded-lg border border-amber-200">
                <p className="text-xs font-bold text-slate-600">
                  {isTe ? "ఈ కస్టమర్‌కి గతంలో ఎలాంటి కాల్స్ లాగ్ చేయలేదు." : "No calls logged yet for this customer."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-amber-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left text-slate-900 border-collapse">
                  <thead className="bg-amber-100 font-black text-amber-950 border-b border-amber-200 text-[11px] sticky top-0">
                    <tr>
                      <th className="py-1.5 px-2.5">{isTe ? "తేదీ" : "Date"}</th>
                      <th className="py-1.5 px-2.5">{isTe ? "కాల్ చేసినవారు" : "Called By"}</th>
                      <th className="py-1.5 px-2.5">{isTe ? "స్థితి" : "Status"}</th>
                      <th className="py-1.5 px-2.5">{isTe ? "రిమార్క్స్" : "Remarks"}</th>
                      <th className="py-1.5 px-2.5">{isTe ? "తదుపరి కాల్" : "Next Call"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {existingFollowups.map((h, i) => (
                      <tr key={h.id || i} className="hover:bg-amber-50/60">
                        <td className="py-1.5 px-2.5 font-mono font-bold text-amber-900 whitespace-nowrap">
                          {formatDisplayDate(h.callDate || todayStr)}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-700 whitespace-nowrap">
                          {h.calledBy || "Staff"}
                        </td>
                        <td className="py-1.5 px-2.5">
                          {h.status && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold whitespace-nowrap">
                              {h.status}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-800 font-medium min-w-[160px]">
                          {h.remarks || h.notes || "—"}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono text-blue-700 font-bold whitespace-nowrap">
                          {h.nextCallDate ? formatDisplayDate(h.nextCallDate) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Call Logger Form */}
          <form onSubmit={handleSaveCallLogSubmit} className="bg-purple-50/50 border border-purple-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-2 border-b border-purple-200 pb-2">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <h4 className="font-black text-purple-950 text-xs">
                {isTe ? "టెలికాలింగ్ కాల్ నమోదు & ఫాలో-అప్ (Log Telecalling Call)" : "Log Telecalling Call & Follow-up"}
              </h4>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {isTe ? "తదుపరి కాల్ / సర్వీస్ తేదీ (Preferred Date)" : "Next Call / Preferred Service Date"}
              </label>
              <input
                type="date"
                value={callPreferredDate}
                onChange={(e) => setCallPreferredDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-bold">
                  {isTe ? "కాల్ ఫలితం / స్థితి (Call Status)" : "Call Outcome / Status"}
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddStatus(!showAddStatus)}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-0.5"
                >
                  {showAddStatus ? "✕" : "+"} {isTe ? "కొత్త" : "New"}
                </button>
              </div>
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
                {customCallStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {showAddStatus && (
                <div className="mt-2 flex gap-1.5">
                  <input
                    type="text"
                    placeholder={isTe ? "కొత్త కారణం..." : "New status reason..."}
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddCustomStatus()}
                    className="flex-1 p-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-purple-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomStatus}
                    className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    {isTe ? "జోడించు" : "Add"}
                  </button>
                </div>
              )}
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

            {/* Quick action buttons row inside form */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-purple-200">
              <div className="flex items-center gap-1.5 flex-wrap">
                {cleanPhone && (
                  <a
                    href={`tel:${cleanPhone}`}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{isTe ? "డైరెక్ట్ కాల్" : "Call Now"}</span>
                  </a>
                )}
                {cleanPhone && (
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyDetails}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all border border-indigo-200"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? (isTe ? "కాపీ అయ్యింది!" : "Copied!") : (isTe ? "కాపీ" : "Copy")}</span>
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
          <div className="flex items-center gap-2">
            {onEditCustomer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditCustomer(customer);
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer border border-blue-200"
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>{isTe ? "కస్టమర్ ఎడిట్" : "Edit Customer"}</span>
              </button>
            )}
            {onRegisterComplaint && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRegisterComplaint(customer);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer border border-rose-200"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{isTe ? "కంప్లైంట్ నమోదు" : "Register Complaint"}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
          >
            {isTe ? "మూసివేయి (Close)" : "Close"}
          </button>
        </div>

      </div>
    </div>
  );
};
export default CustomerCallLogModal;
