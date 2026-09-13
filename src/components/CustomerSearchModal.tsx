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
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shrink-0">👤</span>
                  <h3 className="font-black text-blue-950 text-[15px]">
                    {field(searchResults.customer, "Customer Name", "custName")}
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {[
                    [language === "te" ? "చాసిస్" : "Chassis", field(searchResults.customer, "Chassis no", "chassisNo")],
                    [language === "te" ? "ఫోన్" : "Phone", field(searchResults.customer, "Mobile Number", "mobileNumber")],
                    [language === "te" ? "మోడల్" : "Model", field(searchResults.customer, "Model", "model")],
                    [language === "te" ? "డెలివరీ" : "Delivery", field(searchResults.customer, "Delivery Date", "deliveryDate")],
                    [language === "te" ? "అడ్రెస్" : "Address", field(searchResults.customer, "Customer Address", "address")],
                  ].map(([label, val], i) => (
                    <div key={i} className={label === (language === "te" ? "అడ్రెస్" : "Address") ? "col-span-2 sm:col-span-3" : ""}>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">{label}</p>
                      <p className="text-slate-900 font-semibold truncate">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Card History */}
              {searchResults.jobCards.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs shrink-0">🔧</span>
                    <h3 className="font-black text-slate-900 text-[13px]">
                      {language === "te" ? "జాబ్ కార్డ్ చరిత్ర" : "Job Card History"}
                    </h3>
                    <span className="text-[10px] font-black bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                      {searchResults.jobCards.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {searchResults.jobCards.map((card: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-orange-50/60 rounded-xl p-3 text-sm flex justify-between items-start gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {card.jobNumber || `#${idx + 1}`}
                          </p>
                          <p className="text-slate-600 truncate">
                            {card.complaintDescription || card.jobDescription || "-"}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-orange-700">
                            {card.status || "-"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                          {card.createdAt || card.jobDate || card.jobOpenDate || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Telecalling/Complaints */}
              {searchResults.complaints.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs shrink-0">📞</span>
                    <h3 className="font-black text-slate-900 text-[13px]">
                      {language === "te" ? "టెలీకాలింగ్ ఎంట్రీలు" : "Telecalling Entries"}
                    </h3>
                    <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      {searchResults.complaints.length}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {searchResults.complaints.map((comp: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-purple-50/60 rounded-xl p-3 text-sm flex justify-between items-start gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {comp.type || comp.complaintType || "Complaint"}
                          </p>
                          <p className="text-slate-600 truncate">
                            {comp.description || comp.complaintDescription || "-"}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-purple-700">
                            {comp.status || "-"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                          {comp.createdAt || comp.complaintDate || comp.date || "-"}
                        </span>
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
