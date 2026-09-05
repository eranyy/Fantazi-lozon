const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const webhookUrl = 'https://script.google.com/macros/s/AKfycbxl5IFlmuqfk_CZ4fMBuPDLMQ7GHTp8dwPxNmTJYqSzDho2_qFz-K0lnjB1Vy-6GlTl/exec';

async function triggerNewCleanSync() {
  console.log('--- TRIGGERING NEW CLEAN SYNC VIA NEW WEBHOOK ---');

  const TEAM_NAMES = {
    hamsili: 'חמסילי', harale: 'חראלה', holonia: 'חולוניה', pichichi: 'פיציצי', tampa: 'טמפה', tumali: 'תומאלי'
  };

  // 1. Clean Player Scores Archive (NO מזהה סנכרון, ONLY Round 2)
  const archiveRows = [];
  const usersSnap = await db.collection('users').get();

  usersSnap.forEach(docSnap => {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;
    const teamName = u.teamName || TEAM_NAMES[docSnap.id] || docSnap.id;
    const lineupsByRound = u.lineupsByRound || {};

    [2].forEach(rNum => {
      const rData = lineupsByRound[rNum];
      if (rData && Array.isArray(rData.lineup)) {
        rData.lineup.forEach(p => {
          if (p.name) {
            archiveRows.push([
              new Date().toISOString().split('T')[0],
              `מחזור ${rNum}`,
              teamName,
              p.name,
              Number(p.points || 0)
            ]);
          }
        });
      }
    });
  });

  const payload1 = JSON.stringify({
    action: 'replace_all',
    sheetName: 'ארכיון ניקוד מחזורים',
    headers: ['תאריך', 'מחזור', 'קבוצת פנטזי', 'שם שחקן', 'ניקוד'],
    rows: archiveRows
  });

  const res1 = await axios.post(webhookUrl, payload1, {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    maxRedirects: 10,
    timeout: 60000
  });
  console.log('✅ ארכיון ניקוד מחזורים updated:', res1.data);

  // 2. Interactive H2H Results Tab
  const rawRows = [];
  const fixSnap = await db.doc('leagueData/fixtures').get();
  const rounds = fixSnap.data()?.rounds || [];

  rounds.filter(r => r.isPlayed || r.round === 2).forEach(r => {
    (r.matches || []).forEach(m => {
      const hName = TEAM_NAMES[m.h] || m.h;
      const aName = TEAM_NAMES[m.a] || m.a;
      const hs = m.hs !== undefined ? Number(m.hs) : '-';
      const as = m.as !== undefined ? Number(m.as) : '-';
      const diff = (typeof hs === 'number' && typeof as === 'number') ? Math.abs(hs - as) : 0;
      
      let winnerText = 'טרם שוחק';
      let leaguePointsAwarded = '-';

      if (typeof hs === 'number' && typeof as === 'number') {
        if (hs > as) {
          winnerText = `🏆 ניצחון ל-${hName}`;
          leaguePointsAwarded = diff >= 20 ? `3 נק' (${hName})` : `2 נק' (${hName})`;
        } else if (as > hs) {
          winnerText = `🏆 ניצחון ל-${aName}`;
          leaguePointsAwarded = diff >= 20 ? `3 נק' (${aName})` : `2 נק' (${aName})`;
        } else {
          winnerText = '🤝 תיקו';
          leaguePointsAwarded = '1 נק\' לכל קבוצה';
        }
      }

      rawRows.push([
        `מחזור ${r.round}`,
        hName,
        hs,
        `${hs} : ${as}`,
        as,
        aName,
        diff > 0 ? `+${diff}` : '0',
        winnerText,
        leaguePointsAwarded
      ]);
    });
  });

  const fullSheetData = [
    ['⚽ תוצאות מפגשי פנטזי - תצוגה ממוקדת לפי מחזור', '', '', '', '', '', '', '', ''],
    ['בחר מחזור להצגה:', 'מחזור 2', '◄ לחץ על התא משמאל כדי לבחור מחזור!', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['מחזור', 'קבוצת בית', 'ניקוד בית', 'תוצאת המפגש', 'ניקוד חוץ', 'קבוצת חוץ', 'הפרש', 'מנצחת / סטטוס', 'נקודות ליגה שהוענקו'],
    ['=FILTER(A12:I200, A12:A200 = B2)', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['════════════════════════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '', ''],
    ['📦 ארכיון כל המפגשים (כל המחזורים)', '', '', '', '', '', '', '', ''],
    ['מחזור', 'קבוצת בית', 'ניקוד בית', 'תוצאת המפגש', 'ניקוד חוץ', 'קבוצת חוץ', 'הפרש', 'מנצחת / סטטוס', 'נקודות ליגה שהוענקו'],
    ...rawRows
  ];

  const payload2 = JSON.stringify({
    action: 'replace_all',
    sheetName: 'תוצאות מפגשי פנטזי',
    headers: null,
    rows: fullSheetData
  });

  const res2 = await axios.post(webhookUrl, payload2, {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    maxRedirects: 10,
    timeout: 60000
  });
  console.log('✅ תוצאות מפגשי פנטזי updated:', res2.data);

  // 3. Top Players ('מלאכים')
  const topSnap = await db.doc('leagueData/top_players').get();
  const topPlayers = topSnap.data()?.players || [];
  const topRows = topPlayers.map((tp, idx) => [
    idx + 1,
    tp.name,
    tp.fantasyTeamName || 'שחקן חופשי',
    tp.team || '',
    Number(tp.points || 0)
  ]);

  const payload3 = JSON.stringify({
    action: 'replace_all',
    sheetName: 'מלאכים',
    headers: ['דירוג #', 'שם שחקן', 'קבוצת פנטזי', 'קבוצה בליגת העל', 'סה"כ נקודות'],
    rows: topRows
  });

  const res3 = await axios.post(webhookUrl, payload3, {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    maxRedirects: 10,
    timeout: 60000
  });
  console.log('✅ מלאכים updated:', res3.data);

  console.log('\n🎉 ALL TABS FULLY RE-SYNCED AND CLEANED VIA NEW WEBHOOK!');
}

triggerNewCleanSync().catch(console.error);
