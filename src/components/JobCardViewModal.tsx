import React from "react";
import {
  X,
  Printer,
  PenLine,
  Phone,
  Calendar,
  Wrench,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign
} from "lucide-react";
import { formatDisplayDate } from "../utils/dateFormatter";

interface JobCardViewModalProps {
  card: any;
  onClose: () => void;
  onEdit: (card: any) => void;
  onPrint: (card: any) => void;
  language?: "te" | "en";
}

export const JobCardViewModal: React.FC<JobCardViewModalProps> = ({
  card,
  onClose,
  onEdit,
  onPrint,
  language = "te"
}) => {
  if (!card) return null;

  const isTe = language === "te";
  const isClosed = card.status === "Closed" || (card.actualClosedDate && card.status !== "Open");

  const formatDate = (val: any) => {
    return formatDisplayDate(val, "—");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 z-50 overflow-y-auto print:hidden">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-emerald-800 text-white p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-inner border border-white/20">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black tracking-wide">
                  {isTe ? "జాబ్ కార్డ్ వివరాలు" : "Job Card Summary"}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isClosed
                      ? "bg-slate-200 text-slate-800"
                      : "bg-emerald-400 text-emerald-950"
                  }`}
                >
                  {isClosed ? "⚪ CLOSED" : "🟢 OPEN"}
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                JC No: <span className="font-mono font-bold text-white">{card.jobNo || card.onlineJobCardNo || "—"}</span>
                {card.onlineJobCardNo && card.onlineJobCardNo !== card.jobNo && (
                  <span className="ml-2 font-mono text-emerald-200">
                    (Online: {card.onlineJobCardNo})
                  </span>
                )}
                {card.branch && <span className="ml-2 font-semibold">📍 {card.branch}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrint(card)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Print Job Card"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isTe ? "ప్రింట్ చేయి" : "Print"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(card);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors border border-emerald-500 shadow-xs cursor-pointer"
              title="Edit Job Card"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>{isTe ? "ఎడిట్ చేయి" : "Edit"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 bg-slate-50 text-slate-800 text-xs">
          {/* Top 5 Key Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Customer Profile */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-emerald-800 font-bold text-xs">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{isTe ? "కస్టమర్ వివరాలు" : "Customer Details"}</span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTe ? "పేరు" : "Name"}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {card.custName || "—"}
                  </span>
                </div>
                {card.fatherName && (
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      {isTe ? "తండ్రి పేరు" : "Father's Name"}
                    </span>
                    <span className="text-slate-700 font-semibold">{card.fatherName}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTe ? "గ్రామం & మండలం" : "Village & Mandal"}
                  </span>
                  <span className="text-slate-700 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 inline" />
                    {[card.village, card.mandal].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTe ? "మొబైల్ నెంబర్" : "Mobile Phone"}
                  </span>
                  {card.ownerMob || card.phNo ? (
                    <div className="flex items-center gap-2 pt-0.5">
                      <a
                        href={`tel:${card.ownerMob || card.phNo}`}
                        className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {card.ownerMob || card.phNo}
                      </a>
                      <a
                        href={`https://wa.me/91${(card.ownerMob || card.phNo).replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold text-[10px]"
                      >
                        💬 WA
                      </a>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-mono">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Box 2: Tractor Details */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-indigo-900 font-bold text-xs">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <span>{isTe ? "ట్రాక్టర్ వివరాలు" : "Tractor Details"}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      {isTe ? "మోడల్" : "Model"}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {card.model || "Eicher Tractor"}
                    </span>
                  </div>
                  {card.modelType && (
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px] rounded">
                      {card.modelType}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTe ? "ఛాసిస్ నెంబర్" : "Chassis No"}
                  </span>
                  <span className="font-mono font-bold text-indigo-950 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100 block">
                    {card.chassisNo || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTe ? "ఇంజన్ నెంబర్" : "Engine No"}
                  </span>
                  <span className="font-mono text-slate-700">{card.engineNo || "—"}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      {isTe ? "డెలివరీ తేదీ" : "Delivery Date"}
                    </span>
                    <span className="font-mono text-slate-700">
                      {formatDate(card.dateOfDelivery || card.installDate)}
                    </span>
                  </div>
                  {card.regNo && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">
                        Reg No
                      </span>
                      <span className="font-mono font-bold text-slate-800">{card.regNo}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Box 3: Job & Dates Summary */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-slate-800 font-bold text-xs">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{isTe ? "జాబ్ & తేదీల వివరాలు" : "Job & Dates"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTe ? "కంప్లైంట్ తేదీ" : "Complaint Date"}
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatDate(card.complaintDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTe ? "జాబ్ ఓపెన్ తేదీ" : "Open Date"}
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatDate(card.jobDate || card.dateTimeIn || card.complaintDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTe ? "క్లోజ్డ్ తేదీ" : "Closed Date"}
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatDate(card.actualClosedDate || card.dateTimeOut)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTe ? "బిల్ నెంబర్" : "Bill No"}
                  </span>
                  <span className="font-mono font-bold text-emerald-800">
                    {card.billNo || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTe ? "సర్వీస్ ప్రదేశం" : "Location"}
                  </span>
                  <span className="font-semibold text-slate-700 capitalize">
                    {card.serviceLocation || "Workshop"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTe ? "బ్రాంచ్" : "Branch"}
                  </span>
                  <span className="font-semibold text-slate-700">{card.branch || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Done & Service Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service & Repair Work */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 font-bold text-xs text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  {isTe ? "సర్వీస్ & రిపేర్లు" : "Service & Repairs"}
                </span>
                <span className="font-mono bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                  ⏱️ {card.hourMeter || card.hrsRun || 0} Hours Run
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-600">
                    {isTe ? "సర్వీస్ రకం" : "Type of Service"}:
                  </span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {card.serviceType || "—"}
                  </span>
                </div>

                {card.freeServiceList && (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase mb-0.5">
                      {isTe ? "ఉచిత సర్వీస్ వివరాలు" : "Free Service Done"}
                    </span>
                    <span className="font-medium text-slate-800">{card.freeServiceList}</span>
                  </div>
                )}

                {(card.extraRepairs || card.reasonsForAnalysis || card.problemDescription) && (
                  <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/70 space-y-1">
                    <span className="text-[10px] text-amber-800 block font-extrabold uppercase">
                      {isTe ? "అదనపు రిపేర్లు / కారణాలు" : "Extra Repairs & Analysis"}
                    </span>
                    <p className="text-slate-800 font-medium whitespace-pre-line">
                      {card.extraRepairs || card.reasonsForAnalysis || card.problemDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Technician, Billing & Closure */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 font-bold text-xs text-slate-800">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {isTe ? "టెక్నీషియన్ & క్లోజర్" : "Technician & Closure"}
                </span>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      {isTe ? "టెక్నీషియన్ / మెకానిక్" : "Technician Name"}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {card.mechanic || card.technicianName || "—"}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      {isTe ? "సూపర్‌వైజర్" : "Supervisor"}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {card.supervisor || "—"}
                    </span>
                  </div>
                </div>

                {card.telecalling && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      {isTe ? "టెలికాలింగ్ ఫీడ్‌బ్యాక్" : "Telecalling Remarks"}
                    </span>
                    <span className="text-slate-700 font-medium">{card.telecalling}</span>
                  </div>
                )}

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                      {isTe ? "మొత్తం ఛార్జీలు" : "Total Bill Amount"}
                    </span>
                    <span className="text-base font-black text-emerald-950 font-mono">
                      ₹ {Number(card.totalAmount || card.grandTotal || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-white rounded border border-emerald-300 text-emerald-800 font-bold text-xs">
                    {card.billNo ? `Bill #${card.billNo}` : "Estimate"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-medium">
            Sri Gayathri Automotives • Eicher Dealership Management System
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrint(card)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isTe ? "ప్రింట్" : "Print"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(card);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>{isTe ? "ఎడిట్ చేయి" : "Edit Job Card"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              {isTe ? "మూసివేయి" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
