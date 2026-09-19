const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const webhookUrl = 'https://script.google.com/macros/s/AKfycbwquiK4tstJ8liGAZCRxH825SoMqPNbjEmqaaCaUqZT7-SsPs36iau4xi7217wmlWmL/exec';

async function forceCleanArchiveSheet() {
  console.log('--- FORCE CLEANING ARCHIVE SHEET (REMOVING COLUMN A & R1 ROWS) ---');

  const TEAM_NAMES = {
    hamsili: 'חמסילי', harale: 'חראלה', holonia: 'חולונייה', pichichi: 'פיציצי', tampa: 'טמפה', tumali: 'תומאלי'
  };

  const archiveRows = [];
  const usersSnap = await db.collection('users').get();

  usersSnap.forEach(docSnap => {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;
    const teamName = u.teamName || TEAM_NAMES[docSnap.id] || docSnap.id;
    const lineupsByRound = u.lineupsByRound || {};

    // ONLY Round 2 (closed round)
    [2].forEach(rNum => {
      const rData = lineupsByRound[rNum];
      if (rData && Array.isArray(rData.lineup)) {
        rData.lineup.forEach(p => {
          if (p.name) {
            archiveRows.push([
              new Date().toISOString().split('T')[0], // Column A = תאריך
              `מחזור ${rNum}`,                       // Column B = מחזור
              teamName,                               // Column C = קבוצת פנטזי
              p.name,                                 // Column D = שם שחקן
              Number(p.points || 0)                   // Column E = ניקוד
            ]);
          }
        });
      }
    });
  });

  // Action replace_all clears existing sheet contents and rewrites from A1
  const payload = JSON.stringify({
    action: 'replace_all',
    sheetName: 'ארכיון ניקוד מחזורים',
    headers: ['תאריך', 'מחזור', 'קבוצת פנטזי', 'שם שחקן', 'ניקוד'],
    rows: archiveRows
  });

  const res = await axios.post(webhookUrl, payload, {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    maxRedirects: 10,
    timeout: 60000
  });

  console.log('✅ Archive sheet force-cleaned successfully:', res.data);
}

forceCleanArchiveSheet().catch(console.error);
