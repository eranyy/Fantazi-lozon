const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

async function checkBotStatus() {
    console.log('--- CHECKING BOT SCRAPER READINESS FOR TODAY (29/08/2026) ---');

    const [scraperSnap, settingsSnap, realFixturesSnap] = await Promise.all([
        db.doc('settings/scraper').get(),
        db.doc('leagueData/settings').get(),
        db.doc('leagueData/real_fixtures').get()
    ]);

    const scraperConfig = scraperSnap.exists ? scraperSnap.data() : { enabled: true };
    const currentRound = settingsSnap.data()?.currentRound || 2;
    const matches = realFixturesSnap.data()?.matches || [];

    const todayMatches = matches.filter(m => m.round === currentRound || m.date?.includes('29/08'));

    console.log('1. Scraper Enabled:', scraperConfig.enabled !== false ? '🟢 YES (ACTIVE)' : '🔴 NO (DISABLED)');
    console.log('2. Current Round in Firestore:', currentRound);
    console.log('3. Today Matches (29/08/2026):', todayMatches.length);
    todayMatches.forEach((m, i) => {
        console.log(`   Match ${i+1}: ${m.homeTeam} vs ${m.awayTeam} at ${m.time} (${m.stadium}) - TV: ${m.tvChannel}`);
    });

    process.exit(0);
}

checkBotStatus();
