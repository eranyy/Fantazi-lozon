const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const webhookUrl = 'https://script.google.com/macros/s/AKfycbxl5IFlmuqfk_CZ4fMBuPDLMQ7GHTp8dwPxNmTJYqSzDho2_qFz-K0lnjB1Vy-6GlTl/exec';

const TEAM_NAMES = {
    hamsili: 'חמסילי (ערן ואסף)',
    harale: 'חראלה (גיא)',
    holonia: 'חולוניה (ארז)',
    pichichi: 'פיצ\'יצי (שלומי)',
    tampa: 'טמפה (יינון)',
    tumali: 'תומאלי (אלי ותום)'
};

async function resyncAllRounds() {
    console.log('=== STARTING RESYNC OF ALL ROUNDS (1-5) TO GOOGLE SHEETS WEBHOOK ===\n');

    // 1. Fetch H2H Fixtures Archive
    const fixSnap = await db.doc('leagueData/fixtures').get();
    const roundsData = fixSnap.data()?.rounds || [];
    const h2hArchive = [];

    roundsData.forEach((r) => {
        (r.matches || []).forEach((m) => {
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

    // Save to Firestore h2h_excel_archive
    await db.collection('leagueData').doc('h2h_excel_archive').set({
        fixtures: h2hArchive,
        lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 2. Build full H2H sheet rows
    const allH2HSheetRows = [];
    h2hArchive.filter(m => m.homeScore !== '-').forEach(m => {
        const hs = Number(m.homeScore);
        const as = Number(m.awayScore);
        const diff = Math.abs(hs - as);
        let winnerText = '🤝 תיקו';
        let ptsAwarded = '1 נק\' לכל קבוצה';
        if (hs > as) {
            winnerText = `🏆 ניצחון ל-${m.homeTeam}`;
            ptsAwarded = diff >= 20 ? `3 נק' (${m.homeTeam})` : `2 נק' (${m.homeTeam})`;
        } else if (as > hs) {
            winnerText = `🏆 ניצחון ל-${m.awayTeam}`;
            ptsAwarded = diff >= 20 ? `3 נק' (${m.awayTeam})` : `2 נק' (${m.awayTeam})`;
        }
        allH2HSheetRows.push([
            `מחזור ${m.round}`,
            m.homeTeam,
            hs,
            `${hs} : ${as}`,
            as,
            m.awayTeam,
            diff > 0 ? `+${diff}` : '0',
            winnerText,
            ptsAwarded
        ]);
    });

    // 3. Process each round's player scores from round_excel_archives
    const archivesSnap = await db.collection('round_excel_archives').get();
    console.log(`Found ${archivesSnap.docs.length} round archive documents in Firestore.`);

    const allPlayerSheetRows = [];

    // Sort by round
    const sortedDocs = archivesSnap.docs.sort((a, b) => {
        const rA = Number(a.id.replace('round_', '')) || 0;
        const rB = Number(b.id.replace('round_', '')) || 0;
        return rA - rB;
    });

    for (const docSnap of sortedDocs) {
        const data = docSnap.data();
        const rNum = data.round || Number(docSnap.id.replace('round_', ''));
        const rows = data.rows || [];
        console.log(`Processing Round ${rNum} with ${rows.length} player records...`);

        rows.forEach(r => {
            const teamName = r.fantasyTeam || r.fantasyTeamName || r.userId || '';
            const playerName = r.player || r.name || '';
            const syncId = r.syncId || `R${rNum}_${teamName}_${playerName}`;
            const dateStr = r.date || (data.timestamp ? data.timestamp.split('T')[0] : '2026-09-20');
            allPlayerSheetRows.push([
                syncId,
                dateStr,
                rNum,
                teamName,
                playerName,
                Number(r.points || 0)
            ]);
        });
    }

    console.log(`\nPosting ${allPlayerSheetRows.length} total player score rows to Google Sheets Webhook...`);
    try {
        const res1 = await axios.post(webhookUrl, JSON.stringify({
            sheetName: 'ארכיון ניקוד מחזורים',
            headers: ['מזהה סנכרון', 'תאריך', 'מחזור', 'קבוצת פנטזי', 'שם שחקן', 'ניקוד'],
            rows: allPlayerSheetRows
        }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });
        console.log('✅ Player Scores Webhook response status:', res1.status, res1.data);
    } catch (e) {
        console.error('❌ Error posting player scores:', e.message);
    }

    console.log(`\nPosting ${allH2HSheetRows.length} total H2H match result rows to Google Sheets Webhook...`);
    try {
        const res2 = await axios.post(webhookUrl, JSON.stringify({
            sheetName: 'תוצאות מפגשי פנטזי',
            headers: ['מחזור', 'קבוצת בית', 'ניקוד בית', 'תוצאת המפגש', 'ניקוד חוץ', 'קבוצת חוץ', 'הפרש', 'מנצחת / סטטוס', 'נקודות ליגה שהוענקו'],
            rows: allH2HSheetRows
        }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });
        console.log('✅ H2H Matches Webhook response status:', res2.status, res2.data);
    } catch (e) {
        console.error('❌ Error posting H2H results:', e.message);
    }

    // 4. Also fetch current standings and post to Standings sheet tab
    const usersSnap = await db.collection('users').get();
    const standings = [];
    usersSnap.forEach(uDoc => {
        const u = uDoc.data();
        standings.push({
            name: TEAM_NAMES[uDoc.id] || u.teamName || uDoc.id,
            played: u.played || 0,
            wins: u.wins || 0,
            draws: u.draws || 0,
            losses: u.losses || 0,
            gf: u.gf || 0,
            ga: u.ga || 0,
            gd: (u.gf || 0) - (u.ga || 0),
            points: u.points || 0
        });
    });

    standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

    const standingsRows = standings.map((t, idx) => [
        idx + 1,
        t.name,
        t.played,
        t.wins,
        t.draws,
        t.losses,
        t.gf,
        t.ga,
        t.gd > 0 ? `+${t.gd}` : `${t.gd}`,
        t.points
    ]);

    console.log(`\nPosting ${standingsRows.length} standings rows to Google Sheets Webhook...`);
    try {
        const res3 = await axios.post(webhookUrl, JSON.stringify({
            sheetName: 'טבלת הליגה',
            headers: ['מיקום', 'קבוצה', 'משחקים', 'נצחונות', 'תיקו', 'הפסדים', 'שערי זכות (ניקוד שנצבר)', 'שערי חובה (ניקוד שיריב צבר)', 'הפרש שערים', 'נקודות ליגה'],
            rows: standingsRows
        }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });
        console.log('✅ Standings Webhook response status:', res3.status, res3.data);
    } catch (e) {
        console.error('❌ Error posting Standings:', e.message);
    }

    // 5. Fetch Predictor Standings and post to 'טבלת הנביאים' tab
    const predSnap = await db.doc('leagueData/predictor_standings').get();
    if (predSnap.exists) {
        const pList = predSnap.data()?.standings || [];
        const predRows = pList.map((p, idx) => [
            idx + 1,
            p.name,
            p.hits || 0,
            p.totalVotes || 0,
            p.accuracy || '0%',
            p.points || 0
        ]);
        console.log(`\nPosting ${predRows.length} predictor rows to Google Sheets Webhook...`);
        try {
            const res4 = await axios.post(webhookUrl, JSON.stringify({
                sheetName: 'טבלת הנביאים',
                headers: ['מיקום', 'נביא / קבוצה', 'פגיעות מדויקות', 'סך הכל ניחושים', 'אחוזי הצלחה', 'נקודות נביאים'],
                rows: predRows
            }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });
            console.log('✅ Predictor Standings Webhook response status:', res4.status, res4.data);
        } catch (e) {
            console.error('❌ Error posting Predictor Standings:', e.message);
        }
    }

    console.log('\n=== ALL DATA RESYNC COMPLETED SUCCESSFULLY ===');
    process.exit(0);
}

resyncAllRounds().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
