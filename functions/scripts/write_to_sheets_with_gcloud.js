const { execSync } = require('child_process');
const axios = require('axios');

async function writeWithGCloudToken() {
  console.log('Obtaining access token from gcloud...');
  const token = execSync('gcloud auth print-access-token').toString().trim();
  const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

  console.log('Got access token! Creating tabs and writing data to Google Spreadsheet...');

  // 1. Fetch spreadsheet metadata
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const metaRes = await axios.get(metaUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const existingSheetTitles = metaRes.data.sheets.map(s => s.properties.title);
  console.log('Existing tabs:', existingSheetTitles);

  // 2. Add missing sheets if needed
  const requiredTabs = ['ארכיון ניקוד מחזורים', 'תוצאות מפגשי פנטזי', 'מלאכים (Top Players)'];
  const requests = [];

  requiredTabs.forEach(t => {
    if (!existingSheetTitles.includes(t)) {
      requests.push({
        addSheet: {
          properties: { title: t }
        }
      });
    }
  });

  if (requests.length > 0) {
    console.log(`Adding ${requests.length} new sheet tabs...`);
    await axios.post(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      requests
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ New sheet tabs created successfully!');
  }

  // 3. Populate rows for Round 1 & Round 2 into 'ארכיון ניקוד מחזורים'
  console.log('Writing player scores archive...');
  const roundArchiveRows = [
    ['מזהה סנכרון', 'תאריך', 'מחזור', 'קבוצת פנטזי', 'שם שחקן', 'ניקוד']
  ];

  // Fetch from Firestore
  const admin = require('firebase-admin');
  if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
  const db = admin.firestore();

  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(docSnap => {
    const user = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;
    const teamName = user.teamName || docSnap.id;
    const lineupsByRound = user.lineupsByRound || {};

    Object.keys(lineupsByRound).forEach(rNum => {
      const rData = lineupsByRound[rNum];
      if (rData && Array.isArray(rData.lineup)) {
        rData.lineup.forEach(p => {
          if (p.name) {
            roundArchiveRows.push([
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

  // Clear & write 'ארכיון ניקוד מחזורים'
  await axios.put(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'ארכיון ניקוד מחזורים'!A1?valueInputOption=USER_ENTERED`,
    { values: roundArchiveRows },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log(`✅ Wrote ${roundArchiveRows.length} rows to 'ארכיון ניקוד מחזורים'!`);

  // 4. Populate H2H results into 'תוצאות מפגשי פנטזי'
  const h2hRows = [
    ['מחזור', 'קבוצת בית', 'תוצאת בית', 'תוצאת חוץ', 'קבוצת חוץ', 'סטטוס / מנצחת']
  ];
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

  await axios.put(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'תוצאות מפגשי פנטזי'!A1?valueInputOption=USER_ENTERED`,
    { values: h2hRows },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log(`✅ Wrote ${h2hRows.length} rows to 'תוצאות מפגשי פנטזי'!`);

  // 5. Populate Top Players into 'מלאכים (Top Players)'
  const topSnap = await db.doc('leagueData/top_players').get();
  const topPlayers = topSnap.data()?.players || [];
  const topRows = [
    ['דירוג #', 'שם שחקן', 'קבוצת פנטזי', 'קבוצה בליגת העל', 'סה"כ נקודות']
  ];

  topPlayers.forEach((tp, idx) => {
    topRows.push([idx + 1, tp.name, tp.fantasyTeamName || 'חופשי', tp.team, tp.points]);
  });

  await axios.put(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'מלאכים (Top Players)'!A1?valueInputOption=USER_ENTERED`,
    { values: topRows },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log(`✅ Wrote ${topRows.length} rows to 'מלאכים (Top Players)'!`);

  console.log('\n🎉 ALL FANTASY LUZON 14 DATA WRITTEN TO GOOGLE SPREADSHEET SUCCESSFULLY!');
}

writeWithGCloudToken().catch(console.error);
