import React, { useState, useMemo } from "react";
import { X, Search } from "lucide-react";

export function CustomerSearchModal({
  isOpen,
  onClose,
  customers,
  jobCards,
  complaints,
  language,
}: {
  isOpen: boolean;
  onClose: () => void;
  customers: any[];
  jobCards: any[];
  complaints: any[];
  language: string;
}) {
  const [searchInput, setSearchInput] = useState("");

  const normalizeText = (text: string) => {
    return text
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      || "";
  };

  const searchResults = useMemo(() => {
    if (!searchInput.trim()) {
      return null;
    }

    const query = normalizeText(searchInput);
    let foundCustomer = null;

    // Search across all fields (chassis, name, mobile)
    for (const customer of customers) {
      const ch = normalizeText(
        customer["Chassis no"] ||
          customer.chassisNo ||
          customer.chassis ||
          ""
      );
      const nm = normalizeText(
        customer["Customer Name"] ||
          customer.custName ||
          customer.customerName ||
          ""
      );
      const ph = normalizeText(
        customer["Mobile Number"] || customer.mobileNumber || customer.phone || ""
      );

      if (
        ch.includes(query) ||
        query.includes(ch) ||
        nm.includes(query) ||
        query.includes(nm) ||
        ph.includes(query) ||
        query.includes(ph)
      ) {
        foundCustomer = customer;
        break;
      }
    }

    if (!foundCustomer) {
      return { found: false };
    }

    // Get customer's job cards
    const chasisNo = normalizeText(
      foundCustomer["Chassis no"] ||
        foundCustomer.chassisNo ||
        foundCustomer.chassis ||
        ""
    );
    const custJobCards = jobCards.filter((card) => {
      const cardChassis = normalizeText(
        card.chassisNo || card.chassis || ""
      );
      return cardChassis.includes(chasisNo) || chasisNo.includes(cardChassis);
    });

    // Get customer's complaints/free service
    const custComplaints = complaints.filter((comp) => {
      const compChassis = normalizeText(comp.chassisNo || comp.chassis || "");
      return compChassis.includes(chasisNo) || chasisNo.includes(compChassis);
    });

    return {
      found: true,
      customer: foundCustomer,
      jobCards: custJobCards,
      complaints: custComplaints,
    };
  }, [searchInput, customers, jobCards, complaints]);

  if (!isOpen) return null;

  const field = (obj: any, ...keys: string[]) => {
    for (const k of keys) {
      if (obj?.[k]) return obj[k];
    }
    return "-";
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-4 sm:my-0 overflow-hidden">
        {/* Search bar header */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoFocus
                placeholder={
                  language === "te"
                    ? "చాసిస్ నం, పేరు, ఫోన్ నం టైప్ చేయండి..."
                    : "Type chassis no, name, or phone..."
                }
                className="w-full pl-4 pr-4 py-3 bg-slate-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/40 outline-none transition-all"
              />
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 max-h-[75vh] overflow-y-auto">
          {/* Results */}
          {searchResults && !searchResults.found && (
            <div className="bg-amber-50 rounded-2xl p-6 text-center text-amber-800 font-medium">
              {language === "te"
                ? "ఫలితాలు కనుగొనబడలేదు"
                : "No results found"}
            </div>
          )}

          {searchResults?.found && (
            <div className="space-y-3">
              {/* Customer Details */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-lg shrink-0 shadow-md">👤</span>
                  <div>
                    <h3 className="font-black text-blue-950 text-[16px] leading-tight">
                      {field(searchResults.customer, "Customer Name", "custName")}
                    </h3>
                    <p className="text-xs text-blue-700 font-bold">{language === "te" ? "కస్టమర్ సమాచారం" : "Customer Information"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    [language === "te" ? "🚗 చాసిస్" : "🚗 Chassis", field(searchResults.customer, "Chassis no", "chassisNo"), "bg-red-100 text-red-800"],
                    [language === "te" ? "📞 ఫోన్" : "📞 Phone", field(searchResults.customer, "Mobile Number", "mobileNumber"), "bg-emerald-100 text-emerald-800"],
                    [language === "te" ? "🚜 మోడల్" : "🚜 Model", field(searchResults.customer, "Model", "model"), "bg-orange-100 text-orange-800"],
                    [language === "te" ? "📅 డెలివరీ" : "📅 Delivery", field(searchResults.customer, "Delivery Date", "deliveryDate"), "bg-purple-100 text-purple-800"],
                    [language === "te" ? "📍 అడ్రెస్" : "📍 Address", field(searchResults.customer, "Customer Address", "address"), "bg-teal-100 text-teal-800"],
                  ].map(([label, val, bgClass], i) => (
                    <div key={i} className={i === 4 ? "sm:col-span-2" : ""}>
                      <p className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded inline-block ${bgClass} mb-1`}>{label}</p>
                      <p className="text-slate-900 font-semibold text-sm break-words">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Card History */}
              {searchResults.jobCards.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-orange-200">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-lg shrink-0 shadow-md">🔧</span>
                    <div>
                      <h3 className="font-black text-slate-900 text-[14px]">
                        {language === "te" ? "సర్వీస్ చరిత్ర" : "Service History"}
                      </h3>
                      <p className="text-xs text-orange-700 font-bold">{language === "te" ? "జాబ్ కార్డుల రికార్డ్" : "Job Cards & Services"}</p>
                    </div>
                    <span className="text-[11px] font-black bg-orange-100 text-orange-800 px-3 py-1 rounded-full ml-auto">
                      {searchResults.jobCards.length} {language === "te" ? "కార్డులు" : "Cards"}
                    </span>
                  </div>
                  <div className="space-y-2.5 max-h-52 overflow-y-auto">
                    {searchResults.jobCards.map((card: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-orange-50/80 rounded-xl p-3.5 text-sm flex justify-between items-start gap-3 border border-orange-100"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-900 text-[12px] bg-orange-100 px-2 py-1 rounded inline-block mb-1">
                            {card.jobNumber || `Job #${idx + 1}`}
                          </p>
                          <p className="text-slate-700 font-semibold text-[11px] break-words mb-1">
                            {card.complaintDescription || card.jobDescription || "-"}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-block text-[10px] font-black px-2 py-1 rounded-full bg-white text-orange-700 border border-orange-200">
                              📊 {card.status || "-"}
                            </span>
                            <span className="text-[10px] text-slate-600 font-bold">
                              📅 {card.createdAt || card.jobDate || card.jobOpenDate || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Telecalling/Complaints */}
              {searchResults.complaints.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-purple-200">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white flex items-center justify-center text-lg shrink-0 shadow-md">📞</span>
                    <div>
                      <h3 className="font-black text-slate-900 text-[14px]">
                        {language === "te" ? "టెలీకాలింగ్ నమోదులు" : "Telecalling Records"}
                      </h3>
                      <p className="text-xs text-purple-700 font-bold">{language === "te" ? "ఫాలో-అప్ & కంప్లెయింట్లు" : "Follow-ups & Complaints"}</p>
                    </div>
                    <span className="text-[11px] font-black bg-purple-100 text-purple-800 px-3 py-1 rounded-full ml-auto">
                      {searchResults.complaints.length} {language === "te" ? "ఎంట్రీలు" : "Entries"}
                    </span>
                  </div>
                  <div className="space-y-2.5 max-h-52 overflow-y-auto">
                    {searchResults.complaints.map((comp: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-purple-50/80 rounded-xl p-3.5 text-sm flex justify-between items-start gap-3 border border-purple-100"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-900 text-[12px] bg-purple-100 px-2 py-1 rounded inline-block mb-1">
                            {comp.type || comp.complaintType || "Follow-up"}
                          </p>
                          <p className="text-slate-700 font-semibold text-[11px] break-words mb-1">
                            {comp.description || comp.complaintDescription || "-"}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-block text-[10px] font-black px-2 py-1 rounded-full bg-white text-purple-700 border border-purple-200">
                              🎯 {comp.status || "-"}
                            </span>
                            <span className="text-[10px] text-slate-600 font-bold">
                              📅 {comp.createdAt || comp.complaintDate || comp.date || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
