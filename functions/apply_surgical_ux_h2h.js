const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const webhookUrl = 'https://script.google.com/macros/s/AKfycbwquiK4tstJ8liGAZCRxH825SoMqPNbjEmqaaCaUqZT7-SsPs36iau4xi7217wmlWmL/exec';

async function applySurgicalUXToH2H() {
  console.log('--- APPLYING SURGICAL UX TO H2H RESULTS TAB ---');

  const TEAM_NAMES = {
    hamsili: 'חמסילי', harale: 'חראלה', holonia: 'חולוניה', pichichi: 'פיציצי', tampa: 'טמפה', tumali: 'תומאלי'
  };

  const h2hRows = [];
  const fixSnap = await db.doc('leagueData/fixtures').get();
  const rounds = fixSnap.data()?.rounds || [];

  // Strictly include only closed rounds (Round 2)
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

      h2hRows.push([
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

  const payload = JSON.stringify({
    action: 'replace_all',
    sheetName: 'תוצאות מפגשי פנטזי',
    headers: ['מחזור', 'קבוצת בית', 'ניקוד בית', 'תוצאת המפגש', 'ניקוד חוץ', 'קבוצת חוץ', 'הפרש', 'מנצחת / סטטוס', 'נקודות ליגה שהוענקו'],
    rows: h2hRows
  });

  const res = await axios.post(webhookUrl, payload, {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    maxRedirects: 10,
    timeout: 30000
  });

  console.log('✅ Surgical UX applied to H2H sheet tab:', res.data);
}

applySurgicalUXToH2H().catch(console.error);
