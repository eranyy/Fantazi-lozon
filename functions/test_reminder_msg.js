const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

(async () => {
    const [settingsSnap, fixturesSnap, realSnap, usersSnap] = await Promise.all([
        db.doc('leagueData/settings').get(),
        db.doc('leagueData/fixtures').get(),
        db.doc('leagueData/real_fixtures').get(),
        db.collection('users').where('role', 'in', ['USER', 'OWNER']).get()
    ]);

    const currentRound = settingsSnap.data()?.currentRound || 1;
    
    const canonicalTeamNames = {
        'hamsili': 'חמסילי',
        'harale': 'חראלה',
        'holonia': 'חולוניה',
        'pichichi': 'פיציצי',
        'tampa': 'טמפה',
        'tumali': 'תומאלי'
    };

    const teamsMap = { ...canonicalTeamNames };
    const missingTeams = [];

    usersSnap.docs.forEach(d => {
        const u = d.data();
        const teamName = u.teamName || u.name || canonicalTeamNames[d.id] || d.id;
        teamsMap[d.id] = teamName;
        if (u.teamId) teamsMap[u.teamId] = teamName;

        const lineup = u.published_lineup || u.lineup || [];
        const isFullLineup = Array.isArray(lineup) && lineup.length >= 11;
        if (!isFullLineup) {
            const phonesList = [];
            if (u.phone) phonesList.push(u.phone);
            if (u.assistantPhone) phonesList.push(u.assistantPhone);
            missingTeams.push({
                teamName,
                manager: u.manager || '',
                assistantName: u.assistantName || '',
                phones: Array.from(new Set(phonesList))
            });
        }
    });

    const fantasyRound = (fixturesSnap.data()?.rounds || []).find(r => r.round === currentRound);
    const fantasyMatchesStr = (fantasyRound?.matches || []).map(m => {
        const homeName = teamsMap[m.h] || canonicalTeamNames[m.h] || m.h;
        const awayName = teamsMap[m.a] || canonicalTeamNames[m.a] || m.a;
        return `⚔️ *${homeName}* 🆚 *${awayName}*`;
    }).join('\n');

    const realMatches = realSnap.data()?.matches || [];
    const upcoming = realMatches.filter(m => !String(m.status || '').includes('הסתיים'));
    const firstMatch = upcoming[0] || realMatches[0];

    const kickoffStr = firstMatch ? `${firstMatch.day || ''} (${firstMatch.date || ''}) בשעה ${firstMatch.time || ''} (${firstMatch.homeTeam} 🆚 ${firstMatch.awayTeam})` : 'יום שבת בשעה 17:00';
    const deadlineStr = firstMatch ? `${firstMatch.day || ''} (${firstMatch.date || ''}) בשעה ${firstMatch.time || ''}` : 'יום שבת בשעה 17:00';

    let missingLines = '';
    if (missingTeams.length > 0) {
        missingLines = missingTeams.map(t => {
            const mentionsStr = t.phones.map((p) => `@${p.replace(/\D/g, '')}`).join(' ');
            const managerNames = [t.manager, t.assistantName].filter(Boolean).join(' & ');
            return `▫️ *${t.teamName}* (${managerNames}): ${mentionsStr}`;
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
        `⚠️ *מצב הגשת הרכבים כרגע:*\n` +
        `${missingLines}\n\n` +
        `📱 *עדכון הרכב באפליקציה:*\n` +
        `https://fantasy-luzon.web.app`;

    console.log('=== GENERATED EXAMPLE MESSAGE ===\n');
    console.log(fullMessage);
    console.log('\n================================');
    process.exit(0);
})();
