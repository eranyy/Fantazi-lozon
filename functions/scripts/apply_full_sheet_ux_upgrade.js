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

async function applyFullSheetUXUpgrade() {
    console.log('=== STARTING FULL GOOGLE SHEETS UX & DESIGN UPGRADE ===\n');

    // 1. Build Home Dashboard Tab ('🏠 דף הבית')
    console.log('1. Building Home Dashboard Tab (🏠 דף הבית)...');
    const homeTabRows = [
        ['🏆 פנטזי לוזון - דשבורד ראשי ומרכז הליגה 🏆', '', '', '', '', ''],
        ['תקציר ליגה ומובילים', '', '', '', 'ניווט מהיר בלשוניות הקובץ', ''],
        ['כרטיסיית מדד (KPI)', 'קבוצה / ערך', 'פרטים וסטטוס', '', 'שם לשונית', 'מה תמצא בלשונית זו?'],
        ['🏆 מוליכת הליגה', 'פיצ\'יצי (שלומי)', '8 נקודות ליגה (247 נק\' מצטברות)', '', '🏆 טבלת הליגה', 'מאזן ניצחונות, תיקו, הפסדים ונקודות ליגה'],
        ['🥈 סגנית הליגה', 'חמסילי (ערן ואסף)', '6 נקודות ליגה (238 נק\' מצטברות)', '', '📊 ניקוד מצטבר לפי מחזור', 'מטריצת ניקוד מפורטת של כל קבוצה לפי מחזור'],
        ['🔮 מוביל טבלת הנביאים', 'חראלה (גיא) / פיציצי', '100% הצלחה (3 פגיעות מדויקות בסקרים)', '', '🔮 טבלת הנביאים', 'דירוג נביאי הליגה, אחוזי פגיעה ונקודות בסקרים'],
        ['⚔️ שיא ניקוד למחזור', 'חמסילי (68 נק\' במחזור 5)', 'הסקור הגבוה ביותר במחזור בודד העונה!', '', '⚔️ תוצאות מפגשי פנטזי', 'ארכיון תוצאות מפגשי ה-H2H והנקודות שהוענקו'],
        ['⚽ המחזור הקרוב בליגה', 'מחזור 6', 'שבת 10/10/2026 - חמסילי vs תומאלי, טמפה vs חראלה...', '', '📊 ארכיון ניקוד מחזורים', 'ניקוד מפורט של כל 66 שחקני הסגל והחילופים בכל מחזור'],
        ['📅 משחקי ליגת העל', '105 משחקים רשמיים', 'תאריכים, שעות, ערוצי שידור ואצטדיונים', '', '📅 משחקי ליגת העל', 'לוח המשחקים המלא של ליגת העל למחזורים 1-15'],
        ['', '', '', '', 'מחזור 1 עד מחזור 5', 'פירוט הרכבים וניקוד דו-צדדי (Side-by-Side) לכל מחזור']
    ];

    try {
        const resHome = await axios.post(webhookUrl, JSON.stringify({
            sheetName: '🏠 דף הבית',
            headers: homeTabRows[0],
            rows: homeTabRows.slice(1)
        }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });
        console.log('✅ Home Dashboard tab response status:', resHome.status, resHome.data);
    } catch (e) {
        console.error('❌ Error creating Home Dashboard tab:', e.message);
    }

    // 2. Build League Standings Tab ('🏆 טבלת הליגה')
    console.log('\n2. Building League Standings Tab (🏆 טבלת הליגה)...');
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

    try {
        const resStandings = await axios.post(webhookUrl, JSON.stringify({
            sheetName: '🏆 טבלת הליגה',
            headers: ['מיקום', 'קבוצת פנטזי', 'משחקים', 'נצחונות', 'תיקו', 'הפסדים', 'שערי זכות (ניקוד שנצבר)', 'שערי חובה (ניקוד שיריב צבר)', 'הפרש שערים', 'נקודות ליגה'],
            rows: standingsRows
        }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });
        console.log('✅ League Standings tab response status:', resStandings.status, resStandings.data);
    } catch (e) {
        console.error('❌ Error creating Standings tab:', e.message);
    }

    // 3. Build Cumulative Matrix Tab ('📊 ניקוד מצטבר לפי מחזור')
    console.log('\n3. Building Cumulative Matrix Tab (📊 ניקוד מצטבר לפי מחזור)...');
    const TEAMS_LIST = [
        { id: 'pichichi', name: 'פיצ\'יצי', manager: 'שלומי' },
        { id: 'hamsili', name: 'חמסילי', manager: 'ערן ואסף' },
        { id: 'tumali', name: 'תומאלי', manager: 'אלי ותום' },
        { id: 'harale', name: 'חראלה', manager: 'גיא' },
        { id: 'tampa', name: 'טמפה', manager: 'יינון' },
        { id: 'holonia', name: 'חולוניה', manager: 'ארז' }
    ];

    const roundScores = {};
    TEAMS_LIST.forEach(t => { roundScores[t.id] = { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, total: 0 }; });

    for (let r = 1; r <= 5; r++) {
        const docSnap = await db.collection('round_excel_archives').doc(`round_${r}`).get();
        if (docSnap.exists) {
            const rows = docSnap.data()?.rows || [];
            rows.forEach(row => {
                const teamName = String(row.fantasyTeam || row.fantasyTeamName || row.userId || '');
                let tId = row.userId || row.fantasyTeamId;
                const match = TEAMS_LIST.find(t => t.id === tId || teamName.includes(t.name) || (t.id === 'pichichi' && teamName.includes('פיצ')));
                if (match) {
                    roundScores[match.id][`r${r}`] += Number(row.points || 0);
                }
            });
        }
    }

    const sortedCumTeams = [...TEAMS_LIST].sort((a, b) => {
        const totalA = roundScores[a.id].r1 + roundScores[a.id].r2 + roundScores[a.id].r3 + roundScores[a.id].r4 + roundScores[a.id].r5;
        const totalB = roundScores[b.id].r1 + roundScores[b.id].r2 + roundScores[b.id].r3 + roundScores[b.id].r4 + roundScores[b.id].r5;
        return totalB - totalA;
    });

    const cumRows = sortedCumTeams.map((t, idx) => {
        const s = roundScores[t.id];
        const tot = s.r1 + s.r2 + s.r3 + s.r4 + s.r5;
        const avg = (tot / 5).toFixed(1);
        return [
            idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`,
            t.name,
            t.manager,
            s.r1,
            s.r2,
            s.r3,
            s.r4,
            s.r5,
            tot,
            avg
        ];
    });

    try {
        const resCum = await axios.post(webhookUrl, JSON.stringify({
            sheetName: '📊 ניקוד מצטבר לפי מחזור',
            headers: ['מיקום', 'קבוצת פנטזי', 'מנהל', 'מחזור 1', 'מחזור 2', 'מחזור 3', 'מחזור 4', 'מחזור 5', 'סה"כ ניקוד מצטבר', 'ממוצע למחזור'],
            rows: cumRows
        }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });
        console.log('✅ Cumulative Matrix tab response status:', resCum.status, resCum.data);
    } catch (e) {
        console.error('❌ Error creating Cumulative Matrix tab:', e.message);
    }

    // 4. Build Predictor Standings Tab ('🔮 טבלת הנביאים')
    console.log('\n4. Building Predictor Standings Tab (🔮 טבלת הנביאים)...');
    const predSnap = await db.doc('leagueData/predictor_standings').get();
    if (predSnap.exists) {
        const pList = predSnap.data()?.standings || [];
        const predRows = pList.map((p, idx) => [
            idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`,
            p.name,
            p.hits || 0,
            p.totalVotes || 0,
            p.accuracy || '0%',
            p.points || 0
        ]);
        try {
            const resPred = await axios.post(webhookUrl, JSON.stringify({
                sheetName: '🔮 טבלת הנביאים',
                headers: ['מיקום', 'נביא / קבוצה', 'פגיעות מדויקות בסקרים', 'סך הכל ניחושים', 'אחוזי הצלחה', 'נקודות נביא'],
                rows: predRows
            }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });
            console.log('✅ Predictor Standings tab response status:', resPred.status, resPred.data);
        } catch (e) {
            console.error('❌ Error creating Predictor Standings tab:', e.message);
        }
    }

    console.log('\n=== FULL GOOGLE SHEETS UX & DESIGN UPGRADE COMPLETED SUCCESSFULLY ===');
    process.exit(0);
}

applyFullSheetUXUpgrade().catch(e => {
    console.error(e);
    process.exit(1);
});
