import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Copy,
  ExternalLink,
  Sparkles,
  Users,
  Check
} from 'lucide-react';

export interface BroadcastCustomer {
  id?: string;
  custName?: string;
  cust_name?: string;
  customerName?: string;
  fatherName?: string;
  father_name?: string;
  ownerMob?: string;
  owner_mob?: string;
  mobileNumber?: string;
  phone?: string;
  tractorModel?: string;
  tractor_model?: string;
  model?: string;
  chassisNo?: string;
  chassis_no?: string;
  chassisKey?: string;
  dateOfDelivery?: string;
  date_of_delivery?: string;
  historyFileNo?: string;
  history_file_no?: string;
}

interface BroadcastQueueModalProps {
  villageName: string;
  mandalName: string;
  branchName: string;
  customers: BroadcastCustomer[];
  messageTemplate: string;
  isTe: boolean;
  onClose: () => void;
  contactedMap: Record<string, boolean>;
  onMarkContacted: (customerKey: string) => void;
  showToast: (msg: string) => void;
}

export const BroadcastQueueModal: React.FC<BroadcastQueueModalProps> = ({
  villageName,
  mandalName,
  branchName,
  customers,
  messageTemplate,
  isTe,
  onClose,
  contactedMap,
  onMarkContacted,
  showToast
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!customers || customers.length === 0) {
    return null;
  }

  const currentCust = customers[currentIndex] || customers[0];
  const custKey =
    currentCust.chassisKey ||
    currentCust.chassisNo ||
    currentCust.ownerMob ||
    currentCust.id ||
    `cust_${currentIndex}`;

  const cleanMob = String(
    currentCust.ownerMob ||
    currentCust.owner_mob ||
    currentCust.mobileNumber ||
    currentCust.phone ||
    ''
  ).replace(/[^0-9]/g, '');

  const custName = currentCust.custName || currentCust.cust_name || (isTe ? 'రైతు సోదరులారా' : 'Farmer');
  const fatherName = currentCust.fatherName || currentCust.father_name || '';
  const tractorModel = currentCust.tractorModel || currentCust.tractor_model || currentCust.model || (isTe ? 'ఈచర్ ట్రాక్టర్' : 'Eicher Tractor');
  const chassisNo = currentCust.chassisNo || currentCust.chassis_no || '';

  // Format message dynamically
  const personalizedMessage = messageTemplate
    .replace(/\{CustomerName\}|\{పేరు\}/g, custName)
    .replace(/\{Village\}|\{గ్రామం\}/g, villageName)
    .replace(/\{Mandal\}|\{మండలం\}/g, mandalName)
    .replace(/\{Branch\}|\{బ్రాంచ్\}/g, branchName)
    .replace(/\{TractorModel\}|\{మోడల్\}|\{ట్రాక్టర్\}/g, tractorModel)
    .replace(/\{ChassisNo\}|\{ఛాసిస్\}/g, chassisNo);

  const waCountryMob = cleanMob.length === 10 ? `91${cleanMob}` : cleanMob;
  const whatsappUrl = `https://wa.me/${waCountryMob}?text=${encodeURIComponent(personalizedMessage)}`;

  const isContacted = contactedMap[custKey] || false;
  const totalSentCount = customers.filter(c => {
    const k = c.chassisKey || c.chassisNo || c.ownerMob || c.id || '';
    return contactedMap[k];
  }).length;

  const handleSendAndNext = () => {
    if (!cleanMob) {
      alert(isTe ? 'ఈ కస్టమర్‌కి మొబైల్ నంబర్ అందుబాటులో లేదు.' : 'No mobile number found for this customer.');
      return;
    }
    // Mark contacted
    onMarkContacted(custKey);
    // Open WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    // Advance to next if available
    if (currentIndex < customers.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      showToast(isTe ? '🎉 అందరు కస్టమర్లకి మెసేజ్ పూర్తయింది!' : '🎉 All selected customers processed!');
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(personalizedMessage).then(() => {
      showToast(isTe ? '✅ సందేశం కాపీ చేయబడింది!' : '✅ Message copied to clipboard!');
    });
  };

  const progressPct = Math.round(((currentIndex + 1) / customers.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-emerald-900 via-blue-950 to-slate-900 text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-black bg-emerald-400 text-emerald-950 rounded-full uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isTe ? 'వాట్సాప్ బ్రాడ్‌కాస్ట్ అసిస్టెంట్' : 'WhatsApp Broadcast Assistant'}
              </span>
              <span className="text-xs text-blue-200 font-semibold">
                📍 {villageName} ({mandalName})
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-black mt-1">
              {isTe ? 'కస్టమర్లకు వరుసగా సందేశం పంపండి' : 'Sequential WhatsApp Broadcaster'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {isTe
                ? 'ఒక్కొక్క కస్టమర్‌కి వారి పేరు & ట్రాక్టర్ వివరాలతో వ్యక్తిగతీకరించిన మెసేజ్ 1-క్లిక్‌తో వాట్సాప్‌లో ఓపెన్ అవుతుంది.'
                : '1-Click send personalized camp invite with customer tractor details.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Ribbon */}
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              {isTe ? 'కస్టమర్' : 'Customer'} {currentIndex + 1} of {customers.length}
            </span>
            <span className="text-slate-400 font-mono">({progressPct}%)</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
              <CheckCircle className="w-3.5 h-3.5" />
              {isTe ? 'పంపినవి:' : 'Sent:'} {totalSentCount} / {customers.length}
            </span>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-slate-200 h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Current Farmer Profile Card */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-900">{custName}</span>
                  {fatherName && (
                    <span className="text-xs text-slate-600 font-medium">
                      S/o {fatherName}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-1">
                  <span className="font-bold text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded font-mono">
                    🚜 {tractorModel}
                  </span>
                  {chassisNo && (
                    <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                      CH: {chassisNo}
                    </span>
                  )}
                  {currentCust.historyFileNo && (
                    <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                      HFN: {currentCust.historyFileNo}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge & Call Button */}
              <div className="flex items-center gap-2">
                {isContacted ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-full text-xs flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {isTe ? 'పంపబడింది ✅' : 'Sent ✅'}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-full text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {isTe ? 'పెండింగ్ ⏳' : 'Pending'}
                  </span>
                )}

                {cleanMob && (
                  <a
                    href={`tel:${cleanMob}`}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition border border-slate-300"
                    title={isTe ? 'కస్టమర్‌కి కాల్ చేయండి' : 'Direct Phone Call'}
                  >
                    <Phone className="w-4 h-4 text-emerald-700" />
                  </a>
                )}
              </div>
            </div>

            {/* Mobile Number display */}
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800">
              <span className="text-slate-500">📱 Mobile:</span>
              <span>{cleanMob || 'N/A'}</span>
            </div>
          </div>

          {/* Formatted Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-green-600" />
                {isTe ? 'వాట్సాప్ మెసేజ్ ప్రివ్యూ (Message Preview)' : 'WhatsApp Message Preview'}
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {isTe ? 'కాపీ చేయండి' : 'Copy'}
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-slate-900 text-xs font-medium leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {personalizedMessage}
            </div>
          </div>

          {/* Quick Queue Navigation Chips */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isTe ? 'కస్టమర్ల జాబితా (Queue)' : 'Selected Customers Queue'}:
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {customers.map((c, idx) => {
                const k = c.chassisKey || c.chassisNo || c.ownerMob || c.id || `idx_${idx}`;
                const done = contactedMap[k];
                const active = idx === currentIndex;
                const nameShort = (c.custName || c.cust_name || `Farmer ${idx + 1}`).split(' ')[0];

                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                      active
                        ? 'bg-blue-900 text-white shadow-xs'
                        : done
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{idx + 1}.</span>
                    <span>{nameShort}</span>
                    {done && <Check className="w-3 h-3 text-emerald-700" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isTe ? 'మునుపటి' : 'Previous'}</span>
            </button>

            <button
              type="button"
              disabled={currentIndex >= customers.length - 1}
              onClick={() => setCurrentIndex(prev => Math.min(customers.length - 1, prev + 1))}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1"
            >
              <span>{isTe ? 'తర్వాత / స్కిప్' : 'Skip / Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs transition"
            >
              {isTe ? 'పూర్తయింది / మూసివేయి' : 'Finish & Close'}
            </button>

            {/* Primary Action Button: 1-Click Send & Step */}
            <button
              type="button"
              onClick={handleSendAndNext}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-black rounded-lg shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2 text-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>
                {isTe ? '1-క్లిక్ వాట్సాప్ పంపి తదుపరి వెళ్ళండి' : 'Send WhatsApp & Next'} ➔
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
