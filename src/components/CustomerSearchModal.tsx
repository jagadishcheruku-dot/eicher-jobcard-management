import React, { useState } from "react";
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
  const [searchBy, setSearchBy] = useState<"chassis" | "name" | "mobile">("chassis");
  const [searchResults, setSearchResults] = useState<any>(null);

  const normalizeText = (text: string) => {
    return text
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      || "";
  };

  const handleSearch = () => {
    if (!searchInput.trim()) {
      setSearchResults(null);
      return;
    }

    const query = normalizeText(searchInput);
    let foundCustomer = null;

    // Search for customer
    for (const customer of customers) {
      let match = false;

      if (searchBy === "chassis") {
        const ch = normalizeText(
          customer["Chassis no"] ||
            customer.chassisNo ||
            customer.chassis ||
            ""
        );
        match = ch.includes(query) || query.includes(ch);
      } else if (searchBy === "name") {
        const nm = normalizeText(
          customer["Customer Name"] ||
            customer.custName ||
            customer.customerName ||
            ""
        );
        match = nm.includes(query) || query.includes(nm);
      } else if (searchBy === "mobile") {
        const ph = normalizeText(
          customer["Mobile Number"] || customer.mobileNumber || customer.phone || ""
        );
        match = ph.includes(query) || query.includes(ph);
      }

      if (match) {
        foundCustomer = customer;
        break;
      }
    }

    if (!foundCustomer) {
      setSearchResults({ found: false });
      return;
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

    setSearchResults({
      found: true,
      customer: foundCustomer,
      jobCards: custJobCards,
      complaints: custComplaints,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">
              {language === "te" ? "కస్టమర్ సర్చ్" : "Customer Search"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Search Inputs */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="chassis">
                  {language === "te" ? "చాసిస్ నంబర్" : "Chassis Number"}
                </option>
                <option value="name">
                  {language === "te" ? "కస్టమర్ పేరు" : "Customer Name"}
                </option>
                <option value="mobile">
                  {language === "te" ? "మొబైల్ నంబర్" : "Mobile Number"}
                </option>
              </select>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder={
                  language === "te"
                    ? "ఇక్కడ టైప్ చేయండి..."
                    : "Type here..."
                }
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {language === "te" ? "సర్చ్" : "Search"}
              </button>
            </div>
          </div>

          {/* Results */}
          {searchResults && !searchResults.found && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center text-amber-800">
              {language === "te"
                ? "ఫলితాలు కనుగొనబడలేదు"
                : "No results found"}
            </div>
          )}

          {searchResults?.found && (
            <div className="space-y-4">
              {/* Customer Details */}
              <div className="border-l-4 border-blue-600 pl-4 py-2 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <span>👤</span>
                  {language === "te" ? "కస్టమర్ వివరాలు" : "Customer Details"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-slate-700">
                      {language === "te" ? "పేరు:" : "Name:"}
                    </span>
                    <p className="text-slate-900">
                      {searchResults.customer["Customer Name"] ||
                        searchResults.customer.custName ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">
                      {language === "te" ? "చాసిస్ నంబర్:" : "Chassis No:"}
                    </span>
                    <p className="text-slate-900">
                      {searchResults.customer["Chassis no"] ||
                        searchResults.customer.chassisNo ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">
                      {language === "te" ? "ఫోన్:" : "Phone:"}
                    </span>
                    <p className="text-slate-900">
                      {searchResults.customer["Mobile Number"] ||
                        searchResults.customer.mobileNumber ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">
                      {language === "te" ? "ఠిక్డ్: " : "Delivery:"}
                    </span>
                    <p className="text-slate-900">
                      {searchResults.customer["Delivery Date"] ||
                        searchResults.customer.deliveryDate ||
                        "-"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold text-slate-700">
                      {language === "te" ? "అడ్రెస్:" : "Address:"}
                    </span>
                    <p className="text-slate-900">
                      {searchResults.customer["Customer Address"] ||
                        searchResults.customer.address ||
                        "-"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold text-slate-700">
                      {language === "te" ? "మోడల్:" : "Model:"}
                    </span>
                    <p className="text-slate-900">
                      {searchResults.customer["Model"] ||
                        searchResults.customer.model ||
                        "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Job Card History */}
              {searchResults.jobCards.length > 0 && (
                <div className="border-l-4 border-orange-600 pl-4 py-2 bg-orange-50 rounded-lg">
                  <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <span>🔧</span>
                    {language === "te"
                      ? "జాబ్ కార్డ్ చరిత్ర"
                      : "Job Card History"}{" "}
                    ({searchResults.jobCards.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.jobCards.map((card: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white border border-orange-200 rounded p-2 text-sm"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {card.jobNumber || `#${idx + 1}`}
                            </p>
                            <p className="text-slate-600">
                              {card.complaintDescription ||
                                card.jobDescription ||
                                "-"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {language === "te" ? "స్థితి:" : "Status:"}{" "}
                              <span className="font-semibold">
                                {card.status || "-"}
                              </span>
                            </p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {card.createdAt ||
                              card.jobDate ||
                              card.jobOpenDate ||
                              "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Telecalling/Complaints */}
              {searchResults.complaints.length > 0 && (
                <div className="border-l-4 border-purple-600 pl-4 py-2 bg-purple-50 rounded-lg">
                  <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <span>📞</span>
                    {language === "te"
                      ? "టెలీకాలింగ్ ఎంట్రీలు"
                      : "Telecalling Entries"}{" "}
                    ({searchResults.complaints.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.complaints.map((comp: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white border border-purple-200 rounded p-2 text-sm"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {comp.type ||
                                comp.complaintType ||
                                "Complaint"}
                            </p>
                            <p className="text-slate-600">
                              {comp.description ||
                                comp.complaintDescription ||
                                "-"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {language === "te" ? "దశ:" : "Status:"}{" "}
                              <span className="font-semibold">
                                {comp.status || "-"}
                              </span>
                            </p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {comp.createdAt ||
                              comp.complaintDate ||
                              comp.date ||
                              "-"}
                          </span>
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
