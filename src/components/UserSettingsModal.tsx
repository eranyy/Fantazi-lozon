import React, { useState, useEffect } from 'react';
import { 
  X, 
  Type, 
  Bell, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Check, 
  Loader2, 
  Send,
  Zap,
  Home,
  Users,
  Trophy,
  Activity,
  SlidersHorizontal,
  Flame,
  Clock,
  Swords
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebaseConfig';
import { User, PushPreferences } from '../types';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loggedInUser: User | null;
  onUpdateUser?: (updated: Partial<User>) => void;
  currentFontScale?: number;
  onApplyFontScale?: (scale: number) => void;
}

const PRESET_SCALES = [
  { label: 'קומפקטי', value: 90, desc: 'מציג מקסימום תוכן' },
  { label: 'רגיל', value: 100, desc: 'ברירת מחדל' },
  { label: 'גדול', value: 115, desc: 'מומלץ למסכים קטנים' },
  { label: 'מוגדל', value: 130, desc: 'אותיות ענקיות וברורות' },
];

const DEFAULT_TABS = [
  { id: 'home', label: 'דף הבית', icon: Home },
  { id: 'live', label: 'הזירה בלייב', icon: Zap },
  { id: 'lineup', label: 'ניהול הרכב', icon: Users },
  { id: 'table', label: 'טבלת הליגה', icon: Trophy },
];

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  loggedInUser,
  onUpdateUser,
  currentFontScale = 100,
  onApplyFontScale
}) => {
  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = localStorage.getItem('luzon_user_font_scale');
    return saved ? Number(saved) : (loggedInUser?.fontScale || currentFontScale || 100);
  });

  const [pushPrefs, setPushPrefs] = useState<PushPreferences>(() => {
    const userPrefs = loggedInUser?.pushPreferences || {};
    return {
      liveScoreboardBanner: userPrefs.liveScoreboardBanner !== false,
      lineupReminders: userPrefs.lineupReminders !== false,
      rivalLineups: userPrefs.rivalLineups !== false,
      transfers: userPrefs.transfers !== false,
      matchResults: userPrefs.matchResults !== false,
    };
  });

  const [defaultTab, setDefaultTab] = useState<string>(() => {
    return localStorage.getItem('luzon_default_tab') || loggedInUser?.defaultTab || 'home';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('luzon_sound_enabled');
    return saved !== null ? saved === 'true' : (loggedInUser?.soundEnabled !== false);
  });

  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    const saved = localStorage.getItem('luzon_reduce_motion');
    return saved === 'true' || loggedInUser?.reduceMotion === true;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [testPushStatus, setTestPushStatus] = useState<string | null>(null);

  // Sync state if user changes
  useEffect(() => {
    if (loggedInUser) {
      if (loggedInUser.fontScale) setFontScale(loggedInUser.fontScale);
      if (loggedInUser.pushPreferences) {
        setPushPrefs({
          liveScoreboardBanner: loggedInUser.pushPreferences.liveScoreboardBanner !== false,
          lineupReminders: loggedInUser.pushPreferences.lineupReminders !== false,
          rivalLineups: loggedInUser.pushPreferences.rivalLineups !== false,
          transfers: loggedInUser.pushPreferences.transfers !== false,
          matchResults: loggedInUser.pushPreferences.matchResults !== false,
        });
      }
      if (loggedInUser.defaultTab) setDefaultTab(loggedInUser.defaultTab);
      if (loggedInUser.soundEnabled !== undefined) setSoundEnabled(loggedInUser.soundEnabled);
      if (loggedInUser.reduceMotion !== undefined) setReduceMotion(loggedInUser.reduceMotion);
    }
  }, [loggedInUser]);

  if (!isOpen) return null;

  // Handle immediate font change
  const handleFontChange = (newScale: number) => {
    setFontScale(newScale);
    localStorage.setItem('luzon_user_font_scale', String(newScale));
    if (typeof (window as any).applyLuzonFontScale === 'function') {
      (window as any).applyLuzonFontScale(newScale);
    }
    if (onApplyFontScale) {
      onApplyFontScale(newScale);
    }
  };

  // Toggle push preference
  const togglePushPref = (key: keyof PushPreferences) => {
    setPushPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleMuteAll = () => {
    setPushPrefs({
      liveScoreboardBanner: false,
      lineupReminders: false,
      rivalLineups: false,
      transfers: false,
      matchResults: false
    });
  };

  const handleEnableAll = () => {
    setPushPrefs({
      liveScoreboardBanner: true,
      lineupReminders: true,
      rivalLineups: true,
      transfers: true,
      matchResults: true
    });
  };

  // Save all settings to Firestore & localStorage
  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('luzon_user_font_scale', String(fontScale));
      localStorage.setItem('luzon_default_tab', defaultTab);
      localStorage.setItem('luzon_sound_enabled', String(soundEnabled));
      localStorage.setItem('luzon_reduce_motion', String(reduceMotion));

      if (loggedInUser?.id) {
        const updatePayload: Partial<User> = {
          fontScale,
          pushPreferences: pushPrefs,
          defaultTab,
          soundEnabled,
          reduceMotion
        };

        await updateDoc(doc(db, 'users', loggedInUser.id), updatePayload);
        if (onUpdateUser) {
          onUpdateUser(updatePayload);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Error saving personal settings:', err);
      alert('ההגדרות נשמרו מקומית במכשיר שלך!');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Send a test push notification to user's device
  const handleTestPush = async () => {
    if (!loggedInUser?.id) return;
    setIsTestingPush(true);
    setTestPushStatus(null);
    try {
      const sendCustomPush = httpsCallable(functions, 'sendCustomPushNotification');
      const res: any = await sendCustomPush({
        title: '🔔 בדיקת התראות - פנטזי לוזון!',
        message: 'ההתראות במכשיר שלך מוגדרות ועובדות פיקס! 🚀',
        targetUserId: loggedInUser.id
      });

      if (res?.data?.success && res?.data?.count > 0) {
        setTestPushStatus('התראה נשלחה למכשיר שלך! 📱');
      } else {
        setTestPushStatus('לא נמצא מכשיר רשום. ודא שאישרת התראות בדפדפן.');
      }
    } catch (err: any) {
      console.error('Test push error:', err);
      setTestPushStatus('שגיאה בשליחת בדיקה. ודא חיבור לרשת.');
    } finally {
      setIsTestingPush(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-l from-slate-900 via-emerald-950/40 to-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">הגדרות אישיות</h2>
              <p className="text-xs text-slate-400">התאם את האפליקציה בדיוק למכשיר שלך</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            title="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">

          {/* Section 1: Font Size */}
          <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Type className="w-4 h-4" />
                <span>גודל תצוגה וגופן ({fontScale}%)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                משפיע עליך בלבד
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              בחר גודל שנוח לך לקריאה. הגודל יוחל מיידית על המכשיר שלך בלבד:
            </p>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_SCALES.map(preset => {
                const isSelected = Math.abs(fontScale - preset.value) < 3;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleFontChange(preset.value)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected 
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-black">{preset.label}</div>
                    <div className="text-[10px] text-emerald-400 font-bold mt-0.5">{preset.value}%</div>
                  </button>
                );
              })}
            </div>

            {/* Slider */}
            <div className="pt-2">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>80%</span>
                <span className="font-bold text-emerald-400">{fontScale}%</span>
                <span>140%</span>
              </div>
              <input
                type="range"
                min="80"
                max="140"
                step="5"
                value={fontScale}
                onChange={(e) => handleFontChange(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
            </div>

            {/* Live Preview Box */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-center">
              <span className="text-slate-300 font-bold" style={{ fontSize: `${fontScale}%` }}>
                ⚽ תצוגה מקדימה: כך נראה הטקסט אצלך
              </span>
            </div>
          </div>

          {/* Section 2: Push Notifications */}
          <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Bell className="w-4 h-4" />
                <span>ניהול התראות פוש</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleMuteAll}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded-md border border-red-500/20 transition-all active:scale-95"
                >
                  השתק הכל 🔕
                </button>
                <button
                  type="button"
                  onClick={handleEnableAll}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/20 transition-all active:scale-95"
                >
                  הפעל הכל 🔔
                </button>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {/* Toggle 1: Live scoreboard banner */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white leading-tight">באנר תוצאות חי במסך הנעילה</div>
                    <div className="text-[11px] text-slate-400 leading-tight">לוח תוצאות שקט שמתעדכן בלייב בזמן משחקים</div>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={pushPrefs.liveScoreboardBanner}
                  onChange={() => togglePushPref('liveScoreboardBanner')}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mr-3"
                />
              </label>

              {/* Toggle 2: Lineup reminders */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white leading-tight">תזכורות הרכב לפני שריקת הפתיחה</div>
                    <div className="text-[11px] text-slate-400 leading-tight">התראות 24 שעות ושעתיים לפני נעילת המחזור</div>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={pushPrefs.lineupReminders}
                  onChange={() => togglePushPref('lineupReminders')}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mr-3"
                />
              </label>

              {/* Toggle 3: Rival lineup save */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <Swords className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white leading-tight">עדכוני הרכבים של יריבים</div>
                    <div className="text-[11px] text-slate-400 leading-tight">התראה כשאחד המנג'רים בליגה שומר ונועל הרכב</div>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={pushPrefs.rivalLineups}
                  onChange={() => togglePushPref('rivalLineups')}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mr-3"
                />
              </label>

              {/* Toggle 4: Transfers */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white leading-tight">שוק העברות ורכש שחקנים</div>
                    <div className="text-[11px] text-slate-400 leading-tight">התראה כשקבוצה בליגה מחתימה או משחררת שחקן</div>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={pushPrefs.transfers}
                  onChange={() => togglePushPref('transfers')}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mr-3"
                />
              </label>

              {/* Toggle 5: Match & round results */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/5">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white leading-tight">סיום מחזור ותוצאת המשחק שלי</div>
                    <div className="text-[11px] text-slate-400 leading-tight">התראה אישית בניצחון/הפסד ופרסום טבלה מעודכנת</div>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={pushPrefs.matchResults}
                  onChange={() => togglePushPref('matchResults')}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mr-3"
                />
              </label>
            </div>

            {/* Test Push Button */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleTestPush}
                disabled={isTestingPush}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-950 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                {isTestingPush ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>שולח התראת בדיקה...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>שלח לי התראת בדיקה למכשיר</span>
                  </>
                )}
              </button>
              {testPushStatus && (
                <div className="text-center text-[11px] text-emerald-400 font-bold mt-1.5 animate-in fade-in">
                  {testPushStatus}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: App Preferences */}
          <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="text-emerald-400 font-bold text-sm">
              העדפות פתיחה וממשק
            </div>

            {/* Default Tab Selection */}
            <div>
              <div className="text-xs font-bold text-slate-300 mb-1.5">מסך פתיחה מועדף בכניסה לאפליקציה:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEFAULT_TABS.map(tab => {
                  const Icon = tab.icon;
                  const isSelected = defaultTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDefaultTab(tab.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] font-bold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <div className="text-xs font-bold text-white">אפקטים קוליים וסאונד</div>
                  <div className="text-[10px] text-slate-400">צלילים בשמירת הרכב ובפעולות מיוחדות</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  soundEnabled 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                {soundEnabled ? 'פעיל' : 'מושתק'}
              </button>
            </div>

            {/* Reduce Motion */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">מצב ביצועים וחיסכון</div>
                  <div className="text-[10px] text-slate-400">מבטל אפקטים כבדים למכשירים ישנים</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReduceMotion(!reduceMotion)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  reduceMotion 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                {reduceMotion ? 'פעיל' : 'כבוי'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/95 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>שומר שינויים...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>נשמר בהצלחה!</span>
              </>
            ) : (
              <span>שמור הגדרות</span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-sm border border-white/10 transition-all"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsModal;
