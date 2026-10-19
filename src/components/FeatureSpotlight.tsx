import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronLeft } from 'lucide-react';

interface FeatureSpotlightProps {
  featureId: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  placement?: 'bottom-left' | 'bottom-right' | 'bottom-center';
}

export const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  featureId,
  title,
  description,
  actionLabel,
  onAction,
  children,
  placement = 'bottom-left'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const storageKey = `luzon_seen_feature_${featureId}`;
      const hasSeen = localStorage.getItem(storageKey);
      if (!hasSeen) {
        // Small delay so the app finishes initial render before showing spotlight
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [featureId]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(`luzon_seen_feature_${featureId}`, 'true');
    } catch {}
    setIsVisible(false);
  };

  const handleActionClick = () => {
    handleDismiss();
    if (onAction) {
      onAction();
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Target Wrapped Child with pulse glow if not seen yet */}
      <div 
        onClick={handleDismiss}
        className={`relative inline-flex items-center transition-all ${
          isVisible ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.6)]' : ''
        }`}
      >
        {children}

        {/* Floating "חדש!" Badge */}
        {isVisible && (
          <span className="absolute -top-3 -right-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-[0_4px_10px_rgba(16,185,129,0.5)] border border-white/60 animate-bounce flex items-center gap-0.5 pointer-events-none z-30 tracking-tight">
            <span>✨</span>
            <span>חדש!</span>
          </span>
        )}
      </div>

      {/* Popover Balloon */}
      {isVisible && (
        <>
          {/* Subtle backdrop to capture outside clicks */}
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={handleDismiss}
          />

          {/* Balloon Container */}
          <div 
            className={`absolute top-full mt-3.5 z-50 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-2xl border border-emerald-400/50 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.7),0_0_25px_rgba(16,185,129,0.25)] text-right animate-in fade-in zoom-in-95 duration-200 font-sans ${
              placement === 'bottom-left' 
                ? 'left-0 sm:left-auto sm:right-0' 
                : placement === 'bottom-right'
                ? 'right-0'
                : 'left-1/2 -translate-x-1/2'
            }`}
            dir="rtl"
          >
            {/* Pointer arrow pointing up */}
            <div 
              className={`absolute -top-2 w-3.5 h-3.5 bg-slate-900 border-t border-r border-emerald-400/50 rotate-[-45deg] ${
                placement === 'bottom-left' ? 'left-5 sm:left-auto sm:right-5' : 'right-5'
              }`}
            />

            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm">
                <div className="p-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-spin-slow" />
                </div>
                <span>{title}</span>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                title="סגור (איקס)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs font-bold text-slate-200 leading-relaxed mb-3.5">
              {description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              {actionLabel && (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs py-2 px-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{actionLabel}</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
              
              <button
                type="button"
                onClick={handleDismiss}
                className="px-3 py-2 text-slate-400 hover:text-slate-200 font-black text-xs rounded-xl hover:bg-white/5 transition-all cursor-pointer"
              >
                הבנתי 👍
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FeatureSpotlight;
