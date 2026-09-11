import React, { useState } from "react";
import { LogIn, Shield, Building2, User, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
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
  users,
  onLogin,
  language = "te",
  onLanguageChange,
}) => {
  const isTe = language === "te";
  const [selectedBranch, setSelectedBranch] = useState<string>("All Branches (Master)");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setErrorMessage(
        isTe
          ? "దయచేసి యూజర్ ఐడీ మరియు పాస్‌వర్డ్ నమోదు చేయండి."
          : "Please enter your User ID and Password."
      );
      return;
    }

    // Check against users list
    const foundUser = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername &&
        u.password === cleanPassword
    );

    if (!foundUser) {
      // Allow default fallback admin if no users seeded yet
      if (cleanUsername === "admin" && cleanPassword === "admin123") {
        const defaultAdmin: SystemUser = {
          id: "admin_master",
          username: "admin",
          password: "admin123",
          name: "Master Admin",
          branch: "All Branches (Master)",
          role: "Super Admin",
          allowedMenus: [
            "dashboard",
            "service_camp_planning",
            "free_service_followup",
            "telecalling",
            "complaints",
            "attendance",
            "new_entry",
            "saved_cards",
            "customer_data",
            "customers_and_jobcards",
            "reports",
            "databases",
            "user_management",
          ],
          canEdit: true,
          canDelete: true,
          canUpdate: true,
          canCreate: true,
          isAdmin: true,
          dataScope: "all",
        };
        onLogin(defaultAdmin, selectedBranch);
        return;
      }

      setErrorMessage(
        isTe
          ? "చెల్లని యూజర్ ఐడీ లేదా పాస్‌వర్డ్! దయచేసి సరైన వివరాలు నమోదు చేయండి."
          : "Invalid User ID or Password. Please verify your credentials."
      );
      return;
    }

    // If user belongs to a specific branch (not "All Branches"), inform or set to their branch
    const effectiveBranch =
      foundUser.branch && foundUser.branch !== "All Branches (Master)"
        ? foundUser.branch
        : selectedBranch;

    onLogin(foundUser, effectiveBranch);
  };

  const handleQuickAdminBypass = () => {
    const adminUser = users.find((u) => u.username === "admin") || {
      id: "admin_master",
      username: "admin",
      password: "admin123",
      name: "Master Admin",
      branch: "All Branches (Master)",
      role: "Super Admin",
      allowedMenus: [
        "dashboard",
        "service_camp_planning",
        "free_service_followup",
        "telecalling",
        "complaints",
        "attendance",
        "new_entry",
        "saved_cards",
        "customer_data",
        "customers_and_jobcards",
        "reports",
        "databases",
        "user_management",
      ],
      canEdit: true,
      canDelete: true,
      canUpdate: true,
      canCreate: true,
      isAdmin: true,
      dataScope: "all",
    };
    onLogin(adminUser, "All Branches (Master)");
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

      {/* Login Box */}
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
                ? "బ్రాంచ్ మరియు అడ్మిన్ కేటాయించిన యూజర్ ఐడీ ద్వారా లాగిన్ అవ్వండి"
                : "Branch-Wise Access & Role-Based Security"}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold animate-in shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          {/* Branch Select */}
          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-800" />
              <span>{isTe ? "బ్రాంచ్ ఎంచుకోండి (Select Branch)" : "Select Branch"}</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all cursor-pointer"
            >
              <option value="All Branches (Master)">
                🌐 {isTe ? "అన్ని బ్రాంచీలు (Master Admin)" : "All Branches (Master Access)"}
              </option>
              {branchesList.map((branch) => (
                <option key={branch} value={branch}>
                  🏢 {branch}
                </option>
              ))}
            </select>
          </div>

          {/* User ID */}
          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-800" />
              <span>{isTe ? "యూజర్ ఐడీ (User ID)" : "User ID / Username"}</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or jagtial_mgr"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all"
              required
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-800" />
              <span>{isTe ? "పాస్‌వర్డ్ (Password)" : "Password"}</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isTe ? "సురక్షితంగా లాగిన్ అవ్వండి (Sign In)" : "Secure Sign In"}</span>
          </button>
        </form>

        {/* Master Admin Bypass / Credentials Box */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <button
            type="button"
            onClick={handleQuickAdminBypass}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-blue-700" />
            <span>{isTe ? "మాస్టర్ అడ్మిన్ త్వరిత లాగిన్ (Admin Bypass)" : "Master Admin Quick Login"}</span>
          </button>
          <div className="p-2 bg-blue-50/80 rounded-xl border border-blue-200 text-[11px] text-blue-900 text-center font-medium">
            <span className="font-bold">Master Admin ID: </span>
            <code className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-mono text-blue-800">admin</code>
            {" | "}
            <span className="font-bold">Password: </span>
            <code className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-mono text-blue-800">admin123</code>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-xs text-slate-400 font-medium">
        Sri Gayathri Automotives • Authorized Eicher Commercial Vehicles Dealer
      </div>
    </div>
  );
};

export default BranchLoginView;
