const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const webhookUrl = 'https://script.google.com/macros/s/AKfycbwquiK4tstJ8liGAZCRxH825SoMqPNbjEmqaaCaUqZT7-SsPs36iau4xi7217wmlWmL/exec';

async function sendChunk(sheetName, headers, rows) {
  console.log(`Sending ${rows.length} rows chunk to sheet '${sheetName}'...`);
  const payload = JSON.stringify({ sheetName, headers, rows });
  const res = await axios.post(webhookUrl, payload, {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    maxRedirects: 10,
    timeout: 60000
  });
  console.log(`  ✅ Chunk synced for '${sheetName}':`, res.data);
}

async function syncAllFast() {
  console.log('--- FAST CHUNKED GOOGLE SHEETS SYNC ---');

  // 1. H2H Results ('תוצאות מפגשי פנטזי')
  const h2hRows = [];
  const fixSnap = await db.doc('leagueData/fixtures').get();
  const rounds = fixSnap.data()?.rounds || [];
  const TEAM_NAMES = {
    hamsili: 'חמסילי', harale: 'חראלה', holonia: 'חולוניה', pichichi: 'פיציצי', tampa: 'טמפה', tumali: 'תומאלי'
  };

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

  for (let i = 0; i < h2hRows.length; i += 15) {
    const chunk = h2hRows.slice(i, i + 15);
    await sendChunk(
      'תוצאות מפגשי פנטזי',
      i === 0 ? ['מחזור', 'קבוצת בית', 'תוצאת בית', 'תוצאת חוץ', 'קבוצת חוץ', 'סטטוס / מנצחת'] : null,
      chunk
    );
  }

  // 2. Top Players ('מלאכים') in chunks of 15
  const topSnap = await db.doc('leagueData/top_players').get();
  const topPlayers = topSnap.data()?.players || [];
  const topRows = topPlayers.map((tp, idx) => [
    idx + 1,
    tp.name,
    tp.fantasyTeamName || 'שחקן חופשי',
    tp.team || '',
    Number(tp.points || 0)
  ]);

  for (let i = 0; i < topRows.length; i += 15) {
    const chunk = topRows.slice(i, i + 15);
    await sendChunk(
      'מלאכים',
      i === 0 ? ['דירוג #', 'שם שחקן', 'קבוצת פנטזי', 'קבוצה בליגת העל', 'סה"כ נקודות'] : null,
      chunk
    );
  }

  // 3. Player Scores Archive ('ארכיון ניקוד מחזורים') in chunks of 15
  const archiveRows = [];
  const usersSnap = await db.collection('users').get();

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

  for (let i = 0; i < archiveRows.length; i += 15) {
    const chunk = archiveRows.slice(i, i + 15);
    await sendChunk(
      'ארכיון ניקוד מחזורים',
      i === 0 ? ['מזהה סנכרון', 'תאריך', 'מחזור', 'קבוצת פנטזי', 'שם שחקן', 'ניקוד'] : null,
      chunk
    );
  }

  console.log('\n🎉 ALL FANTASY LUZON 14 DATA FULLY SYNCED TO GOOGLE SHEET!');
}

syncAllFast().catch(console.error);
