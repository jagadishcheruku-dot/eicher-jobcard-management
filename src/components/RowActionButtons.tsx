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
  History,
  ChevronDown
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

// Single fixed-size triangle toggle button per row. Clicking it opens a
// small floating menu listing that row's actions - the menu floats above
// the table instead of expanding inline, so the Actions column always stays
// the same width and clicking one row's toggle never resizes the column or
// pushes other rows' data out of view. Only the row whose toggle you click
// shows its menu; every other row stays collapsed.
export const RowActionButtons: React.FC<RowActionButtonsProps> = ({
  isExpanded = false,
  onToggleExpand,
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

  const actions: {
    key: string;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
    className: string;
    disabled?: boolean;
  }[] = [];

  if (onCall) {
    actions.push({
      key: "call",
      onClick: onCall,
      label: isTe ? "కాల్ లాగ్ & టెలీకాలింగ్" : "Log Call & Information",
      icon: <PhoneCall className="w-3.5 h-3.5" />,
      className: "text-amber-700 hover:bg-amber-50 font-black",
    });
  }
  if (onEdit && canEdit) {
    actions.push({
      key: "edit",
      onClick: onEdit,
      label: isTe ? "సవరించు" : "Edit",
      icon: <PenLine className="w-3.5 h-3.5" />,
      className: "text-blue-700 hover:bg-blue-50",
    });
  }
  if (onView) {
    actions.push({
      key: "view",
      onClick: onView,
      label: isTe ? "వివరాలు చూడండి" : "View Details",
      icon: <Eye className="w-3.5 h-3.5" />,
      className: "text-slate-700 hover:bg-slate-100",
    });
  }
  if (onPrint) {
    actions.push({
      key: "print",
      onClick: onPrint,
      label: isTe ? "ప్రింట్" : "Print",
      icon: <Printer className="w-3.5 h-3.5" />,
      className: "text-indigo-700 hover:bg-indigo-50",
    });
  }
  if (onNewJobCard && canCreate) {
    actions.push({
      key: "newjc",
      onClick: onNewJobCard,
      label: jobCardLabel || (isTe ? "జాబ్ కార్డ్" : "New Job Card"),
      icon: <Plus className="w-3.5 h-3.5 stroke-[2.5]" />,
      className: "text-emerald-700 hover:bg-emerald-50 font-black",
    });
  }
  if (onHistory) {
    actions.push({
      key: "history",
      onClick: onHistory,
      label: isTe ? "చరిత్ర" : "History",
      icon: <History className="w-3.5 h-3.5" />,
      className: "text-sky-700 hover:bg-sky-50",
    });
  }
  if (onWhatsApp && hasPhone) {
    actions.push({
      key: "whatsapp",
      onClick: onWhatsApp,
      label: "WhatsApp",
      icon: <MessageCircle className="w-3.5 h-3.5" />,
      className: "text-emerald-700 hover:bg-emerald-50",
    });
  }
  if (onRegisterComplaint) {
    actions.push({
      key: "complaint",
      onClick: onRegisterComplaint,
      label: isTe ? "కంప్లైంట్" : "Complaint",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      className: "text-rose-700 hover:bg-rose-50",
    });
  }
  if (onSave) {
    actions.push({
      key: "save",
      onClick: onSave,
      label: isSaved ? (isTe ? "సేవ్ అయ్యింది!" : "Saved!") : (isTe ? "సేవ్ చేయండి" : "Save"),
      icon: isSaved ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Save className="w-3.5 h-3.5" />,
      className: isSaved ? "text-emerald-700 bg-emerald-50" : "text-purple-700 hover:bg-purple-50",
      disabled: isSaving,
    });
  }
  if (onDelete && canDelete) {
    actions.push({
      key: "delete",
      onClick: onDelete,
      label: isTe ? "తొలగించు" : "Delete",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      className: "text-red-600 hover:bg-red-50",
    });
  }

  return (
    <div className="relative inline-flex items-center justify-end shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleExpand) onToggleExpand();
        }}
        className={`w-6 h-6 p-1 rounded-lg border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
          isExpanded
            ? "bg-slate-700 text-white border-slate-700"
            : "bg-slate-100 hover:bg-slate-700 text-slate-600 hover:text-white border-slate-300"
        }`}
        title={isTe ? "చర్యలు" : "Actions"}
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {isExpanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-44 max-h-72 overflow-y-auto"
        >
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              disabled={a.disabled}
              onClick={(e) => {
                e.stopPropagation();
                a.onClick();
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${a.className}`}
            >
              {a.icon}
              <span className="truncate">{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RowActionButtons;
