import React, { useState } from "react";
import {
  LayoutDashboard,
  FilePlus,
  Users,
  FileSpreadsheet,
  Tent,
  PhoneCall,
  Headphones,
  AlertCircle,
  UserCheck,
  BarChart3,
  Database,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Sliders,
  Layers,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export interface MenuOrderSettingsProps {
  language: "te" | "en";
  menuOrder: string[];
  setMenuOrder: (order: string[]) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  onSaveToCloud?: (order: string[], locked: boolean) => Promise<void>;
  defaultOrder?: string[];
}

export const DEFAULT_MENU_ORDER = [
  "dashboard",
  "new_entry",
  "customer_data",
  "job_cards_data",
  "service_camp_planning",
  "free_service_followup",
  "telecalling",
  "complaints",
  "attendance",
  "reports",
  "databases",
];

interface MenuItemMeta {
  key: string;
  nameTe: string;
  nameEn: string;
  descTe: string;
  descEn: string;
  icon: React.ReactNode;
  accentColor: string;
  bgLight: string;
}

const MENU_ITEMS_META: Record<string, MenuItemMeta> = {
  dashboard: {
    key: "dashboard",
    nameTe: "📊 డాష్‌బోర్డ్ & లైవ్ సమ్మరీ",
    nameEn: "Dashboard & Live Summary",
    descTe: "సర్వీస్ మరియు జాబ్ కార్డుల తాజా విశ్లేషణలు",
    descEn: "Live overview of tractor services & revenue",
    icon: <LayoutDashboard className="w-4 h-4 text-blue-700" />,
    accentColor: "border-blue-500 text-blue-900",
    bgLight: "bg-blue-50",
  },
  new_entry: {
    key: "new_entry",
    nameTe: "✍️ కొత్త జాబ్ ఎంట్రీ",
    nameEn: "New Job Card Entry",
    descTe: "కొత్త జాబ్ కార్డ్ వివరాలు వేగంగా నమోదు చేయండి",
    descEn: "Create new job cards with live spares pricing",
    icon: <FilePlus className="w-4 h-4 text-emerald-700" />,
    accentColor: "border-emerald-500 text-emerald-900",
    bgLight: "bg-emerald-50",
  },
  saved_cards: {
    key: "saved_cards",
    nameTe: "👥 కస్టమర్లు & జాబ్ కార్డులు",
    nameEn: "Customers & Job Cards",
    descTe: "పూర్తి కస్టమర్ డేటా, సేవ్ చేసిన జాబ్ కార్డులు, ప్రింట్ & ఎక్సెల్ ఫిల్టర్స్",
    descEn: "Master records of tractor owners, saved job cards & Excel spreadsheet",
    icon: <Users className="w-4 h-4 text-purple-700" />,
    accentColor: "border-purple-500 text-purple-900",
    bgLight: "bg-purple-50",
  },
  customer_data: {
    key: "customer_data",
    nameTe: "👤 కస్టమర్ డేటా",
    nameEn: "Customer Data",
    descTe: "పూర్తి కస్టమర్ మాస్టర్ డేటా, ప్రింట్ & ఎక్సెల్ ఫిల్టర్స్",
    descEn: "Master records of tractor owners & customer details",
    icon: <Users className="w-4 h-4 text-blue-700" />,
    accentColor: "border-blue-500 text-blue-900",
    bgLight: "bg-blue-50",
  },
  job_cards_data: {
    key: "job_cards_data",
    nameTe: "🔧 జాబ్ కార్డ్ డేటా",
    nameEn: "Job Cards Data",
    descTe: "సేవ్ చేసిన జాబ్ కార్డులు, ప్రింట్ & ఎక్సెల్ ఫిల్టర్స్",
    descEn: "All saved job cards, service history & Excel spreadsheet",
    icon: <Users className="w-4 h-4 text-orange-700" />,
    accentColor: "border-orange-500 text-orange-900",
    bgLight: "bg-orange-50",
  },
  customers_and_jobcards: {
    key: "customers_and_jobcards",
    nameTe: "👥 కస్టమర్లు & జాబ్ కార్డులు",
    nameEn: "Customers & Job Cards Master",
    descTe: "పూర్తి కస్టమర్ డేటా, జాబ్ హిస్టరీ & ఎక్సెల్ ఫిల్టర్స్",
    descEn: "Master records of tractor owners & all job sheets",
    icon: <Users className="w-4 h-4 text-purple-700" />,
    accentColor: "border-purple-500 text-purple-900",
    bgLight: "bg-purple-50",
  },
  service_camp_planning: {
    key: "service_camp_planning",
    nameTe: "⛺ సర్వీస్ క్యాంప్ ప్లానింగ్",
    nameEn: "Service Camp Planning",
    descTe: "గ్రామాల వారీగా క్యాంపుల షెడ్యూలింగ్ & టార్గెట్స్",
    descEn: "Plan village service camps & customer outreach",
    icon: <Tent className="w-4 h-4 text-indigo-700" />,
    accentColor: "border-indigo-500 text-indigo-900",
    bgLight: "bg-indigo-50",
  },
  free_service_followup: {
    key: "free_service_followup",
    nameTe: "📞 ఫ్రీ సర్వీస్ ఫాలో-అప్",
    nameEn: "Free Service Follow-up",
    descTe: "1st, 2nd, 3rd, 4th ఉచిత సర్వీస్ డ్యూ కస్టమర్ల లిస్ట్",
    descEn: "Track upcoming warranty services & send reminders",
    icon: <PhoneCall className="w-4 h-4 text-teal-700" />,
    accentColor: "border-teal-500 text-teal-900",
    bgLight: "bg-teal-50",
  },
  telecalling: {
    key: "telecalling",
    nameTe: "📱 టెలికాలింగ్ డెస్క్ & డైలీ కాల్స్",
    nameEn: "Telecalling Desk & Daily Followups",
    descTe: "కాల్ రికార్డులు, కస్టమర్ ఫీడ్‌బ్యాక్ & రిమైండర్స్",
    descEn: "Customer call logs, voice notes & status tagging",
    icon: <Headphones className="w-4 h-4 text-amber-700" />,
    accentColor: "border-amber-500 text-amber-900",
    bgLight: "bg-amber-50",
  },
  complaints: {
    key: "complaints",
    nameTe: "⚠️ కంప్లయింట్స్ రిజిస్టర్",
    nameEn: "Complaints & Service Requests",
    descTe: "కస్టమర్ సమస్యల నమోదు & పరిష్కార స్థితి",
    descEn: "Log issues, assign technicians & track resolution",
    icon: <AlertCircle className="w-4 h-4 text-rose-700" />,
    accentColor: "border-rose-500 text-rose-900",
    bgLight: "bg-rose-50",
  },
  attendance: {
    key: "attendance",
    nameTe: "📅 స్టాఫ్ అటెండెన్స్ & హాజరు",
    nameEn: "Staff Attendance & Duty Register",
    descTe: "మెకానిక్ మరియు స్టాఫ్ రోజువారీ హాజరు",
    descEn: "Technician & staff daily attendance logs",
    icon: <UserCheck className="w-4 h-4 text-teal-800" />,
    accentColor: "border-teal-600 text-teal-950",
    bgLight: "bg-teal-50",
  },
  reports: {
    key: "reports",
    nameTe: "📈 రిపోర్ట్స్ & ఎనలిటిక్స్",
    nameEn: "Reports & Financial Analytics",
    descTe: "ఆదాయం, స్పేర్స్ ఖర్చులు & పర్ఫార్మెన్స్ రిపోర్టులు",
    descEn: "Revenue charts, spare parts breakdown & performance",
    icon: <BarChart3 className="w-4 h-4 text-sky-700" />,
    accentColor: "border-sky-500 text-sky-900",
    bgLight: "bg-sky-50",
  },
  databases: {
    key: "databases",
    nameTe: "🗄️ మాస్టర్ డేటాబేస్ & బ్యాకప్",
    nameEn: "Master Databases & App Settings",
    descTe: "ఎక్సెల్ డేటా దిగుమతి/ఎగుమతి & సిస్టమ్ సెట్టింగ్స్",
    descEn: "Excel database upload, backup, restore & settings",
    icon: <Database className="w-4 h-4 text-emerald-800" />,
    accentColor: "border-emerald-600 text-emerald-950",
    bgLight: "bg-emerald-50",
  },
};

export const MenuOrderSettings: React.FC<MenuOrderSettingsProps> = ({
  language,
  menuOrder,
  setMenuOrder,
  isLocked,
  setIsLocked,
  onSaveToCloud,
  defaultOrder = DEFAULT_MENU_ORDER,
}) => {
  const isTe = language === "te";
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Ensure all defined menus are present in current order
  const fullOrder = React.useMemo(() => {
    // Legacy combined menu keys expand into the two separate modern menu items
    const cleanOrder = (Array.isArray(menuOrder) ? menuOrder : []).filter(Boolean);
    const expandedOrder = cleanOrder.flatMap((key) => {
      if (key === "customers_and_jobcards" || key === "saved_cards") return ["customer_data", "job_cards_data"];
      return [key];
    });
    const missing = defaultOrder.filter((key) => !expandedOrder.includes(key));
    const clean = expandedOrder.filter((key) => defaultOrder.includes(key));
    return Array.from(new Set([...clean, ...missing]));
  }, [menuOrder, defaultOrder]);

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (isLocked) {
      showNotification(
        isTe
          ? "🔒 మెనూ ఆర్డర్ లాక్ చేయబడింది! మార్చడానికి ముందుగా అన్‌లాక్ చేయండి."
          : "🔒 Menu order is locked! Unlock to modify order."
      );
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fullOrder.length) return;

    const newOrder = [...fullOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    setMenuOrder(newOrder);

    // Save to localStorage immediately
    try {
      localStorage.setItem("app_sidebar_menu_order", JSON.stringify(newOrder));
    } catch {}

    if (onSaveToCloud) {
      onSaveToCloud(newOrder, isLocked);
    }
  };

  const handleToggleLock = () => {
    const nextLockedState = !isLocked;
    setIsLocked(nextLockedState);

    try {
      localStorage.setItem(
        "app_sidebar_menu_order_locked",
        nextLockedState ? "true" : "false"
      );
      localStorage.setItem(
        "app_sidebar_menu_order",
        JSON.stringify(fullOrder)
      );
    } catch {}

    if (onSaveToCloud) {
      onSaveToCloud(fullOrder, nextLockedState);
    }

    if (nextLockedState) {
      showNotification(
        isTe
          ? "🔒 మెనూ ఆర్డర్ లాక్ చేయబడింది! పేజీ రీఫ్రెష్ చేసినా ఈ ఆర్డర్ శాశ్వతంగా అలాగే ఉంటుంది."
          : "🔒 Menu order locked! This custom order will stay permanent on all refreshes."
      );
    } else {
      showNotification(
        isTe
          ? "🔓 మెనూ ఆర్డర్ అన్‌లాక్ చేయబడింది. మీరు ఇప్పుడు అంశాల స్థానాన్ని మార్చవచ్చు."
          : "🔓 Menu order unlocked. You can now reorder items."
      );
    }
  };

  const handleResetToDefault = () => {
    if (isLocked) {
      showNotification(
        isTe
          ? "🔒 రీసెట్ చేయడానికి ముందుగా మెనూ ఆర్డర్‌ను అన్‌లాక్ చేయండి."
          : "🔒 Please unlock before resetting to default."
      );
      return;
    }

    if (
      window.confirm(
        isTe
          ? "మెనూ ఆర్డర్‌ను ప్రారంభ డిఫాల్ట్ స్థితికి రీసెట్ చేయాలనుకుంటున్నారా?"
          : "Are you sure you want to reset menu order to default?"
      )
    ) {
      setMenuOrder(defaultOrder);
      try {
        localStorage.setItem("app_sidebar_menu_order", JSON.stringify(defaultOrder));
        localStorage.setItem("app_sidebar_menu_order_locked", "false");
      } catch {}

      if (onSaveToCloud) {
        onSaveToCloud(defaultOrder, false);
      }

      showNotification(
        isTe
          ? "✅ మెనూ ఆర్డర్ డిఫాల్ట్ స్థితికి రీసెట్ చేయబడింది."
          : "✅ Menu order reset to standard default."
      );
    }
  };

  const applyPreset = (presetOrder: string[], label: string) => {
    if (isLocked) {
      showNotification(
        isTe
          ? "🔒 ప్రీసెట్ అప్లై చేయడానికి ముందుగా అన్‌లాక్ చేయండి."
          : "🔒 Please unlock to apply a preset."
      );
      return;
    }

    setMenuOrder(presetOrder);
    try {
      localStorage.setItem("app_sidebar_menu_order", JSON.stringify(presetOrder));
    } catch {}

    if (onSaveToCloud) {
      onSaveToCloud(presetOrder, isLocked);
    }

    showNotification(
      isTe
        ? `✅ "${label}" ప్రీసెట్ విజయవంతంగా వర్తింపజేయబడింది.`
        : `✅ "${label}" preset applied.`
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl border-2 border-indigo-100 shadow-sm overflow-hidden space-y-0">
      {/* Toast Notification */}
      {saveToast && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-all animate-fade-in shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveToast}</span>
          </div>
          <button
            onClick={() => setSaveToast(null)}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Collapsed / Minimized Bar Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 md:p-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3 cursor-pointer hover:bg-slate-800/95 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-black tracking-tight text-white flex items-center gap-1.5">
                {isTe ? "⚙️ సైడ్‌బార్ మెనూ ఆర్డర్ సెట్టింగ్స్" : "⚙️ Sidebar Menu Order Settings"}
              </h2>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isLocked
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                }`}
              >
                {isLocked
                  ? isTe
                    ? "🔒 లాక్ చేయబడింది"
                    : "🔒 Locked"
                  : isTe
                  ? "🔓 అన్‌లాక్"
                  : "🔓 Unlocked"}
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 font-medium">
              {isTe
                ? "మెనూ క్రమాన్ని మార్చడానికి లేదా లాక్ చేయడానికి ఇక్కడ క్లిక్ చేసి తెరవండి (కనిష్టపరిచిన మోడ్)."
                : "Click here to expand and reorder sidebar items or toggle lock state (minimized mode)."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-800 hover:bg-indigo-700 text-white border border-indigo-600 transition shadow-sm cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>{isTe ? "మినిమైజ్ చేయండి" : "Minimize"}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>{isTe ? "ఓపెన్ చేయండి / సెట్ చేయండి" : "Expand & Configure"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content Section */}
      {isExpanded && (
        <div className="border-t border-indigo-100 animate-fadeIn">
          {/* Action Bar with Lock Toggle and Reset */}
          <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
            <div className="text-xs text-slate-300 font-medium flex items-center gap-2">
              {isLocked ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <Layers className="w-4 h-4 text-amber-400" />
              )}
              <span>
                {isLocked
                  ? isTe
                    ? "🔒 ఆర్డర్ లాక్ చేయబడింది. మార్చడానికి అన్‌లాక్ చేయండి."
                    : "🔒 Menu is locked against edits and persists on all refreshes."
                  : isTe
                  ? "🔓 మీరు అంశాలను పైకి/కిందికి జరిపి ఆ తర్వాత లాక్ చేయవచ్చు."
                  : "🔓 Reorder items and click Lock to permanently freeze."}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleLock}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer ${
                  isLocked
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-300 font-extrabold animate-pulse"
                }`}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-white" />
                    <span>{isTe ? "🔒 లాక్ చేయబడింది (Locked)" : "🔒 Menu Locked"}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-950" />
                    <span>{isTe ? "🔓 అన్‌లాక్ (లాక్ చేయండి)" : "🔓 Unlocked (Click to Lock)"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={isLocked}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title={isTe ? "డిఫాల్ట్ ఆర్డర్‌కు రీసెట్ చేయండి" : "Reset to Default Order"}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isTe ? "రీసెట్" : "Reset"}</span>
              </button>
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isTe ? "క్విక్ ప్రీసెట్స్ (Quick Layouts):" : "Quick Presets:"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isLocked}
                onClick={() =>
                  applyPreset(
                    [
                      "customer_data",
                      "job_cards_data",
                      "new_entry",
                      "free_service_followup",
                      "telecalling",
                      "service_camp_planning",
                      "dashboard",
                      "complaints",
                      "attendance",
                      "reports",
                      "databases",
                    ],
                    isTe ? "జాబ్ కార్డ్స్ & కస్టమర్లు మొదట" : "Job Cards & Customers First"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 font-bold border border-indigo-200 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
              >
                📋 {isTe ? "జాబ్ కార్డ్స్ & కస్టమర్లు మొదట" : "Job Cards First"}
              </button>

              <button
                type="button"
                disabled={isLocked}
                onClick={() =>
                  applyPreset(
                    [
                      "dashboard",
                      "reports",
                      "new_entry",
                      "customer_data",
                      "job_cards_data",
                      "service_camp_planning",
                      "free_service_followup",
                      "telecalling",
                      "complaints",
                      "attendance",
                      "databases",
                    ],
                    isTe ? "డాష్‌బోర్డ్ & ఎనలిటిక్స్ మొదట" : "Dashboard First"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 font-bold border border-indigo-200 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
              >
                📊 {isTe ? "డాష్‌బోర్డ్ & రిపోర్ట్స్ మొదట" : "Dashboard First"}
              </button>

              <button
                type="button"
                disabled={isLocked}
                onClick={() =>
                  applyPreset(
                    DEFAULT_MENU_ORDER,
                    isTe ? "స్టాండర్డ్ డిఫాల్ట్" : "Standard Default"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-slate-800 font-bold border border-slate-300 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
              >
                👑 {isTe ? "డిఫాల్ట్ క్రమం" : "Default Order"}
              </button>
            </div>
          </div>

          {/* Menu Reorder List */}
          <div className="p-4 md:p-6 bg-slate-50/50">
            <div className="space-y-2.5 max-w-4xl mx-auto">
              {fullOrder.map((menuKey, index) => {
                const meta = MENU_ITEMS_META[menuKey] || {
                  key: menuKey,
                  nameTe: menuKey,
                  nameEn: menuKey,
                  descTe: "సిస్టమ్ మెనూ విభాగం",
                  descEn: "System menu item",
                  icon: <Layers className="w-4 h-4 text-slate-600" />,
                  accentColor: "border-slate-300 text-slate-800",
                  bgLight: "bg-slate-100",
                };

                const isFirst = index === 0;
                const isLast = index === fullOrder.length - 1;

                return (
                  <div
                    key={menuKey}
                    className={`flex items-center justify-between p-3 rounded-xl border bg-white transition-all shadow-xs ${
                      isLocked
                        ? "border-slate-200 opacity-95"
                        : "border-slate-300 hover:border-indigo-400 hover:shadow-sm"
                    }`}
                  >
                    {/* Left: Position & Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Position Badge */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                          index === 0
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : index === 1
                            ? "bg-indigo-100 text-indigo-900 border border-indigo-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        #{index + 1}
                      </div>

                      {/* Icon Avatar */}
                      <div
                        className={`p-2 rounded-lg ${meta.bgLight} border border-slate-200/80 shrink-0`}
                      >
                        {meta.icon}
                      </div>

                      {/* Title & Description */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs md:text-sm text-slate-900 truncate">
                            {isTe ? meta.nameTe : meta.nameEn}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            ({meta.key})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate hidden md:block">
                          {isTe ? meta.descTe : meta.descEn}
                        </p>
                      </div>
                    </div>

                    {/* Right: Reorder Controls */}
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <button
                        type="button"
                        disabled={isLocked || isFirst}
                        onClick={() => handleMove(index, "up")}
                        className="p-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 disabled:opacity-20 disabled:cursor-not-allowed border border-slate-200 transition cursor-pointer font-black text-xs flex items-center gap-1"
                        title={isTe ? "పైకి జరుపు" : "Move Up"}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span className="text-[10px] hidden sm:inline">
                          {isTe ? "పైకి" : "Up"}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isLocked || isLast}
                        onClick={() => handleMove(index, "down")}
                        className="p-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 disabled:opacity-20 disabled:cursor-not-allowed border border-slate-200 transition cursor-pointer font-black text-xs flex items-center gap-1"
                        title={isTe ? "కిందికి జరుపు" : "Move Down"}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                        <span className="text-[10px] hidden sm:inline">
                          {isTe ? "కిందికి" : "Down"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
