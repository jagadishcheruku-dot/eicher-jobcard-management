import React, { useState } from "react";
import { ArrowRight, UserCog, Shield } from "lucide-react";
import { SystemUser } from "./UserManagementModal";

interface BranchLoginViewProps {
  branchesList: string[];
  supervisorsList: string[];
  users: SystemUser[];
  onLogin: (user: SystemUser, selectedBranch: string) => void;
  language?: "te" | "en";
  onLanguageChange?: (lang: "te" | "en") => void;
}

export const BranchLoginView: React.FC<BranchLoginViewProps> = ({
  supervisorsList,
  onLogin,
  language = "te",
  onLanguageChange,
}) => {
  const isTe = language === "te";
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("All Branches (Master)");

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    const isAll = selectedSupervisor === "All Branches (Master)";
    const user: SystemUser = {
      id: isAll ? "admin_master" : `supervisor_${selectedSupervisor}`,
      username: isAll ? "admin" : selectedSupervisor,
      password: "",
      name: isAll ? "Sri Gayathri Automotives" : selectedSupervisor,
      branch: selectedSupervisor,
      role: isAll ? "Admin" : "Supervisor",
      allowedMenus: [],
      canEdit: true,
      canDelete: true,
      canUpdate: true,
      canCreate: true,
      isAdmin: isAll,
      dataScope: isAll ? "all" : "branch",
    };

    onLogin(user, selectedSupervisor);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Toggle in Top-Right */}
      {onLanguageChange && (
        <div className="absolute top-4 right-4 flex items-center bg-slate-800/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-lg">
          <button
            type="button"
            onClick={() => onLanguageChange("te")}
            className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
              isTe ? "bg-amber-400 text-slate-950 shadow-xs" : "text-slate-300 hover:text-white"
            }`}
          >
            తెలుగు
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange("en")}
            className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
              !isTe ? "bg-amber-400 text-slate-950 shadow-xs" : "text-slate-300 hover:text-white"
            }`}
          >
            English
          </button>
        </div>
      )}

      {/* Supervisor Selection Box */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 max-w-md w-full relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">

        {/* Dealership Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900 text-white shadow-xl shadow-blue-900/30 ring-4 ring-blue-100">
            <Shield className="w-9 h-9 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Sri Gayathri Automotives
            </h1>
            <p className="text-xs font-black text-blue-900 uppercase tracking-wider">
              Eicher Dealership Management System
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {isTe
                ? "మీ సూపర్‌వైజర్ ఎంచుకుని కొనసాగించండి"
                : "Select your supervisor to continue"}
            </p>
          </div>
        </div>

        {/* Supervisor Select Form */}
        <form onSubmit={handleContinue} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-700 flex items-center gap-1.5">
              <UserCog className="w-3.5 h-3.5 text-blue-800" />
              <span>{isTe ? "సూపర్‌వైజర్ ఎంచుకోండి (Select Supervisor)" : "Select Supervisor"}</span>
            </label>
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all cursor-pointer"
              autoFocus
            >
              <option value="All Branches (Master)">
                🌐 {isTe ? "అందరూ (Master)" : "All Supervisors (Master)"}
              </option>
              {supervisorsList.map((sup) => (
                <option key={sup} value={sup}>
                  🧑‍💼 {sup}
                </option>
              ))}
            </select>
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isTe ? "కొనసాగించు (Continue)" : "Continue"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-xs text-slate-400 font-medium">
        Sri Gayathri Automotives • Authorized Eicher Commercial Vehicles Dealer
      </div>
    </div>
  );
};

export default BranchLoginView;
