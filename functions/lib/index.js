"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerSheetSync = exports.scheduledSheetSync = exports.scheduledCalendarSync = exports.updateRealFixtures = exports.whatsappWebhook = exports.sendCustomPushNotification = exports.fetchLiveFixtures = exports.scheduledSync = exports.onFixturesChangeSync = exports.onUserChangeSync = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
admin.initializeApp();
const db = admin.firestore();
(0, v2_1.setGlobalOptions)({ region: 'us-west1' });
// region --- Copied Types from src/types.ts ---
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["OWNER"] = "OWNER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["MODERATOR"] = "MODERATOR";
    UserRole["ARENA_MANAGER"] = "ARENA_MANAGER";
})(UserRole || (UserRole = {}));
// endregion
// region --- Logic ported from LiveArena.tsx for server-side calculation ---
const applySubstitutionsToLineup = (team, currentRound) => {
    if (!team)
        return [];
    let currentLineup = [...(team.published_lineup || [])];
    const bench = team.published_subs_out || [];
    const roundSubs = (team.transfers || []).filter((t) => t.type === 'HALFTIME_SUB' && t.round === currentRound && t.status !== 'CANCELLED');
    const sortedSubs = roundSubs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    sortedSubs.forEach((sub) => {
        const outIndex = currentLineup.findIndex(p => p.name === sub.playerOut);
        const inPlayer = bench.find((p) => p.name === sub.playerIn);
        if (outIndex !== -1 && inPlayer) {
            currentLineup[outIndex] = inPlayer;
        }
    });
    return currentLineup;
};
const calculateTeamScore = (team, currentRound) => {
    if (!team)
        return 0;
    let total = 0;
    const currentLineup = applySubstitutionsToLineup(team, currentRound);
    if (currentLineup) {
        total += currentLineup.reduce((sum, p) => sum + (Number(p.points) || 0), 0);
    }
    const roundSubs = (team.transfers || []).filter((t) => t.type === 'HALFTIME_SUB' && t.round === currentRound && t.status !== 'CANCELLED');
    roundSubs.forEach((sub) => {
        const allPossibleOutPlayers = [...(team.published_subs_out || []), ...(team.squad || [])];
        const benchedPlayerOut = allPossibleOutPlayers.find((p) => p.name === sub.playerOut);
        if (benchedPlayerOut) {
            total += (Number(benchedPlayerOut.points) || 0);
        }
    });
    return total;
};
const getTeamLiveEvents = (team, currentRound) => {
    if (!team)
        return { goals: 0, yellows: 0, reds: 0 };
    let goals = 0, yellows = 0, reds = 0;
    const playersInPlay = new Set();
    const currentLineup = applySubstitutionsToLineup(team, currentRound);
    currentLineup.forEach((player) => {
        if (player.stats) {
            goals += (player.stats.goals || 0);
            if (player.stats.yellow)
                yellows++;
            if (player.stats.secondYellow)
                yellows++;
            if (player.stats.red)
                reds++;
        }
        playersInPlay.add(player.name);
    });
    const subbedOutPlayers = (team.transfers || [])
        .filter((t) => t.type === 'HALFTIME_SUB' && t.round === currentRound && t.status !== 'CANCELLED')
        .map((sub) => {
        const allPlayers = [...(team.published_subs_out || []), ...(team.squad || [])];
        return allPlayers.find((p) => p.name === sub.playerOut);
    })
        .filter(Boolean);
    subbedOutPlayers.forEach((player) => {
        if (player && player.stats && !playersInPlay.has(player.name)) {
            goals += (player.stats.goals || 0);
            if (player.stats.yellow)
                yellows++;
            if (player.stats.secondYellow)
                yellows++;
            if (player.stats.red)
                reds++;
        }
    });
    return { goals, yellows, reds };
};
const isPosMatch = (pPos, category) => {
    if (!pPos)
        return false;
    const pos = pPos.toUpperCase();
    if (category === 'GK')
        return ['GK', 'שוער'].includes(pos);
    if (category === 'DEF')
        return ['DEF', 'הגנה', 'בלם', 'מגן'].includes(pos);
    if (category === 'MID')
        return ['MID', 'קשר', 'קישור'].includes(pos);
    if (category === 'FWD')
        return ['FWD', 'חלוץ', 'התקפה'].includes(pos);
    return false;
};
const getFormation = (lineup) => {
    if (!lineup || lineup.length !== 11)
        return '';
    const def = lineup.filter(p => isPosMatch(p.position, 'DEF')).length;
    const mid = lineup.filter(p => isPosMatch(p.position, 'MID')).length;
    const fwd = lineup.filter(p => isPosMatch(p.position, 'FWD')).length;
    return `${def}-${mid}-${fwd}`;
};
// endregion
const performSync = async () => {
    console.log('Starting Live Arena sync...');
    const [settingsSnap, fixturesSnap, teamsSnap] = await Promise.all([
        db.doc('leagueData/settings').get(),
        db.doc('leagueData/fixtures').get(),
        db.collection('users').where('role', 'in', ['USER', 'OWNER']).get()
    ]);
    if (!settingsSnap.exists || !fixturesSnap.exists) {
        console.error('Settings or Fixtures do not exist. Aborting sync.');
        return;
    }
    const { currentRound } = settingsSnap.data();
    const allTeams = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const allRounds = fixturesSnap.data()?.rounds || [];
    const currentFixtures = allRounds.find(r => r.round === currentRound);
    if (!currentFixtures || !currentFixtures.matches) {
        console.log(`No matches found for current round: ${currentRound}. Clearing live data.`);
        await db.doc('liveData/arena').set({ matches: [], teams: {}, currentRound, lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
        return;
    }
    const processedTeams = {};
    for (const team of allTeams) {
        const lineup = applySubstitutionsToLineup(team, currentRound);
        processedTeams[team.id] = {
            id: team.id,
            teamName: team.teamName,
            manager: team.manager,
            liveScore: calculateTeamScore(team, currentRound),
            liveEvents: getTeamLiveEvents(team, currentRound),
            formation: getFormation(lineup),
            lineup: lineup,
        };
    }
    const liveArenaData = {
        teams: processedTeams,
        matches: currentFixtures.matches,
        currentRound: currentRound,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.doc('liveData/arena').set(liveArenaData);
    console.log(`Live Arena sync completed successfully for round ${currentRound}.`);
};
exports.onUserChangeSync = (0, firestore_1.onDocumentWritten)('users/{userId}', async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    if (JSON.stringify(beforeData?.squad) !== JSON.stringify(afterData?.squad)) {
        await performSync();
    }
});
exports.onFixturesChangeSync = (0, firestore_1.onDocumentWritten)('leagueData/fixtures', async (event) => {
    await performSync();
});
exports.scheduledSync = (0, scheduler_1.onSchedule)('every 2 minutes', async (event) => {
    await performSync();
});
// --- Web Scraping Environment ---
const SCRAPER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7'
};
const createScraper = (name, scrapeFunc) => ({
    name,
    scrape: scrapeFunc,
});
const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};
const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};
const scrapeIFA = async (roundHint) => {
    return [];
};
const scrapeSport5 = async (roundHint) => {
    console.log(`Attempting to scrape Sport5 with round hint: ${roundHint}`);
    try {
        const { data } = await axios_1.default.get('https://www.sport5.co.il/Games.aspx?FolderID=44&lang=HE', { headers: SCRAPER_HEADERS });
        const $ = cheerio.load(data);
        const matches = [];
        $('.table-games tr').each((i, row) => {
            if (i === 0)
                return;
            try {
                const columns = $(row).find('td');
                if (columns.length > 5) {
                    const roundText = $(columns[0]).text().trim();
                    const homeTeam = $(columns[1]).text().trim();
                    const score = $(columns[2]).text().trim();
                    const awayTeam = $(columns[3]).text().trim();
                    const date = $(columns[4]).text().trim();
                    const time = $(columns[5]).text().trim();
                    const stadium = $(columns[6]).text().trim();
                    const status = "Scheduled";
                    // מחלץ רק מספרים כדי למנוע קריסה מול המילה "פלייאוף"
                    const matchRound = roundText.match(/\d+/);
                    const round = matchRound ? parseInt(matchRound[0], 10) : 0;
                    if (roundHint) {
                        // הלוגיקה שממירה למספרי פלייאוף (אם גדול מ-26, פחות 26)
                        const altRound = roundHint > 26 ? roundHint - 26 : roundHint;
                        if (round !== roundHint && round !== altRound) {
                            return; // מדלג אם זה לא המחזור שביקשנו או מחזור הפלייאוף המקביל
                        }
                    }
                    let hs = '';
                    let as = '';
                    if (score.includes('-')) {
                        [hs, as] = score.split('-').map(s => s.trim());
                    }
                    matches.push({
                        round: roundHint || round, // שומרים את מספר המחזור הראשי כדי שהאפליקציה שלנו תבין
                        homeTeam,
                        awayTeam,
                        date,
                        time,
                        stadium,
                        hs: hs || "",
                        as: as || "",
                        status: status,
                    });
                }
            }
            catch (e) {
                console.warn(`Failed to parse a row from Sport5`, { error: e.message });
            }
        });
        return matches;
    }
    catch (error) {
        console.error("ScrapeSport5 failed:", { error: error.message, status: error.response?.status });
        return [];
    }
};
const scrapeONE = async (roundHint) => {
    return [];
};
const scrape365 = async (roundHint) => {
    console.log(`Attempting to scrape 365Scores with round hint: ${roundHint}`);
    try {
        const { data } = await axios_1.default.get('https://webws.365scores.com/web/games/current/?appTypeId=5&langId=2&timezoneName=Asia/Jerusalem&competitions=11', { headers: SCRAPER_HEADERS });
        const allGames = data.games || [];
        let filteredGames = allGames;
        if (roundHint) {
            // הוספת התמיכה בפלייאוף: בודק גם את המחזור המקורי וגם את "הגרסה המקוצרת" של מנהלת הליגות
            const altRound = roundHint > 26 ? roundHint - 26 : roundHint;
            filteredGames = allGames.filter((game) => game.roundNum === roundHint || game.roundNum === altRound);
        }
        return filteredGames.map((game) => {
            const startTime = new Date(game.startTime);
            return {
                round: roundHint || game.roundNum, // חשוב מאוד: אונסים את השרת לשמור תחת מחזור 33 ולא מחזור 7
                homeTeam: game.competitors[0]?.name || '',
                awayTeam: game.competitors[1]?.name || '',
                date: formatDate(startTime),
                time: formatTime(startTime),
                stadium: game.venue?.name || '',
                hs: game.competitors[0]?.score >= 0 ? game.competitors[0].score : '',
                as: game.competitors[1]?.score >= 0 ? game.competitors[1].score : '',
                status: game.statusText || '',
            };
        });
    }
    catch (error) {
        console.error("Scrape365 failed:", { error: error.message, status: error.response?.status });
        return [];
    }
};
exports.fetchLiveFixtures = (0, https_1.onCall)({ region: 'us-west1', cors: true }, async (request) => {
    const roundHintRaw = request.data?.roundHint;
    const roundHint = roundHintRaw ? Number(roundHintRaw) : undefined;
    console.log(`Requested sync for round: ${roundHint}`);
    const scrapers = [
        createScraper('365Scores', scrape365),
        createScraper('Sport5', scrapeSport5),
        createScraper('IFA', scrapeIFA),
        createScraper('ONE', scrapeONE),
    ];
    let finalMatches = [];
    let successfulScraper = '';
    for (const scraper of scrapers) {
        try {
            console.log(`Trying scraper: ${scraper.name}`);
            const result = await scraper.scrape(roundHint);
            if (result && result.length > 0) {
                console.log(`Scraper ${scraper.name} succeeded with ${result.length} matches.`);
                finalMatches = result;
                successfulScraper = scraper.name;
                break;
            }
            else {
                console.log(`Scraper ${scraper.name} returned no data.`);
            }
        }
        catch (error) {
            console.warn(`Scraper ${scraper.name} failed.`, { message: error.message });
        }
    }
    if (finalMatches.length === 0) {
        console.error('All scrapers failed to fetch fixtures or returned empty arrays.');
        throw new functions.https.HttpsError('internal', 'All scrapers failed to fetch data.');
    }
    return { success: true, source: successfulScraper, matches: finalMatches };
});
exports.sendCustomPushNotification = (0, https_1.onCall)({ region: 'us-west1', cors: true }, async (request) => {
    const { title, message, targetUserId } = request.data || {};
    if (!title || !message) {
        throw new functions.https.HttpsError('invalid-argument', 'Title and message are required.');
    }
    const tokens = [];
    if (targetUserId && targetUserId !== 'ALL') {
        const userDoc = await db.collection('users').doc(targetUserId).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            if (data?.fcmTokens && Array.isArray(data.fcmTokens)) {
                tokens.push(...data.fcmTokens.filter((t) => typeof t === 'string' && t.trim()));
            }
            else if (data?.fcmToken && typeof data.fcmToken === 'string') {
                tokens.push(data.fcmToken);
            }
        }
    }
    else {
        const usersSnap = await db.collection('users').get();
        usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
                tokens.push(...data.fcmTokens.filter((t) => typeof t === 'string' && t.trim()));
            }
            else if (data.fcmToken && typeof data.fcmToken === 'string') {
                tokens.push(data.fcmToken);
            }
        });
    }
    if (tokens.length === 0) {
        return { success: true, count: 0, message: 'No registered FCM tokens found.' };
    }
    const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
            title,
            body: message,
        },
        data: {
            title,
            body: message,
        },
        webpush: {
            headers: {
                Urgency: 'high'
            },
            notification: {
                title,
                body: message,
                icon: '/app-icon.png',
                badge: '/app-icon.png',
                requireInteraction: true
            }
        }
    });
    return { success: true, count: response.successCount, failed: response.failureCount };
});
// 🟢 עוזר AI חכם של ג'מיני למענה על שאלות פנטזי לוזון ב-WhatsApp 🟢
const askGeminiFantasyAI = async (userPrompt, senderPhone = '') => {
    let managerName = 'מנג\'ר';
    try {
        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyARwamUBjcirbqFtWn_RpKkOdiHmeGlis0';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        // Map manager phone to name & team
        const cleanPhone = String(senderPhone || '').replace(/\D/g, '');
        let managerInfo = '';
        if (cleanPhone.includes('972525001777'))
            managerInfo = 'ערן (מנג\'ר קבוצת חמסילי)';
        else if (cleanPhone.includes('14049608805') || cleanPhone.includes('972522390580'))
            managerInfo = 'אסף (מנג\'ר קבוצת חמסילי)';
        else if (cleanPhone.includes('972505919869'))
            managerInfo = 'גיא (מנג\'ר קבוצת חראלה)';
        else if (cleanPhone.includes('972535330428'))
            managerInfo = 'אלי (מנג\'ר קבוצת תומאלי)';
        else if (cleanPhone.includes('972526330513'))
            managerInfo = 'תום (מנג\'ר קבוצת תומאלי)';
        else if (cleanPhone.includes('972504014734'))
            managerInfo = 'ארז (מנג\'ר קבוצת חולוניה)';
        else if (cleanPhone.includes('18133779008'))
            managerInfo = 'יינון (מנג\'ר קבוצת טמפה)';
        else if (cleanPhone.includes('972524414371'))
            managerInfo = 'שלומי (מנג\'ר קבוצת פיצ\'יצי)';
        managerName = managerInfo ? managerInfo.split(' ')[0] : 'מנג\'ר';
        // Fetch live Firestore teams standings & real Hall of Fame history & real fixtures
        let standingsContext = '';
        let historyContext = '';
        let realFixturesList = [];
        try {
            const usersSnap = await db.collection('users').get();
            const teamsList = usersSnap.docs
                .map(d => ({ name: d.data().teamName || d.data().name || d.id, manager: d.data().manager || '', points: d.data().points || 0 }))
                .filter(t => t.name !== 'admin' && t.name !== 'system')
                .sort((a, b) => b.points - a.points);
            standingsContext = teamsList.map((t, idx) => `מקום ${idx + 1}: ${t.name} (מנג'ר: ${t.manager}) | ${t.points} נק'`).join('\n');
            const historySnap = await db.collection('leagueData').doc('history').get();
            if (historySnap.exists) {
                const seasons = historySnap.data()?.seasons || [];
                historyContext = seasons.map((s) => `עונה ${s.season}: אלופה = ${s.champ}, סגנית = ${s.runnerUp || 'ללא'}, גביע = ${s.cup || 'ללא'}`).join('\n');
            }
            const realSnap = await db.collection('leagueData').doc('real_fixtures').get();
            if (realSnap.exists) {
                realFixturesList = realSnap.data()?.matches || [];
            }
        }
        catch (err) {
            console.error('Error fetching Firestore context for AI:', err);
        }
        // 1. Fast Smart Router for Intro, Managers, Fixtures & Hall of Fame (100% accurate, zero latency)
        const p = userPrompt.toLowerCase();
        if (p.includes('תציג') || p.includes('מי אתה') || p.includes('הכרות') || p.includes('מיזה') || p.includes('מי זה')) {
            return `⚽ **שלום לכל 6 המנג'רים של פנטזי לוזון 14!** 🏆\n\nאני **לוזון Bot** – ה-AI הרשמי, הטקטיקן והפרשן של הליגה!\n\n🔔 **איך מפעילים אותי? (חוק הברזל 🚨):**\nפשוט כותבים בתחילת המשפט **"לוזון"** או **"היי לוזון"** (למשל: *"לוזון מתי המשחק של חיפה?"*).\nאם לא תכתבו *"לוזון"* בתחילת המשפט – אשאר שקט 100% ולא אציק בשיחה בקבוצה!\n\n💡 **מה אני יודע לעשות עבורכם?**\n👤 **מזהה את כולכם אישית**: ערן ואסף (*חמסילי*), יינון הטמפון (*טמפה*), אלי ותום (*תומאלי*), שלומי (*פיצ'יצי*), גיא (*חראלה*) וארז (*חולוניה*)!\n📊 **עדכוני ניקוד ואירועים בלייב**: כותבים בקבוצה *"לוזון חוגי כבש"* או *"לוזון ניקוד חמסילי 14"*.\n🧠 **ייעוץ טקטי וליגת העל**: שואלים אותי *"לוזון מתי המשחק של חיפה?"* או *"לוזון איזה הרכב לפתוח?"*.\n📜 **היכל התהילה**: מכיר את כל 13 העונות, האליפויות והגביעים של כל הזמנים!\n\n📢 **בסיום כל מחזור**: אשלח לכם פה בקבוצה **סיכום מחזור, טבלה מעודכנת ואת המשחקים של המחזור הבא!**\n\n⚠️ **הערה קטנה**: אני כרגע בגרסת פיילוט/הרצה חדשה. אם פספסתי משהו, תהיו סבלניים – ערן ואני משדרגים אותי בלייב בכל יום!\n\n**בהצלחה לכולם בדראפט היום (יום שני)! 🔥⚽**`;
        }
        if (p.includes('מתחיל') || p.includes('מתי הליגה') || p.includes('פתיחת') || p.includes('מתי מתחילה')) {
            return `⚽ **פנטזי לוזון 14:**\nאהלן ${managerName}! הדראפט של הליגה נערך **היום (יום שני, 17/08/2026)!** 🏆\nמשחקי מחזור 1 בליגת העל מתחילים ב-**22/08/2026** (המשחק הפותח: מכבי חיפה נגד הפועל רמת גן בשעה 20:00 בסמי עופר)! 🏟️🔥`;
        }
        // Dynamic Real Fixtures Search in Firestore for any team (e.g. חיפה, תל אביב, בית"ר)
        if (p.includes('משחק') || p.includes('חיפה') || p.includes('תל אביב') || p.includes('באר שבע') || p.includes('בית"ר')) {
            const teamQuery = p.includes('חיפה') ? 'חיפה' : p.includes('תל אביב') ? 'תל אביב' : p.includes('באר שבע') ? 'באר שבע' : p.includes('בית"ר') ? 'בית"ר' : '';
            const match = realFixturesList.find((m) => (m.homeTeam && m.homeTeam.includes(teamQuery)) || (m.awayTeam && m.awayTeam.includes(teamQuery))) || realFixturesList[0];
            if (match) {
                return `⚽ **משחק ליגת העל הקרוב (מחזור ${match.round}):**\n🏟️ **${match.homeTeam} נגד ${match.awayTeam}**\n📅 תאריך: ${match.date} בשעה ${match.time} (אצטדיון: ${match.stadium || 'ישראל'})! 📺`;
            }
        }
        if (p.includes('אלופה מכהנת') || p.includes('אלופה כרגע') || p.includes('מי האלופה') || p.includes('מי אלופה')) {
            if (p.includes('על') || p.includes('אמיתית') || p.includes('ישראל')) {
                return `⚽ **ליגת העל האמיתית:**\nהאלופה המכהנת כרגע בליגת העל היא **הפועל באר שבע!** 🏆\n*(ובפנטזי לוזון האלופה המכהנת מעונה 13 היא קבוצת תומאלי - אלי ותום! 👑)*`;
            }
            return `⚽ **אלופות מכהנות:**\n👑 **בפנטזי לוזון (עונה 13):** קבוצת **תומאלי** (אלי ותום) היא האלופה המכהנת! 🏆\n⚽ **בליגת העל האמיתית:** **הפועל באר שבע** היא האלופה המכהנת! 🏆`;
        }
        if (p.includes('לינק') || p.includes('קישור') || p.includes('אתר') || p.includes('אפליקציה') || p.includes('הורדה') || p.includes('פוש') || p.includes('התראות')) {
            return `🌐 **הלינק הרשמי לאתר פנטזי לוזון 14:**\n🔗 https://fantasy-luzon.web.app\n\n📲 **איך מתקינים את האפליקציה בנייד?**\n🍏 **אייפון (Safari):**\n1. פותחים את הלינק ב-Safari.\n2. לוחצים על כפתור השיתוף בתחתית המסך (מרובע עם חץ למעלה 📤).\n3. בוחרים **"הוסף למסך הבית"** (*Add to Home Screen*) 📲.\n\n🤖 **אנדרואיד (Chrome):**\n1. פותחים את הלינק ב-Chrome.\n2. לוחצים על 3 הנקודות 🛠️ בצד למעלה.\n3. בוחרים **"התקן אפליקציה"** (*Install App*) או **"הוסף למסך הבית"**.\n\n🔔 **חשיבות אישור התראות פוש (Push Notifications):**\nקבלת התראות בלייב על שערים, עדכוני ניקוד בזמן אמת, סיומי מחזור ושינויים קריטיים!\n• **באייפון:** הגדרות המכשיר ⚙️ ⬅️ התראות ⬅️ Safari / פנטזי לוזון ⬅️ **אפשר התראות!**\n• **באנדרואיד:** הגדרות ⚙️ ⬅️ אפליקציות ⬅️ Chrome / פנטזי לוזון ⬅️ התראות ⬅️ **אפשר!**`;
        }
        if (p.includes('ניר ביטון') || p.includes('ביטון')) {
            return `⚽ **ניר ביטון (Nir Bitton):**\nבלם/קשר נבחרת ישראל, מכבי תל אביב וסלטיק לשעבר. כיום (2026) שחקן חופשי לאחר סיום חוזהו במכבי תל אביב ושיקום מפציעה בברך! ⚽`;
        }
        if (p.includes('חמסילי')) {
            return `⚽ **פנטזי לוזון 14:**\nאהלן ${managerName}! לקבוצת **חמסילי** (ערן ואסף) יש **4 אליפויות היסטוריות!** 🏆🏆🏆🏆 *(עונות 6, 8, 10, 12)*, 4 סגנויות 🥈 ו-2 דאבלים 🌟!`;
        }
        if (p.includes('טמפה') || p.includes('יינון')) {
            return `⚽ **פנטזי לוזון 14:**\nקבוצת **טמפה** מנוהלת ע"י **יינון הטמפון**! 🏆 יש לו **3 אליפויות היסטוריות** *(עונות 1, 2, 9)* וסגנות 1! ⚽`;
        }
        if (p.includes('תומאלי') || p.includes('תום') || p.includes('אלי')) {
            return `⚽ **פנטזי לוזון 14:**\nקבוצת **תומאלי** מנוהלת ע"י **אלי ותום**! 🏆 יש להם **2 אליפויות היסטוריות** (כולל עונה 13 - האלופה המכהנת! 👑) ו-2 גביעים!`;
        }
        if (p.includes('פיצ') || p.includes('שלומי')) {
            return `⚽ **פנטזי לוזון 14:**\nקבוצת **פיצ'יצי** מנוהלת ע"י **שלומי**! 🏆 יש לו **2 אליפויות היסטוריות** *(עונות 4, 7)* וגביע 1! ⚽`;
        }
        if (p.includes('חראלה') || p.includes('גיא')) {
            return `⚽ **פנטזי לוזון 14:**\nקבוצת **חראלה** מנוהלת ע"י **גיא**! 🏆 יש לו **אליפות 1 היסטורית** *(עונה 11)* ו-3 גביעים! 🏆🏆🏆`;
        }
        if (p.includes('חולוניה') || p.includes('ארז')) {
            return `⚽ **פנטזי לוזון 14:**\nקבוצת **חולוניה** מנוהלת ע"י **ארז**! 🥈 יש לו סגנות 1 היסטורית *(עונה 9)*.`;
        }
        if (p.includes('אליפות') || p.includes('אליפויות') || p.includes('מי לקח') || p.includes('היכל התהילה')) {
            return `🏆 **היכל התהילה של פנטזי לוזון:**\n1. 🥇 חמסילי (ערן ואסף): 4 אליפויות 🏆🏆🏆🏆\n2. 🥈 טמפה (יינון): 3 אליפויות 🏆🏆🏆\n3. 🥉 תומאלי (אלי ותום): 2 אליפויות 🏆🏆 (האלופה המכהנת עונה 13!)\n4. ⚽ פיצ'יצי (שלומי): 2 אליפויות 🏆🏆\n5. ⚽ חראלה (גיא): 1 אליפות 🏆\n6. ⚽ חמסה (אסף עבר): 1 אליפות 🏆`;
        }
        const realFixturesContext = realFixturesList.slice(0, 10).map((m) => `מחזור ${m.round}: ${m.homeTeam} נגד ${m.awayTeam} (${m.date} בשעה ${m.time}, אצטדיון: ${m.stadium || 'ישראל'})`).join('\n');
        const systemInstruction = `אתה עוזר ה-AI הרשמי, הטקטיקן, הפרשן והסטטיסטיקאי הבכיר של ליגת "פנטזי לוזון 14" (Fantasy Luzon). 
תפקידך להשיב בשפה עברית קולחת, מצחיקה, ספורטיבית ומדויקת לחלוטין למנג'רים בליגה ב-WhatsApp.

${managerInfo ? `👤 מנג'ר נוכחי שפונה אליך כרגע ב-WhatsApp: ${managerInfo}\nפנה אליו בשמו הפרטי בחמימות ובסגנון ספורטיבי!` : ''}

🏆 היכל התהילה הרשמי של פנטזי לוזון (מיפוי קבוצות ומנג'רים מדויק):

1. 🥇 **קבוצת חמסילי** (מנג'רים: **ערן ואסף**):
   - 4 אליפויות 🏆🏆🏆🏆, 4 סגנויות 🥈, 2 דאבלים 🌟!
   *(הערה היסטורית: אסף ניהל בעבר את קבוצת "חמסה", והתאחד עם ערן לקבוצת חמסילי!).*

2. 🥈 **קבוצת טמפה** (מנג'ר: **יינון הטמפון**):
   - 3 אליפויות 🏆🏆🏆, 1 סגנות 🥈!

3. 🥉 **קבוצת תומאלי** (מנג'רים: **אלי ותום** - אלי הוא אבא של תום, בעבר נקראו "תום מכבי"):
   - 2 אליפויות 🏆🏆 (כולל עונה 13 - האלופה המכהנת!), 2 סגנויות 🥈!

4. ⚽ **קבוצת פיצ'יצי** (מנג'ר: **שלומי**):
   - 2 אליפויות 🏆🏆, 1 סגנות 🥈!

5. ⚽ **קבוצת חראלה** (מנג'ר: **גיא**):
   - 1 אליפות 🏆, 3 סגנויות 🥈!

6. ⚽ **קבוצת חולוניה** (מנג'ר: **ארז**):
   - 0 אליפויות, 1 סגנות 🥈!

7. 📜 **קבוצת חמסה** (קבוצת עבר של אסף לפני האיחוד עם ערן):
   - 1 אליפות 🏆, 1 סגנות 🥈, 1 דאבל 🌟!

📜 פירוט מלא לפי עונות בסיס הנתונים:
${historyContext}

📊 מצב הליגה כרגע (עונה 14):
${standingsContext || 'עונה 14 בפתח לקראת הדראפט!'}

⚽ משחקי ליגת העל הקרובים המסונכרנים בלייב:
${realFixturesContext || 'לוח המשחקים מעודכן במערכת!'}

🚨 חוקי תגובה מיוחדים 🚨:
- אם ההודעה היא "תציג את עצמך", "מי אתה" או "הכרות" (למשל "היי לוזון תציג את עצמך"): תן הצגה עצמית מלהיבה, מצחיקה ומקצועית! ברך בברכת "בהצלחה בדראפט היום (יום שני)!". הסבר שאתה ה-AI והפרשן הרשמי של פנטזי לוזון 14, שאתה מזהה את כל 6 המנג'רים (ערן, אסף, גיא, אלי, תום, ארז, יינון הטמפון, שלומי), שאתה מנקד ומעדכן בלייב, נותן טיפים טקטיים, ובסיום כל מחזור תשלח בקבוצה סיכום מחזור, טבלה מעודכנת ואת המשחקים של המחזור הבא! הוסף הערת סיומת חביבה: "⚠️ הערה קטנה: אני בגרסת פיילוט/הרצה חדשה. אם פספסתי משהו, תהיו סבלניים – ערן ואני משדרגים אותי בלייב בכל יום!"
- אחרת: ענה בקצרה (עד 3-4 שורות), בצורה מבריקה, עם נתונים מדויקים לחלוטין מתוך היכל התהילה ואימוג'ים!`;
        const response = await axios_1.default.post(url, {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `${systemInstruction}\n\nשאלה מהמנג'ר: "${userPrompt}"` }]
                }
            ]
        });
        const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply)
            return reply.trim();
        return `⚽ **פנטזי לוזון 14:**\nאהלן ${managerName}! לקבוצת **חמסילי** (ערן ואסף) יש **4 אליפויות היסטוריות!** 🏆🏆🏆🏆 (עונות 6, 8, 10, 12) ו-4 גביעים! האלופה המכהנת בעונה 13 היא תומאלי! 👑`;
    }
    catch (e) {
        console.error('Error querying Gemini AI:', e?.message || e);
        return `⚽ **פנטזי לוזון 14:**\nאהלן ${managerName}! לקבוצת **חמסילי** (ערן ואסף) יש **4 אליפויות היסטוריות!** 🏆🏆🏆🏆 *(עונות 6, 8, 10, 12)* ו-4 גביעים! האלופה המכהנת עונה 13 היא תומאלי! 👑`;
    }
};
// 🟢 WhatsApp AI Webhook Endpoint (Meta WhatsApp Cloud API / Twilio) 🟢
exports.whatsappWebhook = (0, https_1.onRequest)({ region: 'us-west1', cors: true }, async (req, res) => {
    const VERIFY_TOKEN = 'luzon_fantasy_whatsapp_2026';
    // 1. GET Request: Meta Webhook Verification Challenge
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WhatsApp Webhook Verified Successfully!');
            res.status(200).send(challenge);
            return;
        }
        else {
            res.status(403).send('Verification token mismatch');
            return;
        }
    }
    // 2. POST Request: Incoming WhatsApp Message / Voice Note (Meta Cloud API or Green API)
    if (req.method === 'POST') {
        try {
            const body = req.body;
            console.log('Incoming WhatsApp Webhook Body:', JSON.stringify(body));
            // A. Green API Payload Handler (Group & Private Chats)
            if (body?.typeWebhook === 'incomingMessageReceived' || body?.messageData) {
                const chatId = body?.senderData?.chatId || body?.chatId;
                const senderPhone = (body?.senderData?.sender || chatId || '').split('@')[0].split(':')[0];
                const messageText = body?.messageData?.textMessageData?.textMessage || body?.messageData?.extendedTextMessageData?.text || body?.messageData?.caption || '';
                if (messageText) {
                    console.log(`Received Green API message from ${senderPhone} in ${chatId}: "${messageText}"`);
                    await db.collection('whatsapp_incoming_logs').add({
                        fromPhone: senderPhone,
                        chatId,
                        messageText,
                        rawPayload: body,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });
                    const trimmed = messageText.trim().toLowerCase();
                    const startsWithLuzon = /^(לוזון|היי לוזון|שלום לוזון|אהלן לוזון|luzon|hi luzon|!לוזון|לוזון:)/i.test(trimmed);
                    if (!startsWithLuzon) {
                        console.log(`IRON RULE: Green API message from ${senderPhone} in ${chatId} ignored because it does not start with Luzon.`);
                        res.status(200).json({ status: 'ignored_not_sentence_start' });
                        return;
                    }
                    const aiReply = await askGeminiFantasyAI(messageText, senderPhone);
                    const greenHost = 'https://7107.api.greenapi.com';
                    const greenId = '710722713612';
                    const greenToken = '4c1d55acf6d44149bbd1b515ae065b5131f83be1761a435e97';
                    await axios_1.default.post(`${greenHost}/waInstance${greenId}/sendMessage/${greenToken}`, {
                        chatId: chatId,
                        message: aiReply
                    });
                    console.log(`Green API reply sent successfully to ${chatId}!`);
                    res.status(200).json({ status: 'success_green_api' });
                    return;
                }
            }
            // B. Meta Cloud API Payload Handler
            const entry = body?.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const messageObj = value?.messages?.[0];
            if (messageObj) {
                const fromPhone = messageObj.from;
                const messageText = messageObj.text?.body || messageObj.caption || '';
                console.log(`Received Meta WhatsApp message from ${fromPhone}: "${messageText}"`);
                // Log incoming WhatsApp message to Firestore for history
                await db.collection('whatsapp_incoming_logs').add({
                    fromPhone,
                    messageText,
                    rawPayload: messageObj,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
                // 🚨 חוק ברזל: הבוט מגיב אך ורק אם ההודעה מתחילה במילת הפנייה "לוזון" / "היי לוזון" 🚨
                const trimmed = messageText.trim().toLowerCase();
                const startsWithLuzon = /^(לוזון|היי לוזון|שלום לוזון|אהלן לוזון|luzon|hi luzon|!לוזון|לוזון:)/i.test(trimmed);
                if (!startsWithLuzon) {
                    console.log(`IRON RULE TRIGGERED: Skipping WhatsApp reply to ${fromPhone}. Message "${messageText}" does NOT start with Luzon.`);
                    res.status(200).json({ status: 'ignored_not_sentence_start' });
                    return;
                }
                // Auto-reply confirmation via Meta Cloud API using Gemini AI
                const settingsSnap = await db.collection('leagueData').doc('settings').get();
                const storedToken = settingsSnap.exists ? settingsSnap.data()?.whatsappToken : null;
                const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || storedToken || 'EAAu1XzkKLNMBSNOAlReyeUre0mUZAGMapdvC5SNvbupUvlbUBZC3WYXUtZCJae6p3hFGAolgP3PtWpSdEGdgNgwfgXBbzmUSKevi6n5Wveb9kbC8VzFBMFCVsyXKZCdCnaYQ7ZA5WZB52bXoemWiKj6stvkTGT4KTmaFEU4Fgh39nWJOYM3V7NeOrFq45vXQCfJwZDZD';
                const phoneNumberId = value?.metadata?.phone_number_id || '1337632699423375';
                if (accessToken && phoneNumberId) {
                    const aiReply = await askGeminiFantasyAI(messageText, fromPhone);
                    await axios_1.default.post(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: fromPhone,
                        type: 'text',
                        text: {
                            body: aiReply
                        }
                    }, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                }
            }
            res.status(200).json({ status: 'success' });
        }
        catch (err) {
            console.error('Error handling WhatsApp webhook:', err);
            res.status(500).json({ error: err.message });
        }
        return;
    }
    res.status(405).send('Method Not Allowed');
});
// 🟢 API Webhook לסוכן Gemini Spark לעדכון לוח משחקי ליגת העל (שעה, ערוץ, מגרש) 🟢
exports.updateRealFixtures = (0, https_1.onRequest)({ region: 'us-west1', cors: true }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    try {
        const { apiKey, matches } = req.body || {};
        const SECRET_KEY = 'luzon_spark_agent_2026';
        if (apiKey !== SECRET_KEY) {
            res.status(403).json({ error: 'Unauthorized: Invalid API Key' });
            return;
        }
        if (!matches || !Array.isArray(matches)) {
            res.status(400).json({ error: 'Invalid argument: matches array is required' });
            return;
        }
        await db.doc('leagueData/real_fixtures').set({
            matches,
            lastUpdated: new Date().toISOString(),
            updatedBy: 'Gemini Spark Agent'
        }, { merge: true });
        console.log(`Successfully updated ${matches.length} real fixtures from Gemini Spark Agent.`);
        res.status(200).json({ success: true, count: matches.length, message: 'Real fixtures updated successfully' });
    }
    catch (err) {
        console.error('Error updating real fixtures:', err);
        res.status(500).json({ error: err.message });
    }
});
// 🟢 סנכרון אוטומטי מיומן Google Calendar (eranyy@gmail.com) 🟢
exports.scheduledCalendarSync = (0, scheduler_1.onSchedule)('every 6 hours', async () => {
    try {
        const calendarId = 'eranyy@gmail.com';
        const apiKey = process.env.GOOGLE_API_KEY || 'AIzaSyARwamUBjcirbqFtWn_RpKkOdiHmeGlis0';
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&singleEvents=true&orderBy=startTime`;
        const response = await axios_1.default.get(url);
        const items = response.data?.items || [];
        const israeliTeams = [
            'מכבי תל אביב', 'מכבי חיפה', 'הפועל באר שבע', 'הפועל תל אביב',
            'בית"ר ירושלים', 'מכבי נתניה', 'הפועל ירושלים', 'הפועל חיפה',
            'בני סכנין', 'מ.ס אשדוד', 'מכבי פתח תקווה', 'הפועל פתח תקווה',
            'עירוני קרית שמונה', 'עירוני טבריה', 'הפועל חדרה', 'מכבי בני ריינה'
        ];
        const matchedMatches = [];
        items.forEach((item) => {
            const summary = item.summary || '';
            const description = item.description || '';
            const location = item.location || '';
            const fullText = `${summary} ${description} ${location}`;
            const isWinnerLeague = fullText.includes('ליגת Winner') || fullText.includes('ליגת ווינר') || fullText.includes('ליגת העל');
            const isCup = fullText.includes('גביע המדינה') || fullText.includes('גביע הטוטו');
            if (isWinnerLeague && !isCup) {
                const foundTeams = israeliTeams.filter(t => fullText.includes(t));
                if (foundTeams.length >= 2 || summary.includes('נגד') || summary.includes('vs')) {
                    const startDateTime = item.start?.dateTime || item.start?.date;
                    const dateObj = new Date(startDateTime);
                    const formattedDate = dateObj.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
                    const formattedTime = dateObj.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
                    let tvChannel = '';
                    if (fullText.includes('ספורט 5'))
                        tvChannel = 'ספורט 5';
                    else if (fullText.includes('ספורט 1'))
                        tvChannel = 'ספורט 1';
                    else if (fullText.includes('ספורט 2'))
                        tvChannel = 'ספורט 2';
                    else if (fullText.includes('ספורט 3'))
                        tvChannel = 'ספורט 3';
                    else if (fullText.includes('ספורט 4'))
                        tvChannel = 'ספורט 4';
                    else if (fullText.includes('כאן 11'))
                        tvChannel = 'כאן 11';
                    matchedMatches.push({
                        title: summary,
                        date: formattedDate,
                        time: formattedTime,
                        stadium: location || 'אצטדיון',
                        tvChannel: tvChannel || 'שידור ישיר',
                        homeTeam: foundTeams[0] || summary.split('נגד')[0]?.trim() || '',
                        awayTeam: foundTeams[1] || summary.split('נגד')[1]?.trim() || '',
                        rawEventId: item.id
                    });
                }
            }
        });
        if (matchedMatches.length > 0) {
            await db.doc('leagueData/real_fixtures').set({
                matches: matchedMatches,
                lastUpdated: new Date().toISOString(),
                calendarId,
                updatedBy: 'Google Calendar Sync'
            }, { merge: true });
            console.log(`Synced ${matchedMatches.length} Winner League matches from Google Calendar.`);
        }
    }
    catch (e) {
        console.error('Error syncing Google Calendar:', e?.message || e);
    }
});
// 🟢 סנכרון אוטומטי מתוך קובץ Google Sheets של משחקי ליגת העל והגביע 🟢
const runSheetSyncLogic = async () => {
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQu3dsWYrZmhp_LvcWSisQODusa0aETCYEHLlJGbKeqOpLBJFhwHCFML5HlpHnbSdeUEycx2K3KhZLt/pub?output=csv';
    const res = await axios_1.default.get(sheetUrl);
    const csvData = res.data;
    if (!csvData)
        return { count: 0 };
    const parseCsvLine = (line) => {
        const result = [];
        let insideQuote = false;
        let entry = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (insideQuote && line[i + 1] === '"') {
                    entry += '"';
                    i++;
                }
                else {
                    insideQuote = !insideQuote;
                }
            }
            else if (char === ',' && !insideQuote) {
                result.push(entry.trim());
                entry = '';
            }
            else {
                entry += char;
            }
        }
        result.push(entry.trim());
        return result;
    };
    const lines = csvData.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length <= 1)
        return { count: 0 };
    const matches = [];
    const cupMatches = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 6)
            continue;
        const roundStage = cols[0]; // מחזור 1
        const dateStr = cols[1]; // 22/08/2026
        const dayStr = cols[2]; // שבת
        const timeStr = cols[3]; // 20:00
        const homeTeam = cols[4]; // מכבי חיפה
        const awayTeam = cols[5]; // הפועל רמת גן
        const competition = cols[6] || ''; // ליגת WINNER / גביע המדינה
        const stadium = cols[7] || ''; // אצטדיון סמי עופר
        const tvChannel = cols[8] || ''; // ספורט 1 / ספורט 2
        const status = cols[9] || ''; // עתידי / נדחה
        const roundNum = parseInt(cols[0].replace(/[^\d]/g, ''), 10) || 1;
        const matchItem = {
            round: roundNum,
            roundStage,
            date: dateStr,
            day: dayStr,
            time: timeStr,
            homeTeam,
            awayTeam,
            competition,
            stadium,
            tvChannel,
            status
        };
        if (competition.includes('גביע')) {
            cupMatches.push(matchItem);
        }
        else {
            matches.push(matchItem);
        }
    }
    await db.doc('leagueData/real_fixtures').set({
        matches,
        cupMatches,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'Google Sheet Sync'
    }, { merge: true });
    console.log(`Successfully synced ${matches.length} league matches and ${cupMatches.length} cup matches from Google Sheet.`);
    return { matchesCount: matches.length, cupCount: cupMatches.length };
};
exports.scheduledSheetSync = (0, scheduler_1.onSchedule)('every 2 hours', async () => {
    try {
        await runSheetSyncLogic();
    }
    catch (e) {
        console.error('Error in scheduledSheetSync:', e?.message || e);
    }
});
exports.triggerSheetSync = (0, https_1.onRequest)({ region: 'us-west1', cors: true }, async (req, res) => {
    try {
        const result = await runSheetSyncLogic();
        res.status(200).json({ success: true, ...result });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
//# sourceMappingURL=index.js.map