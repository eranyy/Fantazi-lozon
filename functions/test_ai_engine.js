const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const CANONICAL_TEAMS = {
    'hamsili': { name: 'חמסילי', manager: 'אסף & ערן' },
    'harale': { name: 'חראלה', manager: 'גיא' },
    'holonia': { name: 'חולוניה', manager: 'ארז' },
    'pichichi': { name: 'פיציצי', manager: 'שלומי' },
    'tampa': { name: 'טמפה', manager: 'יינון' },
    'tumali': { name: 'תומאלי', manager: 'אלי & תום' }
};

async function generateAILeagueResponse(prompt) {
    const p = prompt.trim();
    
    // Fetch live league data for full memory context
    const [settingsSnap, fixturesSnap, realFixturesSnap, usersSnap] = await Promise.all([
        db.doc('leagueData/settings').get(),
        db.doc('leagueData/fixtures').get(),
        db.doc('leagueData/real_fixtures').get(),
        db.collection('users').get()
    ]);

    const currentRound = settingsSnap.data()?.currentRound || 1;
    const teamsData = [];

    usersSnap.forEach(d => {
        const u = d.data();
        if (CANONICAL_TEAMS[d.id] || u.manager) {
            const teamInfo = CANONICAL_TEAMS[d.id] || { name: u.teamName || d.id, manager: u.manager || '' };
            teamsData.push({
                id: d.id,
                teamName: teamInfo.name,
                manager: teamInfo.manager,
                totalPoints: Number(u.totalPoints || u.points) || 0,
                wins: Number(u.wins) || 0,
                draws: Number(u.draws) || 0,
                losses: Number(u.losses) || 0,
                lineup: u.published_lineup || u.lineup || [],
                squad: u.squad || []
            });
        }
    });

    teamsData.sort((a, b) => b.totalPoints - a.totalPoints);

    // 1. Table / Leaderboard queries
    if (p.includes('טבלה') || p.includes('מי מוביל') || p.includes('מקום ראשון') || p.includes('מי בראש')) {
        const leader = teamsData[0];
        const second = teamsData[1];
        const last = teamsData[teamsData.length - 1];

        let msg = `🏆 *תחזית וניתוח טבלה בזירה - מחזור ${currentRound}!* 🏆\n\n`;
        msg += `👑 *בפיסגת הליגה:* *${leader?.teamName}* (${leader?.manager}) עם ${leader?.totalPoints} נקודות!\n`;
        if (second) msg += `🥈 *במקום השני:* *${second?.teamName}* (${second?.manager}) עם ${second?.totalPoints} נק' (${leader?.totalPoints - second?.totalPoints} נק' מהפסגה!)\n`;
        if (last) msg += `📉 *בתחתית הבוערת:* *${last?.teamName}* (${last?.manager}) עם ${last?.totalPoints} נק' בלבד. חייב ניצחון דחוף!\n\n`;
        
        msg += `📊 *הטבלה המלאה בזירה:*\n`;
        teamsData.forEach((t, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⚽';
            msg += `${medal} ${idx + 1}. *${t.teamName}* (${t.manager}) - ${t.totalPoints} נק' (${t.wins}נ', ${t.draws}ת', ${t.losses}ה')\n`;
        });
        
        msg += `\n💬 *פרשנות לוזון AI:* הכל פתוח! מחזור ${currentRound} הולך להיות לוהט! 🔥`;
        return msg;
    }

    // 2. Matchups / Next Round queries
    if (p.includes('מי נגד מי') || p.includes('משחקים') || p.includes('מחזור') || p.includes('תחזית')) {
        const fantasyRound = (fixturesSnap.data()?.rounds || []).find(r => r.round === currentRound);
        const matches = fantasyRound?.matches || [];

        let msg = `⚔️ *ניתוח טקטי של לוזון AI למחזור ${currentRound} בזירה!* ⚔️\n\n`;
        matches.forEach(m => {
            const hTeam = teamsData.find(t => t.id === m.h) || { teamName: m.h, manager: '' };
            const aTeam = teamsData.find(t => t.id === m.a) || { teamName: m.a, manager: '' };
            msg += `⚔️ *${hTeam.teamName}* (${hTeam.manager}) 🆚 *${aTeam.teamName}* (${aTeam.manager})\n`;
            msg += `   📊 מאזן נקודות: ${hTeam.totalPoints || 0} נק' מול ${aTeam.totalPoints || 0} נק'\n`;
        });
        msg += `\n🔒 *תזכורת:* הרכבים ננעלים בשבת בשעה 20:00!`;
        return msg;
    }

    // 3. Default AI Analyst commentary
    return `⚽ *לוזון AI בוט לשירותך!* 🤖\nאני עוקב אחרי כל הנתונים, ההרכבים והניקוד בזירה בזמן אמת.\nרשום לקבוצה: *"לוזון טבלה"*, *"לוזון תחזית"* או *"לוזון מי מוביל"* ותקבל ניתוח מקצועי ושנון! 🔥`;
}

(async () => {
    console.log(await generateAILeagueResponse('לוזון מי מוביל בקשה?'));
    console.log('\n--- NEXT QUERY ---');
    console.log(await generateAILeagueResponse('לוזון מה המשחקים הקרובים?'));
    process.exit(0);
})();
