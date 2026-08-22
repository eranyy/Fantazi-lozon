import React, { useState } from 'react';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getToken } from 'firebase/messaging';
import { db, auth, messaging } from '../firebaseConfig';
import { authService } from '../authService';

interface LoginScreenProps {
  onLogin: (user: any) => void;
}

// פונקציית הרדאר לזיהוי המכשיר
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'Mobile';
  return 'Desktop (PC)';
};

// פונקציה לבקשת אישור התראות פוש ושמירת הטוקן
const requestPushPermission = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BELPkm_Y6IgLW-atBkxPKAyXnUbMagpKIuNF7oQkPLu8XdtzYXcUWD6yGIgqdLguY-OAOyZbJKV8Usm5Yi89emQ"
      });

      if (token) {
        await setDoc(doc(db, "users", userId), {
          fcmToken: token
        }, { merge: true });
      }
    }
  } catch (error) {
    // Ignore notification setup errors
  }
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const processAuthenticatedUser = async (user: any, inputEmail: string, loginMethod: string) => {
    const usersSnap = await getDocs(collection(db, 'users'));
    let foundUser: any = null;

    usersSnap.forEach(doc => {
      const data = doc.data();
      const mainEmail = data.email?.toLowerCase().trim();
      const asstEmail = data.assistantEmail?.toLowerCase().trim();

      // בדיקה אם זה המנג'ר הראשי
      if (mainEmail === inputEmail) {
        foundUser = { id: doc.id, teamId: doc.id, name: data.manager || data.name || data.teamName, email: data.email, teamName: data.teamName, role: data.role || 'USER' };
      }
      // בדיקה אם זה עוזר המאמן
      else if (asstEmail === inputEmail) {
        foundUser = { id: doc.id, teamId: doc.id, name: data.assistantName || `עוזר מאמן - ${data.teamName}`, email: data.assistantEmail, teamName: data.teamName, role: 'USER' };
      }
      // בדיקה אם זה אחד מעוזרי המאמן (מערך)
      else if (data.assistants && Array.isArray(data.assistants)) {
        const assistant = data.assistants.find((a: any) => a.email?.toLowerCase().trim() === inputEmail);
        if (assistant) {
          foundUser = { id: doc.id, teamId: doc.id, name: assistant.name || `עוזר מאמן - ${data.teamName}`, email: assistant.email, teamName: data.teamName, role: 'USER' };
        }
      }
    });

    if (foundUser) {
      try {
        await addDoc(collection(db, 'login_logs'), {
          uid: user.uid,
          email: foundUser.email,
          name: foundUser.name,
          teamName: foundUser.teamName,
          role: foundUser.role,
          deviceType: getDeviceType(),
          loginMethod,
          timestamp: new Date().toISOString()
        });
      } catch (logError) {
        // Ignore login tracking log errors
      }

      authService.login(foundUser, rememberMe);
      onLogin(foundUser);
      requestPushPermission(foundUser.id);
    } else {
      setError(`חשבון הגוגל שאיתו התחברת (${inputEmail}) אומת בהצלחה בגוגל, אך אימייל זה אינו רשום תחת אף קבוצה במערכת. אנא ודא שכתובת המייל המדויקת הזאת (${inputEmail}) מעודכנת עבור הקבוצה בפאנל הניהול.`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('נא להזין אימייל וסיסמה');
      return;
    }

    setLoading(true);
    setError('');

    const inputEmail = email.toLowerCase().trim();
    const inputPassword = password.trim();

    try {
      // 1. Try Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, inputEmail, inputPassword);
      await processAuthenticatedUser(userCredential.user, inputEmail, 'email');
    } catch (err: any) {

      // Auto-create user account if email exists in Firestore but has not created a Firebase Auth user yet
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          let isTeamMember = false;
          usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.email?.toLowerCase().trim() === inputEmail ||
                data.assistantEmail?.toLowerCase().trim() === inputEmail ||
                (data.assistants && data.assistants.some((a: any) => a.email?.toLowerCase().trim() === inputEmail))) {
              isTeamMember = true;
            }
          });

          if (isTeamMember) {
            const newCredential = await createUserWithEmailAndPassword(auth, inputEmail, inputPassword);
            await processAuthenticatedUser(newCredential.user, inputEmail, 'email_created');
            setLoading(false);
            return;
          }
        } catch (createErr: any) {
          if (createErr.code === 'auth/weak-password') {
            setError('הסיסמה קצרה מדי. נא לבחור סיסמה בת 6 תווים לפחות.');
            setLoading(false);
            return;
          }
        }
      }

      let errorMessage = 'שגיאת התחברות. אנא נסה שוב.';
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'אימייל זה אינו רשום כמנג\'ר בליגה. ודא שהאימייל נכון.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'סיסמה שגויה. נסה שוב או פנה למנהל הליגה לאיפוס.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'כתובת אימייל לא תקינה.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'חשבון זה הושבת. פנה למנהל הליגה.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'יותר מדי ניסיונות כושלים. החשבון נחסם זמנית, נסה שוב מאוחר יותר.';
          break;
        default:
          errorMessage = `שגיאה: ${err.code || 'מערכת'}. אנא נסה שוב.`;
      }

      setError(errorMessage);

      try {
        await addDoc(collection(db, 'login_errors'), {
          email: inputEmail,
          errorCode: err.code || 'unknown',
          errorMessage: err.message,
          timestamp: new Date().toISOString()
        });
      } catch (logErr) {
        // Ignore errors when saving login_errors log
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const inputEmail = (user.email || '').toLowerCase().trim();
      await processAuthenticatedUser(user, inputEmail, 'google');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('התחברות עם Google בוטלה.');
      } else if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
        setError('הדפדפן חסם את חלון ההתחברות של גוגל. פתח את הקישור בדפדפן Chrome / Safari רגיל (ולא מתוך אפליקציית ווצאפ), או התחבר באימייל וסיסמה.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('הדומיין שבו אתה משתמש אינו מורשה ב-Firebase. נסה להיכנס מ-fantasy-luzon.web.app');
      } else {
        setError(`שגיאת התחברות גוגל: ${err.message || err.code}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHelp = (type: string) => {
    if (type === 'new') alert('ברוך הבא לפנטזי לוזון! ⚽\nהמערכת סגורה להרשמה חופשית.\nנא לפנות למנהל הליגה (ערן) כדי לפתוח קבוצה חדשה.');
    if (type === 'forgot') alert('שכחת סיסמה? לא נורא.\nפנה למנהל הליגה (ערן) בווצאפ והוא יאפס לך את הסיסמה בשנייה מתוך פאנל הניהול.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-['Assistant'] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-slate-950 px-4" dir="rtl">

      <div className="bg-slate-900/90 backdrop-blur-md p-8 md:p-12 rounded-[40px] border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.15)] w-full max-w-md">

        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-white italic tracking-tighter mb-2">LUZON <span className="text-green-500">14</span></h1>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">ניהול ליגת פנטזי מקצועית</p>
        </div>

        {/* Google Sign-In Option */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-base py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] border border-slate-200 active:scale-95 mb-6"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>התחבר באמצעות Google</span>
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-3 text-slate-500 font-bold">או התחבר עם אימייל</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-xs font-bold mb-2 ml-1">אימייל (מנג'ר / עוזר מאמן)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-green-500 transition-colors"
              placeholder="email@example.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold mb-2 ml-1">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-slate-700 p-4 rounded-2xl text-white outline-none focus:border-green-500 transition-colors"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-5 h-5 accent-green-500"
              />
              <span className="text-sm text-slate-300 font-bold">זכור אותי מחובר</span>
            </label>

            <button type="button" onClick={() => handleHelp('forgot')} className="text-xs text-green-500 hover:text-green-400 font-bold">שכחתי סיסמה</button>
          </div>

          {error && <div className="bg-red-950/50 border border-red-500/50 text-red-400 p-3 rounded-xl text-center text-sm font-bold animate-in fade-in">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-black font-black text-xl py-4 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all hover:scale-[1.02]"
          >
            {loading ? 'מתחבר למגרש...' : 'היכנס לזירה ⚡'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-6">
          <p className="text-slate-400 text-sm">עדיין לא בליגה?</p>
          <button type="button" onClick={() => handleHelp('new')} className="text-white font-black mt-2 hover:text-green-400 transition-colors">בקש לפתוח קבוצה חדשה ➔</button>
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;