import { GoogleGenAI } from "@google/genai";
const modelName = "gemini-1.5-flash-latest";

const FALLBACK_GEMINI_KEY = "AIzaSyDsXUeI2CUSm4bz5A2K32BFOOa5xkRPtvk";

const getApiKey = (providedKey?: string) => {
  return providedKey || 
         localStorage.getItem('gemini_api_key') || 
         (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || 
         FALLBACK_GEMINI_KEY;
};

// 🟢 פונקציית עזר למניעת תקיעות - מוקצב ל-45 שניות (זמן סביר לסריקת מסמכים) 🟢
const fetchWithTimeout = async (promise: Promise<any>, timeoutMs: number = 45000) => {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout: The request took longer than ${timeoutMs / 1000} seconds`)), timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timer!);
        return result;
    } catch (e) {
        clearTimeout(timer!);
        throw e;
    }
};

export const analyzeMatchImage = async (base64Data: string, mimeType: string, hint?: string, apiKey?: string) => {
  const activeKey = getApiKey(apiKey);
  
  // 🟢 שימוש ב-SDK המודרני 🟢
  const ai = new GoogleGenAI({ apiKey: activeKey }); 
  
  const prompt = `אתה סוכן AI מומחה ופדנט לחילוץ נתונים מטבלאות ספורט מורכבות ומסמכי PDF רשמיים.\\nאני מספק לך תמונה או קובץ PDF של משחקי ליגת העל בכדורגל (ישראל). \\nרמז למחזור שצריך לחלץ: \\"${hint || 'לא ידוע'}\\".\\n\\nהמשימה שלך היא לחלץ את המשחקים ולהחזיר אותם אך ורק כמערך JSON חוקי.\\n\\n🚨 חוקי ברזל לסריקה מושלמת (קריטי להצלחת המשימה!) 🚨:\\n1. **סרוק את כל המסמך ביסודיות, שורה אחר שורה, מההתחלה ועד הסוף!** אל תעצור עד שסיימת לקרוא הכל.\\n2. חפש את המספר שניתן לך ברמז (למשל מחזור 28, 30, 32 או 33).\\n3. **שים לב לפלייאוף!** המחזור יכול להיות מפוצל ל\\"פלייאוף עליון\\" ו\\"פלייאוף תחתון\\". אם ביקשתי מחזור מסוים, עליך למצוא ולחלץ את *כל* המשחקים של אותו מחזור משני הפלייאופים יחד!\\n4. אל תניח שיש מספר קבוע של משחקים. יכולים להיות 3, 4, 6 או 7 משחקים. חלץ את כולם.\\n5. קרא בעיון כל טבלה. לפעמים שמות הקבוצות או התאריכים נשברים לשורות נפרדות. חבר אותם למשחק אחד.\\n6. השעה של המשחק היא קריטית! חלץ אותה במדויק.\\n\\nהחזר אך ורק מערך JSON, ללא שום טקסט או הסבר נוסף (ללא פורמט Markdown כמו \\\\\`\\\\\`\\\\\`json).\\n\\nכל אובייקט במערך חייב לכלול בדיוק את המפתחות הבאים:\\n- \\"round\\": (מספר שלם לפי הרמז שסיפקתי).\\n- \\"homeTeam\\": (מחרוזת) שם קבוצת הבית בעברית.\\n- \\"awayTeam\\": (מחרוזת) שם קבוצת החוץ בעברית.\\n- \\"date\\": (מחרוזת) תאריך המשחק (למשל 19.04 או 19/04). \\n- \\"time\\": (מחרוזת) שעת המשחק המדויקת בפורמט HH:MM בלבד (למשל \\"20:00\\"). ללא מילים נוספות!\\n- \\"stadium\\": (מחרוזת) חלץ את שם המגרש/אצטדיון בעברית (למשל \\"סמי עופר\\", \\"בלומפילד\\", \\"דוחא\\", \\"טרנר\\", \\"שלמה ביטוח\\"). אם לא מופיע, החזר \\"\\".\\n- \\"tvChannel\\": (מחרוזת) ערוץ שידור אם יש, אחרת \\"\\".`;

  // 🟢 שימוש במודל החדיש והיציב ביותר 🟢
  const modelName = "gemini-1.5-flash-latest";

  try {
      console.log(`מפעיל חילוץ PDF/תמונה עם ${modelName}...`);
      const requestPromise = ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Data } }] }]
      });

      const response = await fetchWithTimeout(requestPromise, 45000); 

      const text = response.text;
      if (!text) throw new Error("No response from Gemini AI");

      const cleanJsonText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJsonText);
  } catch (error: any) {
      console.error(`שגיאה בחילוץ נתונים (${modelName}):`, error);
      throw new Error(`שגיאת התחברות לשרת ה-AI: ${error.message}. נסה לרענן את העמוד או נסה שוב מאוחר יותר.`);
  }
};

export const generateAISummary = async (fixtures: any[], teams: any[], pollData?: any, apiKey?: string) => {
    const activeKey = getApiKey(apiKey);
    const ai = new GoogleGenAI({ apiKey: activeKey });

    const sortedTeams = [...teams].filter(t => t.id !== 'admin' && t.id !== 'system').sort((a, b) => {
        const aPts = a.points || 0; const bPts = b.points || 0;
        if (bPts !== aPts) return bPts - aPts;
        return ((b.gf || 0) - (b.ga || 0)) - ((a.gf || 0) - (a.ga || 0));
    });

    const leagueStandingsText = sortedTeams.map((t, index) => 
        `מקום ${index + 1}: ${t.teamName} (מנג'ר: ${t.name || t.manager}) | נקודות בטבלה: ${t.points || 0} | שערים: ${t.gf || 0} זכות, ${t.ga || 0} חובה (הפרש: ${(t.gf || 0) - (t.ga || 0)})`
    ).join('\n');

    const fixturesText = fixtures.map((m, index) => {
        const hScore = Number(m.hs || 0);
        const aScore = Number(m.as || 0);
        const diff = Math.abs(hScore - aScore);
        const winner = hScore > aScore ? (m.homeTeam || m.h) : aScore > hScore ? (m.awayTeam || m.a) : 'תיקו';
        const earnedPts = diff >= 20 ? 3 : 2;
        return `משחק ${index + 1}: ${m.homeTeam || m.h} (${hScore}) נגד ${m.awayTeam || m.a} (${aScore}) | מנצחת: ${winner} (הפרש ${diff} נק' -> ${earnedPts} נק' ליגה לפנטזי)`;
    }).join('\n');

    let pollText = 'אין נתוני סקר ניחושים למחזור זה.';
    if (pollData && pollData.votes) {
        const totalVotes = Object.keys(pollData.votes || {}).length;
        pollText = `נתוני סקר הניחושים (חכמת ההמונים): הצביעו ${totalVotes} מנג'רים.`;
    }

    const prompt = `אתה פרשן כדורגל ישראלי בכיר (בסגנון רז זהבי או אבי מלר).
כתוב סיכום מחזור מרגש, מקצועי, מדויק ומשעשע עבור ליגת הפנטזי "לוזון 14".

🚨 חוקי ברזל חובה (קריטי!) 🚨:
1. התבסס אך ורק עובדתית על הנתונים הבאים! אסור לך בשום אופן להמציא נתונים או להניח רצף ניצחונות שלא צוין.
2. ניקוד הליגה נקבע לפי הכללים: ניצחון בהפרש 20 נקודות ומעלה = 3 נקודות ליגה. ניצחון בהפרש קטן מ-20 = 2 נקודות ליגה. תיקו = 1 נקודות.
3. מיקומי הקבוצות והפרשי השערים קבועים מראש - ציין אותם בדיוק כפי שהם!
4. כלול התייחסות לחכמת ההמונים (סקר הניחושים) מול התוצאות בפועל.

--- טבלת הליגה המדויקת ---
${leagueStandingsText}

--- תוצאות משחקי המחזור שהיו ---
${fixturesText}

--- נתוני סקר ניחושים ---
${pollText}

הסיכום צריך לכלול כותרת מרשימה, ניתוח קצר ומדוייק לכל משחק, התייחסות לטבלה ולשחקנים הבולטים, וסלנג כדורגל ישראלי קליל. החזר בפורמט Markdown בלבד.`;

    try {
        const requestPromise = ai.models.generateContent({ model: "gemini-1.5-flash-latest", contents: prompt });
        const response = await fetchWithTimeout(requestPromise, 25000);
        return response.text || "";
    } catch (error: any) {
        console.error("Summary generation failed:", error);
        throw error;
    }
};

export const generateRumors = async (teams: any[], apiKey?: string) => {
    const activeKey = getApiKey(apiKey);
    const ai = new GoogleGenAI({ apiKey: activeKey });

    const teamsWithPlayersText = teams.filter(t => t.id !== 'admin' && t.id !== 'system').map(t => {
        const playersList = (t.squad || []).map((p: any) => p.name).filter(Boolean).join(', ');
        return `* קבוצת ${t.teamName} (מנג\\'ר: ${t.name}):\\\\n  שחקנים בסגל: ${playersList || 'אין שחקנים כרגע'}`;
    }).join('\\\\n\\\\n');

    const prompt = `אתה כתב רכילות ספורט בסגנון \\"צהוב\\" ומשעשע.\\nכתוב 3-4 שמועות חמות מחדרי ההלבשה של ליגת הפנטזי \\"לוזון 14\\".\\n\\n🚨 חוקי ברזל חובה (קריטי!) 🚨\\n1. אתה יכול להמציא סיפורים מאחורי הקלעים (למשל: שחקן רב עם המאמן, איחר לאימון, אכל שווארמה בלילה).\\n2. **אסור** לך בשום פנים ואופן לשייך שחקן לקבוצה הלא נכונה! \\n3. אל תמציא שמות של שחקנים או קבוצות שלא מופיעים ברשימה הבאה.\\n\\n--- רשימת הקבוצות והשחקנים השייכים להן בוודאות ---\\n${teamsWithPlayersText}\\n\\nהחזר את השמועות בפורמט Markdown בצורה של מבזקי חדשות.`;

    try {
        const requestPromise = ai.models.generateContent({ model: "gemini-1.5-flash-latest", contents: prompt });
        const response = await fetchWithTimeout(requestPromise, 25000);
        return response.text || "";
    } catch (error: any) {
        console.error("Rumors generation failed:", error);
        throw error;
    }
};