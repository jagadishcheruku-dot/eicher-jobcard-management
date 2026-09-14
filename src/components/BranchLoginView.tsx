import React, { useState } from "react";
import { ArrowRight, Building2, Shield } from "lucide-react";
import { SystemUser } from "./UserManagementModal";

interface BranchLoginViewProps {
  branchesList: string[];
  users: SystemUser[];
  onLogin: (user: SystemUser, selectedBranch: string) => void;
  language?: "te" | "en";
  onLanguageChange?: (lang: "te" | "en") => void;
}

export const BranchLoginView: React.FC<BranchLoginViewProps> = ({
  branchesList,
  onLogin,
  language = "te",
  onLanguageChange,
}) => {
  const isTe = language === "te";
  const [selectedBranch, setSelectedBranch] = useState<string>("All Branches (Master)");

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    const isAllBranches = selectedBranch === "All Branches (Master)";
    const user: SystemUser = {
      id: isAllBranches ? "admin_master" : `branch_${selectedBranch}`,
      username: isAllBranches ? "admin" : selectedBranch,
      password: "",
      name: isAllBranches ? "Sri Gayathri Automotives" : selectedBranch,
      branch: selectedBranch,
      role: isAllBranches ? "Admin" : "Staff",
      allowedMenus: [],
      canEdit: true,
      canDelete: true,
      canUpdate: true,
      canCreate: true,
      isAdmin: isAllBranches,
      dataScope: isAllBranches ? "all" : "branch",
    };

    onLogin(user, selectedBranch);
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

      {/* Branch Selection Box */}
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
                ? "మీ బ్రాంచ్ ఎంచుకుని కొనసాగించండి"
                : "Select your branch to continue"}
            </p>
          </div>
        </div>

        {/* Branch Select Form */}
        <form onSubmit={handleContinue} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-800" />
              <span>{isTe ? "బ్రాంచ్ ఎంచుకోండి (Select Branch)" : "Select Branch"}</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all cursor-pointer"
              autoFocus
            >
              <option value="All Branches (Master)">
                🌐 {isTe ? "అన్ని బ్రాంచీలు (Master)" : "All Branches (Master)"}
              </option>
              {branchesList.map((branch) => (
                <option key={branch} value={branch}>
                  🏢 {branch}
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
