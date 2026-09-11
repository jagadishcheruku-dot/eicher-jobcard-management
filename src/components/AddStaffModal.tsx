import React, { useState, useEffect } from "react";
import {
  UserPlus,
  X,
  User,
  Phone,
  MapPin,
  Wrench,
  Calendar,
  Building,
  Check,
  AlertCircle,
  Save,
  RotateCcw,
  Shield,
  Trash2,
  Briefcase
} from "lucide-react";

export interface StaffFormData {
  id?: string;
  name: string;
  fatherName?: string;
  role: string;
  mobileNumber?: string;
  village?: string;
  mandal?: string;
  dateOfJoining?: string;
  supervisor?: string;
  branch?: string;
  address?: string;
  status?: "active" | "inactive";
  notes?: string;
}

interface AddStaffModalProps {
  isOpen: boolean;
  language?: "te" | "en";
  initialStaff?: StaffFormData | null;
  supervisorsList?: string[];
  branchesList?: string[];
  onClose: () => void;
  onSave: (staffData: StaffFormData) => Promise<void> | void;
  onDelete?: (staffId: string) => Promise<void> | void;
}

const ROLES = [
  { value: "mechanic", labelEn: "Mechanic / Technician", labelTe: "మెకానిక్ / టెక్నీషియన్" },
  { value: "supervisor", labelEn: "Workshop Supervisor", labelTe: "వర్క్‌షాప్ సూపర్‌వైజర్" },
  { value: "electrician", labelEn: "Auto Electrician", labelTe: "ఆటో ఎలక్ట్రీషియన్" },
  { value: "telecaller", labelEn: "Telecaller / Service Advisor", labelTe: "టెలికాలర్ / సర్వీస్ అడ్వైజర్" },
  { value: "manager", labelEn: "Service Manager", labelTe: "సర్వీస్ మేనేజర్" },
  { value: "driver", labelEn: "Driver / Delivery Incharge", labelTe: "డ్రైవర్ / డెలివరీ ఇన్‌ఛార్జ్" },
  { value: "accountant", labelEn: "Accountant / Cashier", labelTe: "అకౌంటెంట్ / క్యాషియర్" },
  { value: "helper", labelEn: "Helper / Trainee", labelTe: "హెల్పర్ / ట్రైనీ" }
];

const DEFAULT_BRANCHES = [
  "Vuyyuru",
  "Vijayawada",
  "Machilipatnam",
  "Gudivada",
  "Nuzvid",
  "Tiruvuru"
];

const POPULAR_MANDALS = [
  "Vuyyuru",
  "Vijayawada Rural",
  "Gudivada",
  "Machilipatnam",
  "Pamarru",
  "Gannavaram",
  "Nuzvid",
  "Tiruvuru",
  "Kanchikacherla",
  "Ibrahimpatnam",
  "Jaggayyapeta",
  "Nandigama",
  "Challapalli",
  "Movva",
  "Mopidevi",
  "Pedana",
  "Bantumilli",
  "Mudinepalli",
  "Mandavalli",
  "Kaikalur",
  "Kalidindi",
  "Musunuru",
  "Mylavaram",
  "Vissannapeta",
  "Reddigudem"
];

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  language = "te",
  initialStaff = null,
  supervisorsList = [],
  branchesList = DEFAULT_BRANCHES,
  onClose,
  onSave,
  onDelete
}) => {
  const isTe = language === "te";
  const isEditing = !!initialStaff && !!initialStaff.id;

  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    fatherName: "",
    role: "mechanic",
    mobileNumber: "",
    village: "",
    mandal: "",
    dateOfJoining: new Date().toISOString().split("T")[0],
    supervisor: "",
    branch: "Vuyyuru",
    address: "",
    status: "active",
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialStaff) {
        setFormData({
          id: initialStaff.id || "",
          name: initialStaff.name || "",
          fatherName: initialStaff.fatherName || "",
          role: initialStaff.role || "mechanic",
          mobileNumber: initialStaff.mobileNumber || "",
          village: initialStaff.village || "",
          mandal: initialStaff.mandal || "",
          dateOfJoining: initialStaff.dateOfJoining || new Date().toISOString().split("T")[0],
          supervisor: initialStaff.supervisor || "",
          branch: initialStaff.branch || "Vuyyuru",
          address: initialStaff.address || "",
          status: initialStaff.status || "active",
          notes: initialStaff.notes || ""
        });
      } else {
        setFormData({
          name: "",
          fatherName: "",
          role: "mechanic",
          mobileNumber: "",
          village: "",
          mandal: "",
          dateOfJoining: new Date().toISOString().split("T")[0],
          supervisor: "",
          branch: "Vuyyuru",
          address: "",
          status: "active",
          notes: ""
        });
      }
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen, initialStaff]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof StaffFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage(
        isTe
          ? "దయచేసి ఉద్యోగి పూర్తి పేరు నమోదు చేయండి (Staff Name is required)"
          : "Please enter staff member name"
      );
      return;
    }

    if (formData.mobileNumber && formData.mobileNumber.replace(/\D/g, "").length < 10) {
      setErrorMessage(
        isTe
          ? "దయచేసి 10 అంకెల సరైన మొబైల్ నంబర్ నమోదు చేయండి"
          : "Please enter a valid 10-digit mobile number"
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        mobileNumber: (formData.mobileNumber || "").replace(/\D/g, "")
      });
      setSuccessMessage(
        isTe
          ? "సిబ్బంది వివరాలు విజయవంతంగా భద్రపరచబడ్డాయి!"
          : "Staff details saved successfully!"
      );
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error("Save staff error:", err);
      setErrorMessage(err.message || (isTe ? "సేవ్ చేయడంలో లోపం ఏర్పడింది" : "Error saving staff"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialStaff?.id || !onDelete) return;
    const confirmDelete = window.confirm(
      isTe
        ? `మీరు నిజంగా "${formData.name}" ఉద్యోగి రికార్డును తొలగించాలనుకుంటున్నారా?`
        : `Are you sure you want to delete staff member "${formData.name}"?`
    );
    if (!confirmDelete) return;

    setIsSubmitting(true);
    try {
      await onDelete(initialStaff.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to delete");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 text-white px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <UserPlus className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide">
                {isEditing
                  ? isTe
                    ? "ఉద్యోగి వివరాలు సవరించండి (Edit Staff)"
                    : "Edit Staff Details"
                  : isTe
                  ? "కొత్త ఉద్యోగిని జోడించండి (Add New Staff)"
                  : "Add New Staff Member"}
              </h2>
              <p className="text-[11px] text-emerald-200 font-medium">
                {isTe
                  ? "మెకానిక్స్, సూపర్‌వైజర్లు మరియు సిబ్బంది సమాచారం"
                  : "Register mechanics, supervisors, and workshop staff"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY FORM */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. FULL NAME */}
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-700" />
                <span>{isTe ? "ఉద్యోగి పూర్తి పేరు (Full Name) *" : "Full Name *"}</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={isTe ? "ఉదా: K. రాంబాబు, శ్రీనివాస్" : "e.g. K. Rambabu, M. Srinivas"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all shadow-2xs"
                autoFocus
              />
            </div>

            {/* 2. ROLE */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-teal-700" />
                <span>{isTe ? "హోదా / పాత్ర (Designation / Role) *" : "Designation / Role *"}</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all shadow-2xs"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {isTe ? `${r.labelTe} (${r.labelEn})` : r.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. MOBILE NUMBER */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-700" />
                <span>{isTe ? "మొబైల్ ఫోన్ నంబర్ (Phone No)" : "Mobile Phone No"}</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                value={formData.mobileNumber}
                onChange={(e) => handleInputChange("mobileNumber", e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-900 outline-none transition-all shadow-2xs"
              />
            </div>

            {/* 4. FATHER'S NAME */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{isTe ? "తండ్రి పేరు (Father's Name)" : "Father's Name"}</span>
              </label>
              <input
                type="text"
                value={formData.fatherName}
                onChange={(e) => handleInputChange("fatherName", e.target.value)}
                placeholder={isTe ? "తండ్రి పేరు" : "Father's Name"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all shadow-2xs"
              />
            </div>

            {/* 5. BRANCH */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-teal-700" />
                <span>{isTe ? "బ్రాంచ్ / లొకేషన్ (Branch)" : "Branch / Workshop"}</span>
              </label>
              <select
                value={formData.branch}
                onChange={(e) => handleInputChange("branch", e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all shadow-2xs"
              >
                {branchesList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. VILLAGE */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{isTe ? "గ్రామం (Village / Town)" : "Village / Town"}</span>
              </label>
              <input
                type="text"
                value={formData.village}
                onChange={(e) => handleInputChange("village", e.target.value)}
                placeholder={isTe ? "గ్రామం పేరు" : "Village / Town"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all shadow-2xs"
              />
            </div>

            {/* 7. MANDAL */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{isTe ? "మండలం (Mandal)" : "Mandal"}</span>
              </label>
              <input
                type="text"
                list="staff-mandals-list"
                value={formData.mandal}
                onChange={(e) => handleInputChange("mandal", e.target.value)}
                placeholder={isTe ? "మండలం ఎంచుకోండి" : "Mandal"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all shadow-2xs"
              />
              <datalist id="staff-mandals-list">
                {POPULAR_MANDALS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            {/* 8. DATE OF JOINING */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                <span>{isTe ? "చేరిన తేదీ (Date of Joining)" : "Date of Joining"}</span>
              </label>
              <input
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => handleInputChange("dateOfJoining", e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all shadow-2xs"
              />
            </div>

            {/* 9. ASSIGNED SUPERVISOR */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-700" />
                <span>{isTe ? "సూపర్‌వైజర్ (Supervisor Incharge)" : "Assigned Supervisor"}</span>
              </label>
              <input
                type="text"
                list="staff-supervisors-options"
                value={formData.supervisor}
                onChange={(e) => handleInputChange("supervisor", e.target.value)}
                placeholder={isTe ? "సూపర్‌వైజర్ పేరు" : "Supervisor name"}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-teal-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all shadow-2xs"
              />
              <datalist id="staff-supervisors-options">
                {supervisorsList.map((sup) => (
                  <option key={sup} value={sup} />
                ))}
              </datalist>
            </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isTe ? "ఉద్యోగిని తొలగించండి" : "Delete Staff"}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer shadow-2xs"
            >
              {isTe ? "రద్దు చేయండి" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>{isTe ? "సేవ్ అవుతోంది..." : "Saving..."}</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {isEditing
                      ? isTe
                        ? "మార్పులను సేవ్ చేయండి"
                        : "Update Staff"
                      : isTe
                      ? "ఉద్యోగిని భద్రపరచండి"
                      : "Save Staff"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
