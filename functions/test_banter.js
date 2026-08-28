const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function testRealWorldBanter(prompt, managerName = 'ערן') {
    const p = prompt.trim();
    
    const [settingsSnap, fantasyFixturesSnap, usersSnap, fanProfilesSnap] = await Promise.all([
        db.doc('leagueData/settings').get(),
        db.doc('leagueData/fixtures').get(),
        db.collection('users').get(),
        db.doc('bot_league_memory/fan_profiles').get()
    ]);

    const fanProfiles = fanProfilesSnap.exists ? fanProfilesSnap.data() || {} : {};
    const currentRound = settingsSnap.data()?.currentRound || 1;

    // Real-Life Team Banter queries
    if (p.includes('חיפה') || p.includes('מכבי תא') || p.includes('מכבי ת"א') || p.includes('ביתר') || p.includes('בית"ר') || p.includes('הפועל')) {
        let teamDiscussed = p.includes('חיפה') ? 'מכבי חיפה' : (p.includes('מכבי') ? 'מכבי תל אביב' : p.includes('ביתר') || p.includes('בית"ר') ? 'בית"ר ירושלים' : 'הפועל תל אביב');

        const supportingManagers = Object.values(fanProfiles).filter((f) => f.realFanOf?.includes(teamDiscussed) || teamDiscussed.includes(f.realFanOf));

        let msg = `🗣️ *דיון לוהט על ${teamDiscussed}! (ניתוח אובייקטיבי מבית לוזון AI)* ⚽\n\n`;
        if (supportingManagers.length > 0) {
            const managersStr = supportingManagers.map((f) => `*${f.managers}* (קבוצת *${f.teamName}*)`).join(', ');
            msg += `👀 *אוהדי ${teamDiscussed} בזירה:* ${managersStr}\n`;
        }
        msg += `💡 *פרשנות ניטרלית ואובייקטיבית:* לוזון AI ממליץ לא להיות מונעים מטעמים רגשיים! בפנטזי מציבים שחקנים לפי כושר ותפוקה נטו במציאות ולא לפי הלב. 😉🔥\n`;
        return msg;
    }

    return 'OK';
}

(async () => {
    console.log(await testRealWorldBanter('לוזון מה אתה אומר על מכבי חיפה?'));
    process.exit(0);
})();
