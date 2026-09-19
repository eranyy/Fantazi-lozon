const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function testHaifaQuery() {
    const teamDiscussed = 'מכבי חיפה';
    const [settingsSnap, fantasyFixturesSnap, usersSnap, fanProfilesSnap, realFixturesSnap] = await Promise.all([
        db.doc('leagueData/settings').get(),
        db.doc('leagueData/fixtures').get(),
        db.collection('users').get(),
        db.doc('bot_league_memory/fan_profiles').get(),
        db.doc('leagueData/real_fixtures').get()
    ]);

    const fanProfiles = fanProfilesSnap.exists ? fanProfilesSnap.data() || {} : {};
    const realMatches = realFixturesSnap.data()?.matches || [];

    // Filter strictly for Maccabi Haifa (not Hapoel Haifa) and check completed matches
    const haifaMatches = realMatches.filter(m => 
        (m.homeTeam === 'מכבי חיפה' || m.awayTeam === 'מכבי חיפה') && 
        (m.status || '').includes('הסתיים')
    );
    const lastMatch = haifaMatches[haifaMatches.length - 1];

    const supportingManagers = Object.values(fanProfiles).filter((f) => {
        const str = (f.realFanOf || '') + ' ' + (f.banter || '') + ' ' + (Array.isArray(f.teamsList) ? f.teamsList.join(' ') : '');
        return str.includes(teamDiscussed);
    });

    let msg = `🗣️ *דיון לוהט על ${teamDiscussed}! (ניתוח אובייקטיבי מבית לוזון AI)* ⚽\n\n`;
    
    if (lastMatch) {
        msg += `⚽ *המשחק האחרון של ${teamDiscussed} בליגת העל במציאות:* \n▫️ *${lastMatch.homeTeam} 🆚 ${lastMatch.awayTeam}* (${lastMatch.roundStage})\n▫️ תוצאה: *${lastMatch.status}* (תאריך: ${lastMatch.date})\n\n`;
    }

    if (supportingManagers.length > 0) {
        const managersStr = supportingManagers.map((f) => `*${f.managers}* (${f.realFanOf})`).join('\n▫️ ');
        msg += `👀 *אהדה מוצהרת בזירה לקבוצה/נושא:* \n▫️ ${managersStr}\n\n`;
    }

    msg += `💡 *פרשנות ניטרלית ואובייקטיבית:* לוזון AI ממליץ לא להיות מונעים מטעמים רגשיים! בפנטזי מציבים שחקנים לפי כושר ותפוקה נטו במציאות ולא לפי הלב. 😉🔥`;
    
    console.log(msg);
    process.exit(0);
}

testHaifaQuery();
