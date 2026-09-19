const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const canonicalTeamNames = {
    'hamsili': 'חמסילי',
    'harale': 'חראלה',
    'holonia': 'חולוניה',
    'pichichi': 'פיציצי',
    'tampa': 'טמפה',
    'tumali': 'תומאלי'
};

(async () => {
    const [settingsSnap, fantasyFixturesSnap, realFixturesSnap, usersSnap] = await Promise.all([
        db.doc('leagueData/settings').get(),
        db.doc('leagueData/fixtures').get(),
        db.doc('leagueData/real_fixtures').get(),
        db.collection('users').get()
    ]);

    const currentRound = (settingsSnap.exists ? settingsSnap.data()?.currentRound : 1) || 1;
    const cutoffDate = new Date('2026-08-24T21:00:00Z').getTime();

    const teamsMap = { ...canonicalTeamNames };
    const missingTeams = [];

    usersSnap.forEach(docSnap => {
        const u = docSnap.data();
        if (!u.manager && !canonicalTeamNames[docSnap.id]) return;

        const teamName = u.teamName || u.name || canonicalTeamNames[docSnap.id] || docSnap.id;
        teamsMap[docSnap.id] = teamName;
        if (u.teamId) teamsMap[u.teamId] = teamName;

        const lastUpdate = u.lastLineupUpdate ? new Date(u.lastLineupUpdate).getTime() : 0;
        const hasRoundLineup = Boolean(u.lineupsByRound?.[currentRound] || (currentRound > 1 ? lastUpdate > cutoffDate : lastUpdate > 0));

        if (!hasRoundLineup) {
            const phonesList = [];
            if (u.phone) phonesList.push(u.phone);
            if (u.assistantPhone) phonesList.push(u.assistantPhone);
            if (Array.isArray(u.phones)) phonesList.push(...u.phones);

            missingTeams.push({
                id: docSnap.id,
                teamName,
                manager: u.manager || '',
                assistantName: u.assistantName || '',
                phones: Array.from(new Set(phonesList))
            });
        }
    });

    const fantasyRound = (fantasyFixturesSnap.data()?.rounds || []).find(r => r.round === currentRound);
    const fantasyMatchesStr = (fantasyRound?.matches || []).map(m => {
        const homeName = teamsMap[m.h] || canonicalTeamNames[m.h] || m.h;
        const awayName = teamsMap[m.a] || canonicalTeamNames[m.a] || m.a;
        return `⚔️ *${homeName}* 🆚 *${awayName}*`;
    }).join('\n');

    const realMatches = realFixturesSnap.exists ? realFixturesSnap.data()?.matches || [] : [];
    const upcoming = realMatches.filter(m => (m.round === currentRound || !m.round) && !String(m.status || '').includes('הסתיים'));
    
    const parseDate = (dStr, tStr) => {
        if (!dStr) return new Date(9999, 0, 1).getTime();
        const parts = dStr.split(/[\/\.]/);
        if (parts.length < 3) return new Date(9999, 0, 1).getTime();
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const [h, m] = (tStr || '20:00').split(':');
        return new Date(year, month, day, parseInt(h || '20', 10), parseInt(m || '0', 10)).getTime();
    };

    upcoming.sort((a, b) => parseDate(a.date, a.time) - parseDate(b.date, b.time));
    const firstMatch = upcoming[0] || realMatches[0];

    const kickoffStr = firstMatch ? `${firstMatch.day || ''} (${firstMatch.date || ''}) בשעה ${firstMatch.time || ''} (${firstMatch.homeTeam} 🆚 ${firstMatch.awayTeam})` : 'יום שבת בשעה 20:00';
    const deadlineStr = firstMatch ? `${firstMatch.day || ''} (${firstMatch.date || ''}) בשעה ${firstMatch.time || ''}` : 'יום שבת בשעה 20:00';

    let missingLines = '';
    if (missingTeams.length > 0) {
        missingLines = missingTeams.map(t => {
            const mentionsStr = t.phones.map(p => `@${p.replace(/\D/g, '')}`).join(' ');
            const managerNames = [t.manager, t.assistantName].filter(Boolean).join(' & ');
            return `▫️ *${t.teamName}* (${managerNames})${mentionsStr ? ': ' + mentionsStr : ''}`;
        }).join('\n');
    } else {
        missingLines = `🎉 *כל המנג'רים כבר עדכנו הרכב מלא למחזור!* 👏`;
    }

    const fullMessage = `שבת שלום מנג'רים! ⚽ *תזכורת שישי לקראת מחזור ${currentRound} בפנטזי לוזון 14!* 🏆\n\n` +
        `⚔️ *משחקי הזירה (מי נגד מי במחזור ${currentRound}):*\n` +
        `${fantasyMatchesStr || 'משחקי הזירה הקרובים'}\n\n` +
        `⏰ *שעת המשחק הראשון בליגת העל:*\n` +
        `${kickoffStr}\n\n` +
        `🔒 *נעילת הרכבים:* יש לשלוח/לעדכן הרכב באפליקציה **עד ${deadlineStr} בדיוק!**\n\n` +
        `⚠️ *טרם עדכנו הרכב למחזור ${currentRound}:*\n` +
        `${missingLines}\n\n` +
        `📱 *עדכון הרכב באפליקציה:*\n` +
        `https://fantasy-luzon.web.app`;

    console.log('--- FORMATTED WHATSAPP MESSAGE ---');
    console.log(fullMessage);
    process.exit(0);
})();
