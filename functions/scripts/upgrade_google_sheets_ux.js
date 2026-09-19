const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const webhookUrl = 'https://script.google.com/macros/s/AKfycbwquiK4tstJ8liGAZCRxH825SoMqPNbjEmqaaCaUqZT7-SsPs36iau4xi7217wmlWmL/exec';

async function sendFormattedSheet(action, sheetName, headers, rows) {
  console.log(`Sending action '${action}' for sheet '${sheetName}'...`);
  const payload = JSON.stringify({ action, sheetName, headers, rows });
  const res = await axios.post(webhookUrl, payload, {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    maxRedirects: 10,
    timeout: 30000
  });
  console.log(`  ✅ Result for '${sheetName}':`, res.data);
}

async function upgradeGoogleSheetsUX() {
  console.log('--- UPGRADING GOOGLE SHEETS UX & CLEANING UNCLOSED ROUNDS ---');

  // 1. Fetch CLOSED rounds (Only Round 2 is currently closed)
  const TEAM_NAMES = {
    hamsili: 'חמסילי', harale: 'חראלה', holonia: 'חולוניה', pichichi: 'פיציצי', tampa: 'טמפה', tumali: 'תומאלי'
  };

  const archiveRows = [];
  const usersSnap = await db.collection('users').get();

  usersSnap.forEach(docSnap => {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;
    const teamName = u.teamName || TEAM_NAMES[docSnap.id] || docSnap.id;
    const lineupsByRound = u.lineupsByRound || {};

    // Strictly include ONLY closed rounds (Round 2)
    [2].forEach(rNum => {
      const rData = lineupsByRound[rNum];
      if (rData && Array.isArray(rData.lineup)) {
        rData.lineup.forEach(p => {
          if (p.name) {
            archiveRows.push([
              `R${rNum}_${docSnap.id}_${p.id || p.name}`,
              new Date().toISOString().split('T')[0],
              Number(rNum),
              teamName,
              p.name,
              Number(p.points || 0)
            ]);
          }
        });
      }
    });
  });

  // Overwrite 'ארכיון ניקוד מחזורים' with ONLY Round 2
  await sendFormattedSheet(
    'replace_all',
    'ארכיון ניקוד מחזורים',
    ['מזהה סנכרון', 'תאריך', 'מחזור', 'קבוצת פנטזי', 'שם שחקן', 'ניקוד'],
    archiveRows
  );

  // 2. Fetch H2H Results for CLOSED rounds
  const h2hRows = [];
  const fixSnap = await db.doc('leagueData/fixtures').get();
  const rounds = fixSnap.data()?.rounds || [];

  rounds.filter(r => r.isPlayed || r.round === 2).forEach(r => {
    (r.matches || []).forEach(m => {
      const hName = TEAM_NAMES[m.h] || m.h;
      const aName = TEAM_NAMES[m.a] || m.a;
      const hs = m.hs !== undefined ? m.hs : '-';
      const as = m.as !== undefined ? m.as : '-';
      let status = 'שוחק';
      if (m.hs !== undefined && m.as !== undefined) {
        status = m.hs > m.as ? `ניצחון ל-${hName}` : m.as > m.hs ? `ניצחון ל-${aName}` : 'תיקו';
      }
      h2hRows.push([r.round, hName, hs, as, aName, status]);
    });
  });

  await sendFormattedSheet(
    'replace_all',
    'תוצאות מפגשי פנטזי',
    ['מחזור', 'קבוצת בית', 'תוצאת בית', 'תוצאת חוץ', 'קבוצת חוץ', 'סטטוס / מנצחת'],
    h2hRows
  );

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

  await sendFormattedSheet(
    'replace_all',
    'מלאכים',
    ['דירוג #', 'שם שחקן', 'קבוצת פנטזי', 'קבוצה בליגת העל', 'סה"כ נקודות'],
    topRows
  );

  console.log('🎉 Google Sheet UX upgraded & cleaned to contain ONLY closed round 2 data!');
}

upgradeGoogleSheetsUX().catch(console.error);
