import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export const VersionUpdateBanner: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('גרסה חדשה של פנטזי לוזון שוחררה! רענן לשמירה על סנכרון התוצאות והניקוד המעודכן.');

  // 1. Firestore global_refresh listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'global_refresh'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const serverTimestamp = data?.timestamp || 0;
        const localTimestamp = Number(localStorage.getItem('luzon_last_handled_version') || 0);

        if (localTimestamp === 0) {
          localStorage.setItem('luzon_last_handled_version', String(serverTimestamp));
        } else if (serverTimestamp > localTimestamp) {
          if (data?.message) {
            setUpdateMessage(data.message);
          }
          setUpdateAvailable(true);
        }
      }
    });

    return () => unsub();
  }, []);

  // 2. Build deployment version.json polling check with mobile Android hardening
  useEffect(() => {
    let isMounted = true;
    let initialBuildVersion: string | null = null;
    let lastCheckTimestamp = 0;

    const checkVersionJson = async () => {
      const now = Date.now();
      if (now - lastCheckTimestamp < 5000) return;
      lastCheckTimestamp = now;

      try {
        const uniqueCacheBuster = `${now}_${Math.random().toString(36).substring(2, 7)}`;
        const response = await fetch(`/version.json?t=${uniqueCacheBuster}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
        if (!response.ok) return;

        const data = await response.json();
        const serverVersion = data?.version;

        if (!serverVersion || !isMounted) return;

        if (!initialBuildVersion) {
          initialBuildVersion = serverVersion;
        } else if (initialBuildVersion !== serverVersion) {
          setUpdateAvailable(true);
        }
      } catch (err) {
        // Silent catch for network hiccups
      }
    };

    checkVersionJson();
    const intervalId = setInterval(checkVersionJson, 20000);

    const triggerEvents = ['visibilitychange', 'focus', 'pageshow', 'touchstart', 'online'];
    const handleEventTrigger = () => {
      if (document.visibilityState === 'visible') {
        checkVersionJson();
      }
    };

    triggerEvents.forEach(evt => {
      window.addEventListener(evt, handleEventTrigger, { passive: true });
    });

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      triggerEvents.forEach(evt => {
        window.removeEventListener(evt, handleEventTrigger);
      });
    };
  }, []);

  const handleRefresh = () => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'global_refresh'), (docSnap) => {
      const serverTimestamp = docSnap.data()?.timestamp || Date.now();
      localStorage.setItem('luzon_last_handled_version', String(serverTimestamp));
    });
    unsub();

    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).catch(console.error);
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-3 left-3 right-3 md:left-auto md:right-6 md:max-w-md z-[9999] animate-in slide-in-from-top duration-500 font-sans" dir="rtl">
      <div className="bg-gradient-to-r from-blue-900/95 via-indigo-900/95 to-slate-900/95 backdrop-blur-2xl border border-blue-400/40 text-white p-4 rounded-2xl shadow-[0_10px_30px_rgba(59,130,246,0.35)] flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30 text-yellow-400 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="font-black text-sm text-yellow-400 italic flex items-center gap-1.5">
              <span>עדכון מערכת זמין!</span>
            </div>
            <p className="text-xs font-bold text-slate-200 mt-1 leading-relaxed">
              {updateMessage}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>רענן</span>
          </button>
          <button
            onClick={handleDismiss}
            className="text-[11px] text-slate-400 hover:text-white font-bold flex items-center justify-center gap-0.5 cursor-pointer"
            title="סגור התראה"
          >
            <X className="w-3 h-3" />
            <span>מאוחר יותר</span>
          </button>
        </div>
      </div>
    </div>
  );
};
