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

async function cleanAndRebuildFinalSheets() {
    console.log('=== CLEANING AND REBUILDING FINAL GOOGLE SHEETS ===\n');

    // 1. Clean Standings Tab ('🏆 טבלת הליגה')
    console.log('1. Rebuilding 🏆 טבלת הליגה (6 teams only)...');
    const usersSnap = await db.collection('users').get();
    const standings = [];
    usersSnap.forEach(uDoc => {
        if (TEAM_NAMES[uDoc.id]) {
            const u = uDoc.data();
            standings.push({
                name: TEAM_NAMES[uDoc.id],
                played: u.played || 0,
                wins: u.wins || 0,
                draws: u.draws || 0,
                losses: u.losses || 0,
                gf: u.gf || 0,
                ga: u.ga || 0,
                gd: (u.gf || 0) - (u.ga || 0),
                points: u.points || 0
            });
        }
    });
    standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

    const standingsRows = standings.map((t, idx) => [
        idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`,
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

    await axios.post(webhookUrl, JSON.stringify({
        sheetName: '🏆 טבלת הליגה',
        action: 'overwrite',
        headers: ['מיקום', 'קבוצת פנטזי', 'משחקים', 'נצחונות', 'תיקו', 'הפסדים', 'שערי זכות (ניקוד שנצבר)', 'שערי חובה (ניקוד שיריב צבר)', 'הפרש שערים', 'נקודות ליגה'],
        rows: standingsRows
    }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });

    // Also update tab 'טבלה' with clean matrix
    await axios.post(webhookUrl, JSON.stringify({
        sheetName: 'טבלה',
        action: 'overwrite',
        headers: ['מיקום', 'קבוצת פנטזי', 'משחקים', 'נצחונות', 'תיקו', 'הפסדים', 'שערי זכות (ניקוד שנצבר)', 'שערי חובה (ניקוד שיריב צבר)', 'הפרש שערים', 'נקודות ליגה'],
        rows: standingsRows
    }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });

    console.log('✅ Clean 🏆 טבלת הליגה updated with exactly 6 teams.');
    process.exit(0);
}

cleanAndRebuildFinalSheets().catch(e => {
    console.error(e);
    process.exit(1);
});
