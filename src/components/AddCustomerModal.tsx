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
} from "lucide-react";

export interface NewCustomerFormData {
  branch?: string;
  sNo?: string;
  model?: string;
  modelType?: string;
  chassisNo: string;
  engineNo?: string;
  dateOfDel?: string;
  custName: string;
  fatherName?: string;
  address?: string;
  village?: string;
  mandal?: string;
  mobileNumber?: string;
  district?: string;
  pinCode?: string;
  dspName?: string;
  exchangeBrand?: string;
  exchangeModels?: string;
  supervisor?: string;
}

interface AddCustomerModalProps {
  isOpen: boolean;
  language?: "te" | "en";
  supervisorsList?: string[];
  existingChassisList?: string[];
  onClose: () => void;
  onSave: (customerData: NewCustomerFormData) => Promise<void> | void;
}

const POPULAR_MODELS = [
  "Eicher 380",
  "Eicher 485",
  "Eicher 551",
  "Eicher 557",
  "Eicher 333",
  "Eicher 368",
  "Eicher 242",
  "Eicher 312",
  "Eicher 548",
  "Eicher 650",
];

const POPULAR_MANDALS = [
  "Bantumilli",
  "Challapalli",
  "Chandarlapadu",
  "Gannavaram",
  "Gudivada",
  "Gudlavalleru",
  "Ibrahimpatnam",
  "Jaggayyapeta",
  "Kaikalur",
  "Kalidindi",
  "Kanchikacherla",
  "Koduru",
  "Kruttivennu",
  "Machilipatnam",
  "Mandavalli",
  "Mopidevi",
  "Movva",
  "Mudinepalli",
  "Musunuru",
  "Mylavaram",
  "Nagayalanka",
  "Nandigama",
  "Nuzvid",
  "Pamarru",
  "Pamidimukkala",
  "Pedana",
  "Pedaparupudi",
  "Penamaluru",
  "Reddigudem",
  "Tiruvuru",
  "Unguturu",
  "Vatsavai",
  "Veerullapadu",
  "Vijayawada Rural",
  "Vissannapeta",
  "Vuyyuru",
];

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  language = "te",
  supervisorsList = [],
  existingChassisList = [],
  onClose,
  onSave,
}) => {
  const isTe = language === "te";

  const getTodayFormatted = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, "0");
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const y = today.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const [formData, setFormData] = useState<NewCustomerFormData>({
    branch: "Sri Venkateswara Tractors",
    sNo: "",
    model: "Eicher 380",
    modelType: "Super DI",
    chassisNo: "",
    engineNo: "",
    dateOfDel: getTodayFormatted(),
    custName: "",
    fatherName: "",
    address: "",
    village: "",
    mandal: "",
    mobileNumber: "",
    district: "Krishna",
    pinCode: "",
    dspName: "",
    exchangeBrand: "",
    exchangeModels: "",
    supervisor: supervisorsList[0] || "",
  });

  const [deliveryDateInput, setDeliveryDateInput] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDuplicateChassis, setIsDuplicateChassis] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const todayIso = new Date().toISOString().split("T")[0];
      setDeliveryDateInput(todayIso);
      setFormData((prev) => ({
        ...prev,
        branch: prev.branch || "Sri Venkateswara Tractors",
        district: prev.district || "Krishna",
        dateOfDel: getTodayFormatted(),
      }));
      setErrorMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    const cleanChassis = (formData.chassisNo || "").trim().toUpperCase();
    if (cleanChassis && existingChassisList && existingChassisList.length > 0) {
      const exists = existingChassisList.some(
        (c) => (c || "").trim().toUpperCase() === cleanChassis
      );
      setIsDuplicateChassis(exists);
    } else {
      setIsDuplicateChassis(false);
    }
  }, [formData.chassisNo, existingChassisList]);

  if (!isOpen) return null;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value;
    setDeliveryDateInput(isoVal);
    if (isoVal) {
      const parts = isoVal.split("-");
      if (parts.length === 3) {
        setFormData((prev) => ({
          ...prev,
          dateOfDel: `${parts[2]}-${parts[1]}-${parts[0]}`,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedChassis = (formData.chassisNo || "").trim();
    const trimmedName = (formData.custName || "").trim();

    if (!trimmedChassis && !trimmedName) {
      setErrorMessage(
        isTe
          ? "దయచేసి కస్టమర్ పేరు లేదా ఛాసిస్ నంబర్ నమోదు చేయండి."
          : "Please enter at least Customer Name or Chassis Number."
      );
      return;
    }

    const cleanPhone = (formData.mobileNumber || "").replace(/[^0-9]/g, "");
    if (cleanPhone && cleanPhone.length !== 10) {
      setErrorMessage(
        isTe
          ? "మొబైల్ నంబర్ సరిగ్గా 10 అంకెలు ఉండాలి."
          : "Mobile number must be exactly 10 digits."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        ...formData,
        chassisNo: trimmedChassis.toUpperCase(),
        custName: trimmedName,
        mobileNumber: cleanPhone || formData.mobileNumber,
      });
    } catch (err: any) {
      console.error("Failed to save customer:", err);
      setErrorMessage(err.message || "Failed to save customer details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      branch: "Sri Venkateswara Tractors",
      sNo: "",
      model: "Eicher 380",
      modelType: "Super DI",
      chassisNo: "",
      engineNo: "",
      dateOfDel: getTodayFormatted(),
      custName: "",
      fatherName: "",
      address: "",
      village: "",
      mandal: "",
      mobileNumber: "",
      district: "Krishna",
      pinCode: "",
      dspName: "",
      exchangeBrand: "",
      exchangeModels: "",
      supervisor: supervisorsList[0] || "",
    });
    setDeliveryDateInput(new Date().toISOString().split("T")[0]);
    setErrorMessage("");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 rounded-xl shadow-inner">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <span>{isTe ? "కొత్త కస్టమర్ నమోదు" : "Add New Customer"}</span>
                <span className="bg-emerald-500/30 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Master Record
                </span>
              </h3>
              <p className="text-xs text-emerald-100/90 font-medium">
                {isTe
                  ? "కస్టమర్ మరియు ట్రాక్టర్ వివరాలను మాస్టర్ డేటాబేస్ లో సేవ్ చేయండి"
                  : "Register customer and tractor details into Master Database"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-xl hover:bg-emerald-900/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* 1. Customer Personal Information */}
          <div className="bg-emerald-50/40 p-3.5 sm:p-4 rounded-xl border border-emerald-100 space-y-3">
            <p className="font-black text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isTe ? "కస్టమర్ ప్రాథమిక వివరాలు" : "Customer Basic Info"}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "కస్టమర్ పేరు (Customer Name) *" : "Customer Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.custName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, custName: e.target.value }))
                  }
                  placeholder={isTe ? "ఉదా: శ్రీనివాస రావు" : "e.g., Srinivasa Rao"}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "తండ్రి పేరు (Father Name)" : "Father Name"}
                </label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fatherName: e.target.value }))
                  }
                  placeholder={isTe ? "తండ్రి పేరు" : "Father's Name"}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "మొబైల్ నంబర్ (Mobile No) *" : "Mobile Number *"}
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={formData.mobileNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        mobileNumber: e.target.value.replace(/[^0-9]/g, ""),
                      }))
                    }
                    placeholder="9876543210"
                    className="w-full pl-8 pr-2.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Tractor Specifications */}
          <div className="bg-purple-50/40 p-3.5 sm:p-4 rounded-xl border border-purple-100 space-y-3">
            <p className="font-black text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-purple-700" />
              <span>{isTe ? "ట్రాక్టర్ వివరాలు" : "Tractor Specifications"}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "ఛాసిస్ నంబర్ (Chassis No) *" : "Chassis No *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.chassisNo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      chassisNo: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="e.g. JYFE123456"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-black text-purple-950 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono uppercase"
                />
                {isDuplicateChassis && (
                  <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Chassis already exists in Master. Will update existing.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "ఇంజన్ నంబర్ (Engine No)" : "Engine No"}
                </label>
                <input
                  type="text"
                  value={formData.engineNo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      engineNo: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="e.g. E123456"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "డెలివరీ తేదీ (Date of Delivery)" : "Date of Delivery"}
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={deliveryDateInput}
                    onChange={handleDateChange}
                    className="w-full pl-8 pr-2.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "మోడల్ (Model)" : "Model"}
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={formData.model}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, model: e.target.value }))
                    }
                    className="flex-1 p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                  >
                    {POPULAR_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="Other">Other / Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "మోడల్ టైప్ (Model Type)" : "Model Type"}
                </label>
                <input
                  type="text"
                  value={formData.modelType}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, modelType: e.target.value }))
                  }
                  placeholder="Super DI, Prima G3, Plus"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "సూపర్‌వైజర్ (Supervisor)" : "Assigned Supervisor"}
                </label>
                <select
                  value={formData.supervisor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, supervisor: e.target.value }))
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                >
                  <option value="">-- Select Supervisor --</option>
                  {supervisorsList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Address & Location */}
          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
            <p className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-700" />
              <span>{isTe ? "చిరునామా & లొకేషన్ వివరాలు" : "Address & Location"}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "గ్రామం (Village) *" : "Village *"}
                </label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, village: e.target.value }))
                  }
                  placeholder={isTe ? "గ్రామం పేరు" : "Village name"}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "మండలం (Mandal)" : "Mandal"}
                </label>
                <input
                  type="text"
                  list="mandal-options"
                  value={formData.mandal}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, mandal: e.target.value }))
                  }
                  placeholder={isTe ? "మండలం ఎంచుకోండి" : "Select / enter mandal"}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                />
                <datalist id="mandal-options">
                  {POPULAR_MANDALS.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "జిల్లా (District)" : "District"}
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, district: e.target.value }))
                  }
                  placeholder="Krishna"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "పిన్ కోడ్ (Pin Code)" : "Pin Code"}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.pinCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pinCode: e.target.value.replace(/[^0-9]/g, ""),
                    }))
                  }
                  placeholder="521301"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {isTe ? "పూర్తి చిరునామా (Full Address)" : "Full Address"}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder={isTe ? "ఇంటి నెం, వీధి వివరాలు..." : "D.No, Street, Landmark..."}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* 4. Dealership & Additional Info */}
          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
            <p className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-700" />
              <span>{isTe ? "డీలర్‌షిప్ & అదనపు వివరాలు" : "Dealership & Record Details"}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "బ్రాంచ్ (Branch)" : "Branch"}
                </label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, branch: e.target.value }))
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "క్రమ సంఖ్య / ఫైల్ నెం (S.No / File No)" : "S.No / File No"}
                </label>
                <input
                  type="text"
                  value={formData.sNo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sNo: e.target.value }))
                  }
                  placeholder="e.g. 101"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "DSP పేరు (DSP Name)" : "DSP Name"}
                </label>
                <input
                  type="text"
                  value={formData.dspName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dspName: e.target.value }))
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "ఎక్స్ఛేంజ్ బ్రాండ్ (Exchange Brand)" : "Exchange Brand"}
                </label>
                <input
                  type="text"
                  value={formData.exchangeBrand}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, exchangeBrand: e.target.value }))
                  }
                  placeholder="Mahindra / Swaraj / Massey"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isTe ? "ఎక్స్ఛేంజ్ మోడల్ (Exchange Model)" : "Exchange Model"}
                </label>
                <input
                  type="text"
                  value={formData.exchangeModels}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, exchangeModels: e.target.value }))
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isTe ? "రీసెట్" : "Reset Form"}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors cursor-pointer"
              >
                {isTe ? "రద్దు చేయండి" : "Cancel"}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isTe ? "సేవ్ అవుతోంది..." : "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isTe ? "కస్టమర్‌ను సేవ్ చేయండి" : "Save Customer"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
