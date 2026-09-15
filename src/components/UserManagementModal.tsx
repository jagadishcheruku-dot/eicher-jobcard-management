import React, { useState } from "react";
import {
  UserPlus,
  Trash2,
  Edit2,
  Shield,
  Key,
  Building2,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  FolderPlus,
  Layers,
  Database,
  UserCheck
} from "lucide-react";

export interface SystemUser {
  id: string;
  username: string;
  password: string;
  name: string;
  branch: string;
  role: string;
  allowedMenus: string[];
  canEdit: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  canCreate: boolean;
  isAdmin?: boolean;
  dataScope: "all" | "branch" | "own";
  phone?: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: SystemUser[];
  onSaveUser: (user: SystemUser) => void;
  onDeleteUser: (userId: string) => void;
  branchesList: string[];
  onSaveBranches?: (branches: string[]) => void;
  allMenus: { key: string; label: string; icon?: string }[];
  language?: "te" | "en";
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onSaveUser,
  onDeleteUser,
  branchesList,
  onSaveBranches,
  allMenus,
  language = "te",
}) => {
  const isTe = language === "te";
  const [editingUser, setEditingUser] = useState<Partial<SystemUser> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState<{ [key: string]: boolean }>({});
  const [showFormPassword, setShowFormPassword] = useState(false);
  
  // Branch management state
  const [isManagingBranches, setIsManagingBranches] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [customBranches, setCustomBranches] = useState<string[]>(branchesList);

  if (!isOpen) return null;

  const handleAddNew = () => {
    setEditingUser({
      id: "usr_" + Date.now(),
      username: "",
      password: "",
      name: "",
      branch: customBranches[0] || "Karimnagar (Head Office)",
      role: "Staff Member",
      allowedMenus: [
        "dashboard",
        "new_entry",
        "saved_cards",
        "customer_data",
        "free_service_followup",
        "telecalling",
        "complaints",
      ],
      canEdit: true,
      canDelete: false,
      canUpdate: true,
      canCreate: true,
      isAdmin: false,
      dataScope: "branch",
    });
    setShowFormPassword(true);
    setIsFormOpen(true);
  };

  const handleEdit = (user: SystemUser) => {
    setEditingUser({
      ...user,
      canCreate: user.canCreate !== false,
      dataScope: user.dataScope || (user.isAdmin ? "all" : "branch"),
    });
    setShowFormPassword(false);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.username?.trim() || !editingUser?.password?.trim() || !editingUser?.name?.trim()) {
      alert(
        isTe
          ? "దయచేసి పేరు, యూజర్ ఐడీ మరియు పాస్‌వర్డ్ తప్పనిసరిగా నింపండి."
          : "Please fill in Name, User ID, and Password."
      );
      return;
    }

    // Check duplicate username if adding new
    const cleanUsername = editingUser.username.trim().toLowerCase();
    const existingUser = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.id !== editingUser.id
    );
    if (existingUser) {
      alert(
        isTe
          ? `ఈ యూజర్ ఐడీ "${editingUser.username}" ఇప్పటికే ఉంది. వేరొక ఐడీ ఇవ్వండి.`
          : `User ID "${editingUser.username}" already exists. Please choose a different ID.`
      );
      return;
    }

    onSaveUser({
      id: editingUser.id || "usr_" + Date.now(),
      username: editingUser.username.trim(),
      password: editingUser.password.trim(),
      name: editingUser.name.trim(),
      branch: editingUser.branch || customBranches[0] || "Karimnagar (Head Office)",
      role: editingUser.role || "Staff Member",
      allowedMenus: editingUser.allowedMenus && editingUser.allowedMenus.length > 0
        ? editingUser.allowedMenus
        : ["dashboard", "saved_cards", "customer_data"],
      canEdit: !!editingUser.canEdit,
      canDelete: !!editingUser.canDelete,
      canUpdate: !!editingUser.canUpdate,
      canCreate: !!editingUser.canCreate,
      isAdmin: !!editingUser.isAdmin,
      dataScope: editingUser.dataScope || (editingUser.isAdmin ? "all" : "branch"),
      phone: editingUser.phone || "",
    } as SystemUser);

    setIsFormOpen(false);
    setEditingUser(null);
  };

  const toggleMenuPermission = (menuKey: string) => {
    if (!editingUser) return;
    const currentMenus = editingUser.allowedMenus || [];
    if (currentMenus.includes(menuKey)) {
      setEditingUser({
        ...editingUser,
        allowedMenus: currentMenus.filter((k) => k !== menuKey),
      });
    } else {
      setEditingUser({
        ...editingUser,
        allowedMenus: [...currentMenus, menuKey],
      });
    }
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBranchName.trim();
    if (!trimmed) return;
    if (customBranches.includes(trimmed)) {
      alert(isTe ? "ఈ బ్రాంచ్ ఇప్పటికే జాబితాలో ఉంది." : "This branch already exists.");
      return;
    }
    const updated = [...customBranches, trimmed];
    setCustomBranches(updated);
    setNewBranchName("");
    if (onSaveBranches) {
      onSaveBranches(updated);
    }
  };

  const handleDeleteBranch = (bName: string) => {
    if (customBranches.length <= 1) {
      alert(isTe ? "కనీసం ఒక బ్రాంచ్ ఉండాలి." : "At least one branch is required.");
      return;
    }
    if (window.confirm(isTe ? `బ్రాంచ్ "${bName}" ను తొలగించాలనుకుంటున్నారా?` : `Delete branch "${bName}"?`)) {
      const updated = customBranches.filter((b) => b !== bName);
      setCustomBranches(updated);
      if (onSaveBranches) {
        onSaveBranches(updated);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <span>{isTe ? "యూజర్లు & బ్రాంచ్ పర్మిషన్ల సెట్టింగ్స్" : "User Management & Branch Permissions"}</span>
                <span className="text-[10px] bg-blue-900/80 px-2 py-0.5 rounded-full border border-blue-700 font-mono text-blue-200">
                  {users.length} Users
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {isTe
                  ? "అడ్మిన్ ద్వారా యూజర్ల సృష్టి, పాస్‌వర్డ్‌లు, బ్రాంచ్ కేటాయింపు, మెనూ & ఎడిట్/డిలీట్ పర్మిషన్లు"
                  : "Create users, set passwords, assign branches, menu visibility, and edit/delete permissions"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManagingBranches(!isManagingBranches)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              title={isTe ? "బ్రాంచీలను నిర్వహించండి" : "Manage Branches"}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{isTe ? "బ్రాంచీలు" : "Branches"}</span>
            </button>
            <button
              type="button"
              onClick={handleAddNew}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isTe ? "+ కొత్త యూజర్" : "+ Add New User"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Branch Management Drawer (If Opened) */}
        {isManagingBranches && (
          <div className="p-4 bg-amber-50/70 border-b border-amber-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-black text-amber-950">
                {isTe ? "యాక్టివ్ బ్రాంచీల జాబితా:" : "Active Branches List:"}
              </span>
              <div className="flex flex-wrap gap-1.5 max-w-xl">
                {customBranches.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-900 font-bold text-[11px] shadow-2xs"
                  >
                    🏢 {b}
                    <button
                      type="button"
                      onClick={() => handleDeleteBranch(b)}
                      className="text-slate-400 hover:text-rose-600 font-black ml-1 cursor-pointer"
                      title={isTe ? "తొలగించు" : "Delete"}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <form onSubmit={handleAddBranch} className="flex items-center gap-1.5 shrink-0 w-full md:w-auto">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder={isTe ? "కొత్త బ్రాంచ్ పేరు..." : "New branch name..."}
                className="p-1.5 px-3 text-xs border border-amber-300 bg-white rounded-xl focus:ring-2 focus:ring-amber-500 outline-none w-full md:w-48 font-medium"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0 shadow-xs"
              >
                + {isTe ? "చేర్చు" : "Add"}
              </button>
            </form>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50">
          
          {/* User Add / Edit Form Modal */}
          {isFormOpen && editingUser && (
            <form
              onSubmit={handleSave}
              className="bg-white p-5 rounded-2xl border-2 border-blue-500 shadow-xl space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {editingUser.id && users.some((u) => u.id === editingUser.id)
                        ? (isTe ? `యూజర్ వివరాలను సవరించు (${editingUser.name})` : `Edit User & Permissions (${editingUser.name})`)
                        : (isTe ? "కొత్త యూజర్ ఖాతా & పర్మిషన్లు సృష్టించండి" : "Create New User Account & Set Permissions")}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isTe ? "యూజర్ ఐడీ, పాస్‌వర్డ్ మరియు అనుమతించబడిన మెనూలను ఎంచుకోండి" : "Specify credentials, branch, and exact menu/action permissions"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer text-xs font-bold p-1"
                >
                  ✕ {isTe ? "రద్దు" : "Cancel"}
                </button>
              </div>

              {/* Row 1: Name, Username, Password, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    {isTe ? "పూర్తి పేరు (Full Name) *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    value={editingUser.name || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    {isTe ? "యూజర్ ఐడీ (Login User ID) *" : "Login User ID *"}
                  </label>
                  <input
                    type="text"
                    value={editingUser.username || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                    placeholder="e.g. ramesh_jagtial"
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-blue-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    {isTe ? "పాస్‌వర్డ్ (Password) *" : "Password *"}
                  </label>
                  <div className="relative">
                    <input
                      type={showFormPassword ? "text" : "password"}
                      value={editingUser.password || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      placeholder="e.g. pass123"
                      className="w-full p-2 pr-8 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    {isTe ? "మొబైల్ నెంబర్ (Phone)" : "Phone Number"}
                  </label>
                  <input
                    type="text"
                    value={editingUser.phone || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Branch, Role Title, Data Visibility Scope */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    {isTe ? "కేటాయించిన బ్రాంచ్ (Assigned Branch) *" : "Assigned Branch *"}
                  </label>
                  <select
                    value={editingUser.branch || customBranches[0]}
                    onChange={(e) => setEditingUser({ ...editingUser, branch: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-800"
                  >
                    <option value="All Branches (Master)">🌐 All Branches (Master Access)</option>
                    {customBranches.map((b) => (
                      <option key={b} value={b}>🏢 {b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    {isTe ? "హోదా / రోల్ (Designation/Role)" : "Designation / Role Title"}
                  </label>
                  <input
                    type="text"
                    value={editingUser.role || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    placeholder="e.g. Branch Manager / Mechanic / Telecaller"
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    {isTe ? "డేటా యాక్సెస్ పరిధి (Data Scope) *" : "Data Scope / Visibility *"}
                  </label>
                  <select
                    value={editingUser.dataScope || "branch"}
                    onChange={(e) => setEditingUser({ ...editingUser, dataScope: e.target.value as any })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-purple-900"
                  >
                    <option value="all">🌐 All Branches Data (అన్ని బ్రాంచీల డేటా)</option>
                    <option value="branch">🏢 Only Assigned Branch Data (సొంత బ్రాంచ్ డేటా మాత్రమే)</option>
                    <option value="own">👤 Only Own Created Records (తన రికార్డులు మాత్రమే)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Action Privileges (Edit, Delete, Update, Create, Admin) */}
              <div className="p-3.5 bg-slate-100 rounded-2xl space-y-2 border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-700" />
                    <span>{isTe ? "యాక్షన్ పర్మిషన్లు (Action Privileges)" : "Action Privileges"}</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {isTe ? "ఈ యూజర్ రికార్డులను ఎడిట్/డిలీట్/క్రియేట్ చేయవచ్చా?" : "Can this user edit, delete, or create records?"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={!!editingUser.canCreate}
                      onChange={(e) => setEditingUser({ ...editingUser, canCreate: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>{isTe ? "కొత్తవి జోడించుట (+ Can Create/Add)" : "+ Can Create / Add"}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-blue-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={!!editingUser.canEdit}
                      onChange={(e) => setEditingUser({ ...editingUser, canEdit: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>{isTe ? "సవరించుట (Can Edit)" : "Can Edit"}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={!!editingUser.canUpdate}
                      onChange={(e) => setEditingUser({ ...editingUser, canUpdate: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span>{isTe ? "అప్‌డేట్ / సేవ్ (Can Update/Save)" : "Can Update / Save"}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-800 bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={!!editingUser.canDelete}
                      onChange={(e) => setEditingUser({ ...editingUser, canDelete: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span>{isTe ? "🗑️ రికార్డులను తొలగించుట (Can Delete)" : "🗑️ Can Delete Records"}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-800 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={!!editingUser.isAdmin}
                      onChange={(e) => setEditingUser({ ...editingUser, isAdmin: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>{isTe ? "👑 సూపర్ అడ్మిన్ హోదా (Super Admin Role)" : "👑 Super Admin Role"}</span>
                  </label>
                </div>
              </div>

              {/* Row 4: Menu Access Permissions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-700" />
                    <span>{isTe ? "మెనూ లో ఏమేమి కనిపించాలి? (Menu Visibility Permissions)" : "Allowed Menu Navigation Tabs"}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const allKeys = allMenus.map((m) => m.key);
                      const isAll = (editingUser.allowedMenus || []).length === allKeys.length;
                      setEditingUser({
                        ...editingUser,
                        allowedMenus: isAll ? ["dashboard"] : allKeys,
                      });
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    {(editingUser.allowedMenus || []).length === allMenus.length
                      ? (isTe ? "అన్నీ క్లియర్ చేయి" : "Deselect All")
                      : (isTe ? "అన్నీ ఎంచుకోండి (Select All)" : "Select All")}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {allMenus.map((menu) => {
                    const isChecked = (editingUser.allowedMenus || []).includes(menu.key);
                    return (
                      <div
                        key={menu.key}
                        onClick={() => toggleMenuPermission(menu.key)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? "bg-blue-50 border-blue-400 text-blue-950 shadow-2xs"
                            : "bg-white border-slate-200 text-slate-400 opacity-70"
                        }`}
                      >
                        <span className="truncate pr-1">{menu.label}</span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-white text-[10px] shrink-0 ${
                            isChecked ? "bg-blue-600 font-black" : "bg-slate-300"
                          }`}
                        >
                          {isChecked ? "✓" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {isTe ? "రద్దు చేయి" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isTe ? "యూజర్ వివరాలు సేవ్ చేయి" : "Save User & Permissions"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Users List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {isTe ? "నమోదైన యూజర్ల జాబితా & పర్మిషన్లు" : "Registered Users & Access Control"}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                {isTe ? "పాస్‌వర్డ్ చూసేందుకు ఐకాన్ పై క్లిక్ చేయండి" : "Click eye icon to reveal passwords"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3">{isTe ? "పేరు & యూజర్ ఐడీ" : "Name & User ID"}</th>
                    <th className="p-3">{isTe ? "పాస్‌వర్డ్" : "Password"}</th>
                    <th className="p-3">{isTe ? "బ్రాంచ్ & పరిధి" : "Branch & Scope"}</th>
                    <th className="p-3">{isTe ? "హోదా / రోల్" : "Role"}</th>
                    <th className="p-3 text-center">{isTe ? "అనుమతించిన మెనూలు" : "Menus"}</th>
                    <th className="p-3 text-center">{isTe ? "పర్మిషన్లు" : "Privileges"}</th>
                    <th className="p-3 text-center">{isTe ? "చర్యలు" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                        {isTe ? "యూజర్లు ఎవరూ లేరు. పైనున్న '+ కొత్త యూజర్' బటన్ ద్వారా జోడించండి." : "No users found. Click '+ Add New User' above."}
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isPassVisible = !!showPasswordMap[u.id];
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              {u.isAdmin && <span title="Super Admin">👑</span>}
                              <span>{u.name}</span>
                            </div>
                            <div className="text-[11px] font-mono text-blue-700 font-bold">
                              @{u.username}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg border border-slate-200 font-mono text-xs">
                              <span className="font-bold text-slate-800">
                                {isPassVisible ? u.password : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswordMap((prev) => ({
                                    ...prev,
                                    [u.id]: !prev[u.id],
                                  }))
                                }
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                title={isPassVisible ? "Hide password" : "Show password"}
                              >
                                {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-0.5">
                              <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-md font-bold text-[11px]">
                                🏢 {u.branch}
                              </span>
                              <div className="text-[10px] text-slate-500 font-semibold">
                                Scope: {u.dataScope === "all" ? "🌐 All Data" : (u.dataScope === "own" ? "👤 Own Data" : "🏢 Branch Data")}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-700">{u.role || "Staff"}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 font-bold text-[11px] rounded-full">
                              {(u.allowedMenus || []).length} / {allMenus.length}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1 flex-wrap max-w-[140px] mx-auto">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  u.canCreate ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
                                }`}
                                title="Can Create"
                              >
                                +Add
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  u.canEdit ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-400"
                                }`}
                                title="Can Edit"
                              >
                                Edit
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  u.canDelete ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-400"
                                }`}
                                title="Can Delete"
                              >
                                Del
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEdit(u)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer transition-all border border-blue-200"
                                title={isTe ? "సవరించు" : "Edit User"}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!u.isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        isTe
                                          ? `యూజర్ "${u.name}" (@${u.username}) ను నిజంగా తొలగించాలనుకుంటున్నారా?`
                                          : `Are you sure you want to delete user "${u.name}" (@${u.username})?`
                                      )
                                    ) {
                                      onDeleteUser(u.id);
                                    }
                                  }}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer transition-all border border-rose-200"
                                  title={isTe ? "తొలగించు" : "Delete User"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-semibold">
            {isTe
              ? "అడ్మిన్ మార్పులు తక్షణమే అన్ని సిస్టమ్‌లలో (Supabase) సింక్ అవుతాయి."
              : "User changes and permissions sync immediately to Supabase across all systems."}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-950 text-white font-black text-xs rounded-xl cursor-pointer shadow-md"
          >
            {isTe ? "మూసివేయి (Done)" : "Done / Close"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserManagementModal;
