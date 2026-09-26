import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const UpdateNotifier: React.FC = () => {
  const [initialVersion, setInitialVersion] = useState<string | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (!response.ok) return;

        const data = await response.json();
        const serverVersion = data?.version;

        if (!serverVersion || !isMounted) return;

        setInitialVersion(prev => {
          if (!prev) {
            return serverVersion;
          }
          if (prev !== serverVersion) {
            setHasNewVersion(true);
          }
          return prev;
        });
      } catch (err) {
        // Silent error handling for network hiccups
      }
    };

    checkVersion();

    const intervalId = setInterval(checkVersion, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  if (!hasNewVersion || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-96 z-[9999] bg-slate-900/95 text-white p-5 rounded-2xl border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md flex flex-col gap-3 font-sans"
        dir="rtl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">
                עדכון פנטזי לוזון זמין!
              </h4>
              <p className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5">
                גרסה חדשה של המשחק והמערכת שוחררה. רענן לשמירה על סנכרון התוצאות והניקוד.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="סגור"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleReload}
            className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            רענן עכשיו
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            מאוחר יותר
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateNotifier;
