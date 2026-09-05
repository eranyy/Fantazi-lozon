const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const webhookUrl = 'https://script.google.com/macros/s/AKfycbwquiK4tstJ8liGAZCRxH825SoMqPNbjEmqaaCaUqZT7-SsPs36iau4xi7217wmlWmL/exec';

async function removeSyncIdColumn() {
  console.log('Removing מזהה סנכרון column from ארכיון ניקוד מחזורים...');

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

  const payload = JSON.stringify({
    action: 'replace_all',
    sheetName: 'ארכיון ניקוד מחזורים',
    headers: ['תאריך', 'מחזור', 'קבוצת פנטזי', 'שם שחקן', 'ניקוד'],
    rows: archiveRows
  });

  const res = await axios.post(webhookUrl, payload, {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    maxRedirects: 10,
    timeout: 30000
  });

  console.log('✅ Removed מזהה סנכרון column! Sheet updated:', res.data);
}

removeSyncIdColumn().catch(console.error);
