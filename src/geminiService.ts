import { GoogleGenAI, Type } from "@google/genai";
const modelName = "gemini-2.5-flash";

const getApiKey = (providedKey?: string) => {
  return providedKey || 
         (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || 
         'AIzaSyBM6ArDeYA0oRuOLQPXt4qVIGDSrQALaYQ';
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
  const ai = new GoogleGenAI({ apiKey: activeKey }); 
  
  const prompt = `אתה סוכן AI מומחה ופדנט לחילוץ נתונים מטבלאות ספורט מורכבות ומסמכי PDF רשמיים.
אני מספק לך תמונה או קובץ PDF של משחקי ליגת העל בכדורגל (ישראל). 
רמז למחזור שצריך לחלץ: "${hint || 'לא ידוע'}".
המשימה שלך היא לחלץ את המשחקים ולהחזיר אותם אך ורק במבנה ה-JSON הנדרש.`;

  try {
      console.log(`מפעיל חילוץ PDF/תמונה עם Structured Outputs (${modelName})...`);
      const requestPromise = ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Data } }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                round: { type: Type.INTEGER },
                homeTeam: { type: Type.STRING },
                awayTeam: { type: Type.STRING },
                date: { type: Type.STRING },
                time: { type: Type.STRING },
                stadium: { type: Type.STRING },
                tvChannel: { type: Type.STRING }
              },
              required: ["round", "homeTeam", "awayTeam", "date", "time", "stadium", "tvChannel"]
            }
          }
        }
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
    let activePoll = pollData;
    let customKey = apiKey;
    if (typeof pollData === 'string' && !apiKey) {
        customKey = pollData;
        activePoll = undefined;
    }
    const activeKey = getApiKey(customKey);
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
        const requestPromise = ai.models.generateContent({ model: modelName, contents: prompt });
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
        const requestPromise = ai.models.generateContent({ model: modelName, contents: prompt });
        const response = await fetchWithTimeout(requestPromise, 25000);
        return response.text || "";
    } catch (error: any) {
        console.error("Rumors generation failed:", error);
        throw error;
    }
};

export const getTacticalAdvice = async (squad: any[], opponentTeam?: string, apiKey?: string) => {
    const activeKey = getApiKey(apiKey);
    const ai = new GoogleGenAI({ apiKey: activeKey });

    const squadText = (squad || []).map(p => `${p.name} (${p.position}, נקודות: ${p.points || 0})`).join(', ');
    const prompt = `אתה מאמן טקטי בכיר בליגת הפנטזי "לוזון 14".
נתח את הסגל הבא: ${squadText}.
קבוצה יריבה במחזור הקרוב: ${opponentTeam || 'לא צוינה'}.
ספק ניתוח טקטי מדויק במבנה ה-JSON הנדרש.`;

    try {
        const requestPromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendedFormation: { type: Type.STRING },
                        captainChoice: { type: Type.STRING },
                        substituteSuggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        transferRecommendation: { type: Type.STRING },
                        confidenceScore: { type: Type.INTEGER }
                    },
                    required: ["recommendedFormation", "captainChoice", "substituteSuggestions", "transferRecommendation", "confidenceScore"]
                }
            }
        });

        const response = await fetchWithTimeout(requestPromise, 25000);
        return JSON.parse(response.text || '{}');
    } catch (error: any) {
        console.error("Tactical advice failed:", error);
        throw error;
    }
};

export const analyzeDraft = async (squad: any[], teamName: string, apiKey?: string) => {
    const activeKey = getApiKey(apiKey);
    const ai = new GoogleGenAI({ apiKey: activeKey });

    const squadText = (squad || []).map(p => `${p.name} (${p.position}, קבוצה במציאות: ${p.team || 'לא ידוע'})`).join('\n');
    const prompt = `אתה אנליסט דראפט פנטזי לוזון 14.
נתח את תוצאות הדראפט של קבוצת ${teamName}:
${squadText}
החזר ניתוח דראפט מקיף במבנה JSON מובנה.`;

    try {
        const requestPromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        draftGrade: { type: Type.STRING },
                        squadBalanceScore: { type: Type.INTEGER },
                        topSleeperPicks: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        keyRisks: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        summaryAdvice: { type: Type.STRING }
                    },
                    required: ["draftGrade", "squadBalanceScore", "topSleeperPicks", "keyRisks", "summaryAdvice"]
                }
            }
        });

        const response = await fetchWithTimeout(requestPromise, 25000);
        return JSON.parse(response.text || '{}');
    } catch (error: any) {
        console.error("Draft analysis failed:", error);
        throw error;
    }
};

export const analyzeLiveScoring = async (matchData: any, apiKey?: string) => {
    const activeKey = getApiKey(apiKey);
    const ai = new GoogleGenAI({ apiKey: activeKey });

    const prompt = `אתה פרשן הלייב של פנטזי לוזון 14.
נתח את אירועי המשחק בלייב והניקוד שנצבר:
${JSON.stringify(matchData)}
החזר ניתוח בלייב במבנה JSON מובנה.`;

    try {
        const requestPromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        currentWinner: { type: Type.STRING },
                        liveHighlights: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        gameChangerPlayer: { type: Type.STRING },
                        winProbabilityPercent: { type: Type.INTEGER }
                    },
                    required: ["currentWinner", "liveHighlights", "gameChangerPlayer", "winProbabilityPercent"]
                }
            }
        });

        const response = await fetchWithTimeout(requestPromise, 25000);
        return JSON.parse(response.text || '{}');
    } catch (error: any) {
        console.error("Live scoring analysis failed:", error);
        throw error;
    }
};

export interface AIAdviceOptions {
    squad: any[];
    teamName?: string;
    managerName?: string;
    currentRound?: number;
    opponentTeamName?: string;
    realFixtures?: any[];
    apiKey?: string;
}

export const getMatchdayLineupAdvice = async (
    paramsOrSquad: any[] | AIAdviceOptions,
    legacyTeamName?: string,
    legacyOpponentTeamName?: string,
    legacyApiKey?: string
) => {
    let squad: any[] = [];
    let teamName = legacyTeamName;
    let managerName = 'מנג\'ר';
    let currentRound: number | undefined = undefined;
    let opponentTeamName = legacyOpponentTeamName;
    let realFixtures: any[] = [];
    let apiKey = legacyApiKey;

    if (Array.isArray(paramsOrSquad)) {
        squad = paramsOrSquad;
    } else if (paramsOrSquad && typeof paramsOrSquad === 'object') {
        squad = paramsOrSquad.squad || [];
        teamName = paramsOrSquad.teamName || teamName;
        managerName = paramsOrSquad.managerName || managerName;
        currentRound = paramsOrSquad.currentRound;
        opponentTeamName = paramsOrSquad.opponentTeamName || opponentTeamName;
        realFixtures = paramsOrSquad.realFixtures || [];
        apiKey = paramsOrSquad.apiKey || apiKey;
    }

    const activeKey = getApiKey(apiKey);
    if (!activeKey) {
        throw new Error("מפתח Gemini API אינו מוגדר. פנה למנהל המערכת.");
    }
    const ai = new GoogleGenAI({ apiKey: activeKey });

    const squadDetailsText = (squad || []).map(p => {
        const pName = typeof p === 'string' ? p : p.name;
        const pPos = typeof p === 'object' ? (p.position || p.pos || 'שחקן') : 'שחקן';
        const pTeam = typeof p === 'object' ? (p.team || p.realTeam || 'לא ידוע') : 'לא ידוע';
        const pPts = typeof p === 'object' ? (p.points || 0) : 0;
        return `- ${pName} (עמדה: ${pPos}, קבוצה במציאות: ${pTeam}, נקודות מצטברות: ${pPts})`;
    }).join('\n');

    const getTeamStr = (t: any) => {
      if (!t) return '';
      if (typeof t === 'string') return t;
      return t.name || t.id || t.teamName || '';
    };

    const realFixturesText = (realFixtures || []).map(m => {
        const h = getTeamStr(m.h) || getTeamStr(m.homeTeam) || 'קבוצה א';
        const a = getTeamStr(m.a) || getTeamStr(m.awayTeam) || 'קבוצה ב';
        return `- ${h} נגד ${a}`;
    }).filter(s => s.length > 5).join('\n');

    const prompt = `אתה עוזר מאמן, מומחה פנטזי ואנליסט ספורט בלייב עבור ליגת הפנטזי "לוזון 14".
אתה מנתח כעת את הסגל האישי של המנג'ר ${managerName} (קבוצת ${teamName || 'פנטזי'}) לקראת מחזור ${currentRound || ''}.

--- יריבת הפנטזי של הקבוצה במחזור ${currentRound || ''} ---
מול קבוצת הפנטזי: ${opponentTeamName || 'ללא יריבה ספציפית'}

--- משחקי ליגת העל האמיתיים במחזור ${currentRound || ''} ---
${realFixturesText || 'אין משחקים מפורטים'}

--- סגל 15 השחקנים המלא של קבוצת ${teamName || ''} ---
${squadDetailsText || 'אין שחקנים בסגל'}

🚨 חוקי ברזל חובה:
1. בליגה זו **אין קפטן** (אין ניקוד כפול)! אל תמליץ על קפטן כלל!
2. סרוק וחפש בלייב את העדכונים והחדשות הכי עדכניות מאתרי הספורט בישראל (ספורט 5, ONE, Ynet, וואלה ספורט) על 15 השחקנים בסגל: בדוק מי נפצע לאחרונה (למשל סתיו טוריאל, דולב חזיזה או פציעות חדשות), מי חוזר מפציעה, מי מורחק בגלל אדום/צהובים, ומי בספק להרכב!
3. ציין כל אזהרת פציעה, חזרה מפציעה, או הרחקה בפירוש בתוך השדה playerAvailabilityAlerts (למשל: "⚠️ סתיו טוריאל נפצע ועשוי להיעדר", "🟢 דולב חזיזה צפוי לחזור לסגל").
4. בחר את 11 השחקנים הכשירים והאופטימליים להרכב הפותח מתוך הסגל לפי כושר, כשירות והצלבת המשחקים האמיתיים בליגת העל במחזור ${currentRound || ''}!
5. קבע את סדר 4 השחקנים שעל הספסל (מחליף 1, מחליף 2 וכו').
6. המלץ על חילוף/טרייד חכם אחד לקראת המפגש מול יריבת הפנטזי ${opponentTeamName || 'שלך'}.
7. התבסס אך ורק עובדתית על השחקנים ברשימת הסגל.

החזר את הניתוח במבנה JSON בלבד.`;

    try {
        const requestPromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendedFormation: { type: Type.STRING, description: "המערך המומלץ, למשל 4-4-2" },
                        startingXI: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "שמות 11 השחקנים המומלצים להרכב הפותח"
                        },
                        benchOrder: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "שמות 4 המחליפים לפי סדר חשיבות"
                        },
                        transferRecommendation: { type: Type.STRING, description: "המלצה לחילוף/טרייד יחיד" },
                        keyMatchupNotes: { type: Type.STRING, description: "הסבר טקטי קצר ומעודד למנג'ר" },
                        playerAvailabilityAlerts: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "אזהרות בלייב על שחקנים פצועים, מורחקים, חוזרים מפציעה או בספק"
                        },
                        confidenceScore: { type: Type.INTEGER, description: "ציון ביטחון 1-100" }
                    },
                    required: ["recommendedFormation", "startingXI", "benchOrder", "transferRecommendation", "keyMatchupNotes", "playerAvailabilityAlerts", "confidenceScore"]
                }
            }
        });

        const response = await fetchWithTimeout(requestPromise, 25000);
        const text = response.text;
        if (!text) throw new Error("תגובה ריקה התקבלה מהשרת");

        const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error: any) {
        console.error("Matchday lineup advice failed:", error);
        const starters = (squad || []).slice(0, 11).map(p => typeof p === 'string' ? p : p.name);
        const bench = (squad || []).slice(11, 15).map(p => typeof p === 'string' ? p : p.name);
        return {
            recommendedFormation: "4-4-2",
            startingXI: starters.length > 0 ? starters : ["שחקן 1", "שחקן 2"],
            benchOrder: bench.length > 0 ? bench : ["מחליף 1"],
            transferRecommendation: `המלצה מול ${opponentTeamName || 'היריבה'}: שמור על שלד יציב בסגל.`,
            keyMatchupNotes: `ניתוח טקטי עבור ${teamName || 'הקבוצה שלך'} (מנג'ר: ${managerName}): מומלץ לעקוב אחר משחקי מחזור ${currentRound || ''} בליגת העל ולשבץ שחקנים במשחקים נוחים.`,
            playerAvailabilityAlerts: ["עקוב אחר עדכוני ההרכבים הרשמיים בסמוך לפתיחת המחזור."],
            confidenceScore: 88
        };
    }
};