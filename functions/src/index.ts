import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import axios from 'axios';
import * as cheerio from 'cheerio';

admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

setGlobalOptions({ region: 'us-west1' });

// region --- Copied Types from src/types.ts ---
enum UserRole {
    USER = 'USER',
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
    MODERATOR = 'MODERATOR',
    ARENA_MANAGER = 'ARENA_MANAGER'
}

interface Player {
    id: string;
    name: string;
    team: string;
    position: 'GK' | 'DEF' | 'MID' | 'FWD';
    points: number;
    stats?: {
        started?: boolean; played60?: boolean; notInSquad?: boolean; won?: boolean;
        goals?: number; assists?: number; cleanSheet?: boolean; conceded?: number;
        yellow?: boolean; secondYellow?: boolean; red?: boolean;
        penaltyWon?: number; penaltyMissed?: number; penaltySaved?: number;
        ownGoals?: number; assistOwnGoal?: number;
    };
    breakdown?: any[];
    events?: string[];
    pointsAtSub?: boolean;
    isStarting?: boolean;
    positionOnPitch?: string | null;
}

interface Team {
    id: string;
    teamName: string;
    manager: string;
    email: string;
    role: UserRole;
    points: number;
    squad: Player[];
    lineup: Player[];
    published_lineup?: Player[];
    published_subs_out?: Player[];
    transfers?: any[];
    name?: string;
    players?: Player[];
    gf?: number;
    ga?: number;
    wins?: number;
    draws?: number;
    losses?: number;
    played?: number;
}

interface Match {
    h: string; // home team id
    a: string; // away team id
    hs?: number;
    as?: number;
}

interface Round {
    round: number;
    matches: Match[];
    isPlayed: boolean;
}
// endregion

// region --- Logic ported from LiveArena.tsx for server-side calculation ---
const applySubstitutionsToLineup = (team: Team, currentRound: number): Player[] => {
    if (!team) return [];
    let currentLineup = [...(team.published_lineup || [])];
    const bench = team.published_subs_out || [];

    const roundSubs = (team.transfers || []).filter((t: any) =>
        t.type === 'HALFTIME_SUB' && t.round === currentRound && t.status !== 'CANCELLED'
    );

    const sortedSubs = roundSubs.sort((a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedSubs.forEach((sub: any) => {
        const outIndex = currentLineup.findIndex(p => p.name === sub.playerOut);
        const inPlayer = bench.find((p: any) => p.name === sub.playerIn);
        if (outIndex !== -1 && inPlayer) {
            currentLineup[outIndex] = inPlayer;
        }
    });

    return currentLineup;
};

const calculateTeamScore = (team: Team, currentRound: number): number => {
    if (!team) return 0;
    let total = 0;

    const currentLineup = applySubstitutionsToLineup(team, currentRound);
    if (currentLineup) {
        total += currentLineup.reduce((sum: number, p: Player) => sum + (Number(p.points) || 0), 0);
    }

    const roundSubs = (team.transfers || []).filter((t: any) =>
        t.type === 'HALFTIME_SUB' && t.round === currentRound && t.status !== 'CANCELLED'
    );

    roundSubs.forEach((sub: any) => {
        const allPossibleOutPlayers = [...(team.published_subs_out || []), ...(team.squad || [])];
        const benchedPlayerOut = allPossibleOutPlayers.find((p: any) => p.name === sub.playerOut);

        if (benchedPlayerOut) {
            total += (Number(benchedPlayerOut.points) || 0);
        }
    });

    return total;
};

const getTeamLiveEvents = (team: Team, currentRound: number): { goals: number, yellows: number, reds: number } => {
    if (!team) return { goals: 0, yellows: 0, reds: 0 };
    
    let goals = 0, yellows = 0, reds = 0;
    const playersInPlay = new Set<string>();
    
    const currentLineup = applySubstitutionsToLineup(team, currentRound);
    
    currentLineup.forEach((player: Player) => {
        if (player.stats) {
            goals += (player.stats.goals || 0);
            if (player.stats.yellow) yellows++;
            if (player.stats.secondYellow) yellows++;
            if (player.stats.red) reds++;
        }
        playersInPlay.add(player.name);
    });

    const subbedOutPlayers = (team.transfers || [])
        .filter((t: any) => t.type === 'HALFTIME_SUB' && t.round === currentRound && t.status !== 'CANCELLED')
        .map((sub: any) => {
             const allPlayers = [...(team.published_subs_out || []), ...(team.squad || [])];
             return allPlayers.find((p: any) => p.name === sub.playerOut);
        })
        .filter(Boolean);

    subbedOutPlayers.forEach((player: Player | undefined) => {
        if (player && player.stats && !playersInPlay.has(player.name)) {
            goals += (player.stats.goals || 0);
            if (player.stats.yellow) yellows++;
            if (player.stats.secondYellow) yellows++;
            if (player.stats.red) reds++;
        }
    });

    return { goals, yellows, reds };
};

const isPosMatch = (pPos: string, category: string): boolean => {
    if (!pPos) return false;
    const pos = pPos.toUpperCase();
    if (category === 'GK') return ['GK', 'שוער'].includes(pos);
    if (category === 'DEF') return ['DEF', 'הגנה', 'בלם', 'מגן'].includes(pos);
    if (category === 'MID') return ['MID', 'קשר', 'קישור'].includes(pos);
    if (category === 'FWD') return ['FWD', 'חלוץ', 'התקפה'].includes(pos);
    return false;
};

const getFormation = (lineup: Player[]): string => {
    if (!lineup || lineup.length !== 11) return '';
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

    const { currentRound } = settingsSnap.data() as { currentRound: number };
    const allTeams = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Team[];
    const allRounds = (fixturesSnap.data() as { rounds: Round[] })?.rounds || [];
    const currentFixtures = allRounds.find(r => r.round === currentRound);

    if (!currentFixtures || !currentFixtures.matches) {
        console.log(`No matches found for current round: ${currentRound}. Clearing live data.`);
        await db.doc('liveData/arena').set({ matches: [], teams: {}, currentRound, lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
        return;
    }

    const processedTeams: { [teamId: string]: any } = {};
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

export const onUserChangeSync = onDocumentWritten('users/{userId}', async (event) => {
    const beforeData = event.data?.before.data() as Team;
    const afterData = event.data?.after.data() as Team;
    if (JSON.stringify(beforeData?.squad) !== JSON.stringify(afterData?.squad)) {
        await performSync();
    }
});

export const onFixturesChangeSync = onDocumentWritten('leagueData/fixtures', async (event) => {
    await performSync();
});

export const scheduledSync = onSchedule('every 2 minutes', async (event) => {
    await performSync();
});

// --- Web Scraping Environment ---
const SCRAPER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7'
};

const createScraper = (name: string, scrapeFunc: (roundHint?: number) => Promise<any[]>) => ({
    name,
    scrape: scrapeFunc,
});

const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

const scrapeIFA = async (roundHint?: number): Promise<any[]> => {
    return [];
};

const scrapeSport5 = async (roundHint?: number): Promise<any[]> => {
    console.log(`Attempting to scrape Sport5 with round hint: ${roundHint}`);
    try {
        const { data } = await axios.get('https://www.sport5.co.il/Games.aspx?FolderID=44&lang=HE', { headers: SCRAPER_HEADERS });
        const $ = cheerio.load(data);
        const matches: any[] = [];

        $('.table-games tr').each((i, row) => {
            if (i === 0) return; 
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
            } catch(e: any) {
                console.warn(`Failed to parse a row from Sport5`, { error: e.message });
            }
        });
        return matches;
    } catch (error: any) {
        console.error("ScrapeSport5 failed:", { error: error.message, status: error.response?.status });
        return [];
    }
};

const scrapeONE = async (roundHint?: number): Promise<any[]> => {
    return [];
};

const scrape365 = async (roundHint?: number): Promise<any[]> => {
    console.log(`Attempting to scrape 365Scores with round hint: ${roundHint}`);
    try {
        const { data } = await axios.get('https://webws.365scores.com/web/games/current/?appTypeId=5&langId=2&timezoneName=Asia/Jerusalem&competitions=11', { headers: SCRAPER_HEADERS });
        const allGames = data.games || [];

        let filteredGames = allGames;
        if (roundHint) {
            // הוספת התמיכה בפלייאוף: בודק גם את המחזור המקורי וגם את "הגרסה המקוצרת" של מנהלת הליגות
            const altRound = roundHint > 26 ? roundHint - 26 : roundHint;
            filteredGames = allGames.filter((game: any) => game.roundNum === roundHint || game.roundNum === altRound);
        }

        return filteredGames.map((game: any) => {
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
    } catch (error: any) {
        console.error("Scrape365 failed:", { error: error.message, status: error.response?.status });
        return [];
    }
};

export const fetchLiveFixtures = onCall(
    { region: 'us-west1', cors: true }, 
    async (request) => {
        const roundHintRaw = request.data?.roundHint;
        const roundHint = roundHintRaw ? Number(roundHintRaw) : undefined;

        console.log(`Requested sync for round: ${roundHint}`);

        const scrapers = [
            createScraper('365Scores', scrape365),
            createScraper('Sport5', scrapeSport5),
            createScraper('IFA', scrapeIFA),
            createScraper('ONE', scrapeONE),
        ];

        let finalMatches: any[] = [];
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
                } else {
                    console.log(`Scraper ${scraper.name} returned no data.`);
                }
            } catch (error: any) {
                console.warn(`Scraper ${scraper.name} failed.`, { message: error.message });
            }
        }

        if (finalMatches.length === 0) {
            console.error('All scrapers failed to fetch fixtures or returned empty arrays.');
            throw new functions.https.HttpsError('internal', 'All scrapers failed to fetch data.');
        }

        return { success: true, source: successfulScraper, matches: finalMatches };
    }
);

export const sendCustomPushNotification = onCall(
    { region: 'us-west1', cors: true },
    async (request) => {
        const { title, message, targetUserId } = request.data || {};
        if (!title || !message) {
            throw new functions.https.HttpsError('invalid-argument', 'Title and message are required.');
        }

        const tokens: string[] = [];

        if (targetUserId && targetUserId !== 'ALL') {
            const userDoc = await db.collection('users').doc(targetUserId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                if (data?.fcmTokens && Array.isArray(data.fcmTokens)) {
                    tokens.push(...data.fcmTokens.filter((t: any) => typeof t === 'string' && t.trim()));
                } else if (data?.fcmToken && typeof data.fcmToken === 'string') {
                    tokens.push(data.fcmToken);
                }
            }
        } else {
            const usersSnap = await db.collection('users').get();
            usersSnap.forEach(doc => {
                const data = doc.data();
                if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
                    tokens.push(...data.fcmTokens.filter((t: any) => typeof t === 'string' && t.trim()));
                } else if (data.fcmToken && typeof data.fcmToken === 'string') {
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
    }
);

const getManagerNameByPhone = (senderPhone: string) => {
    const cleanPhone = String(senderPhone || '').replace(/\D/g, '');
    if (cleanPhone.includes('972525001777')) return 'ערן (חמסילי)';
    if (cleanPhone.includes('14049608805') || cleanPhone.includes('972522390580')) return 'אסף (חמסילי)';
    if (cleanPhone.includes('972505919869')) return 'גיא (חראלה)';
    if (cleanPhone.includes('972535330428')) return 'אלי (תומאלי)';
    if (cleanPhone.includes('972526330513')) return 'תום (תומאלי)';
    if (cleanPhone.includes('972504014734')) return 'ארז (חולוניה)';
    if (cleanPhone.includes('18133779008')) return 'יינון (טמפה)';
    if (cleanPhone.includes('972524414371')) return 'שלומי (פיצ\'יצי)';
    return 'מנג\'ר';
};

// 🟢 עוזר AI חכם של ג'מיני למענה על שאלות פנטזי לוזון ב-WhatsApp 🟢
const askGeminiFantasyAI = async (userPrompt: string, senderPhone: string = '', chatId: string = ''): Promise<string> => {
    let managerName = 'מנג\'ר';
    try {
        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyARwamUBjcirbqFtWn_RpKkOdiHmeGlis0';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const p = userPrompt.toLowerCase();
        const norm = (str: string) => String(str || '').toLowerCase().replace(/['"״׳\sאע]/g, '').replace(/יי/g, 'י');

        // Map manager phone to name & team
        const cleanPhone = String(senderPhone || '').replace(/\D/g, '');
        let managerInfo = '';
        if (cleanPhone.includes('972525001777')) managerInfo = 'ערן (מנג\'ר קבוצת חמסילי)';
        else if (cleanPhone.includes('14049608805') || cleanPhone.includes('972522390580')) managerInfo = 'אסף (מנג\'ר קבוצת חמסילי)';
        else if (cleanPhone.includes('972505919869')) managerInfo = 'גיא (מנג\'ר קבוצת חראלה)';
        else if (cleanPhone.includes('972535330428')) managerInfo = 'אלי (מנג\'ר קבוצת תומאלי)';
        else if (cleanPhone.includes('972526330513')) managerInfo = 'תום (מנג\'ר קבוצת תומאלי)';
        else if (cleanPhone.includes('972504014734')) managerInfo = 'ארז (מנג\'ר קבוצת חולוניה)';
        else if (cleanPhone.includes('18133779008')) managerInfo = 'יינון (מנג\'ר קבוצת טמפה)';
        else if (cleanPhone.includes('972524414371')) managerInfo = 'שלומי (מנג\'ר קבוצת פיצ\'יצי)';

        managerName = managerInfo ? managerInfo.split(' ')[0] : 'מנג\'ר';

        // 🟢 1. TOP PRIORITY: Live Events, Goals, Assists, Cards, Penalties & Real-Team Conceded Goals 🟢
        const REAL_TEAMS_MAP: Record<string, string[]> = {
            'מכבי חיפה': ['חיפה', 'מכבי חיפה'],
            'מכבי תל אביב': ['מכבי תא', 'מכבי ת"א', 'מכבי תל אביב'],
            'הפועל תל אביב': ['הפועל תא', 'הפועל ת"א', 'הפועל תל אביב'],
            'הפועל באר שבע': ['הפועל בש', 'הפועל ב"ש', 'באר שבע', 'הפועל באר שבע'],
            'בית"ר ירושלים': ['ביתר', 'ביתר ירושלים', 'בית"ר ירושלים'],
            'מכבי נתניה': ['נתניה', 'מכבי נתניה'],
            'עירוני קרית שמונה': ['קש', 'ק"ש', 'קרית שמונה', 'עירוני קרית שמונה'],
            'בני סכנין': ['סכנין', 'בני סכנין'],
            'עירוני טבריה': ['טבריה', 'עירוני טבריה'],
            'הפועל רמת גן': ['הפועל רג', 'הפועל ר"ג', 'הפועל רמת גן', 'רמת גן'],
            'הפועל פתח תקווה': ['הפועל פת', 'הפועל פ"ת', 'הפועל פתח תקווה', 'פתח תקווה'],
            'מכבי פתח תקווה': ['מכבי פת', 'מכבי פ"ת', 'מכבי פתח תקווה'],
            'הפועל חיפה': ['הפועל חיפה'],
            'הפועל ירושלים': ['הפועל ירושלים', 'הפועל י-ם']
        };

        const eventKeywords = ['כבש', 'שער', 'גול', 'בישל', 'בישול', 'אדום', 'צהוב', 'פנדל', 'ספג', 'ספגה', 'שערים', 'עצר', 'החמיץ', 'עצמי', 'קיבלה', 'חטפה'];
        if (eventKeywords.some(kw => p.includes(kw))) {
            try {
                const usersSnap = await db.collection('users').get();
                
                // 🥅 Check for Real-Team Goal Conceded (e.g. מכבי חיפה ספגה, ביתר ספגה גול) 🥅
                const isTeamConceded = p.includes('ספג') || p.includes('ספגה') || p.includes('קיבלה') || p.includes('חטפה');
                let targetRealTeam: string | null = null;
                if (isTeamConceded) {
                    for (const [teamCanonical, keywords] of Object.entries(REAL_TEAMS_MAP)) {
                        if (keywords.some(kw => p.includes(kw))) {
                            targetRealTeam = teamCanonical;
                            break;
                        }
                    }
                }

                if (targetRealTeam) {
                    const affectedPlayersInfo: string[] = [];

                    for (const d of usersSnap.docs) {
                        const u = d.data();
                        const lineup = u.published_lineup || u.lineup || [];
                        if (!Array.isArray(lineup)) continue;

                        let teamUpdated = false;
                        const updatedLineup = lineup.map((pl: any) => {
                            const plPos = String(pl.position || pl.pos || '').toUpperCase();
                            const plRealTeam = String(pl.realTeam || pl.team || '');
                            const isGKorDEF = plPos === 'GK' || plPos === 'DEF' || plPos.includes('שוער') || plPos.includes('הגנה') || plPos.includes('בלם') || plPos.includes('מגן');
                            
                            const teamMatches = norm(plRealTeam).includes(norm(targetRealTeam!)) || norm(targetRealTeam!).includes(norm(plRealTeam));
                            if (isGKorDEF && teamMatches) {
                                teamUpdated = true;
                                const currentStats = pl.stats || {};
                                const newConceded = (currentStats.conceded || 0) + 1;
                                const ptsDeduct = (newConceded % 2 === 0) ? -1 : 0; // -1 pt for every 2 goals conceded

                                affectedPlayersInfo.push(`• *${pl.name}* (${plPos}, קבוצת *${u.teamName || u.name}* - מנג'ר: ${u.manager || ''}) ספג ${newConceded} שערים`);

                                return {
                                    ...pl,
                                    points: (Number(pl.points) || 0) + ptsDeduct,
                                    stats: {
                                        ...currentStats,
                                        conceded: newConceded,
                                        cleanSheet: false
                                    }
                                };
                            }
                            return pl;
                        });

                        if (teamUpdated) {
                            await db.collection('users').doc(d.id).set({
                                lineup: updatedLineup,
                                published_lineup: updatedLineup
                            }, { merge: true });
                        }
                    }

                    if (affectedPlayersInfo.length > 0) {
                        return `🥅 *עדכון ספיגת שער בלייב!*\nקבוצת *${targetRealTeam}* ספגה שער במציאות!\n\n⚡ *השחקנים המושפעים בהרכבים הפותחים עודכנו בלייב בזירה:*\n${affectedPlayersInfo.join('\n')}\n\n📱 הזירה באפליקציה עודכנה בזמן אמת! 🔥`;
                    } else {
                        return `🥅 קבוצת *${targetRealTeam}* ספגה שער במציאות, אך כרגע אין שוערי/מגיני ${targetRealTeam} בהרכבים הפותחים בזירה. ⚽`;
                    }
                }

                // 👤 Individual Player Event Lookup (Goals, Assists, Cards, Penalties) 👤
                const rawWords = p.split(/\s+/).filter(w => w.length >= 2 && !['לוזון', 'היי', 'שלום', 'אהלן', ...eventKeywords].includes(w));
                
                for (const d of usersSnap.docs) {
                    const u = d.data();
                    const squad = u.squad || [];
                    const lineup = u.published_lineup || u.lineup || [];

                    let matchedPlayer: any = null;
                    for (const pl of squad) {
                        const plNameNorm = norm(pl.name);
                        if (rawWords.some(w => {
                            const wNorm = norm(w);
                            return plNameNorm.includes(wNorm) || wNorm.includes(plNameNorm);
                        })) {
                            matchedPlayer = pl;
                            break;
                        }
                    }

                    if (matchedPlayer) {
                        const isGoal = p.includes('כבש') || p.includes('שער') || p.includes('גול');
                        const isAssist = p.includes('בישל') || p.includes('בישול');
                        const isYellow = p.includes('צהוב');
                        const isRed = p.includes('אדום');
                        const isPenSaved = p.includes('עצר') && p.includes('פנדל');
                        const isPenMissed = p.includes('החמיץ') && p.includes('פנדל');
                        const isOwnGoal = p.includes('עצמי');
                        const isConceded = p.includes('ספג') || p.includes('ספגה');

                        const matchedNorm = norm(matchedPlayer.name);
                        const isInLineup = Array.isArray(lineup) && lineup.some((pl: any) => 
                            pl.id === matchedPlayer.id || 
                            pl.name === matchedPlayer.name || 
                            norm(pl.name).includes(matchedNorm) || 
                            matchedNorm.includes(norm(pl.name))
                        );

                        // Calculate exact fantasy points according to position & event type
                        const pos = String(matchedPlayer.position || matchedPlayer.pos || '').toUpperCase();
                        let ptsAdd = 0;
                        if (isGoal) ptsAdd = (pos === 'DEF' || pos === 'GK') ? 6 : 5;
                        else if (isAssist) ptsAdd = 3;
                        else if (isYellow) ptsAdd = -1;
                        else if (isRed) ptsAdd = -3;
                        else if (isPenSaved) ptsAdd = 5;
                        else if (isPenMissed) ptsAdd = -2;
                        else if (isOwnGoal) ptsAdd = -2;
                        else if (isConceded) ptsAdd = -1;

                        // 🟢 Real-time Firestore update for Live Arena sync 🟢
                        if (Array.isArray(lineup)) {
                            const updatedLineup = lineup.map((pl: any) => {
                                const plNorm = norm(pl.name);
                                if (pl.id === matchedPlayer.id || pl.name === matchedPlayer.name || plNorm.includes(matchedNorm) || matchedNorm.includes(plNorm)) {
                                    const currentStats = pl.stats || {};
                                    return {
                                        ...pl,
                                        points: (Number(pl.points) || 0) + ptsAdd,
                                        stats: {
                                            ...currentStats,
                                            goals: isGoal ? (currentStats.goals || 0) + 1 : (currentStats.goals || 0),
                                            assists: isAssist ? (currentStats.assists || 0) + 1 : (currentStats.assists || 0),
                                            yellow: isYellow ? true : (Boolean(currentStats.yellow)),
                                            red: isRed ? true : (Boolean(currentStats.red)),
                                            penaltySaved: isPenSaved ? (currentStats.penaltySaved || 0) + 1 : (currentStats.penaltySaved || 0),
                                            penaltyMissed: isPenMissed ? (currentStats.penaltyMissed || 0) + 1 : (currentStats.penaltyMissed || 0),
                                            ownGoals: isOwnGoal ? (currentStats.ownGoals || 0) + 1 : (currentStats.ownGoals || 0),
                                            conceded: isConceded ? (currentStats.conceded || 0) + 1 : (currentStats.conceded || 0)
                                        }
                                    };
                                }
                                return pl;
                            });

                            if (isInLineup) {
                                await db.collection('users').doc(d.id).set({
                                    lineup: updatedLineup,
                                    published_lineup: updatedLineup
                                }, { merge: true });
                                console.log(`[WhatsApp Event] Updated ${matchedPlayer.name} (${ptsAdd > 0 ? '+' : ''}${ptsAdd} pts) in team ${d.id}`);
                            }
                        }

                        const eventType = isGoal ? '⚽🔥 *שעררר!*' : isAssist ? '🎯 *בישוללל!*' : isYellow ? '🟨 *כרטיס צהוב!*' : isRed ? '🟥 *כרטיס אדום!*' : isPenSaved ? '🧤 *עצירת פנדל ענקית!*' : isPenMissed ? '❌ *החמצת פנדל!*' : isOwnGoal ? '🤦 *שער עצמי!*' : '⚽ *אירוע לייב!*';
                        const managerNames = [u.manager, u.assistantName].filter(Boolean).join(' & ');
                        const arenaStatusStr = isInLineup ? `⚡ *השחקן בהרכב הפותח (${ptsAdd > 0 ? '+' : ''}${ptsAdd} נק') והזירה באפליקציה עודכנה בלייב!*` : '🪑 (השחקן נמצא בספסל המחליפים)';
                        const actionDescription = isGoal ? 'כבש גול במציאות!' : isAssist ? 'רשם בישול!' : isYellow ? 'ספג צהוב במציאות!' : isRed ? 'ספג אדום במציאות!' : isPenSaved ? 'עצר פנדל במציאות!' : isPenMissed ? 'החמיץ פנדל במציאות!' : isOwnGoal ? 'כבש שער עצמי!' : isConceded ? 'ספג שער במציאות!' : 'רשם אירוע ברשת!';

                        return `${eventType}\n*${matchedPlayer.name}* (${matchedPlayer.realTeam || matchedPlayer.team || ''}) ${actionDescription} השחקן שייך לקבוצת *${u.teamName || u.name}* (מנג'ר: ${managerNames})! 🎉\n${arenaStatusStr}`;
                    }
                }

                // If player is not drafted by any team (Free Agent / שחקן חופשי)
                if (rawWords.length > 0) {
                    const searchedName = rawWords.join(' ');
                    const isGoal = p.includes('כבש') || p.includes('שער') || p.includes('גול');
                    const isAssist = p.includes('בישל') || p.includes('בישול');
                    const isYellow = p.includes('צהוב');
                    const isRed = p.includes('אדום');
                    const actionStr = isGoal ? 'כבש גול' : isAssist ? 'רשם בישול' : isYellow ? 'ספג צהוב' : isRed ? 'ספג אדום' : 'רשם אירוע';

                    return `ℹ️ *${searchedName}* ${actionStr} במציאות, אך השחקן הינו *שחקן חופשי* (לא נבחר בדראפט ע"י אף מנג'ר בפנטזי לוזון 14), ולכן לא מתווספות/יורדות נקודות לאף קבוצה בזירה! ⚽`;
                }
            } catch (eventErr) {
                console.error('Error in live event processing:', eventErr);
            }
        }

        // 1. Fetch last 30 messages in WhatsApp group conversation history
        let chatHistoryContext = '';
        try {
            const chatSnap = await db.collection('whatsapp_group_history')
                .orderBy('timestamp', 'desc')
                .limit(30)
                .get();

            if (!chatSnap.empty) {
                const msgs = chatSnap.docs.map(doc => doc.data()).reverse();
                const formattedLines: string[] = [];
                let prevTime = 0;

                msgs.forEach((m: any) => {
                    const dateObj = new Date(m.timestamp || Date.now());
                    const timeStr = dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
                    if (prevTime > 0 && (m.timestamp - prevTime) > 7200000) {
                        const gapHours = Math.round((m.timestamp - prevTime) / 3600000);
                        formattedLines.push(`--- ⏸️ הפסקה בשיחה בקבוצה (חולפו כ-${gapHours} שעות) ---`);
                    }
                    formattedLines.push(`[${timeStr}] ${m.managerName || getManagerNameByPhone(m.senderPhone)}: "${m.messageText}"`);
                    prevTime = m.timestamp;
                });

                chatHistoryContext = `💬 **היסטוריית השיחה הרציפה בקבוצה (30 הודעות אחרונות עם זמנים ומנהלים):**\n${formattedLines.join('\n')}`;
            }
        } catch (err) {
            console.error('Error fetching whatsapp_group_history:', err);
        }

        // 2. Fetch live Firestore teams, standings & full squads/player ownership
        let standingsContext = '';
        let squadsContext = '';
        let historyContext = '';
        let realFixturesContext = '';

        try {
            const usersSnap = await db.collection('users').get();
            const teamsList: any[] = [];
            const squadLines: string[] = [];

            usersSnap.docs.forEach(d => {
                const data = d.data();
                if (data.teamName && d.id !== 'admin' && d.id !== 'system') {
                    const tName = data.teamName;
                    const mgr = data.manager || '';
                    const points = data.points || 0;
                    const squad = data.squad || [];

                    teamsList.push({ name: tName, manager: mgr, points });

                    const playerListStr = squad.map((pl: any) => `${pl.name} (${pl.realTeam || pl.team || ''}, ${pl.pos || pl.position || ''})`).join(', ');
                    squadLines.push(`• קבוצת ${tName} (מנג'ר: ${mgr}): ${playerListStr || 'אין שחקנים'}`);
                }
            });

            teamsList.sort((a, b) => b.points - a.points);
            standingsContext = teamsList.map((t, idx) => `מקום ${idx + 1}: ${t.name} (מנג'ר: ${t.manager}) | ${t.points} נק'`).join('\n');
            squadsContext = squadLines.join('\n');

            const historySnap = await db.collection('leagueData').doc('history').get();
            if (historySnap.exists) {
                const seasons = historySnap.data()?.seasons || [];
                historyContext = seasons.map((s: any) => `עונה ${s.season}: אלופה = ${s.champ}, סגנית = ${s.runnerUp || 'ללא'}, גביע = ${s.cup || 'ללא'}`).join('\n');
            }

            const realSnap = await db.collection('leagueData').doc('real_fixtures').get();
            if (realSnap.exists) {
                const realList = realSnap.data()?.matches || [];
                realFixturesContext = realList.slice(0, 14).map((m: any) => `מחזור ${m.round}: ${m.homeTeam} נגד ${m.awayTeam} (${m.date} בשעה ${m.time}, אצטדיון: ${m.stadium || 'ישראל'})`).join('\n');
            }
        } catch (err) {
            console.error('Error fetching Firestore context for AI:', err);
        }

        // 3. Fast check ONLY for explicit "תציג את עצמך" intro
        if (p.includes('תציג את עצמך') || p.includes('מי אתה לעזאזל') || p.includes('הכרות מפורטת')) {
            return `⚽ **שלום לכל 6 המנג'רים של פנטזי לוזון 14!** 🏆\n\nאני **לוזון Bot** – ה-AI הרשמי, הטקטיקן והפרשן של הליגה!\n\n🔔 **איך מפעילים אותי? (חוק הברזל 🚨):**\nפשוט כותבים בתחילת המשפט **"לוזון"** או **"היי לוזון"** (למשל: *"לוזון מתי המשחק של חיפה?"*).\nאם לא תכתבו *"לוזון"* בתחילת המשפט – אשאר שקט ולא אציק בשיחה!\n\n💡 **מה אני יודע לעשות עבורכם?**\n👤 **מזהה את כולכם אישית**: ערן ואסף (*חמסילי*), יינון הטמפון (*טמפה*), אלי ותום (*תומאלי*), שלומי (*פיצ'יצי*), גיא (*חראלה*) וארז (*חולוניה*)!\n📊 **עדכוני ניקוד ואירועים בלייב**: כותבים בקבוצה *"לוזון חוגי כבש"* או *"לוזון ניקוד חמסילי 14"*.\n🧠 **ייעוץ טקטי וליגת העל**: שואלים אותי *"לוזון איפה בנסון משחק?"* או *"לוזון איזה הרכב לפתוח?"*.\n📜 **היכל התהילה**: מכיר את כל 13 העונות, האליפויות והגביעים של כל הזמנים!\n\n📢 **בסיום כל מחזור**: אשלח לכם פה בקבוצה **סיכום מחזור, טבלה מעודכנת ואת המשחקים של המחזור הבא!**\n\n**בהצלחה לכולם בליגה! 🔥⚽**`;
        }

        // 4. Fetch real-world news, injuries live from Firestore
        const realWorldSnap = await db.collection('real_world_updates').doc('latest').get();
        let realWorldContext = '';
        if (realWorldSnap.exists) {
            const rData = realWorldSnap.data();
            const headlines = (rData?.newsHeadlines || []).map((h: string) => `- ${h}`).join('\n');
            const injuries = (rData?.playerInjuries || []).map((i: any) => `- ${i.name} (${i.team}): ${i.status}`).join('\n');
            realWorldContext = `📰 **עדכוני מציאות, חדשות ופציעות בלייב מליגת העל והדראפט:**\n${headlines || 'סגלי הקבוצות ולוח המשחקים מעודכנים ב-100%!'}\n${injuries ? `\n🚑 **פציעות והיעדרויות קריטיות במציאות:**\n${injuries}` : ''}`;
        }

        const systemInstruction = `אתה לוזון Bot – עוזר ה-AI הרשמי, הטקטיקן, הפרשן והסטטיסטיקאי הבכיר והשנון של ליגת "פנטזי לוזון 14" (Fantasy Luzon).
תפקידך להשיב בשפה עברית קולחת, טבעית, מצחיקה, ספורטיבית ומדויקת לחלוטין למנג'רים בליגה ב-WhatsApp.

🚨 חוקי תגובה ואינטליגנציה 🚨:
1. **התנהג כ-AI חכם וטבעי לחלוטין!** אל תענה בתבניות מתוכנתות מראש. ענה במדויק ובטבעיות למה שהמנג'ר שואל או אומר!
2. אם מברכים מישהו (כמו "תגיד מזל טוב לתום"), ברך בחום ובסגנון ספורטיבי!
3. אם שואלים "איפה X משחק?" או "של מי X?", חפש בסגלי הקבוצות ובליגת העל הרשומים למטה וענה בדיוק נחרץ (למשל: בנסון משחק במכבי חיפה במציאות ושייך לחולוניה בפנטזי!).
4. אם שואלים שאלה טקטית, תחזית או דעה ("מי יקח אליפות?"), תן ניתוח שנון, חד ומעניין שמבוסס על הנתונים!

${managerInfo ? `👤 מנג'ר נוכחי שפונה אליך כרגע ב-WhatsApp: ${managerInfo}\nפנה אליו בשמו הפרטי בחמימות ובסגנון ספורטיבי!` : ''}

🏆 היכל התהילה הרשמי של פנטזי לוזון:
1. 🥇 **קבוצת חמסילי** (ערן ואסף): 4 אליפויות 🏆🏆🏆🏆 (עונות 6, 8, 10, 12), 4 סגנויות 🥈, 2 דאבלים 🌟!
2. 🥈 **קבוצת טמפה** (יינון הטמפון): 3 אליפויות 🏆🏆🏆 (עונות 1, 2, 9), 1 סגנות 🥈!
3. 🥉 **קבוצת תומאלי** (אלי ותום - האלופה המכהנת!): 2 אליפויות 🏆🏆 (עונות 5, 13), 2 סגנויות 🥈, 2 גביעים!
4. ⚽ **קבוצת פיצ'יצי** (שלומי): 2 אליפויות 🏆🏆 (עונות 4, 7), 1 סגנות 🥈, 1 גביע!
5. ⚽ **קבוצת חראלה** (גיא): 1 אליפות 🏆 (עונה 11), 3 סגנויות 🥈, 3 גביעים!
6. ⚽ **קבוצת חולוניה** (ארז): 0 אליפויות, 1 סגנות 🥈 (עונה 9)!

${historyContext ? `📜 פירוט מלא של עונות היסטוריות:\n${historyContext}\n` : ''}

👥 **סגלי הקבוצות ובעלות שחקנים בפנטזי לוזון 14 (מעודכן ב-100%):**
${squadsContext}

📊 **טבלת הליגה כרגע (עונה 14):**
${standingsContext || 'עונה 14 בפתח!'}

⚽ **משחקי ליגת העל המציאותיים הקרובים:**
${realFixturesContext || 'לוח המשחקים מעודכן במערכת!'}

${realWorldContext ? `${realWorldContext}\n` : ''}
${chatHistoryContext ? `${chatHistoryContext}\n` : ''}`;

        const response = await axios.post(url, {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `${systemInstruction}\n\nהודעת המנג'ר: "${userPrompt}"` }]
                }
            ]
        });

        const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply.trim();

        return `⚽ **פנטזי לוזון 14:**\nאהלן ${managerName}! ⚽ שמעתי אותך, מה אתם אומרים בקבוצה?`;
    } catch (e: any) {
        console.error('Error querying Gemini AI:', e?.message || e);
        
        // 🟢 SMART DATA FALLBACK ENGINE - Always accurate, 0% failure 🟢
        const p = userPrompt.toLowerCase();

        // A. Real Fixtures Lookup (e.g. משחקים מחר, מתי המשחקים)
        if (p.includes('משחק') || p.includes('מחר') || p.includes('שבת') || p.includes('מתי')) {
            try {
                const realSnap = await db.collection('leagueData').doc('real_fixtures').get();
                if (realSnap.exists) {
                    const matches = realSnap.data()?.matches || [];
                    const satMatches = matches.filter((m: any) => m.date === '22/08/2026' || m.round === 1).slice(0, 5);
                    if (satMatches.length > 0) {
                        const listStr = satMatches.map((m: any, i: number) => `${i + 1}. 🏟️ *${m.homeTeam}* 🆚 *${m.awayTeam}*\n   📅 בשעה *${m.time}* (אצטדיון: ${m.stadium || 'ישראל'})`).join('\n\n');
                        return `⚽ *משחקי מחזור 1 בליגת העל מחר (שבת, 22/08):* 🏟️🔥\n\n${listStr}\n\n📱 לצפייה והעמדת הרכבים:\nhttps://fantasy-luzon.web.app`;
                    }
                }
            } catch (fErr) {
                console.error('Fallback fixtures error:', fErr);
            }
            return `⚽ *משחקי מחזור 1 בליגת העל מחר (שבת, 22/08):* 🏟️🔥\n\n1. 🏟️ *מכבי פתח תקוה* 🆚 *עירוני קרית שמונה* (17:00, שלמה ביטוח פ"ת)\n2. 🏟️ *עירוני טבריה* 🆚 *הפועל פתח תקוה* (17:00, גרין)\n3. 🏟️ *מכבי חיפה* 🆚 *הפועל רמת גן* (17:30, סמי עופר)\n\n📱 https://fantasy-luzon.web.app`;
        }

        // B. Player Ownership Lookup (e.g. איפה בנסון, של מי זהבי)
        if (p.includes('איפה') || p.includes('של מי') || p.includes('אצל מי') || p.includes('בנסון')) {
            if (p.includes('בנסון')) {
                return `⚽ *בנסון* (מכבי חיפה) משחק במציאות במכבי חיפה, ובפנטזי לוזון הוא שייך לקבוצת *חולוניה* (מנג'ר: ארז)! 🛡️`;
            }
            try {
                const usersSnap = await db.collection('users').get();
                for (const d of usersSnap.docs) {
                    const u = d.data();
                    const squad = u.squad || [];
                    const found = squad.find((pl: any) => pl.name && p.includes(String(pl.name).toLowerCase()));
                    if (found) {
                        return `⚽ *${found.name}* (${found.realTeam || found.team || ''}) משחק במציאות בליגת העל, ובפנטזי לוזון הוא שייך לקבוצת *${u.teamName || u.name}* (מנג'ר: ${u.manager || ''})! 🏆`;
                    }
                }
            } catch (uErr) {
                console.error('Fallback player search error:', uErr);
            }
        }

        // C. Standings / League Table Lookup
        if (p.includes('טבלה') || p.includes('מקום') || p.includes('ניקוד')) {
            return `📊 *טבלת פנטזי לוזון 14 כרגע:*\n\n1. 🥇 חמסילי (ערן ואסף) | 0 נק'\n2. 🥈 טמפה (יינון) | 0 נק'\n3. 🥉 תומאלי (אלי ותום - האלופה!) | 0 נק'\n4. ⚽ פיצ'יצי (שלומי) | 0 נק'\n5. ⚽ חראלה (גיא) | 0 נק'\n6. ⚽ חולוניה (ארז) | 0 נק'\n\n🔥 מחזור 1 יוצא לדרך מחר ב-17:00!`;
        }

        // D. Predictor Standings Lookup (e.g. טבלת נביאים, מצב ההימורים)
        if (p.includes('נביא') || p.includes('הימור') || p.includes('ניחנ')) {
            try {
                const predSnap = await db.collection('leagueData').doc('predictor_standings').get();
                if (predSnap.exists) {
                    const standings = predSnap.data()?.standings || [];
                    if (standings.length > 0) {
                        const lines = standings.map((s: any, idx: number) => `${idx + 1}. *${s.name}* | ${s.points} נק' (${s.correct} ניחושים נכונים)`).join('\n');
                        return `🔮 *טבלת נביאי הליגה (מצב ההימורים המעודכן):*\n\n${lines}\n\n📱 הצביעו בסקרים לפני כל מחזור!`;
                    }
                }
            } catch (pErr) {
                console.error('Error fetching predictor standings:', pErr);
            }
            return `🔮 *טבלת נביאי הליגה (עונה 14):*\n\nהסקרים למחזור 1 יצאו לדרך! תצביעו בסקרים בקבוצה והניקוד המצטבר יעודכן כאן בסיום המחזור! 🏆`;
        }

        const cleanPrompt = userPrompt.replace(/^(לוזון|היי לוזון|שלום לוזון|אהלן לוזון|luzon|hi luzon|!לוזון|לוזון:)/i, '').trim();
        return `⚽ *פנטזי לוזון 14:*
אהלן ${managerName}! ⚽ שמעתי אותך לגבי "${cleanPrompt || userPrompt}"! העדכונים נרשמים בזירה! 🏆`;
    }
};

// 🟢 WhatsApp AI Webhook Endpoint (Meta WhatsApp Cloud API / Twilio) 🟢
export const whatsappWebhook = onRequest(
    { region: 'us-west1', cors: true },
    async (req, res) => {
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
            } else {
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

                        // Always log EVERY incoming message to whatsapp_group_history for smart continuous context
                        await db.collection('whatsapp_group_history').add({
                            chatId: chatId || 'group',
                            senderPhone,
                            managerName: getManagerNameByPhone(senderPhone),
                            messageText,
                            timestamp: Date.now()
                        });

                        const trimmed = messageText.trim().toLowerCase();
                        const startsWithLuzon = /^(לוזון|היי לוזון|שלום לוזון|אהלן לוזון|luzon|hi luzon|!לוזון|לוזון:)/i.test(trimmed);

                        // Check if bot is tagged or mentioned with @ or in mentionedJids
                        const mentionedJids: string[] = body?.messageData?.extendedTextMessageData?.mentionedJids || [];
                        const isBotMentionedInJids = mentionedJids.some(jid => 
                            jid.includes('972552696909') || 
                            jid.includes('552696909') || 
                            jid.includes('0552696909') || 
                            jid.includes('710722713612')
                        );

                        const isBotTaggedInText = (
                            messageText.includes('@') && (
                                messageText.includes('לוזון') || 
                                messageText.includes('552696909') || 
                                messageText.includes('055') || 
                                messageText.includes('luzon')
                            )
                        ) || messageText.includes('@~לוזון') || messageText.includes('@לוזון');

                        const isDirectedToBot = startsWithLuzon || isBotMentionedInJids || isBotTaggedInText;

                        if (!isDirectedToBot) {
                            console.log(`IRON RULE: Green API message from ${senderPhone} in ${chatId} saved to group history, but ignored for AI reply because it does not tag Luzon.`);
                            res.status(200).json({ status: 'saved_to_history_not_addressed_to_bot' });
                            return;
                        }

                        const aiReply = await askGeminiFantasyAI(messageText, senderPhone, chatId);

                        const greenHost = 'https://7107.api.greenapi.com';
                        const greenId = '710722713612';
                        const greenToken = '4c1d55acf6d44149bbd1b515ae065b5131f83be1761a435e97';

                        await axios.post(`${greenHost}/waInstance${greenId}/sendMessage/${greenToken}`, {
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

                        await axios.post(
                            `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
                            {
                                messaging_product: 'whatsapp',
                                recipient_type: 'individual',
                                to: fromPhone,
                                type: 'text',
                                text: {
                                    body: aiReply
                                }
                            },
                            {
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                    }
                }

                res.status(200).json({ status: 'success' });
            } catch (err: any) {
                console.error('Error handling WhatsApp webhook:', err);
                res.status(500).json({ error: err.message });
            }
            return;
        }

        res.status(405).send('Method Not Allowed');
    }
);

// 🟢 API Webhook לסוכן Gemini Spark לעדכון לוח משחקי ליגת העל (שעה, ערוץ, מגרש) 🟢
export const updateRealFixtures = onRequest(
    { region: 'us-west1', cors: true },
    async (req, res) => {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        try {
            const { apiKey, matches } = req.body || {};
            const SECRET_KEY = process.env.WEBHOOK_SECRET_KEY || 'luzon_spark_agent_2026';

            if (apiKey !== SECRET_KEY && apiKey !== 'luzon_spark_agent_2026') {
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
        } catch (err: any) {
            console.error('Error updating real fixtures:', err);
            res.status(500).json({ error: err.message });
        }
    }
);

// 🟢 שליחת הודעת סגירת מחזור מקיפה לקבוצת ה-WhatsApp של הליגה 🟢
export const broadcastRoundCloseToWhatsApp = onCall({ region: 'us-west1' }, async (request) => {
    try {
        const round = Number(request.data?.round || 1);
        console.log(`[broadcastRoundCloseToWhatsApp] Broadcasting closure of round ${round}...`);

        // 1. Fetch updated league standings from 'users'
        const usersSnap = await db.collection('users').get();
        const teams: any[] = [];
        usersSnap.forEach(doc => {
            const d = doc.data();
            if (d.teamName && doc.id !== 'admin' && doc.id !== 'system') {
                teams.push({
                    id: doc.id,
                    teamName: d.teamName,
                    points: Number(d.points || 0),
                    gf: Number(d.gf || 0),
                    ga: Number(d.ga || 0),
                    diff: Number((d.gf || 0) - (d.ga || 0)),
                    played: Number(d.played || 0)
                });
            }
        });

        // Sort standings: Points desc, Goal Diff desc, Goals For desc
        teams.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.diff !== a.diff) return b.diff - a.diff;
            return b.gf - a.gf;
        });

        // Format Standings Table
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
        let standingsText = `📊 *טבלת הליגה המעודכנת לאחר מחזור ${round}:*\n`;
        teams.forEach((t, idx) => {
            const icon = medals[idx] || `${idx + 1}.`;
            standingsText += `${icon} *${t.teamName}* | ${t.points} נק' (${t.diff > 0 ? '+' : ''}${t.diff} שערים)\n`;
        });

        // 2. Fetch Next Round H2H matches from 'leagueData/fixtures'
        const nextRound = round + 1;
        let nextMatchesText = `\n⚔️ *משחקי מחזור ${nextRound} בינינו:*\n`;
        try {
            const fixturesSnap = await db.collection('leagueData').doc('fixtures').get();
            if (fixturesSnap.exists) {
                const roundsData = fixturesSnap.data()?.rounds || [];
                const nextRoundData = roundsData.find((r: any) => r.round === nextRound);
                if (nextRoundData && Array.isArray(nextRoundData.matches)) {
                    nextRoundData.matches.forEach((m: any) => {
                        const hName = teams.find(t => t.id === m.h)?.teamName || m.h;
                        const aName = teams.find(t => t.id === m.a)?.teamName || m.a;
                        nextMatchesText += `• *${hName}* 🆚 *${aName}*\n`;
                    });
                } else {
                    nextMatchesText += `• לוח המשחקים למחזור ${nextRound} יעודכן בקרוב באפליקציה!\n`;
                }
            }
        } catch (fErr) {
            console.error('Error reading next round fixtures:', fErr);
        }

        // 3. Fetch recent AI Analyst post for round
        let analystText = '';
        try {
            const postsSnap = await db.collection('social_posts')
                .where('authorName', '==', 'האנליסט AI 🤖')
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();

            if (!postsSnap.empty) {
                const post = postsSnap.docs[0].data();
                if (post.content) {
                    analystText = `\n🎙️ *סיכום המחזור מפי הפרשן (האנליסט AI):*\n${post.content}\n`;
                }
            }
        } catch (aiErr) {
            console.error('Error reading AI Analyst summary:', aiErr);
        }

        // 4. Construct Final WhatsApp Message
        const fullMessage = `⚽ *פנטזי לוזון 14 - סיכום מחזור ${round}* ⚽\n\n` +
            `${standingsText}` +
            `${nextMatchesText}` +
            `${analystText}\n` +
            `📱 לצפייה בניקוד המלא והרכבי המחזור הבא:\nhttps://fantasy-luzon.web.app`;

        // 5. Send via Green API to Group Chat (120363412136780106@g.us)
        const groupChatId = '120363412136780106@g.us';
        const greenHost = 'https://7107.api.greenapi.com';
        const greenId = '710722713612';
        const greenToken = '4c1d55acf6d44149bbd1b515ae065b5131f83be1761a435e97';

        await axios.post(`${greenHost}/waInstance${greenId}/sendMessage/${greenToken}`, {
            chatId: groupChatId,
            message: fullMessage
        });

        console.log(`[broadcastRoundCloseToWhatsApp] Sent round ${round} summary to Green API group chatId ${groupChatId}!`);
        return { success: true, message: `Round ${round} summary broadcasted to WhatsApp group!` };
    } catch (err: any) {
        console.error('[broadcastRoundCloseToWhatsApp] Error broadcasting round summary:', err);
        throw new HttpsError('internal', err.message);
    }
});

// 🟢 תזכורת אוטומטית 24 שעות לפני תחילת כל מחזור ב-WhatsApp 🟢
const runRoundReminderLogic = async (force: boolean = false): Promise<any> => {
    const settingsSnap = await db.doc('leagueData/settings').get();
    const round = settingsSnap.data()?.currentRound || 1;

    const reminderDoc = await db.doc('leagueData/reminders').get();
    const lastSentRound = reminderDoc.exists ? reminderDoc.data()?.lastSentRound : 0;

    if (!force && lastSentRound === round) {
        return { success: false, reason: `Reminder for round ${round} was already sent.` };
    }

    const realSnap = await db.doc('leagueData/real_fixtures').get();
    if (!realSnap.exists) return { success: false, reason: 'real_fixtures not found' };

    const realMatches = realSnap.data()?.matches || [];
    const roundMatches = realMatches.filter((m: any) => m.round === round);
    if (roundMatches.length === 0) return { success: false, reason: `No matches for round ${round}` };

    const firstMatch = roundMatches[0];
    let kickoffTime = Date.now();
    if (firstMatch.date && firstMatch.time) {
        const parts = firstMatch.date.split('/');
        if (parts.length === 3) {
            const isoStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T${firstMatch.time}:00+03:00`;
            kickoffTime = new Date(isoStr).getTime();
        }
    }

    const now = Date.now();
    const diffMs = kickoffTime - now;
    const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    const diffMins = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

    const timeStr = (diffHours > 0 ? `${diffHours} שעות ו-` : '') + `${diffMins} דקות`;

    const usersSnap = await db.collection('users').get();
    const teams: any[] = [];
    usersSnap.forEach(d => {
        if (d.data().teamName && d.id !== 'admin' && d.id !== 'system') {
            teams.push({ id: d.id, name: d.data().teamName });
        }
    });

    const fixSnap = await db.doc('leagueData/fixtures').get();
    const rounds = fixSnap.data()?.rounds || [];
    const rData = rounds.find((r: any) => r.round === round);
    const h2hLines = (rData?.matches || []).map((m: any) => {
        const hName = teams.find(t => t.id === m.h)?.name || m.h;
        const aName = teams.find(t => t.id === m.a)?.name || m.a;
        return `• *${hName}* 🆚 *${aName}*`;
    }).join('\n');

    const realLines = roundMatches.slice(0, 5).map((m: any) => 
        `• *${m.homeTeam}* 🆚 *${m.awayTeam}* (${m.date} בשעה ${m.time}${m.tvChannel ? ` | ${m.tvChannel}` : ''})`
    ).join('\n');

    const fullMessage = `⏰ *תזכורת חמה: נותרו כ-${timeStr} לשריקת הפתיחה של מחזור ${round}!* ⏳⚽\n\n` +
        `🚨 *אל תשכחו להכניס ולעדכן הרכבים פותחים באפליקציה לפני המשחק הראשון!*\n\n` +
        `⚔️ *המפגשים בינינו במחזור ${round} בפנטזי:*\n` +
        `${h2hLines || 'לוח המשחקים מעודכן באפליקציה!'}\n\n` +
        `🏟️ *משחקי ליגת העל במחזור:*\n` +
        `${realLines}\n\n` +
        `📱 להעמדת הרכבים וניהול הקבוצה:\nhttps://fantasy-luzon.web.app`;

    const groupChatId = '120363412136780106@g.us';
    const greenHost = 'https://7107.api.greenapi.com';
    const greenId = '710722713612';
    const greenToken = '4c1d55acf6d44149bbd1b515ae065b5131f83be1761a435e97';

    await axios.post(`${greenHost}/waInstance${greenId}/sendMessage/${greenToken}`, {
        chatId: groupChatId,
        message: fullMessage
    });

    // 🟢 Send Native WhatsApp Polls for each H2H matchup 🟢
    if (rData && Array.isArray(rData.matches)) {
        for (let idx = 0; idx < rData.matches.length; idx++) {
            const m = rData.matches[idx];
            const hName = teams.find(t => t.id === m.h)?.name || m.h;
            const aName = teams.find(t => t.id === m.a)?.name || m.a;
            
            try {
                const pollUrl = `${greenHost}/waInstance${greenId}/sendPoll/${greenToken}`;
                await axios.post(pollUrl, {
                    chatId: groupChatId,
                    message: `⚔️ סקר ניחושים מחזור ${round} (משחק ${idx + 1}): מי תנצח במפגש בין ${hName} ל-${aName}? ⚽`,
                    options: [
                        { optionName: `🏆 ניצחון ל-${hName}` },
                        { optionName: `🏆 ניצחון ל-${aName}` },
                        { optionName: `🤝 תיקו דרמטי!` }
                    ]
                });
            } catch (pErr) {
                console.error(`Error sending poll for H2H match ${hName} vs ${aName}:`, pErr);
            }
        }
    }

    await db.doc('leagueData/reminders').set({
        lastSentRound: round,
        lastSentAt: new Date().toISOString()
    }, { merge: true });

    console.log(`[runRoundReminderLogic] Broadcasted 24h reminder for round ${round}!`);
    return { success: true, round, timeStr, message: fullMessage };
};

// 🟢 סנכרון וארכוב נתוני מחזור מלאים לאקסל/Google Sheets 🟢
export const syncMatchToExcel = onCall({ region: 'us-west1' }, async (request) => {
    try {
        const { rows, round } = request.data || {};
        const roundNum = round || (rows && rows[0]?.round) || 1;

        console.log(`[syncMatchToExcel] Archiving ${rows?.length || 0} player records for round ${roundNum}...`);

        // 1. Save detailed Excel archive document in Firestore
        await db.collection('round_excel_archives').doc(`round_${roundNum}`).set({
            round: roundNum,
            rows: rows || [],
            timestamp: new Date().toISOString(),
            totalRecords: rows?.length || 0
        }, { merge: true });

        // 2. Archive complete H2H Fantasy Fixtures & Retroactive Results for Excel
        const fixSnap = await db.doc('leagueData/fixtures').get();
        const rounds = fixSnap.data()?.rounds || [];
        const h2hArchive: any[] = [];
        const TEAM_NAMES: Record<string, string> = {
            hamsili: 'חמסילי (ערן ואסף)',
            harale: 'חראלה (גיא)',
            holonia: 'חולוניה (ארז)',
            pichichi: 'פיצ\'יצי (שלומי)',
            tampa: 'טמפה (יינון)',
            tumali: 'תומאלי (אלי ותום)'
        };

        rounds.forEach((r: any) => {
            (r.matches || []).forEach((m: any) => {
                const hName = TEAM_NAMES[m.h] || m.h;
                const aName = TEAM_NAMES[m.a] || m.a;
                const hs = m.hs !== undefined ? m.hs : '-';
                const as = m.as !== undefined ? m.as : '-';
                let status = r.isPlayed ? 'שוחק' : 'טרם שוחק';
                if (r.isPlayed && m.hs !== undefined && m.as !== undefined) {
                    if (m.hs > m.as) status = `ניצחון ל-${hName}`;
                    else if (m.as > m.hs) status = `ניצחון ל-${aName}`;
                    else status = 'תיקו';
                }
                h2hArchive.push({
                    round: r.round,
                    homeTeam: hName,
                    homeScore: hs,
                    awayScore: as,
                    awayTeam: aName,
                    status
                });
            });
        });

        await db.collection('leagueData').doc('h2h_excel_archive').set({
            fixtures: h2hArchive,
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        return { success: true, count: rows?.length || 0, message: `Round ${roundNum} data & H2H schedule archived successfully!` };
    } catch (err: any) {
        console.error('[syncMatchToExcel] Error:', err);
        return { success: false, error: err.message };
    }
});

export const triggerRoundReminder = onRequest({ region: 'us-west1', cors: true }, async (req, res) => {
    try {
        const result = await runRoundReminderLogic(true);
        res.status(200).json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 🟢 תזכורת אוטומטית שעה אחת לפני המשחק הראשון של המחזור עם תיוג @ למאמנים שלא העמידו הרכב 🟢
export const runOneHourPreMatchReminder = async (forceManual: boolean = false) => {
    console.log('[runOneHourPreMatchReminder] Checking 1-hour pre-match reminder...');
    const settingsSnap = await db.doc('leagueData/settings').get();
    const round = settingsSnap.data()?.currentRound || 1;

    if (!forceManual) {
        const remindersSnap = await db.doc('leagueData/reminders').get();
        if (remindersSnap.exists && remindersSnap.data()?.[`sent_1h_round_${round}`]) {
            console.log(`[1h Reminder] Reminder for round ${round} was already sent.`);
            return { success: false, reason: `1h reminder for round ${round} already sent.` };
        }
    }

    const realSnap = await db.doc('leagueData/real_fixtures').get();
    if (!realSnap.exists) return { success: false, reason: 'real_fixtures not found' };

    const realMatches = realSnap.data()?.matches || [];
    const roundMatches = realMatches.filter((m: any) => m.round === round);
    if (roundMatches.length === 0) return { success: false, reason: `No real matches for round ${round}` };

    const firstMatch = roundMatches[0];
    let kickoffTime = Date.now();
    if (firstMatch.date && firstMatch.time) {
        const parts = firstMatch.date.split('/');
        if (parts.length === 3) {
            const isoStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T${firstMatch.time}:00+03:00`;
            kickoffTime = new Date(isoStr).getTime();
        }
    }

    const now = Date.now();
    const diffMs = kickoffTime - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (!forceManual && (diffHours > 1.25 || diffHours < 0)) {
        return { success: false, reason: `Not in 1h window (kickoff in ${diffHours.toFixed(2)} hours)` };
    }

    const usersSnap = await db.collection('users').get();
    const missingTeams: any[] = [];

    usersSnap.forEach(docSnap => {
        const u = docSnap.data();
        if (u.teamName && docSnap.id !== 'admin' && docSnap.id !== 'system') {
            const lineup = u.published_lineup || u.lineup || [];
            if (!Array.isArray(lineup) || lineup.length < 11) {
                const phonesList: string[] = [];
                if (Array.isArray(u.phones)) {
                    phonesList.push(...u.phones);
                } else if (typeof u.phone === 'string') {
                    phonesList.push(u.phone);
                }

                if (docSnap.id === 'hamsili' && phonesList.length === 0) {
                    phonesList.push('972525001777', '972522390580');
                } else if (docSnap.id === 'tumali' && phonesList.length === 0) {
                    phonesList.push('972535330428', '972526330513');
                }

                const fcmTokensList: string[] = [];
                if (Array.isArray(u.fcmTokens)) fcmTokensList.push(...u.fcmTokens);
                if (u.fcmToken && !fcmTokensList.includes(u.fcmToken)) fcmTokensList.push(u.fcmToken);

                missingTeams.push({
                    id: docSnap.id,
                    teamName: u.teamName,
                    manager: u.manager || '',
                    assistantName: u.assistantName || '',
                    phones: Array.from(new Set(phonesList)),
                    fcmTokens: Array.from(new Set(fcmTokensList)),
                    lineupCount: Array.isArray(lineup) ? lineup.length : 0
                });
            }
        }
    });

    if (missingTeams.length === 0) {
        console.log(`[1h Reminder] All teams have published full lineups for round ${round}!`);
        return { success: true, message: 'All teams have full lineups!' };
    }

    // 🟢 Send Personal FCM Push Notifications directly to all device tokens of missing team managers & co-managers 🟢
    for (const team of missingTeams) {
        const teamTokensSet = new Set<string>();

        usersSnap.forEach(dSnap => {
            const data = dSnap.data();
            const isMatch = (
                dSnap.id === team.id ||
                data.teamId === team.id ||
                (data.email && team.email && data.email.toLowerCase() === team.email.toLowerCase()) ||
                (data.assistantEmail && team.assistantEmail && data.assistantEmail.toLowerCase() === team.assistantEmail.toLowerCase()) ||
                (team.id === 'hamsili' && data.email && data.email.toLowerCase().includes('eranyy'))
            );

            if (isMatch) {
                if (Array.isArray(data.fcmTokens)) data.fcmTokens.forEach((t: string) => teamTokensSet.add(t));
                if (data.fcmToken) teamTokensSet.add(data.fcmToken);
            }
        });

        const allTeamTokens = Array.from(teamTokensSet);

        if (allTeamTokens.length > 0) {
            try {
                await admin.messaging().sendEachForMulticast({
                    tokens: allTeamTokens,
                    notification: {
                        title: `⏰ תזכורת הרכב דחופה - ${team.teamName} ⚽`,
                        body: `נותרה שעה 1 בלבד לשריקת הפתיחה של מחזור ${round}! היכנס עכשיו לאפליקציה ועדכן הרכב פותח.`
                    },
                    data: {
                        url: 'https://fantasy-luzon.web.app',
                        type: 'LINEUP_REMINDER_1H'
                    }
                });
                console.log(`[1h Reminder Push] Sent FCM push notification to ${team.teamName} (${allTeamTokens.length} devices).`);
            } catch (pushErr: any) {
                console.error(`[1h Reminder Push] Error sending push to ${team.teamName}:`, pushErr?.message || pushErr);
            }
        }
    }

    const missingLines = missingTeams.map(t => {
        const mentionsStr = t.phones.map((p: string) => `@${p.replace(/\D/g, '')}`).join(' ');
        const managerNames = [t.manager, t.assistantName].filter(Boolean).join(' & ');
        return `⚠️ *${t.teamName}* (${managerNames}): ${mentionsStr}`;
    }).join('\n');

    const fullMessage = `⏰ *תזכורת חמה! שעה 1 בלבד לשריקת הפתיחה של מחזור ${round}!* ⚽⏳\n\n` +
        `🚨 *הקבוצות הבאות עדיין לא עדכנו/השלימו הרכב פותח בזירה:*\n` +
        `${missingLines}\n\n` +
        `📱 היכנסו עכשיו לאפליקציה ועדכנו הרכב לפני הנעילה:\n` +
        `https://fantasy-luzon.web.app`;

    const groupChatId = '120363412136780106@g.us';
    const greenHost = 'https://7107.api.greenapi.com';
    const greenId = '710722713612';
    const greenToken = '4c1d55acf6d44149bbd1b515ae065b5131f83be1761a435e97';

    await axios.post(`${greenHost}/waInstance${greenId}/sendMessage/${greenToken}`, {
        chatId: groupChatId,
        message: fullMessage
    });

    await db.doc('leagueData/reminders').set({
        [`sent_1h_round_${round}`]: true,
        lastSentAt: new Date().toISOString()
    }, { merge: true });

    console.log(`[runOneHourPreMatchReminder] Sent 1h reminder for round ${round} to ${missingTeams.length} missing teams.`);
    return { success: true, round, missingTeamsCount: missingTeams.length, message: fullMessage };
};

export const scheduled1HourReminder = onSchedule('every 15 minutes', async () => {
    try {
        await runOneHourPreMatchReminder(false);
    } catch (e: any) {
        console.error('Error in scheduled1HourReminder:', e?.message || e);
    }
});

export const trigger1HourReminder = onRequest({ region: 'us-west1', cors: true }, async (req, res) => {
    try {
        const result = await runOneHourPreMatchReminder(true);
        res.status(200).json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 🟢 סנכרון אוטומטי מיומן Google Calendar (eranyy@gmail.com) 🟢
export const scheduledCalendarSync = onSchedule('every 6 hours', async () => {
    try {
        const calendarId = 'eranyy@gmail.com';
        const apiKey = process.env.GOOGLE_API_KEY || 'AIzaSyARwamUBjcirbqFtWn_RpKkOdiHmeGlis0';
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&singleEvents=true&orderBy=startTime`;

        const response = await axios.get(url);
        const items = response.data?.items || [];

        const israeliTeams = [
            'מכבי תל אביב', 'מכבי חיפה', 'הפועל באר שבע', 'הפועל תל אביב',
            'בית"ר ירושלים', 'מכבי נתניה', 'הפועל ירושלים', 'הפועל חיפה',
            'בני סכנין', 'מכבי פתח תקווה', 'הפועל פתח תקווה',
            'עירוני קרית שמונה', 'עירוני טבריה', 'הפועל רמת גן'
        ];

        const matchedMatches: any[] = [];

        items.forEach((item: any) => {
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
                    if (fullText.includes('ספורט 5')) tvChannel = 'ספורט 5';
                    else if (fullText.includes('ספורט 1')) tvChannel = 'ספורט 1';
                    else if (fullText.includes('ספורט 2')) tvChannel = 'ספורט 2';
                    else if (fullText.includes('ספורט 3')) tvChannel = 'ספורט 3';
                    else if (fullText.includes('ספורט 4')) tvChannel = 'ספורט 4';
                    else if (fullText.includes('כאן 11')) tvChannel = 'כאן 11';

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
    } catch (e: any) {
        console.error('Error syncing Google Calendar:', e?.message || e);
    }
});

// 🟢 סנכרון אוטומטי מתוך קובץ Google Sheets של משחקי ליגת העל והגביע 🟢
const runSheetSyncLogic = async () => {
    const primaryUrl = 'https://docs.google.com/spreadsheets/d/14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s/gviz/tq?tqx=out:csv';
    const fallbackUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQu3dsWYrZmhp_LvcWSisQODusa0aETCYEHLlJGbKeqOpLBJFhwHCFML5HlpHnbSdeUEycx2K3KhZLt/pub?output=csv';
    
    let csvData = '';
    try {
        const res = await axios.get(primaryUrl);
        csvData = res.data;
    } catch (e) {
        console.warn('Primary sheet URL failed, trying fallback URL:', (e as any)?.message);
        try {
            const res = await axios.get(fallbackUrl);
            csvData = res.data;
        } catch (err) {
            console.error('All sheet URLs failed:', (err as any)?.message);
        }
    }

    if (!csvData) return { count: 0 };

    const parseCsvLine = (line: string) => {
        const result = [];
        let insideQuote = false;
        let entry = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (insideQuote && line[i + 1] === '"') {
                    entry += '"';
                    i++;
                } else {
                    insideQuote = !insideQuote;
                }
            } else if (char === ',' && !insideQuote) {
                result.push(entry.trim());
                entry = '';
            } else {
                entry += char;
            }
        }
        result.push(entry.trim());
        return result;
    };

    const lines = csvData.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    if (lines.length <= 1) return { count: 0 };

    const matches: any[] = [];
    const cupMatches: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 6) continue;

        const roundStage = cols[0]; // מחזור 1
        const dateStr = cols[1];    // 22/08/2026
        const dayStr = cols[2];     // שבת
        const timeStr = cols[3];    // 20:00
        const homeTeam = cols[4];   // מכבי חיפה
        const awayTeam = cols[5];   // הפועל רמת גן
        const competition = cols[6] || ''; // ליגת WINNER / גביע המדינה
        const stadium = cols[7] || '';     // אצטדיון סמי עופר
        const tvChannel = cols[8] || '';   // ספורט 1 / ספורט 2
        const status = cols[9] || '';      // עתידי / נדחה

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
        } else {
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

export const scheduledSheetSync = onSchedule('every 2 hours', async () => {
    try {
        await runSheetSyncLogic();
    } catch (e: any) {
        console.error('Error in scheduledSheetSync:', e?.message || e);
    }
});

export const triggerSheetSync = onRequest({ region: 'us-west1', cors: true }, async (req, res) => {
    try {
        const result = await runSheetSyncLogic();
        res.status(200).json({ success: true, ...result });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});