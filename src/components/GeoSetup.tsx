import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  Clock,
  Phone,
  Home
} from 'lucide-react';
import { DEALERSHIP_DATA, DealershipInfo, BranchInfo, MandalInfo, VillageInfo } from '../data/dealershipData';

interface GeoSetupProps {
  dealershipData: Record<'4731' | '4732', DealershipInfo>;
  isTe: boolean;
  onUpdateData: (newData: Record<'4731' | '4732', DealershipInfo>) => void;
}

type ModalType = 
  | { mode: 'addBranch'; hubCode: '4731' | '4732' }
  | { mode: 'editBranch'; hubCode: '4731' | '4732'; branchId: string; initial: BranchInfo }
  | { mode: 'addMandal'; hubCode: '4731' | '4732'; branchId: string; branchName: string }
  | { mode: 'editMandal'; hubCode: '4731' | '4732'; branchId: string; initial: MandalInfo; mandalIndex: number }
  | { mode: 'addVillage'; hubCode: '4731' | '4732'; branchId: string; mandalName: string; mandalIndex: number }
  | { mode: 'editVillage'; hubCode: '4731' | '4732'; branchId: string; mandalIndex: number; villageIndex: number; initial: VillageInfo }
  | null;

export const GeoSetup: React.FC<GeoSetupProps> = ({ dealershipData, isTe, onUpdateData }) => {
  // Local state initialized with incoming or localStorage data
  const [geoData, setGeoData] = useState<Record<'4731' | '4732', DealershipInfo>>(() => {
    try {
      const saved = localStorage.getItem('sri_custom_dealership_geo');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed['4731'] || parsed['4732'])) {
          return {
            '4731': parsed['4731'] || JSON.parse(JSON.stringify(dealershipData['4731'] || DEALERSHIP_DATA['4731'])),
            '4732': parsed['4732'] || JSON.parse(JSON.stringify(dealershipData['4732'] || DEALERSHIP_DATA['4732'])),
          };
        }
      }
    } catch (e) {
      console.error('Error reading saved geo data:', e);
    }
    return JSON.parse(JSON.stringify(dealershipData || DEALERSHIP_DATA));
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Expand / collapse states
  const [expandedHubs, setExpandedHubs] = useState<Record<string, boolean>>({ '4731': true, '4732': false });
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
  const [expandedMandals, setExpandedMandals] = useState<Record<string, boolean>>({});

  // Active modal for Add / Edit
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Form fields for modal
  const [formName, setFormName] = useState('');
  const [formTeluguName, setFormTeluguName] = useState('');
  const [formDistance, setFormDistance] = useState<number | string>(10);
  const [formTravelTime, setFormTravelTime] = useState('20 mins');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // Open Add Branch Modal
  const openAddBranch = (hubCode: '4731' | '4732') => {
    setDuplicateWarning(null);
    setFormName('');
    setFormTeluguName('');
    setFormPhone('');
    setFormAddress('');
    setActiveModal({ mode: 'addBranch', hubCode });
  };

  // Open Edit Branch Modal
  const openEditBranch = (hubCode: '4731' | '4732', branch: BranchInfo) => {
    setDuplicateWarning(null);
    setFormName(branch.name);
    setFormTeluguName(branch.teluguName || '');
    setFormPhone(branch.phone || '');
    setFormAddress(branch.hubAddress || '');
    setActiveModal({ mode: 'editBranch', hubCode, branchId: branch.id, initial: branch });
  };

  // Open Add Mandal Modal
  const openAddMandal = (hubCode: '4731' | '4732', branch: BranchInfo) => {
    setDuplicateWarning(null);
    setFormName('');
    setFormTeluguName('');
    setFormDistance(15);
    setActiveModal({ mode: 'addMandal', hubCode, branchId: branch.id, branchName: branch.name });
  };

  // Open Edit Mandal Modal
  const openEditMandal = (hubCode: '4731' | '4732', branchId: string, mandal: MandalInfo, mandalIndex: number) => {
    setDuplicateWarning(null);
    setFormName(mandal.name);
    setFormTeluguName(mandal.teluguName || '');
    setFormDistance(mandal.distanceFromBranchKm || 15);
    setActiveModal({ mode: 'editMandal', hubCode, branchId, initial: mandal, mandalIndex });
  };

  // Open Add Village Modal
  const openAddVillage = (hubCode: '4731' | '4732', branchId: string, mandal: MandalInfo, mandalIndex: number) => {
    setDuplicateWarning(null);
    setFormName('');
    setFormTeluguName('');
    setFormDistance(mandal.distanceFromBranchKm || 15);
    setFormTravelTime('25 mins');
    setActiveModal({ mode: 'addVillage', hubCode, branchId, mandalName: mandal.name, mandalIndex });
  };

  // Open Edit Village Modal
  const openEditVillage = (hubCode: '4731' | '4732', branchId: string, mandalIndex: number, village: VillageInfo, villageIndex: number) => {
    setDuplicateWarning(null);
    setFormName(village.name);
    setFormTeluguName(village.teluguName || '');
    setFormDistance(village.distanceKm || 10);
    setFormTravelTime(village.approxTravelTime || '20 mins');
    setActiveModal({ mode: 'editVillage', hubCode, branchId, mandalIndex, villageIndex, initial: village });
  };

  // Close modal
  const closeModal = () => {
    setActiveModal(null);
    setDuplicateWarning(null);
  };

  // Handle Form Submit (Add / Edit) with Duplicate Warning Check
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    const cleanName = formName.trim();
    if (!cleanName) {
      setDuplicateWarning(isTe ? '⚠️ పేరు తప్పనిసరి.' : '⚠️ Name is required.');
      return;
    }

    const nextData: Record<'4731' | '4732', DealershipInfo> = JSON.parse(JSON.stringify(geoData));

    // 1. ADD BRANCH
    if (activeModal.mode === 'addBranch') {
      const hub = nextData[activeModal.hubCode];
      const exists = hub.branches.some(
        b => b.name.toLowerCase().trim() === cleanName.toLowerCase()
      );
      if (exists) {
        setDuplicateWarning(
          isTe 
            ? `⚠️ హెచ్చరిక: '${cleanName}' పేరుతో బ్రాంచ్ ఇప్పటికే హబ్ ${activeModal.hubCode} లో ఉంది!`
            : `⚠️ Warning: A branch with name '${cleanName}' already exists in Hub ${activeModal.hubCode}!`
        );
        return;
      }

      const newId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
      const newBranch: BranchInfo = {
        id: newId,
        name: cleanName,
        teluguName: formTeluguName.trim() || cleanName,
        dealershipCode: activeModal.hubCode,
        hubAddress: formAddress.trim() || cleanName,
        phone: formPhone.trim() || '',
        mandals: []
      };

      hub.branches.push(newBranch);
      setGeoData(nextData);
      setHasUnsavedChanges(true);
      setExpandedBranches(prev => ({ ...prev, [newId]: true }));
      closeModal();
      return;
    }

    // 2. EDIT BRANCH
    if (activeModal.mode === 'editBranch') {
      const hub = nextData[activeModal.hubCode];
      // Duplicate check against other branches in same hub
      const exists = hub.branches.some(
        b => b.id !== activeModal.branchId && b.name.toLowerCase().trim() === cleanName.toLowerCase()
      );
      if (exists) {
        setDuplicateWarning(
          isTe 
            ? `⚠️ హెచ్చరిక: '${cleanName}' పేరుతో మరొక బ్రాంచ్ ఇప్పటికే ఉంది!`
            : `⚠️ Warning: Another branch with name '${cleanName}' already exists!`
        );
        return;
      }

      const bIdx = hub.branches.findIndex(b => b.id === activeModal.branchId);
      if (bIdx !== -1) {
        hub.branches[bIdx].name = cleanName;
        hub.branches[bIdx].teluguName = formTeluguName.trim() || cleanName;
        hub.branches[bIdx].phone = formPhone.trim();
        hub.branches[bIdx].hubAddress = formAddress.trim();
        setGeoData(nextData);
        setHasUnsavedChanges(true);
      }
      closeModal();
      return;
    }

    // 3. ADD MANDAL
    if (activeModal.mode === 'addMandal') {
      const hub = nextData[activeModal.hubCode];
      const branch = hub.branches.find(b => b.id === activeModal.branchId);
      if (!branch) return;

      const exists = branch.mandals.some(
        m => m.name.toLowerCase().trim() === cleanName.toLowerCase()
      );
      if (exists) {
        setDuplicateWarning(
          isTe 
            ? `⚠️ హెచ్చరిక: '${cleanName}' పేరుతో మండలం ఇప్పటికే '${branch.name}' బ్రాంచ్‌లో ఉంది!`
            : `⚠️ Warning: A mandal named '${cleanName}' already exists in Branch '${branch.name}'!`
        );
        return;
      }

      const dist = Number(formDistance) || 15;
      const newMandal: MandalInfo = {
        name: cleanName,
        teluguName: formTeluguName.trim() || cleanName,
        distanceFromBranchKm: dist,
        villages: []
      };

      branch.mandals.push(newMandal);
      if (!hub.allMandals.includes(cleanName)) {
        hub.allMandals.push(cleanName);
      }
      setGeoData(nextData);
      setHasUnsavedChanges(true);
      setExpandedMandals(prev => ({ ...prev, [`${branch.id}-${cleanName}`]: true }));
      closeModal();
      return;
    }

    // 4. EDIT MANDAL
    if (activeModal.mode === 'editMandal') {
      const hub = nextData[activeModal.hubCode];
      const branch = hub.branches.find(b => b.id === activeModal.branchId);
      if (!branch || !branch.mandals[activeModal.mandalIndex]) return;

      // Duplicate check against other mandals in same branch
      const exists = branch.mandals.some(
        (m, idx) => idx !== activeModal.mandalIndex && m.name.toLowerCase().trim() === cleanName.toLowerCase()
      );
      if (exists) {
        setDuplicateWarning(
          isTe 
            ? `⚠️ హెచ్చరిక: '${cleanName}' పేరుతో మరొక మండలం ఇప్పటికే ఉంది!`
            : `⚠️ Warning: Another mandal named '${cleanName}' already exists in this Branch!`
        );
        return;
      }

      const oldName = branch.mandals[activeModal.mandalIndex].name;
      branch.mandals[activeModal.mandalIndex].name = cleanName;
      branch.mandals[activeModal.mandalIndex].teluguName = formTeluguName.trim() || cleanName;
      branch.mandals[activeModal.mandalIndex].distanceFromBranchKm = Number(formDistance) || 15;

      // Update allMandals list
      const mIdx = hub.allMandals.indexOf(oldName);
      if (mIdx !== -1) {
        hub.allMandals[mIdx] = cleanName;
      } else if (!hub.allMandals.includes(cleanName)) {
        hub.allMandals.push(cleanName);
      }

      setGeoData(nextData);
      setHasUnsavedChanges(true);
      closeModal();
      return;
    }

    // 5. ADD VILLAGE
    if (activeModal.mode === 'addVillage') {
      const hub = nextData[activeModal.hubCode];
      const branch = hub.branches.find(b => b.id === activeModal.branchId);
      if (!branch || !branch.mandals[activeModal.mandalIndex]) return;
      const mandal = branch.mandals[activeModal.mandalIndex];

      const exists = mandal.villages.some(
        v => v.name.toLowerCase().trim() === cleanName.toLowerCase()
      );
      if (exists) {
        setDuplicateWarning(
          isTe 
            ? `⚠️ హెచ్చరిక: '${cleanName}' పేరుతో గ్రామం ఇప్పటికే '${mandal.name}' మండలంలో ఉంది!`
            : `⚠️ Warning: A village named '${cleanName}' already exists in Mandal '${mandal.name}'!`
        );
        return;
      }

      const newVillage: VillageInfo = {
        name: cleanName,
        teluguName: formTeluguName.trim() || cleanName,
        distanceKm: Number(formDistance) || 10,
        approxTravelTime: formTravelTime.trim() || `${Math.round((Number(formDistance) || 10) * 1.8)} mins`
      };

      mandal.villages.push(newVillage);
      setGeoData(nextData);
      setHasUnsavedChanges(true);
      closeModal();
      return;
    }

    // 6. EDIT VILLAGE
    if (activeModal.mode === 'editVillage') {
      const hub = nextData[activeModal.hubCode];
      const branch = hub.branches.find(b => b.id === activeModal.branchId);
      if (!branch || !branch.mandals[activeModal.mandalIndex]) return;
      const mandal = branch.mandals[activeModal.mandalIndex];

      // Duplicate check against other villages in same mandal
      const exists = mandal.villages.some(
        (v, idx) => idx !== activeModal.villageIndex && v.name.toLowerCase().trim() === cleanName.toLowerCase()
      );
      if (exists) {
        setDuplicateWarning(
          isTe 
            ? `⚠️ హెచ్చరిక: '${cleanName}' పేరుతో మరొక గ్రామం ఇప్పటికే ఈ మండలంలో ఉంది!`
            : `⚠️ Warning: Another village named '${cleanName}' already exists in this Mandal!`
        );
        return;
      }

      mandal.villages[activeModal.villageIndex].name = cleanName;
      mandal.villages[activeModal.villageIndex].teluguName = formTeluguName.trim() || cleanName;
      mandal.villages[activeModal.villageIndex].distanceKm = Number(formDistance) || 10;
      mandal.villages[activeModal.villageIndex].approxTravelTime = formTravelTime.trim() || `${Math.round((Number(formDistance) || 10) * 1.8)} mins`;

      setGeoData(nextData);
      setHasUnsavedChanges(true);
      closeModal();
      return;
    }
  };

  // Delete Handlers with confirmation
  const handleDeleteVillage = (hubCode: '4731' | '4732', branchId: string, mandalIdx: number, villageIdx: number, villageName: string) => {
    const confirmMsg = isTe 
      ? `'${villageName}' గ్రామాన్ని ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?` 
      : `Are you sure you want to delete village '${villageName}'?`;
    if (!window.confirm(confirmMsg)) return;

    const nextData = JSON.parse(JSON.stringify(geoData));
    const branch = nextData[hubCode]?.branches.find((b: any) => b.id === branchId);
    if (branch && branch.mandals[mandalIdx]) {
      branch.mandals[mandalIdx].villages.splice(villageIdx, 1);
      setGeoData(nextData);
      setHasUnsavedChanges(true);
    }
  };

  const handleDeleteMandal = (hubCode: '4731' | '4732', branchId: string, mandalIdx: number, mandalName: string) => {
    const confirmMsg = isTe 
      ? `'${mandalName}' మండలాన్ని మరియు దానిలోని అన్ని గ్రామాలను ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?` 
      : `Are you sure you want to delete mandal '${mandalName}' and all its villages?`;
    if (!window.confirm(confirmMsg)) return;

    const nextData = JSON.parse(JSON.stringify(geoData));
    const branch = nextData[hubCode]?.branches.find((b: any) => b.id === branchId);
    if (branch && branch.mandals[mandalIdx]) {
      branch.mandals.splice(mandalIdx, 1);
      setGeoData(nextData);
      setHasUnsavedChanges(true);
    }
  };

  const handleDeleteBranch = (hubCode: '4731' | '4732', branchId: string, branchName: string) => {
    const confirmMsg = isTe 
      ? `'${branchName}' బ్రాంచ్‌ను మరియు దాని పరిధిలోని అన్ని మండలాలను ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?` 
      : `Are you sure you want to delete branch '${branchName}' and all its mandals?`;
    if (!window.confirm(confirmMsg)) return;

    const nextData = JSON.parse(JSON.stringify(geoData));
    const hub = nextData[hubCode];
    if (hub) {
      hub.branches = hub.branches.filter((b: any) => b.id !== branchId);
      setGeoData(nextData);
      setHasUnsavedChanges(true);
    }
  };

  // SAVE CHANGES (🔘)
  const handleSaveMasterChanges = () => {
    try {
      localStorage.setItem('sri_custom_dealership_geo', JSON.stringify(geoData));
      onUpdateData(geoData);
      setHasUnsavedChanges(false);
      setSaveSuccessMsg(
        isTe 
          ? '✅ భౌగోళిక మార్పులు (Branches, Mandals, Villages) విజయవంతంగా సేవ్ చేయబడ్డాయి!' 
          : '✅ Geographic setup changes saved successfully!'
      );
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (e) {
      console.error('Failed to save geo changes:', e);
      alert('Error saving geographic changes.');
    }
  };

  // Reset to default factory directory
  const handleResetToDefault = () => {
    const confirmMsg = isTe
      ? 'అన్ని భౌగోళిక మార్పులను రద్దు చేసి, డిఫాల్ట్ మాస్టర్ డైరెక్టరీకి రీసెట్ చేయాలనుకుంటున్నారా?'
      : 'Reset all geographic data back to factory defaults? Any custom added villages/branches will be restored to defaults.';
    if (!window.confirm(confirmMsg)) return;

    const defaultData = JSON.parse(JSON.stringify(DEALERSHIP_DATA));
    setGeoData(defaultData);
    localStorage.removeItem('sri_custom_dealership_geo');
    onUpdateData(defaultData);
    setHasUnsavedChanges(false);
    setSaveSuccessMsg(isTe ? 'డిఫాల్ట్ డేటా రీసెట్ చేయబడింది.' : 'Reset to default directory.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const toggleHub = (code: string) => setExpandedHubs(p => ({ ...p, [code]: !p[code] }));
  const toggleBranch = (id: string) => setExpandedBranches(p => ({ ...p, [id]: !p[id] }));
  const toggleMandal = (key: string) => setExpandedMandals(p => ({ ...p, [key]: !p[key] }));

  // Summary counts
  const stats = useMemo(() => {
    let totalBranches = 0;
    let totalMandals = 0;
    let totalVillages = 0;
    Object.values(geoData).forEach((hub: any) => {
      totalBranches += hub.branches?.length || 0;
      hub.branches?.forEach((b: any) => {
        totalMandals += b.mandals?.length || 0;
        b.mandals?.forEach((m: any) => {
          totalVillages += m.villages?.length || 0;
        });
      });
    });
    return { totalBranches, totalMandals, totalVillages };
  }, [geoData]);

  // Clean string helper for search
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      {/* 1. TOP HEADER WITH STATUS & SAVE BUTTON */}
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <span>{isTe ? 'జియోగ్రాఫిక్ సెటప్ & మాస్టర్ డైరెక్టరీ' : 'Geographic Directory Setup'}</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                {isTe ? 'ఎడిట్ & కొత్తవి జోడించండి' : 'Edit & Add Master'}
              </span>
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
              <span>{stats.totalBranches} {isTe ? 'బ్రాంచ్‌లు' : 'Branches'}</span>
              <span>•</span>
              <span>{stats.totalMandals} {isTe ? 'మండలాలు' : 'Mandals'}</span>
              <span>•</span>
              <span>{stats.totalVillages} {isTe ? 'గ్రామాలు' : 'Villages'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Save Button */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              {isTe ? 'సేవ్ చేయని మార్పులు ఉన్నాయి' : 'Unsaved Changes'}
            </span>
          )}

          <button
            type="button"
            onClick={handleResetToDefault}
            title={isTe ? 'డిఫాల్ట్ డైరెక్టరీకి రీసెట్ చేయి' : 'Reset to factory defaults'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isTe ? 'రీసెట్' : 'Reset'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveMasterChanges}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-xs shadow-md transition ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isTe ? 'సేవ్ చేయండి 🔘' : 'SAVE MASTER CHANGES 🔘'}</span>
          </button>
        </div>
      </div>

      {/* 2. NOTIFICATION / ALERT BANNERS */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center gap-2 text-emerald-900 font-bold text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 3. SEARCH BAR */}
      <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isTe ? 'గ్రామం, మండలం లేదా బ్రాంచ్ పేరు వెతకండి...' : 'Filter by village, mandal, or branch name...'}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          {isTe ? 'గమనిక: కొత్తవి చేర్చిన తర్వాత "సేవ్ చేయండి 🔘" నొక్కండి.' : 'Note: Click "Save Master Changes 🔘" after editing.'}
        </span>
      </div>

      {/* 4. MAIN DIRECTORY TREE VIEW */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-4">
          {Object.entries(geoData).map(([code, hub]: [string, any]) => {
            const isHubExpanded = expandedHubs[code];
            const filteredBranches = hub.branches.filter((b: any) => {
              if (!searchQuery.trim()) return true;
              const bMatch = matchesSearch(b.name) || matchesSearch(b.teluguName || '');
              const mMatch = b.mandals?.some((m: any) => 
                matchesSearch(m.name) || matchesSearch(m.teluguName || '') ||
                m.villages?.some((v: any) => matchesSearch(v.name) || matchesSearch(v.teluguName || ''))
              );
              return bMatch || mMatch;
            });

            return (
              <div key={code} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                {/* HUB ROW */}
                <div 
                  className="px-4 py-3 flex items-center justify-between bg-slate-900 text-white cursor-pointer hover:bg-slate-800 transition select-none"
                  onClick={() => toggleHub(code)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 rounded bg-slate-800">
                      {isHubExpanded ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div>
                      <span className="font-black text-sm">
                        HUB {code}: {isTe ? hub.teluguName : hub.name}
                      </span>
                      <span className="text-[10px] ml-2 text-slate-400 font-bold">
                        ({hub.branches.length} {isTe ? 'బ్రాంచ్‌లు' : 'Branches'})
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openAddBranch(code as '4731' | '4732')}
                      className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-md shadow transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isTe ? '+ కొత్త బ్రాంచ్ జోడించు' : '+ Add Branch'}</span>
                    </button>
                  </div>
                </div>

                {/* HUB CONTENT (BRANCHES) */}
                {isHubExpanded && (
                  <div className="p-3 space-y-3 bg-slate-100/60">
                    {filteredBranches.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-200">
                        {isTe ? 'ఈ హబ్‌లో బ్రాంచ్‌లు లేవు.' : 'No branches found matching search.'}
                      </div>
                    ) : (
                      filteredBranches.map((branch: any) => {
                        const isBranchExpanded = expandedBranches[branch.id] || searchQuery.trim() !== '';
                        const filteredMandals = branch.mandals?.filter((m: any) => {
                          if (!searchQuery.trim()) return true;
                          return matchesSearch(m.name) || matchesSearch(m.teluguName || '') ||
                            m.villages?.some((v: any) => matchesSearch(v.name) || matchesSearch(v.teluguName || ''));
                        }) || [];

                        return (
                          <div key={branch.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                            {/* BRANCH ROW */}
                            <div 
                              className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition border-b border-slate-200 select-none"
                              onClick={() => toggleBranch(branch.id)}
                            >
                              <div className="flex items-center gap-3">
                                {isBranchExpanded ? (
                                  <FolderOpen className="w-4 h-4 text-blue-700" />
                                ) : (
                                  <Folder className="w-4 h-4 text-slate-400" />
                                )}
                                <div>
                                  <span className="font-bold text-xs text-slate-900">{branch.name}</span>
                                  {branch.teluguName && branch.teluguName !== branch.name && (
                                    <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                                      ({branch.teluguName})
                                    </span>
                                  )}
                                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold ml-2">
                                    {branch.mandals?.length || 0} Mandals
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => openAddMandal(code as '4731' | '4732', branch)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded transition"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>{isTe ? '+ మండలం' : '+ Mandal'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditBranch(code as '4731' | '4732', branch)}
                                  title={isTe ? 'బ్రాంచ్ వివరాలను ఎడిట్ చేయండి' : 'Edit Branch details'}
                                  className="p-1.5 hover:bg-blue-100 text-blue-700 rounded transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBranch(code as '4731' | '4732', branch.id, branch.name)}
                                  title={isTe ? 'బ్రాంచ్‌ను తొలగించండి' : 'Delete Branch'}
                                  className="p-1.5 hover:bg-rose-100 text-rose-600 rounded transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* MANDALS LIST */}
                            {isBranchExpanded && (
                              <div className="p-3 space-y-2.5 bg-slate-50/40">
                                {filteredMandals.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-400 bg-white rounded border border-dashed border-slate-200">
                                    {isTe ? 'ఈ బ్రాంచ్‌లో మండలాలు లేవు. పైన ఉన్న "+ మండలం" బటన్ ద్వారా జోడించండి.' : 'No mandals in this branch yet. Click "+ Mandal" to add.'}
                                  </div>
                                ) : (
                                  filteredMandals.map((mandal: any, mIdx: number) => {
                                    const mKey = `${branch.id}-${mandal.name}`;
                                    const isMExpand = expandedMandals[mKey] || searchQuery.trim() !== '';
                                    const filteredVillages = mandal.villages?.filter((v: any) => {
                                      if (!searchQuery.trim()) return true;
                                      return matchesSearch(v.name) || matchesSearch(v.teluguName || '');
                                    }) || [];

                                    return (
                                      <div key={mandal.name} className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-3xs">
                                        {/* MANDAL ROW */}
                                        <div 
                                          className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-50 cursor-pointer transition select-none"
                                          onClick={() => toggleMandal(mKey)}
                                        >
                                          <div className="flex items-center gap-2">
                                            {isMExpand ? (
                                              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                                            ) : (
                                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                            <span className="font-bold text-xs text-slate-800">{mandal.name} Mandal</span>
                                            {mandal.teluguName && mandal.teluguName !== mandal.name && (
                                              <span className="text-[11px] text-slate-500 font-medium">
                                                ({mandal.teluguName})
                                              </span>
                                            )}
                                            <span className="text-[10px] text-slate-500 font-mono">
                                              [{mandal.distanceFromBranchKm || 15} km]
                                            </span>
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                              {mandal.villages?.length || 0} Villages
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button
                                              type="button"
                                              onClick={() => openAddVillage(code as '4731' | '4732', branch.id, mandal, mIdx)}
                                              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition"
                                            >
                                              <Plus className="w-2.5 h-2.5" />
                                              <span>{isTe ? '+ గ్రామం' : '+ Village'}</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => openEditMandal(code as '4731' | '4732', branch.id, mandal, mIdx)}
                                              title={isTe ? 'మండలం వివరాలను ఎడిట్ చేయండి' : 'Edit Mandal'}
                                              className="p-1 hover:bg-slate-100 text-slate-600 rounded transition"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteMandal(code as '4731' | '4732', branch.id, mIdx, mandal.name)}
                                              title={isTe ? 'మండలాన్ని తొలగించండి' : 'Delete Mandal'}
                                              className="p-1 hover:bg-rose-100 text-rose-600 rounded transition"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* VILLAGES GRID */}
                                        {isMExpand && (
                                          <div className="p-2.5 border-t border-slate-100 bg-slate-50/50">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                              {filteredVillages.map((village: any, vIdx: number) => (
                                                <div 
                                                  key={village.name + '-' + vIdx} 
                                                  className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg shadow-3xs hover:border-blue-300 transition group"
                                                >
                                                  <div className="flex flex-col min-w-0 pr-2">
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-[11px] font-bold text-slate-800 truncate">{village.name}</span>
                                                      {village.teluguName && village.teluguName !== village.name && (
                                                        <span className="text-[10px] text-slate-500 font-medium truncate">
                                                          ({village.teluguName})
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9.5px] text-slate-500 font-mono mt-0.5">
                                                      <span className="flex items-center gap-0.5">
                                                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                                        {village.distanceKm || 10} km
                                                      </span>
                                                      {village.approxTravelTime && (
                                                        <span className="flex items-center gap-0.5 text-slate-400">
                                                          <Clock className="w-2.5 h-2.5" />
                                                          {village.approxTravelTime}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                                                    <button 
                                                      type="button"
                                                      onClick={() => openEditVillage(code as '4731' | '4732', branch.id, mIdx, village, vIdx)}
                                                      title={isTe ? 'గ్రామం ఎడిట్ చేయండి' : 'Edit Village'}
                                                      className="p-1 hover:bg-blue-50 text-blue-600 rounded transition"
                                                    >
                                                      <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                      type="button"
                                                      onClick={() => handleDeleteVillage(code as '4731' | '4732', branch.id, mIdx, vIdx, village.name)}
                                                      title={isTe ? 'గ్రామం తొలగించండి' : 'Delete Village'}
                                                      className="p-1 hover:bg-rose-50 text-rose-500 rounded transition"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}

                                              {/* ADD VILLAGE QUICK BUTTON */}
                                              <button 
                                                type="button"
                                                onClick={() => openAddVillage(code as '4731' | '4732', branch.id, mandal, mIdx)}
                                                className="flex items-center justify-center gap-1.5 p-2 border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/70 text-blue-600 rounded-lg transition text-center"
                                              >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span className="text-[10.5px] font-bold">
                                                  {isTe ? '+ గ్రామాన్ని జోడించండి' : '+ Add Village'}
                                                </span>
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}

                                {/* ADD MANDAL QUICK BUTTON */}
                                <button 
                                  type="button"
                                  onClick={() => openAddMandal(code as '4731' | '4732', branch)}
                                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 rounded-lg transition w-full text-xs font-bold shadow-3xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>{isTe ? `+ ${branch.name} బ్రాంచ్‌కు కొత్త మండలాన్ని జోడించండి` : `+ Add New Mandal to ${branch.name}`}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {/* ADD BRANCH BUTTON */}
                    <button 
                      type="button"
                      onClick={() => openAddBranch(code as '4731' | '4732')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50/50 text-amber-900 rounded-xl transition w-full shadow-3xs text-xs font-black"
                    >
                      <Plus className="w-4 h-4 text-amber-600" />
                      <span>{isTe ? `+ హబ్ ${code} కు కొత్త బ్రాంచ్‌ను జోడించండి` : `+ Add New Branch to Hub ${code}`}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. BOTTOM FOOTER WITH SAVE CHANGES BUTTON */}
      <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          {hasUnsavedChanges ? (
            <span className="flex items-center gap-1.5 text-xs text-amber-700 font-bold bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              <AlertTriangle className="w-4 h-4" />
              {isTe ? 'మార్పులు జరిగాయి! దయచేసి సేవ్ చేయండి.' : 'Unsaved changes pending! Click Save to apply.'}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {isTe ? 'అన్ని భౌగోళిక వివరాలు సేవ్ చేయబడి ఉన్నాయి.' : 'All geographic data is synchronized & up to date.'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveMasterChanges}
            className={`px-6 py-2.5 rounded-lg font-black text-xs shadow-md transition flex items-center gap-2 ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400'
                : 'bg-blue-900 hover:bg-blue-950 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isTe ? 'మార్పులను సేవ్ చేయండి 🔘' : 'SAVE MASTER CHANGES 🔘'}</span>
          </button>
        </div>
      </div>

      {/* 6. MODAL FOR ADD / EDIT BRANCH, MANDAL, VILLAGE */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {activeModal.mode === 'addBranch' && (isTe ? 'కొత్త బ్రాంచ్‌ను జోడించండి' : 'Add New Branch')}
                  {activeModal.mode === 'editBranch' && (isTe ? 'బ్రాంచ్ వివరాలను సవరించండి' : 'Edit Branch Details')}
                  {activeModal.mode === 'addMandal' && (isTe ? 'కొత్త మండలాన్ని జోడించండి' : 'Add New Mandal')}
                  {activeModal.mode === 'editMandal' && (isTe ? 'మండలం వివరాలను సవరించండి' : 'Edit Mandal Details')}
                  {activeModal.mode === 'addVillage' && (isTe ? 'కొత్త గ్రామాన్ని జోడించండి' : 'Add New Village')}
                  {activeModal.mode === 'editVillage' && (isTe ? 'గ్రామం వివరాలను సవరించండి' : 'Edit Village Details')}
                </h3>
              </div>
              <button 
                type="button"
                onClick={closeModal} 
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DUPLICATE WARNING ALERT (హెచ్చరిక) */}
            {duplicateWarning && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-2.5 text-amber-900 text-xs font-bold animate-in shake">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-black text-[13px]">{isTe ? 'హెచ్చరిక!' : 'Warning!'}</div>
                  <div className="mt-0.5">{duplicateWarning}</div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              {/* Name (English) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTe ? 'పేరు (ఇంగ్లీష్‌లో) *' : 'Name (in English) *'}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setDuplicateWarning(null);
                  }}
                  placeholder="e.g. Kondapalli, Mylavaram, Gudivada"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Telugu Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTe ? 'తెలుగు పేరు (ఐచ్ఛికం)' : 'Telugu Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={formTeluguName}
                  onChange={(e) => setFormTeluguName(e.target.value)}
                  placeholder="ఉదా: కొండపల్లి, మైలవరం, గుడివాడ"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Distance Field (for Mandal & Village) */}
              {(activeModal.mode === 'addMandal' || activeModal.mode === 'editMandal' || activeModal.mode === 'addVillage' || activeModal.mode === 'editVillage') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTe ? 'బ్రాంచ్ నుండి దూరం (కి.మీ - Distance in km)' : 'Road Distance from Branch (km)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="0.5"
                    value={formDistance}
                    onChange={(e) => setFormDistance(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              )}

              {/* Approx Travel Time (for Village) */}
              {(activeModal.mode === 'addVillage' || activeModal.mode === 'editVillage') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTe ? 'సుమారు ప్రయాణ సమయం (Approx Travel Time)' : 'Approx Travel Time'}
                  </label>
                  <input
                    type="text"
                    value={formTravelTime}
                    onChange={(e) => setFormTravelTime(e.target.value)}
                    placeholder="e.g. 25 mins, 45 mins, 1 hr"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Phone & Address (for Branch) */}
              {(activeModal.mode === 'addBranch' || activeModal.mode === 'editBranch') && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isTe ? 'ఫోన్ నంబర్' : 'Contact Phone Number'}
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. 9848012345"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isTe ? 'బ్రాంచ్ చిరునామా' : 'Hub / Branch Address'}
                    </label>
                    <textarea
                      rows={2}
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="e.g. NH-65, Beside Petrol Bunk, Nandigama"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  {isTe ? 'రద్దు' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {activeModal.mode.startsWith('add') 
                      ? (isTe ? 'జోడించు' : 'Add Item') 
                      : (isTe ? 'సవరించు' : 'Update Item')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
