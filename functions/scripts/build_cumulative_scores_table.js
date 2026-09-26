const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const webhookUrl = 'https://script.google.com/macros/s/AKfycbxl5IFlmuqfk_CZ4fMBuPDLMQ7GHTp8dwPxNmTJYqSzDho2_qFz-K0lnjB1Vy-6GlTl/exec';

const TEAMS_INFO = [
    { id: 'pichichi', name: 'פיצ\'יצי', manager: 'שלומי' },
    { id: 'hamsili', name: 'חמסילי', manager: 'ערן ואסף' },
    { id: 'tumali', name: 'תומאלי', manager: 'אלי ותום' },
    { id: 'harale', name: 'חראלה', manager: 'גיא' },
    { id: 'tampa', name: 'טמפה', manager: 'יינון' },
    { id: 'holonia', name: 'חולוניה', manager: 'ארז' }
];

async function generateCumulativeScoresTable() {
    console.log('=== GENERATING CUMULATIVE ROUND SCORES TABLE ===\n');

    // Fetch all 5 round excel archives
    const roundScores = {};
    TEAMS_INFO.forEach(t => {
        roundScores[t.id] = { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, total: 0 };
    });

    for (let r = 1; r <= 5; r++) {
        const docSnap = await db.collection('round_excel_archives').doc(`round_${r}`).get();
        if (docSnap.exists) {
            const rows = docSnap.data()?.rows || [];
            rows.forEach(row => {
                const teamName = String(row.fantasyTeam || row.fantasyTeamName || row.userId || '');
                let tId = row.userId || row.fantasyTeamId;
                const match = TEAMS_INFO.find(t => t.id === tId || teamName.includes(t.name) || (t.id === 'pichichi' && teamName.includes('פיצ')));
                if (match) {
                    roundScores[match.id][`r${r}`] += Number(row.points || 0);
                }
            });
        }
    }

    // Calculate totals
    TEAMS_INFO.forEach(t => {
        const s = roundScores[t.id];
        s.total = s.r1 + s.r2 + s.r3 + s.r4 + s.r5;
        console.log(`Team ${t.name} (${t.manager}): R1=${s.r1}, R2=${s.r2}, R3=${s.r3}, R4=${s.r4}, R5=${s.r5} | TOTAL=${s.total}`);
    });

    // Sort teams by total cumulative score
    const sortedTeams = [...TEAMS_INFO].sort((a, b) => roundScores[b.id].total - roundScores[a.id].total);

    const sheetRows = sortedTeams.map((t, idx) => {
        const s = roundScores[t.id];
        const avg = (s.total / 5).toFixed(1);
        return [
            idx + 1,
            t.name,
            t.manager,
            s.r1,
            s.r2,
            s.r3,
            s.r4,
            s.r5,
            s.total,
            avg
        ];
    });

    const headers = ['מיקום', 'קבוצת פנטזי', 'מנהל', 'מחזור 1', 'מחזור 2', 'מחזור 3', 'מחזור 4', 'מחזור 5', 'ניקוד מצטבר כולל', 'ממוצע למחזור'];

    // Send to tab 'טבלה' (the exact tab in user screenshot!)
    console.log('\nPosting cumulative scores matrix to tab "טבלה"...');
    try {
        const res1 = await axios.post(webhookUrl, JSON.stringify({
            sheetName: 'טבלה',
            headers: headers,
            rows: sheetRows
        }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });
        console.log('✅ Tab "טבלה" Webhook response status:', res1.status, res1.data);
    } catch (e) {
        console.error('❌ Error posting to tab "טבלה":', e.message);
    }

    // Also send to tab 'ניקוד מצטבר לפי מחזור'
    console.log('Posting cumulative scores matrix to tab "ניקוד מצטבר לפי מחזור"...');
    try {
        const res2 = await axios.post(webhookUrl, JSON.stringify({
            sheetName: 'ניקוד מצטבר לפי מחזור',
            headers: headers,
            rows: sheetRows
        }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });
        console.log('✅ Tab "ניקוד מצטבר לפי מחזור" Webhook response status:', res2.status, res2.data);
    } catch (e) {
        console.error('❌ Error posting to tab "ניקוד מצטבר לפי מחזור":', e.message);
    }

    process.exit(0);
}

generateCumulativeScoresTable().catch(e => {
    console.error(e);
    process.exit(1);
});
