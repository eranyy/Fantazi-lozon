import React, { useState, useEffect } from 'react';
import { Download, X, Share, Smartphone, PlusSquare, MoreVertical, CheckCircle2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface InstallPwaBannerProps {
  userId?: string;
}

export const InstallPwaBanner: React.FC<InstallPwaBannerProps> = ({ userId }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if app is running in standalone mode (installed on home screen)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const androidDevice = /android/.test(userAgent);
    const mobileDevice = iosDevice || androidDevice || window.innerWidth <= 768;

    setIsIos(iosDevice);
    setIsMobile(mobileDevice);

    // Record status in Firestore so Admin can see who saved the app and who hasn't
    if (userId && userId !== 'system') {
      const lastRecorded = sessionStorage.getItem(`pwa_recorded_${userId}`);
      const currentStatus = isStandalone ? 'installed' : 'browser';
      if (lastRecorded !== currentStatus) {
        sessionStorage.setItem(`pwa_recorded_${userId}`, currentStatus);
        setDoc(
          doc(db, 'users', userId),
          {
            isPwaInstalled: isStandalone,
            lastAccessMode: isStandalone ? 'אפליקציה שמורה 📱' : 'דפדפן רגיל 🌐',
            lastSeenDevice: iosDevice ? 'iPhone' : androidDevice ? 'Android' : 'Desktop',
          },
          { merge: true }
        ).catch((err) => console.error('Error recording PWA status:', err));
      }
    }

    if (isStandalone) return;

    // 2. Check if user dismissed recently (12 hours cooldown for modal, 3 days for banner)
    const dismissedTime = localStorage.getItem('luzon_pwa_dismissed');
    const modalDismissedSession = sessionStorage.getItem('luzon_pwa_modal_dismissed');

    if (mobileDevice) {
      if (!dismissedTime || Date.now() - Number(dismissedTime) > 3 * 24 * 60 * 60 * 1000) {
        setShowBanner(true);
      }
      if (!modalDismissedSession && (!dismissedTime || Date.now() - Number(dismissedTime) > 12 * 60 * 60 * 1000)) {
        // Show popup alert after 1.5s so user notices it clearly
        const timer = setTimeout(() => setShowModal(true), 1500);
        return () => clearTimeout(timer);
      }
    }

    // 3. Catch Android/Chrome native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
      if (!sessionStorage.getItem('luzon_pwa_modal_dismissed')) {
        setShowModal(true);
      }
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      setShowModal(false);
      if (userId && userId !== 'system') {
        setDoc(
          doc(db, 'users', userId),
          { isPwaInstalled: true, lastAccessMode: 'אפליקציה שמורה 📱' },
          { merge: true }
        ).catch(() => {});
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [userId]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        setShowModal(false);
      }
      setDeferredPrompt(null);
      return;
    }
    // If no native prompt (e.g. iOS Safari or Android browser where prompt already fired), open visual guide modal
    setShowModal(true);
  };

  const handleCloseModal = () => {
    sessionStorage.setItem('luzon_pwa_modal_dismissed', 'true');
    localStorage.setItem('luzon_pwa_dismissed', Date.now().toString());
    setShowModal(false);
  };

  const handleDismissBanner = () => {
    localStorage.setItem('luzon_pwa_dismissed', Date.now().toString());
    setShowBanner(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* Top Sticky Banner */}
      {showBanner && (
        <div className="bg-gradient-to-r from-zinc-900 via-amber-950/60 to-zinc-900 border-b border-amber-500/40 px-4 py-2.5 text-white text-xs font-medium flex items-center justify-between shadow-lg relative z-[105] animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              <img src="/app-icon.png?v=3" alt="App Icon" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-black text-amber-400 text-sm leading-tight">שמור את האפליקציה לנייד 📲</h4>
              <p className="text-zinc-300 text-[11px]">כניסה מהירה ב-0 שניות ומסך מלא ללא דפדפן</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 text-xs transition-transform active:scale-95 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>שמור לנייד</span>
            </button>

            <button
              onClick={handleDismissBanner}
              className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
              title="סגור"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Center Popup Alert Modal for Uninstalled Mobile Users */}
      {showModal && isMobile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300" dir="rtl">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-sm w-full p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={handleCloseModal}
              className="absolute top-4 left-4 text-slate-400 hover:text-white bg-slate-800/80 p-1.5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 p-1 shadow-xl mb-3 relative">
                <img src="/app-icon.png?v=3" alt="Luzon 14" className="w-full h-full object-cover rounded-xl" />
                <span className="absolute -bottom-1 -right-1 bg-green-500 text-black rounded-full p-1 shadow">
                  <Smartphone className="w-3.5 h-3.5" />
                </span>
              </div>

              <h3 className="text-xl font-black text-white mb-1">
                שמור את פנטזי לוזון בנייד! ⚽
              </h3>
              <p className="text-xs font-bold text-slate-300 mb-4 leading-relaxed">
                זיהינו שאתה גולש מהדפדפן. שמירת האפליקציה למסך הבית תיתן לך <span className="text-amber-400">טעינה מיידית ברשת סלולרית</span>, מסך מלא והתראות פוש בזמן אמת!
              </p>

              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mb-3"
                >
                  <Download className="w-5 h-5" />
                  התקן את האפליקציה עכשיו
                </button>
              ) : isIos ? (
                <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-right space-y-3 mb-4">
                  <div className="text-xs font-black text-amber-400 text-center mb-1">
                    איך שומרים באייפון ב-2 שניות:
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0">1</span>
                    <span>לחץ על כפתור השיתוף <Share className="w-4 h-4 inline text-blue-400 mx-1" /> בתחתית הדפדפן</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0">2</span>
                    <span>גלול ובחר <strong className="text-amber-400">"הוסף למסך הבית"</strong> <PlusSquare className="w-4 h-4 inline text-amber-400 mx-0.5" /></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0">3</span>
                    <span>לחץ על <strong className="text-green-400">"הוסף" (Add)</strong> בפינה העליונה</span>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-right space-y-3 mb-4">
                  <div className="text-xs font-black text-amber-400 text-center mb-1">
                    איך שומרים באנדרואיד ב-2 שניות:
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0">1</span>
                    <span>לחץ על תפריט 3 הנקודות <MoreVertical className="w-4 h-4 inline text-amber-400 mx-0.5" /> בפינה העליונה</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0">2</span>
                    <span>בחר <strong className="text-amber-400">"התקנת האפליקציה"</strong> או <strong className="text-amber-400">"הוספה למסך הבית"</strong></span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCloseModal}
                className="text-xs font-bold text-slate-400 hover:text-white py-1.5 px-4 rounded-xl transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                הבנתי, הזכר לי מאוחר יותר
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
