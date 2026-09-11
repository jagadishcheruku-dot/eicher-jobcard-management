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
    <div className="flex items-center justify-center gap-0.5 flex-nowrap overflow-x-auto max-w-[130px] mx-auto py-0.5 shrink-0 scrollbar-none">
      {/* 1. View */}
      {onView && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="w-4 h-4 p-0 bg-slate-100 hover:bg-slate-700 text-slate-700 hover:text-white rounded border border-slate-300 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "వివరాలు చూడండి" : "View Details"}
        >
          <Eye className="w-2.5 h-2.5" />
        </button>
      )}

      {/* 2. Edit (Only if permitted) */}
      {onEdit && canEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-4 h-4 p-0 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded border border-blue-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "సవరించు" : "Edit"}
        >
          <PenLine className="w-2.5 h-2.5" />
        </button>
      )}

      {/* 3. Print */}
      {onPrint && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrint();
          }}
          className="w-4 h-4 p-0 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded border border-indigo-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "ప్రింట్" : "Print"}
        >
          <Printer className="w-2.5 h-2.5" />
        </button>
      )}

      {/* 4. New Job Card (Only if permitted) */}
      {onNewJobCard && canCreate && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNewJobCard();
          }}
          className="w-4 h-4 p-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={jobCardLabel || (isTe ? "జాబ్ కార్డ్" : "New Job Card")}
        >
          <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
        </button>
      )}

      {/* 5. Call */}
      {onCall && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCall();
          }}
          className="w-4 h-4 p-0 bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-white rounded border border-amber-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "కాల్ లాగ్" : "Log Call"}
        >
          <PhoneCall className="w-2.5 h-2.5" />
        </button>
      )}

      {/* 6. History */}
      {onHistory && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onHistory();
          }}
          className="w-4 h-4 p-0 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white rounded border border-sky-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "చరిత్ర" : "History"}
        >
          <History className="w-2.5 h-2.5" />
        </button>
      )}

      {/* 7. WhatsApp */}
      {onWhatsApp && hasPhone && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onWhatsApp();
          }}
          className="w-4 h-4 p-0 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded border border-emerald-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title="WhatsApp"
        >
          <MessageCircle className="w-2.5 h-2.5" />
        </button>
      )}

      {/* 8. Complaint */}
      {onRegisterComplaint && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRegisterComplaint();
          }}
          className="w-4 h-4 p-0 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded border border-rose-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "కంప్లైంట్" : "Complaint"}
        >
          <AlertCircle className="w-2.5 h-2.5" />
        </button>
      )}

      {/* 9. Save */}
      {onSave && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          disabled={isSaving}
          className={`w-4 h-4 p-0 rounded transition-all flex items-center justify-center shrink-0 cursor-pointer border ${
            isSaved
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border-purple-200"
          }`}
          title={isSaved ? "Saved!" : "Save"}
        >
          {isSaved ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : <Save className="w-2.5 h-2.5" />}
        </button>
      )}

      {/* 10. Delete (Only if permitted) */}
      {onDelete && canDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-4 h-4 p-0 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded border border-red-200 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title={isTe ? "తొలగించు" : "Delete"}
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
};

export default RowActionButtons;
