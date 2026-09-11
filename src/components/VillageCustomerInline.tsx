import React, { useState, useMemo } from 'react';
import {
  Phone,
  MessageCircle,
  MessageSquare,
  Users,
  CheckCircle,
  Clock,
  Download,
  Copy,
  Plus,
  X,
  Sparkles,
  MapPin,
  ExternalLink,
  ChevronUp,
  Map as MapIcon,
  CheckSquare,
  Square,
  Send,
  Wrench,
  Truck
} from 'lucide-react';
import { getGoogleMapsDirectionsUrl } from '../data/dealershipData';
import { formatDisplayDate, getCustomerDeliveryTimestamp, isDeliveryOutOfWarranty } from '../utils/dateFormatter';

export interface VillageCustomerInlineProps {
  villageName: string;
  villageTelugu?: string;
  mandalName: string;
  mandalTelugu?: string;
  branchName: string;
  hubCode: '4731' | '4732' | string;
  distanceKm: number;
  approxTravelTime?: string;
  customers: any[];
  isTe: boolean;
  onPlanCamp: (initialData: {
    dealershipCode: string;
    branch: string;
    mandal: string;
    village: string;
  }) => void;
  onStartBroadcast: (data: {
    villageName: string;
    mandalName: string;
    branchName: string;
    customers: any[];
    messageTemplate: string;
  }) => void;
  contactedCustomers: Record<string, boolean>;
  onMarkContacted: (customerKey: string) => void;
  onClose?: () => void;
  showToast: (msg: string) => void;
}

export const VillageCustomerInline: React.FC<VillageCustomerInlineProps> = ({
  villageName,
  villageTelugu,
  mandalName,
  mandalTelugu,
  branchName,
  hubCode,
  distanceKm,
  approxTravelTime,
  customers = [],
  isTe,
  onPlanCamp,
  onStartBroadcast,
  contactedCustomers,
  onMarkContacted,
  onClose,
  showToast
}) => {
  // Preset Message Templates (Telugu & English)
  const templates = useMemo(() => {
    if (isTe) {
      return [
        {
          id: 'camp_invite',
          label: '⛺ మెగా క్యాంప్ ఆహ్వానం',
          text: `నమస్కారం {CustomerName} గారు! శ్రీ గాయత్రి ఆటోమోటివ్స్ (ఈచర్ ట్రాక్టర్స్ ${branchName}) తరపున మన గ్రామం {Village} లో ఉచిత మెగా సర్వీస్ క్యాంప్ నిర్వహించబడుతోంది. 
🔹 50-పాయింట్ ఉచిత జనరల్ చెకప్
🔹 ఈచర్ జెన్యూన్ ఆయిల్ & ఫిల్టర్లపై 10% రాయితీ
🔹 ఉచిత గ్రీసింగ్ & బ్యాటరీ చెకప్
మీ {TractorModel} ట్రాక్టర్‌ను తీసుకువచ్చి సర్వీస్ చేయించుకోగలరు.`
        },
        {
          id: 'oil_offer',
          label: '🛢️ ఆయిల్ & ఫిల్టర్ ఆఫర్',
          text: `రైతు సోదరుడు {CustomerName} గారికి నమస్కారం! {Village} ఈచర్ సర్వీస్ క్యాంప్‌లో జెన్యూన్ ఇంజిన్ ఆయిల్, ఆయిల్ ఫిల్టర్ మరియు డీజిల్ ఫిల్టర్లపై ప్రత్యేక 10% రాయితీ కలదు. త్వరపడండి, మీ ట్రాక్టర్ ఇంజిన్ లైఫ్‌ను కాపాడుకోండి.`
        },
        {
          id: 'harvest_checkup',
          label: '🌾 కోత కాలం (Harvest) స్పెషల్',
          text: `నమస్కారం {CustomerName} గారు, రాబోయే సీజన్ దృష్ట్యా మీ {TractorModel} ట్రాక్టర్ బ్రేకులు, క్లచ్, హైడ్రాలిక్స్ మరియు ఇంజిన్ పనితీరును మన {Village} క్యాంప్‌లో నిపుణులైన ఈచర్ కంపెనీ మెకానిక్‌లతో ఉచితంగా తనిఖీ చేయించుకోండి.`
        },
        {
          id: 'service_due',
          label: '🛠️ సర్వీస్ డ్యూ రిమైండర్',
          text: `నమస్కారం {CustomerName} గారు, మీ {TractorModel} ట్రాక్టర్ సర్వీస్ సమయం ఆసన్నమైంది. దూరంగా వెళ్లే పనిలేకుండా, మన {Village} లోనే జరిగే సర్వీస్ క్యాంప్‌లో సులభంగా సర్వీస్ చేయించుకోండి.`
        },
        {
          id: 'custom',
          label: '✍️ సొంత సందేశం (Custom)',
          text: `నమస్కారం {CustomerName} గారు, శ్రీ గాయత్రి ఆటోమోటివ్స్ తరపున మన {Village} లో ఈచర్ ట్రాక్టర్ సర్వీస్ క్యాంప్ జరుగుతోంది. పూర్తి వివరాలకు సంప్రదించండి.`
        }
      ];
    }
    return [
      {
        id: 'camp_invite',
        label: '⛺ Mega Camp Invite',
        text: `Dear {CustomerName}, Sri Gayathri Automotives (${branchName}) is organizing a Free Mega Service Camp in your village {Village}.
🔹 50-Point Free General Inspection
🔹 10% Discount on Genuine Eicher Engine Oil & Filters
🔹 Free Greasing & Battery Health Check
Please bring your {TractorModel} tractor.`
      },
      {
        id: 'oil_offer',
        label: '🛢️ Oil & Filter Offer',
        text: `Dear {CustomerName}, Special 10% discount on Genuine Eicher Engine Oil, Diesel Filter and Oil Filter at our {Village} service camp. Protect your engine with genuine parts!`
      },
      {
        id: 'harvest_checkup',
        label: '🌾 Harvest Season Special',
        text: `Dear {CustomerName}, Prepare your {TractorModel} tractor for the harvest season with free brake, clutch, hydraulic and electrical checkups by expert technicians in {Village}.`
      },
      {
        id: 'service_due',
        label: '🛠️ Service Due Reminder',
        text: `Dear {CustomerName}, Your {TractorModel} tractor is due for routine maintenance. Get it serviced conveniently at the upcoming {Village} service camp.`
      },
      {
        id: 'custom',
        label: '✍️ Custom Draft',
        text: `Dear {CustomerName}, Sri Gayathri Automotives is conducting a Service Camp in {Village}. Please contact us for further details.`
      }
    ];
  }, [isTe, villageName, branchName]);

  // Active custom message draft
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('camp_invite');
  const [customMessage, setCustomMessage] = useState<string>(templates[0].text);

  // Selected customer IDs for bulk actions
  const [selectedCustomerKeys, setSelectedCustomerKeys] = useState<string[]>(() =>
    customers.map(c => c.chassisKey || c.chassisNo || c.ownerMob || c.id || '').filter(Boolean)
  );

  // Search/Filter within village customers
  const [localSearch, setLocalSearch] = useState('');

  // Handle template switch
  const handleSelectTemplate = (template: { id: string; text: string }) => {
    setSelectedTemplateId(template.id);
    setCustomMessage(template.text);
  };

  // Helper to format personalized message for a customer
  const getPersonalizedMessage = (cust: any) => {
    const name = cust.custName || cust.customerName || cust.cust_name || cust.customer_name || cust.Name || cust.name || cust.__custNameDisplay || (isTe ? 'రైతు సోదరులారా' : 'Farmer');
    const model = cust.tractorModel || cust.tractor_model || cust.model || cust.Tractor || (isTe ? 'ఈచర్ ట్రాక్టర్' : 'Eicher Tractor');
    const chassis = cust.chassisNo || cust.chassis_no || cust.Chassis || cust.chassis || '';
    return customMessage
      .replace(/\{CustomerName\}|\{పేరు\}/g, name)
      .replace(/\{Village\}|\{గ్రామం\}/g, villageName)
      .replace(/\{Mandal\}|\{మండలం\}/g, mandalName)
      .replace(/\{Branch\}|\{బ్రాంచ్\}/g, branchName)
      .replace(/\{TractorModel\}|\{మోడల్\}|\{ట్రాక్టర్\}/g, model)
      .replace(/\{ChassisNo\}|\{ఛాసిస్\}/g, chassis);
  };

  // Toggle selection for a single customer
  const toggleSelectCustomer = (key: string) => {
    setSelectedCustomerKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Toggle Select All / Deselect All
  const handleToggleSelectAll = () => {
    const allKeys = customers
      .map(c => c.chassisKey || c.chassisNo || c.ownerMob || c.id || '')
      .filter(Boolean);

    if (selectedCustomerKeys.length === allKeys.length) {
      setSelectedCustomerKeys([]);
    } else {
      setSelectedCustomerKeys(allKeys);
    }
  };

  // Filtered and sorted customer list for display (Chronological: recent delivery first)
  const filteredCustomers = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    let list = customers;
    if (q) {
      list = customers.filter(c => {
        const name = (c.custName || c.cust_name || c.customerName || c.customer_name || c.Name || '').toLowerCase();
        const father = (c.fatherName || c.father_name || c.FatherName || '').toLowerCase();
        const mob = (c.ownerMob || c.owner_mob || c.mobileNumber || c.mobile_number || c.Phone || c.phNo || '').toLowerCase();
        const model = (c.tractorModel || c.tractor_model || c.model || c.Tractor || '').toLowerCase();
        const chassis = (c.chassisNo || c.chassis_no || c.Chassis || '').toLowerCase();
        return (
          name.includes(q) ||
          father.includes(q) ||
          mob.includes(q) ||
          model.includes(q) ||
          chassis.includes(q)
        );
      });
    }

    // Sort: recent delivery date first (present to past)
    return [...list].sort((a, b) => {
      const tsA = getCustomerDeliveryTimestamp(a);
      const tsB = getCustomerDeliveryTimestamp(b);
      if (tsA !== tsB) {
        if (tsA === -1) return 1;
        if (tsB === -1) return -1;
        return tsB - tsA;
      }
      return 0;
    });
  }, [customers, localSearch]);

  // Copy all selected mobile numbers
  const handleCopySelectedMobiles = () => {
    const selectedCusts = customers.filter(c => {
      const k = c.chassisKey || c.chassisNo || c.ownerMob || c.id || '';
      return selectedCustomerKeys.includes(k);
    });

    const mobiles = selectedCusts
      .map(c => c.ownerMob || c.owner_mob || c.mobileNumber || c.mobile_number || c.phone || c.phNo || c.Phone || '')
      .map(m => String(m).replace(/[^0-9]/g, ''))
      .filter(m => m.length >= 10);

    if (mobiles.length === 0) {
      alert(isTe ? 'ఎటువంటి చెల్లుబాటు అయ్యే మొబైల్ నంబర్లు ఎంచుకోలేదు.' : 'No valid mobile numbers found in selection.');
      return;
    }

    const text = mobiles.join(', ');
    navigator.clipboard.writeText(text).then(() => {
      showToast(isTe ? `✅ ${mobiles.length} మొబైల్ నంబర్లు క్లిప్‌బోర్డ్‌కు కాపీ చేయబడ్డాయి!` : `✅ ${mobiles.length} mobile numbers copied!`);
    }).catch(() => {
      alert(text);
    });
  };

  // Launch Bulk WhatsApp Broadcast
  const handleLaunchBroadcast = () => {
    const selectedCusts = customers.filter(c => {
      const k = c.chassisKey || c.chassisNo || c.ownerMob || c.id || '';
      return selectedCustomerKeys.includes(k);
    });

    if (selectedCusts.length === 0) {
      alert(isTe ? 'దయచేసి కనీసం ఒక కస్టమర్‌ను ఎంచుకోండి.' : 'Please select at least one customer.');
      return;
    }

    onStartBroadcast({
      villageName,
      mandalName,
      branchName,
      customers: selectedCusts,
      messageTemplate: customMessage
    });
  };

  // Export Village Customer Excel
  const handleExportCsv = () => {
    const headers = [
      'Sl No',
      'Customer Name',
      'Father Name',
      'Owner Mobile',
      'Village',
      'Mandal',
      'Branch',
      'Tractor Model',
      'Chassis No',
      'Delivery Date',
      'HFN'
    ];

    const rows = customers.map((c, i) => [
      i + 1,
      `"${(c.custName || c.cust_name || '').replace(/"/g, '""')}"`,
      `"${(c.fatherName || c.father_name || '').replace(/"/g, '""')}"`,
      `"${c.ownerMob || c.owner_mob || c.mobileNumber || ''}"`,
      `"${villageName}"`,
      `"${mandalName}"`,
      `"${branchName}"`,
      `"${c.tractorModel || c.tractor_model || c.model || 'Eicher Tractor'}"`,
      `"${c.chassisNo || c.chassis_no || ''}"`,
      `"${formatDisplayDate(c.dateOfDelivery || c.date_of_delivery || c["Date of del"] || c["Date of Delivery"] || c["DEL DATE"] || c["DELIVERY DATE"] || c.dateOfDel || c.deliveryDate || c.installDate || '', '')}"`,
      `"${c.historyFileNo || c.history_file_no || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Eicher_${villageName}_${mandalName}_Customers.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isTe ? '📥 ఎక్సెల్ ఫైల్ డౌన్‌లోడ్ అయింది!' : '📥 CSV downloaded!');
  };

  const directionsUrl = getGoogleMapsDirectionsUrl(branchName, villageName, mandalName);
  const isAllSelected = selectedCustomerKeys.length > 0 && selectedCustomerKeys.length === customers.length;

  return (
    <div className="bg-slate-50 border-y-2 border-blue-900 p-3 sm:p-4 space-y-3.5 animate-in fade-in duration-200">
      {/* 1. VILLAGE SUMMARY & CONTEXT BAR */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 bg-blue-900 text-white rounded-lg">
            <Users className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900">
                {villageName} {villageTelugu ? `(${villageTelugu})` : ''}
              </span>
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded font-mono text-[10px] font-bold">
                {mandalName} Mandal
              </span>
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-mono text-[10px] font-bold">
                {hubCode} Hub • {branchName}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
              <span>📍 {distanceKm} km from {branchName} ({approxTravelTime || '20 min'})</span>
              <span>•</span>
              <span className="font-bold text-blue-950 font-mono">🚜 {customers.length} {isTe ? 'ట్రాక్టర్లు' : 'Tractors Registered'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Google Maps */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition flex items-center gap-1"
            title="Directions"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isTe ? 'మ్యాప్స్ రూట్' : 'Directions'}</span>
          </a>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition flex items-center gap-1 cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">{isTe ? 'ఎక్సెల్' : 'CSV'}</span>
          </button>

          {/* Plan Camp Button */}
          <button
            type="button"
            onClick={() =>
              onPlanCamp({
                dealershipCode: String(hubCode),
                branch: branchName,
                mandal: mandalName,
                village: villageName
              })
            }
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isTe ? 'ఈ గ్రామంలో క్యాంప్ ప్లాన్ చేయండి' : 'Plan Camp Here'}</span>
          </button>

          {/* Close Section */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
              title="Collapse"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. CAMP MESSAGE COMPOSER & BROADCAST BAR (క్యాంప్ సందేశం & కమ్యూనికేషన్) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-green-100 text-green-800 rounded">
              <MessageSquare className="w-3.5 h-3.5 text-green-700" />
            </span>
            <span className="font-black text-xs text-slate-800 uppercase tracking-wide">
              {isTe ? 'క్యాంప్ సందేశం & సులభ కమ్యూనికేషన్' : 'Camp Message & WhatsApp Broadcaster'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            <span className="text-slate-500 font-medium mr-1">{isTe ? 'టెంప్లేట్లు:' : 'Templates:'}</span>
            {templates.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTemplate(t)}
                className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer text-[10px] ${
                  selectedTemplateId === t.id
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editable Textarea */}
        <div className="relative">
          <textarea
            rows={3}
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            placeholder={
              isTe
                ? 'ఇక్కడ కస్టమర్లకి పంపవలసిన సందేశాన్ని టైప్ చేయండి... ({CustomerName}, {Village}, {TractorModel} ట్యాగ్‌లు ఆటోమేటిక్‌గా రీప్లేస్ అవుతాయి)'
                : 'Type message here... ({CustomerName}, {Village}, {TractorModel} tags will be auto-replaced)'
            }
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-transparent transition leading-relaxed"
          />
        </div>

        {/* Dynamic Tags and Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs pt-1">
          {/* Dynamic Tags Helper */}
          <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-700">{isTe ? 'ఆటో ట్యాగ్‌లు:' : 'Tags:'}</span>
            <span className="bg-slate-100 px-1.5 py-0.2 rounded font-mono text-slate-600 font-semibold">{'{CustomerName}'}</span>
            <span className="bg-slate-100 px-1.5 py-0.2 rounded font-mono text-slate-600 font-semibold">{'{Village}'}</span>
            <span className="bg-slate-100 px-1.5 py-0.2 rounded font-mono text-slate-600 font-semibold">{'{TractorModel}'}</span>
            <span className="bg-slate-100 px-1.5 py-0.2 rounded font-mono text-slate-600 font-semibold">{'{ChassisNo}'}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Mobiles */}
            <button
              type="button"
              onClick={handleCopySelectedMobiles}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition border border-slate-300 flex items-center gap-1 cursor-pointer text-xs"
              title="Copy selected phone numbers"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600" />
              <span>{isTe ? 'నంబర్లు కాపీ' : 'Copy Mobiles'} ({selectedCustomerKeys.length})</span>
            </button>

            {/* Launch Guided Broadcast */}
            <button
              type="button"
              onClick={handleLaunchBroadcast}
              disabled={selectedCustomerKeys.length === 0}
              className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1.5 text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isTe ? 'ఎంచుకున్నవారికి వాట్సాప్ పంపండి' : 'Send WhatsApp to Selected'} ({selectedCustomerKeys.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CUSTOMER DATA LIST (TREE SUB-LEVEL) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-2">
        {/* Table Controls Bar: Select All + Search */}
        <div className="p-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 font-bold text-slate-800 hover:text-blue-900 transition cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-900" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>{isTe ? 'అందరినీ ఎంచుకోండి' : 'Select All'} ({customers.length})</span>
            </button>

            <span className="text-slate-400">|</span>

            <span className="text-[11px] text-slate-600 font-semibold">
              {isTe ? 'ఎంపికైనవి:' : 'Selected:'}{' '}
              <span className="font-mono font-bold text-blue-900">{selectedCustomerKeys.length}</span> / {customers.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder={isTe ? 'ఈ గ్రామంలో రైతు పేరు / మోడల్ వెతకండి...' : 'Filter within village...'}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-900"
            />
          </div>
        </div>

        {/* Customer Table */}
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-bold text-xs space-y-1">
            <p>{isTe ? 'ఈ గ్రామంలో ఎటువంటి కస్టమర్ రికార్డులు కనుగొనబడలేదు.' : 'No customer records found in this village.'}</p>
            <p className="text-[11px] text-slate-400 font-normal">
              {isTe ? 'మాస్టర్ డేటాబేస్ నుండి కస్టమర్ ఎక్సెల్ ఫైల్ అప్‌లోడ్ చేయండి.' : 'Upload customer data under Master Databases to auto-link.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <th className="p-2.5 text-center w-8">#</th>
                  <th className="p-2.5 w-10 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="p-2.5">{isTe ? 'కస్టమర్ & తండ్రి పేరు' : 'Customer & Father Name'}</th>
                  <th className="p-2.5 text-center">{isTe ? 'కాలింగ్ & కాల్' : 'Direct Call'}</th>
                  <th className="p-2.5 text-center">{isTe ? 'వాట్సాప్ సందేశం' : 'WhatsApp'}</th>
                  <th className="p-2.5">{isTe ? 'మోడల్ & ఛాసిస్' : 'Model & Chassis'}</th>
                  <th className="p-2.5">{isTe ? 'డెలివరీ తేదీ (DOD)' : 'Delivery Date'}</th>
                  <th className="p-2.5 text-center">{isTe ? 'స్థితి' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredCustomers.map((cust, idx) => {
                  const custKey = `${cust.chassisKey || ''}_${cust.chassisNo || ''}_${cust.ownerMob || cust.mobileNumber || ''}_${cust.id || ''}_${idx}`;

                  const rawMob = cust.ownerMob || cust.owner_mob || cust.mobileNumber || cust.mobile_number || cust.phone || cust.phNo || cust.Phone || cust.custPhone || cust.__custPhoneDisplay || '';
                  const cleanMob = String(rawMob).replace(/[^0-9]/g, '');
                  const formattedMob = cleanMob.length === 10 ? cleanMob : rawMob;
                  const isSelected = selectedCustomerKeys.includes(custKey);
                  const isSent = contactedCustomers[custKey] || false;

                  const persMsg = getPersonalizedMessage(cust);
                  const waCountryMob = cleanMob.length === 10 ? `91${cleanMob}` : cleanMob;
                  const waUrl = `https://wa.me/${waCountryMob}?text=${encodeURIComponent(persMsg)}`;

                  const custDelTs = getCustomerDeliveryTimestamp(cust);
                  const isOutOfWty = custDelTs > 0 && isDeliveryOutOfWarranty(custDelTs, 2);

                  return (
                    <tr
                      key={custKey}
                      className={`transition ${
                        isSelected
                          ? 'bg-blue-50/40'
                          : isOutOfWty
                          ? 'bg-red-50/20 hover:bg-red-50/45'
                          : 'hover:bg-blue-50/40'
                      }`}
                    >
                      {/* S.No */}
                      <td className={`p-2.5 text-center font-mono text-[11px] font-bold ${isOutOfWty ? 'text-red-600' : 'text-slate-400'}`}>
                        {idx + 1}
                      </td>

                      {/* Checkbox */}
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCustomer(custKey)}
                          className="w-4 h-4 rounded text-blue-900 focus:ring-blue-900 border-slate-300 cursor-pointer"
                        />
                      </td>

                      {/* Customer Name & S/o */}
                      <td className="p-2.5">
                        <div className={`font-bold ${isOutOfWty ? 'text-red-700' : 'text-slate-900'}`}>
                          {cust.custName || cust.customerName || cust.cust_name || cust.customer_name || cust.Name || cust.name || cust.__custNameDisplay || 'N/A'}
                        </div>
                        {(cust.fatherName || cust.father_name || cust.FatherName) && (
                          <div className={`text-[11px] font-medium ${isOutOfWty ? 'text-red-600/70' : 'text-slate-500'}`}>
                            S/o {cust.fatherName || cust.father_name || cust.FatherName}
                          </div>
                        )}
                        {(cust._isAiMatched || (cust.village && cust.village.trim().toLowerCase() !== villageName.trim().toLowerCase())) && (
                          <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-semibold" title={`Original Excel Entry: "${cust.village || cust.custAddr || ''}"`}>
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            <span>{isTe ? `AI గుర్తించింది: "${cust.village || cust.custAddr || ''}"` : `AI Matched: "${cust.village || cust.custAddr || ''}"`}</span>
                          </div>
                        )}
                        {(cust.historyFileNo || cust.history_file_no) && (
                          <span className="inline-block mt-0.5 ml-1 px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[9px] font-mono">
                            HFN: {cust.historyFileNo || cust.history_file_no}
                          </span>
                        )}
                      </td>

                      {/* Direct Call Button */}
                      <td className="p-2.5 text-center">
                        {cleanMob ? (
                          <a
                            href={`tel:${cleanMob}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300 rounded-md font-bold font-mono text-xs transition shadow-2xs cursor-pointer"
                            title={isTe ? 'కాల్ చేయడానికి నొక్కండి' : 'Click to dial'}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{formattedMob}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No Mobile</span>
                        )}
                      </td>

                      {/* Direct WhatsApp Button */}
                      <td className="p-2.5 text-center">
                        {cleanMob ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onMarkContacted(custKey)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md font-bold text-xs transition shadow-2xs cursor-pointer"
                            title={isTe ? 'వాట్సాప్‌లో సందేశం పంపండి' : 'Send WhatsApp Invite'}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{isTe ? 'వాట్సాప్' : 'WhatsApp'}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Model & Chassis */}
                      <td className="p-2.5">
                        <div className={`font-bold ${isOutOfWty ? 'text-red-800' : 'text-blue-900'}`}>
                          {cust.tractorModel || cust.tractor_model || cust.model || cust.Tractor || 'Eicher Tractor'}
                        </div>
                        <div className={`font-mono text-[11px] font-semibold ${isOutOfWty ? 'text-red-700/80' : 'text-slate-600'}`}>
                          {cust.chassisNo || cust.chassis_no || cust.Chassis || ''}
                        </div>
                      </td>

                      {/* Delivery Date (DOD) */}
                      <td className="p-2.5 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={isOutOfWty ? "font-bold text-red-600" : "font-medium text-slate-700"}>
                            {formatDisplayDate(
                              cust.dateOfDelivery ||
                                cust.date_of_delivery ||
                                cust["Date of del"] ||
                                cust["Date of Delivery"] ||
                                cust["DEL DATE"] ||
                                cust["DELIVERY DATE"] ||
                                cust["Delivery Date"] ||
                                cust.dateOfDel ||
                                cust.deliveryDate ||
                                cust.installDate,
                              '—'
                            )}
                          </span>
                          {custDelTs > 0 && (
                            isOutOfWty ? (
                              <span
                                className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.2 rounded border border-red-300 uppercase shrink-0 whitespace-nowrap"
                                title={isTe ? "డెలివరీ అయి 2 సంవత్సరాలు దాటింది (Out of Warranty)" : "> 2 Years from Delivery (Out of Warranty)"}
                              >
                                {isTe ? "అవుట్ ఆఫ్ వారంటీ" : "OOW"}
                              </span>
                            ) : (
                              <span
                                className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.2 rounded border border-slate-200 uppercase shrink-0 whitespace-nowrap"
                                title={isTe ? "వారంటీ లో ఉంది (≤ 2 సంవత్సరాలు)" : "≤ 2 Years from Delivery (In Warranty)"}
                              >
                                {isTe ? "ఇన్ వారంటీ" : "In Wty"}
                              </span>
                            )
                          )}
                        </div>
                      </td>

                      {/* Contact Status */}
                      <td className="p-2.5 text-center">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" />
                            <span>{isTe ? 'పంపబడింది ✅' : 'Sent'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{isTe ? 'పెండింగ్ ⏳' : 'Pending'}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
