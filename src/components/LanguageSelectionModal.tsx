import React from "react";
import { Languages, Globe, CheckCircle2, ArrowRight } from "lucide-react";

interface LanguageSelectionModalProps {
  currentLanguage: "te" | "en";
  onSelectLanguage: (lang: "te" | "en") => void;
  onClose?: () => void;
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  currentLanguage,
  onSelectLanguage,
  onClose,
}) => {
  return (
    <div
      id="language-selection-modal-overlay"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="language-selection-modal-card"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white text-center relative">
          <div className="mx-auto w-14 h-14 bg-amber-400/20 border border-amber-400/40 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <Languages className="w-8 h-8 text-amber-400" />
          </div>
          <span className="inline-block text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-3 py-0.5 rounded-full mb-2">
            SRI SATYA SAI SRINIVASA EICHER MOTORS
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            భాషను ఎంచుకోండి / Select Language
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            దయచేసి మీరు ఉపయోగించాలనుకుంటున్న భాషను ఎంచుకోండి
          </p>
        </div>

        {/* Options Container */}
        <div className="p-5 sm:p-6 space-y-4 bg-slate-50/50">
          {/* Telugu Option */}
          <button
            id="select-language-telugu-btn"
            type="button"
            onClick={() => onSelectLanguage("te")}
            className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-150 cursor-pointer flex items-center justify-between group ${
              currentLanguage === "te"
                ? "border-blue-700 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20"
                : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 transition-colors ${
                  currentLanguage === "te"
                    ? "bg-blue-900 text-white shadow-xs"
                    : "bg-blue-100 text-blue-900 group-hover:bg-blue-900 group-hover:text-white"
                }`}
              >
                తె
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900">తెలుగు</span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    సిఫార్సు చేయబడింది (Recommended)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  జాబ్ కార్డులు, ఎక్సెల్ డేటా, కస్టమర్ రికార్డులు మరియు నివేదికలు అన్నీ తెలుగులో
                </p>
              </div>
            </div>
            <div className="shrink-0 pl-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  currentLanguage === "te"
                    ? "bg-blue-900 text-white"
                    : "bg-slate-100 text-slate-400 group-hover:bg-blue-900 group-hover:text-white"
                }`}
              >
                {currentLanguage === "te" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </div>
            </div>
          </button>

          {/* English Option */}
          <button
            id="select-language-english-btn"
            type="button"
            onClick={() => onSelectLanguage("en")}
            className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-150 cursor-pointer flex items-center justify-between group ${
              currentLanguage === "en"
                ? "border-blue-700 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20"
                : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 transition-colors ${
                  currentLanguage === "en"
                    ? "bg-blue-900 text-white shadow-xs"
                    : "bg-slate-200 text-slate-800 group-hover:bg-blue-900 group-hover:text-white"
                }`}
              >
                EN
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900">English</span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    Default
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Job cards, Excel tables, customer data, and system analytics in English
                </p>
              </div>
            </div>
            <div className="shrink-0 pl-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  currentLanguage === "en"
                    ? "bg-blue-900 text-white"
                    : "bg-slate-100 text-slate-400 group-hover:bg-blue-900 group-hover:text-white"
                }`}
              >
                {currentLanguage === "en" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500 leading-snug">
            💡 <strong>గమనిక:</strong> సైట్ ఓపెన్ చేసినప్పుడు భాష అడగబడుతుంది. భాష మార్చుకోవాలనుకుంటే సైట్‌ను క్లోజ్ చేసి మళ్ళీ ఓపెన్ చేయవచ్చు లేదా సైడ్‌బార్‌లోని భాషా బటన్ ద్వారా కూడా మార్చుకోవచ్చు.
          </p>
        </div>
      </div>
    </div>
  );
};
