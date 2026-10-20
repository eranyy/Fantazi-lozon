import React, { useState, useEffect, useMemo } from 'react';
import { Team, User, UserRole } from './types';
import { MOCK_TEAMS } from './constants';
import { authService } from './authService';
import { db, messaging, VAPID_KEY } from './firebaseConfig';
const AdminLeagueManager = React.lazy(() => import('./AdminLeagueManager'));
const AdminSettings = React.lazy(() => import('./AdminSettings'));
import FixturesTab from './components/FixturesTab';
import LiveArena from './components/LiveArena';
import LineupManager from './components/LineupManager';
import LoginScreen from './components/LoginScreen';
import SocialFeed from './components/SocialFeed'; 
import CupTab from './components/CupTab';
import FreeAgentsTab from './components/FreeAgentsTab';
import { VersionUpdateBanner } from './components/VersionUpdateBanner';
import { InstallPwaBanner } from './components/InstallPwaBanner';
import { HeaderRoundBadge } from './components/RoundCountdown';
import UserSettingsModal from './components/UserSettingsModal';
import { FeatureSpotlight } from './components/FeatureSpotlight';
import { Home, Users, Zap, Trophy, Calendar, Settings, BarChart3, RefreshCcw, Bell, Search, SlidersHorizontal } from 'lucide-react'; 
import { collection, onSnapshot, doc, setDoc, getDocs, addDoc, serverTimestamp, arrayUnion, writeBatch } from 'firebase/firestore'; 
import { getToken, onMessage } from 'firebase/messaging'; 

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(() => authService.getSession());
  const [activeTab, setActiveTab] = useState<'home' | 'live' | 'lineup' | 'table' | 'fixtures' | 'settings' | 'cup' | 'free_agents'>(() => {
    const saved = localStorage.getItem('luzon_default_tab');
    if (saved && ['home', 'live', 'lineup', 'table', 'fixtures', 'cup'].includes(saved)) {
      return saved as any;
    }
    return 'home';
  });
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // 🟢 ערך התחלתי למחזור 1 לקראת עונת לוזון 14 🟢
  const [currentRound, setCurrentRound] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🟢 סטייט לטואסט התראות פוש בלייב 🟢
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'success' | 'error' } | null>(null);

  // 🟢 סטייט ששומר את מצב ההתראות של המשתמש 🟢
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('unsupported');
  const [pushBannerDismissed, setPushBannerDismissed] = useState<boolean>(false);
  const [fontSettings, setFontSettings] = useState<{ globalFontScale: number; userFontScales: Record<string, number> }>({
    globalFontScale: 100,
    userFontScales: {}
  });

  const forceHardRefresh = () => {
    setIsRefreshing(true);
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.pathname + '?v=' + Date.now();
  };

  const isEran = loggedInUser?.email?.toLowerCase() === 'eranyy@gmail.com' || loggedInUser?.role === UserRole.ADMIN || loggedInUser?.role === UserRole.SUPER_ADMIN;
  const displayName = isEran ? 'ערן' : (loggedInUser?.name || '');

  // 🟢 1. מנגנון בדיקת גרסה אוטומטי - מרענן אוטומטית למשתמשים כשיוצא Build חדש 🟢
  const LUZON_BUILD_VERSION = '14.0.20261018_v36';
  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('luzon_app_version');
    if (lastSeenVersion !== LUZON_BUILD_VERSION) {
      localStorage.setItem('luzon_app_version', LUZON_BUILD_VERSION);
      if (lastSeenVersion) {
        if ('caches' in window) {
          caches.keys().then(names => names.forEach(name => caches.delete(name)));
        }
        window.location.reload();
      }
    }
  }, []);

  // 🟢 2. האזנה לרענון כפוי בלייב מהמנהל (ערן) מתוך Firestore 🟢
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'global_refresh'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const lastRefreshTime = data?.timestamp || 0;
        const localHandledTime = Number(localStorage.getItem('luzon_last_global_refresh') || 0);
        if (lastRefreshTime > localHandledTime && localHandledTime > 0) {
          localStorage.setItem('luzon_last_global_refresh', String(lastRefreshTime));
          if ('caches' in window) {
            caches.keys().then(names => names.forEach(name => caches.delete(name)));
          }
          window.location.reload();
        } else if (localHandledTime === 0) {
          localStorage.setItem('luzon_last_global_refresh', String(lastRefreshTime));
        }
      }
    });
    return () => unsub();
  }, []);

  // 🟢 האזנה להתראות פוש כשהאפליקציה פתוחה במסך (Foreground Push Notification) 🟢
  useEffect(() => {
    if (messaging) {
      const unsubOnMessage = onMessage(messaging, (payload) => {
        console.log("Foreground FCM Notification received:", payload);
        const title = payload.notification?.title || payload.data?.title || 'פנטזי לוזון ⚽';
        const body = payload.notification?.body || payload.data?.body || '';
        const customTag = payload.data?.tag;

        // אם מדובר בעדכון שקט של באנר לוח התוצאות בלייב במסך הנעילה - נעדכן רק את הבאנר בוילון ההתראות ללא הקפצת טואסט באתר
        if (customTag === 'luzon-live-scoreboard') {
          if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, {
                body,
                icon: '/app-icon.png',
                badge: '/app-icon.png',
                tag: 'luzon-live-scoreboard',
                dir: 'rtl',
                lang: 'he',
                silent: true,
                ...( { renotify: false } as any )
              }).catch(() => {});
            });
          }
          return;
        }

        // 1. הקפצת באנר התראה של הדפדפן גם כשהאתר פתוח במסך (להתראות רגילות)
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: '/app-icon.png',
              badge: '/app-icon.png'
            });
          } catch (e) {
            console.error("Native notification popup error:", e);
          }
        }

        // 2. הצגת טואסט פנימי באתר
        setToast({ msg: `${title}: ${body}`, type: 'info' });
        setTimeout(() => setToast(null), 7000);
      });

      return () => unsubOnMessage();
    }
  }, []);

  // 🟢 הלוגיקה החכמה של התראות הפוש (מרובת מכשירים) 🟢
  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission as any);

      // אם המשתמש כבר אישר התראות בעבר, ניקח לו את הטוקן באופן שקט מאחורי הקלעים
      if (Notification.permission === 'granted' && loggedInUser && messaging) {
        const fetchSilentToken = async () => {
          try {
            const token = await getToken(messaging!, { vapidKey: VAPID_KEY });
            if (token) {
              await setDoc(doc(db, "users", loggedInUser.id), { 
                fcmToken: token,
                fcmTokens: arrayUnion(token)
              }, { merge: true });

              const targetTeamId = loggedInUser.teamId || (loggedInUser.email?.toLowerCase().includes('eranyy') ? 'hamsili' : null);
              if (targetTeamId && targetTeamId !== loggedInUser.id) {
                await setDoc(doc(db, "users", targetTeamId), { 
                  fcmToken: token,
                  fcmTokens: arrayUnion(token)
                }, { merge: true });
              }
            }
          } catch (e) {
            console.error("Silent token fetch failed", e);
          }
        };
        fetchSilentToken();
      }
    }
  }, [loggedInUser]);

  // 🟢 פונקציה שמופעלת כשהמשתמש לוחץ על כפתור הפעמון 🟢
  const handleRequestPush = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission as any);

      if (permission === 'granted' && messaging) {
        const token = await getToken(messaging!, { vapidKey: VAPID_KEY });
        if (token && loggedInUser) {
          await setDoc(doc(db, "users", loggedInUser.id), { 
            fcmToken: token,
            fcmTokens: arrayUnion(token)
          }, { merge: true });

          const targetTeamId = loggedInUser.teamId || (loggedInUser.email?.toLowerCase().includes('eranyy') ? 'hamsili' : null);
          if (targetTeamId && targetTeamId !== loggedInUser.id) {
            await setDoc(doc(db, "users", targetTeamId), { 
              fcmToken: token,
              fcmTokens: arrayUnion(token)
            }, { merge: true });
          }
          alert('מעולה! ההתראות הופעלו בהצלחה 🔔');
        }
      } else {
        alert('סירבת לקבלת התראות. אם תתחרט, תוכל לשנות זאת בהגדרות הדפדפן (סמל המנעול).');
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!loggedInUser) return;

    const recordPresence = async () => {
      try {
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const presenceDocId = isEran ? 'admin_eran' : loggedInUser.id;

        await setDoc(doc(db, 'presence', presenceDocId), {
          name: displayName || 'מנהל',
          email: loggedInUser.email || '',
          lastSeen: serverTimestamp(),
          teamName: loggedInUser.teamName || 'מנהל המערכת'
        }, { merge: true });

        const lastLogTime = sessionStorage.getItem('last_radar_log');
        const now = Date.now();
        if (!lastLogTime || now - Number(lastLogTime) > 30 * 60 * 1000) {
           await addDoc(collection(db, 'login_logs'), {
             name: displayName || 'מנהל',
             email: loggedInUser.email || 'N/A',
             teamName: loggedInUser.teamName || 'מנהל המערכת',
             deviceType: isMobileDevice ? 'Mobile' : 'Desktop',
             timestamp: new Date().toISOString()
           });
           sessionStorage.setItem('last_radar_log', now.toString());
        }
      } catch (e) {
        console.error("Error updating presence/radar:", e);
      }
    };

    recordPresence();
    const interval = setInterval(recordPresence, 30000);
    return () => clearInterval(interval);
  }, [loggedInUser, displayName, isEran]);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastClearDate = localStorage.getItem('last_cache_clear_date');
    if (lastClearDate !== today) {
        localStorage.removeItem('luzon_last_team_id');
        localStorage.setItem('last_cache_clear_date', today);
    }

    const fallbackTimer = setTimeout(() => setIsInitializing(false), 2000);
    try {
      const unsubSettings = onSnapshot(doc(db, "leagueData", "settings"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.currentRound) {
            setCurrentRound(data.currentRound);
          }
          setFontSettings({
            globalFontScale: Number(data?.globalFontScale) || 100,
            userFontScales: data?.userFontScales || {}
          });
        }
      });

      const unsubTeams = onSnapshot(collection(db, "users"), (snapshot) => {
        if (snapshot.empty) {
          const batch = writeBatch(db);
          for (const team of MOCK_TEAMS) {
            batch.set(doc(db, "users", team.id), team);
          }
          batch.commit().catch(err => console.error("Error initializing mock teams:", err));
        }

        const loadedTeams = snapshot.docs.map(d => ({ ...d.data(), id: (d.data() as any)?.id || d.id, docId: d.id }) as unknown as Team);
        setTeams(loadedTeams);

        clearTimeout(fallbackTimer);
        setIsInitializing(false);

        const sessionUser = authService.getSession();

        setLoggedInUser(prev => {
           // If we don't have a user in state, try to rehydrate from session
           const userToRehydrate = prev || sessionUser;
           if (!userToRehydrate || !userToRehydrate.id) return prev;

           const dbRecord = loadedTeams.find(t => t.id === userToRehydrate.id) as any;

           if (dbRecord) {
               // Rehydrate user from the database record using the session email check to verify
               const userEmail = userToRehydrate.email?.toLowerCase().trim();
               const isMainManager = dbRecord.email?.toLowerCase().trim() === userEmail;
               const isAssistant = dbRecord.assistantEmail?.toLowerCase().trim() === userEmail;
               const assistantObj = Array.isArray(dbRecord.assistants) ? dbRecord.assistants.find((a: any) => a.email?.toLowerCase().trim() === userEmail) : null;

               let role = 'USER';
               if (isMainManager) {
                   role = dbRecord.role || 'USER';
               } else if (isAssistant) {
                   role = dbRecord.assistantRole || 'USER';
               } else if (assistantObj) {
                   role = assistantObj.role || dbRecord.assistantRole || 'USER';
               }

               let newName = userToRehydrate.name;
               if (isMainManager) {
                   newName = dbRecord.manager || dbRecord.name || userToRehydrate.name || 'User';
               } else if (isAssistant) {
                   newName = dbRecord.assistantName || userToRehydrate.name || `עוזר מאמן - ${dbRecord.teamName}`;
               } else if (assistantObj) {
                   newName = assistantObj.name || userToRehydrate.name || `עוזר מאמן - ${dbRecord.teamName}`;
               }

               const newTeamName = dbRecord.teamName || userToRehydrate.teamName || '';
               const newRole = role as UserRole;
               const newTeamId = dbRecord.id;

               if (!prev ||
                   prev.name !== newName ||
                   prev.teamName !== newTeamName ||
                   prev.role !== newRole ||
                   prev.teamId !== newTeamId) {

                   // Always return the secure rehydrated object to ensure role and other details are from the server
                   return {
                       ...userToRehydrate,
                       name: newName,
                       teamName: newTeamName,
                       role: newRole,
                       teamId: newTeamId
                   };
               }
           }

           // If not in database yet but we just logged in, return what we have (e.g. admin without team)
           if (!prev && sessionUser) {
               // This covers edge cases where a user might be authenticated but not have a specific team document
               return sessionUser as User;
           }

           return prev;
        });
      });

      return () => { unsubTeams(); unsubSettings(); clearTimeout(fallbackTimer); };
    } catch (e) { clearTimeout(fallbackTimer); setIsInitializing(false); }
  }, []);

  // 🟢 החלת גודל פונט מותאם אישית למשתמש (או גלובלי) בזמן אמת מהגדרות האדמין 🟢
  useEffect(() => {
    const scales = fontSettings.userFontScales || {};
    let resolvedScale = Number(fontSettings.globalFontScale) || 100;

    if (loggedInUser) {
      const emailKey = loggedInUser.email?.toLowerCase().trim() || '';
      const nameKey = (loggedInUser.name || '').trim();
      const teamIdKey = loggedInUser.id || (loggedInUser as any).teamId || '';

      if (emailKey && scales[emailKey]) {
        resolvedScale = Number(scales[emailKey]);
      } else if (nameKey && scales[nameKey]) {
        resolvedScale = Number(scales[nameKey]);
      } else if (teamIdKey && scales[teamIdKey]) {
        resolvedScale = Number(scales[teamIdKey]);
      } else if (teamIdKey) {
        const myTeamDoc = teams.find(t => t.id === teamIdKey) as any;
        if (myTeamDoc?.fontScale) {
          resolvedScale = Number(myTeamDoc.fontScale);
        }
      }
    }

    if (typeof (window as any).applyLuzonFontScale === 'function') {
      (window as any).applyLuzonFontScale(resolvedScale);
    }
  }, [loggedInUser, teams, fontSettings]);

  const handleLogout = () => {
    if(window.confirm('להתנתק מהמערכת?')) {
      authService.logout();
      setLoggedInUser(null);
      sessionStorage.removeItem('last_radar_log');
    }
  };

  const isModerator = isEran || loggedInUser?.role === UserRole.MODERATOR || loggedInUser?.role === 'ARENA_MANAGER';

  const availableTabs = useMemo(() => {
    if (!loggedInUser) return [];
    
    return [
      {id: 'home', icon: <Home className="w-6 h-6" />, label: 'ראשי'},
      {id: 'lineup', icon: <Users className="w-6 h-6" />, label: 'הרכב'},
      {id: 'live', icon: <Zap className="w-6 h-6" />, label: 'זירה'}, 
      {id: 'table', icon: <BarChart3 className="w-6 h-6" />, label: 'טבלה'}, 
      {id: 'fixtures', icon: <Calendar className="w-6 h-6" />, label: 'משחקים'},
      {id: 'cup', icon: <Trophy className="w-6 h-6" />, label: 'גביע'}, 
      ...(isEran ? [{id: 'settings', icon: <Settings className="w-6 h-6" />, label: 'הגדרות', hideOnMobileNav: true}] : [])
    ];
  }, [loggedInUser, isEran]);

  if (isInitializing) return <div className="h-screen bg-[#0B1120] flex items-center justify-center font-black text-green-500 animate-pulse text-4xl italic">LUZON 14</div>;
  if (!loggedInUser) return <LoginScreen onLogin={setLoggedInUser} />;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden text-slate-100 flex flex-col pb-28 lg:pb-10 font-sans bg-[#0B1120] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#020617]" dir="rtl">
      <InstallPwaBanner userId={loggedInUser.id} />
      <header className="h-[64px] sm:h-[72px] w-full max-w-[100vw] bg-[#0B1120]/85 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-[100] shadow-sm gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="font-black italic text-2xl sm:text-3xl tracking-tighter drop-shadow-lg text-white">LUZON <span className="text-green-500">14</span></span>
          <div className="h-4 w-[1px] bg-white/20 hidden sm:block"></div>
          <HeaderRoundBadge currentRound={currentRound} />
        </div>

        {/* 🖥️ סרגל ניווט עליון למחשב בלבד (lg:flex) לחוויית Desktop מהירה ונוחה 🖥️ */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          {availableTabs.map((tab: any) => {
            const isActive = activeTab === tab.id;
            const isCup = tab.id === 'cup';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs transition-all duration-200 active:scale-95 ${
                  isActive
                    ? isCup
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 shadow-[0_0_12px_rgba(250,204,21,0.2)]'
                      : 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                    : `text-slate-400 hover:bg-white/5 border border-transparent ${isCup ? 'hover:text-yellow-400' : 'hover:text-white'}`
                }`}
              >
                <div className="scale-75 -mr-1">{tab.icon}</div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-black text-white leading-tight">{loggedInUser.teamName}</div>
            <div className="text-[11px] font-bold text-slate-400">{displayName}</div>
          </div>

          {/* 🟢 בנייד: כפתור הגדרות מנהל בסרגל העליון כדי לפנות מקום בתפריט התחתון 🟢 */}
          {isEran && (
            <button
              onClick={() => setActiveTab('settings')}
              title="הגדרות מנהל"
              className={`sm:hidden p-2 rounded-xl transition-all border flex items-center justify-center shadow-sm active:scale-95 ${activeTab === 'settings' ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-white/5 text-slate-300 border-white/10'}`}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          
          {/* 🟢 כפתור אישור התראות שמופיע רק למי שעוד לא אישר 🟢 */}
          {pushStatus !== 'granted' && pushStatus !== 'unsupported' && (
            <button
              onClick={handleRequestPush}
              className="bg-green-500/10 hover:bg-green-500/30 text-green-400 p-2 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all border border-green-500/30 flex items-center gap-2 shadow-sm animate-pulse"
              title="הפעל התראות"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden md:inline">הפעל התראות</span>
            </button>
          )}

          {/* 🟢 כפתור הגדרות אישיות לכל המשתמשים עם הבלטה בכניסה ראשונה 🟢 */}
          <FeatureSpotlight
            featureId="user_settings_v1"
            title="חדש! הגדרות אישיות"
            description="הוספנו לכם כפתור הגדרות אישי! מעכשיו תוכלו לבחור בדיוק איזה פושים לקבל (או להשתיק הכל), להגדיר את גודל הטקסט ולהתאים את האפליקציה בדיוק בשבילכם."
            actionLabel="פתח הגדרות ⚙️"
            onAction={() => setIsUserSettingsOpen(true)}
            placement="bottom-left"
          >
            <button
              onClick={() => setIsUserSettingsOpen(true)}
              title="הגדרות אישיות"
              className="bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 p-2 rounded-xl transition-all border border-white/10 hover:border-emerald-500/30 flex items-center justify-center shadow-sm active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </button>
          </FeatureSpotlight>

          <button 
             onClick={forceHardRefresh} 
             disabled={isRefreshing}
             title="רענן נתונים (אם חסרה קבוצה)"
             className="bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 p-2 rounded-xl transition-all border border-blue-500/30 flex items-center justify-center shadow-sm active:scale-95"
          >
            <RefreshCcw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button onClick={handleLogout} className="bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 p-2 md:px-4 md:py-2 rounded-xl text-sm font-bold transition-all border border-transparent hover:border-red-500/30 flex items-center gap-2 shadow-sm">
            <span className="hidden md:inline">התנתק</span> 🚪
          </button>
        </div>
      </header>

      {/* 🔔 באנר "להציק" ולהזכיר למנג'ר להפעיל התראות פוש (מוסתר בטאב הרכב כדי לא להסתיר את כפתור שמירת ההרכב) 🔔 */}
      {pushStatus !== 'granted' && pushStatus !== 'unsupported' && !pushBannerDismissed && activeTab !== 'lineup' && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-gradient-to-r from-slate-900 via-amber-950/90 to-slate-900 border-2 border-yellow-500/50 p-3.5 rounded-2xl shadow-[0_10px_30px_rgba(234,179,8,0.25)] z-[999] animate-in slide-in-from-bottom-5 duration-500 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shrink-0 animate-bounce">
              <Bell className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-white leading-tight truncate">אל תפספס שום שער! ⚽</div>
              <div className="text-[11px] font-bold text-slate-300 mt-0.5 truncate">הפעל התראות פוש לקבלת עדכוני לייב.</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={handleRequestPush}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-xs px-3 py-2 rounded-xl shadow-lg shrink-0 active:scale-95 transition-transform"
            >
              הפעל! 🔔
            </button>
            <button
              onClick={() => setPushBannerDismissed(true)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
              title="סגור"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 🔔 באנר התראה על עדכון גרסה 🔔 */}
      <VersionUpdateBanner />

      {/* 🔔 טואסט התראה כשהאפליקציה פתוחה 🔔 */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 border-2 border-yellow-400 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 max-w-md w-11/12">
          <Bell className="w-6 h-6 text-yellow-400 animate-bounce shrink-0" />
          <span className="font-black text-sm">{toast.msg}</span>
        </div>
      )}
      
      <main className="flex-1 overflow-x-hidden p-3 sm:p-4 md:p-8 relative z-10">
        <div className={activeTab === 'home' ? 'block' : 'hidden'}>
          <SocialFeed teams={teams} currentRound={currentRound} loggedInUser={{...loggedInUser, name: displayName}} onNavigate={() => setActiveTab('table')} />
        </div>
        <div className={activeTab === 'live' ? 'block' : 'hidden'}>
          <LiveArena currentRound={currentRound} teams={teams} isModerator={isModerator} loggedInUser={{...loggedInUser, name: displayName}} isAdmin={isEran} />
        </div>
        <div className={activeTab === 'lineup' ? 'block' : 'hidden'}>
          <LineupManager teams={teams} loggedInUser={{...loggedInUser, name: displayName}} currentRound={currentRound} isAdmin={isEran} />
        </div>
        <div className={activeTab === 'fixtures' ? 'block' : 'hidden'}>
          <FixturesTab currentRound={currentRound} isAdmin={isEran} />
        </div>
        <div className={activeTab === 'table' ? 'block max-w-4xl mx-auto' : 'hidden'}>
          <React.Suspense fallback={<div className="p-12 text-center text-green-400 font-black animate-pulse text-lg">טוען טבלאות ליגה...</div>}>
            <AdminLeagueManager isAdmin={isEran} inline={true} initialSubTab="table" />
          </React.Suspense>
        </div>
        {activeTab === 'settings' && (
          <React.Suspense fallback={<div className="p-12 text-center text-green-400 font-black animate-pulse text-lg">טוען הגדרות מנהל...</div>}>
            <AdminSettings onClose={() => setActiveTab('home')} isAdmin={isEran} />
          </React.Suspense>
        )}
        <div className={activeTab === 'cup' ? 'block' : 'hidden'}>
          <CupTab />
        </div>
      </main>

      {/* 🟢 התפריט התחתון המעודכן והמרווח לטובת המובייל וטאבלטים (מוסתר ב-PC שם יש ניווט עליון) 🟢 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-[#0B1120]/95 backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] z-[100] shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
         <div className="max-w-lg mx-auto flex items-center justify-evenly h-[72px] sm:h-[84px] px-1.5 relative">
            {availableTabs.map((tab: any) => {
              const isActive = activeTab === tab.id;
              const isCup = tab.id === 'cup';

              return (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`${tab.hideOnMobileNav ? 'hidden sm:flex' : 'flex'} flex-1 flex-col items-center justify-center h-full transition-all duration-300 outline-none group gap-1 min-w-0 active:scale-95`}
                >
                  <div className={`transition-all duration-300 flex items-center justify-center p-1 rounded-xl ${isActive ? `-translate-y-0.5 scale-110 ${isCup ? 'text-yellow-400 bg-yellow-500/10' : 'text-green-400 bg-green-500/10'}` : `text-slate-400 group-hover:-translate-y-1 group-active:scale-90 ${isCup ? 'group-hover:text-yellow-400' : 'group-hover:text-slate-300'}`}`}>
                    <div className="transform scale-95 sm:scale-100">{tab.icon}</div>
                  </div>
                  <span className={`text-[10px] sm:text-[10px] font-black uppercase tracking-tight truncate w-full text-center transition-all duration-300 ${isActive ? `opacity-100 ${isCup ? 'text-yellow-400' : 'text-green-400'}` : `opacity-75 text-slate-400 group-hover:opacity-100 ${isCup ? 'group-hover:text-yellow-400' : 'group-hover:text-white'}`}`}>
                    {tab.label}
                  </span>
                  {isActive && <div className={`absolute bottom-1 w-4 h-1 rounded-full ${isCup ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'}`}></div>}
                </button>
              );
            })}
          </div>
      </nav>

      {/* 🟢 חלון הגדרות אישיות לכל מנג'ר (פונט, פושים, העדפות) 🟢 */}
      <UserSettingsModal
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
        loggedInUser={loggedInUser}
        onUpdateUser={(updated) => {
          if (loggedInUser) {
            setLoggedInUser({ ...loggedInUser, ...updated });
          }
        }}
        currentFontScale={fontSettings.globalFontScale}
        onApplyFontScale={(scale) => {
          if (typeof (window as any).applyLuzonFontScale === 'function') {
            (window as any).applyLuzonFontScale(scale);
          }
        }}
      />
    </div>
  );
};

export default App;