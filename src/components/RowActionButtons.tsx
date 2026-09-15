import React from "react";
import {
  PhoneCall,
  Plus,
  MessageCircle,
  AlertCircle,
  PenLine,
  Save,
  Check,
  Trash2,
  Eye,
  Printer,
  History
} from "lucide-react";

export interface RowActionButtonsProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  language?: "te" | "en";
  onCall?: () => void;
  onNewJobCard?: () => void;
  onWhatsApp?: () => void;
  onRegisterComplaint?: () => void;
  onCopy?: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onPrint?: () => void;
  onHistory?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  jobCardLabel?: string;
  hasPhone?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

// All applicable icons show inline, all the time, at a small fixed size -
// no per-row expand/collapse. That keeps every row's Actions cell showing
// the same fixed set of icons, so the column's width never shifts when you
// interact with a single row (which is what used to hide other columns'
// data).
export const RowActionButtons: React.FC<RowActionButtonsProps> = ({
  language = "te",
  onCall,
  onNewJobCard,
  onWhatsApp,
  onRegisterComplaint,
  onEdit,
  onSave,
  onDelete,
  onView,
  onPrint,
  onHistory,
  isSaving = false,
  isSaved = false,
  jobCardLabel,
  hasPhone = true,
  canEdit = true,
  canDelete = true,
  canCreate = true,
}) => {
  const isTe = language === "te";

  return (
    <div className="flex items-center justify-end gap-0.5 flex-nowrap shrink-0">
      {onView && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="w-5 h-5 p-0.5 bg-slate-100 hover:bg-slate-700 text-slate-700 hover:text-white rounded border border-slate-300 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "వివరాలు చూడండి" : "View Details"}
        >
          <Eye className="w-2.5 h-2.5" />
        </button>
      )}

      {onEdit && canEdit && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-5 h-5 p-0.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded border border-blue-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "సవరించు" : "Edit"}
        >
          <PenLine className="w-2.5 h-2.5" />
        </button>
      )}

      {onPrint && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrint(); }}
          className="w-5 h-5 p-0.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded border border-indigo-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "ప్రింట్" : "Print"}
        >
          <Printer className="w-2.5 h-2.5" />
        </button>
      )}

      {onNewJobCard && canCreate && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNewJobCard(); }}
          className="w-5 h-5 p-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={jobCardLabel || (isTe ? "జాబ్ కార్డ్" : "New Job Card")}
        >
          <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
        </button>
      )}

      {onCall && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCall(); }}
          className="w-5 h-5 p-0.5 bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded border border-amber-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm shadow-amber-500/30"
          title={isTe ? "📞 కాల్ లాగ్ & టెలీకాలింగ్" : "📞 Log Call & Information"}
        >
          <PhoneCall className="w-2.5 h-2.5" />
        </button>
      )}

      {onHistory && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onHistory(); }}
          className="w-5 h-5 p-0.5 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white rounded border border-sky-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "చరిత్ర" : "History"}
        >
          <History className="w-2.5 h-2.5" />
        </button>
      )}

      {onWhatsApp && hasPhone && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onWhatsApp(); }}
          className="w-5 h-5 p-0.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded border border-emerald-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title="WhatsApp"
        >
          <MessageCircle className="w-2.5 h-2.5" />
        </button>
      )}

      {onRegisterComplaint && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRegisterComplaint(); }}
          className="w-5 h-5 p-0.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded border border-rose-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "కంప్లైంట్" : "Complaint"}
        >
          <AlertCircle className="w-2.5 h-2.5" />
        </button>
      )}

      {onSave && (
        <button
          type="button"
          disabled={isSaving}
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className={`w-5 h-5 p-0.5 rounded border transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isSaved
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border-purple-200"
          }`}
          title={isSaved ? "Saved!" : "Save"}
        >
          {isSaved ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : <Save className="w-2.5 h-2.5" />}
        </button>
      )}

      {onDelete && canDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-5 h-5 p-0.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded border border-red-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "తొలగించు" : "Delete"}
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
};

export default RowActionButtons;
