const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const webhookUrl = 'https://script.google.com/macros/s/AKfycbzvVXPkBPHLgN2_0Xw9dGxXLgVS5NQFdklreZlRl-ORIdGF9YqO4hR4gRSkP-TPMdR0/exec';

async function sendToSheet(sheetName, headers, rows) {
  console.log(`Sending ${rows.length} rows to sheet '${sheetName}' via Webhook...`);
  const payload = JSON.stringify({ sheetName, headers, rows });
  const res = await axios.post(webhookUrl, payload, {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    maxRedirects: 10
  });
  console.log(`✅ Sheet '${sheetName}' sync result:`, res.data);
}

async function syncAllDataToGoogleSheet() {
  console.log('--- STARTING FULL GOOGLE SHEETS SYNC FOR FANTASY LUZON 14 ---');

  // 1. Sync Player Scores Archive ('ארכיון ניקוד מחזורים')
  const archiveRows = [];
  const usersSnap = await db.collection('users').get();
  const TEAM_NAMES = {
    hamsili: 'חמסילי', harale: 'חראלה', holonia: 'חולוניה', pichichi: 'פיציצי', tampa: 'טמפה', tumali: 'תומאלי'
  };

  usersSnap.forEach(docSnap => {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;
    const teamName = u.teamName || TEAM_NAMES[docSnap.id] || docSnap.id;
    const lineupsByRound = u.lineupsByRound || {};

    Object.keys(lineupsByRound).forEach(rNum => {
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

  await sendToSheet(
    'ארכיון ניקוד מחזורים',
    ['מזהה סנכרון', 'תאריך', 'מחזור', 'קבוצת פנטזי', 'שם שחקן', 'ניקוד'],
    archiveRows
  );

  // 2. Sync H2H Results ('תוצאות מפגשי פנטזי')
  const h2hRows = [];
  const fixSnap = await db.doc('leagueData/fixtures').get();
  const rounds = fixSnap.data()?.rounds || [];

  rounds.forEach(r => {
    (r.matches || []).forEach(m => {
      const hName = TEAM_NAMES[m.h] || m.h;
      const aName = TEAM_NAMES[m.a] || m.a;
      const hs = m.hs !== undefined ? m.hs : '-';
      const as = m.as !== undefined ? m.as : '-';
      let status = r.isPlayed ? 'שוחק' : 'טרם שוחק';
      if (r.isPlayed && m.hs !== undefined && m.as !== undefined) {
        status = m.hs > m.as ? `ניצחון ל-${hName}` : m.as > m.hs ? `ניצחון ל-${aName}` : 'תיקו';
      }
      h2hRows.push([r.round, hName, hs, as, aName, status]);
    });
  });

  await sendToSheet(
    'תוצאות מפגשי פנטזי',
    ['מחזור', 'קבוצת בית', 'תוצאת בית', 'תוצאת חוץ', 'קבוצת חוץ', 'סטטוס / מנצחת'],
    h2hRows
  );

  // 3. Sync Top Players ('מלאכים')
  const topSnap = await db.doc('leagueData/top_players').get();
  const topPlayers = topSnap.data()?.players || [];
  const topRows = topPlayers.map((tp, idx) => [
    idx + 1,
    tp.name,
    tp.fantasyTeamName || 'שחקן חופשי',
    tp.team || '',
    Number(tp.points || 0)
  ]);

  await sendToSheet(
    'מלאכים',
    ['דירוג #', 'שם שחקן', 'קבוצת פנטזי', 'קבוצה בליגת העל', 'סה"כ נקודות'],
    topRows
  );

  console.log('\n🎉 ALL FANTASY LUZON 14 DATA FULLY SYNCED TO GOOGLE SHEET!');
}

syncAllDataToGoogleSheet().catch(console.error);
