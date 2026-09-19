const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const webhookUrl = 'https://script.google.com/macros/s/AKfycbxl5IFlmuqfk_CZ4fMBuPDLMQ7GHTp8dwPxNmTJYqSzDho2_qFz-K0lnjB1Vy-6GlTl/exec';

async function upgradeRealFixturesSheetUX() {
  console.log('--- UPGRADING ISRAELI PREMIER LEAGUE FIXTURES SHEET UX ---');

  // Fetch current real fixtures from Firestore or Sheet
  const realSnap = await db.doc('leagueData/real_fixtures').get();
  const realMatches = realSnap.exists ? realSnap.data()?.matches || [] : [];
  console.log(`Found ${realMatches.length} real fixtures in Firestore.`);

  const rawRows = [];
  realMatches.forEach(m => {
    rawRows.push([
      `מחזור ${m.round || 1}`,
      m.date || '',
      m.day || '',
      m.time || '',
      m.homeTeam || '',
      m.awayTeam || '',
      m.competition || 'ליגת WINNER',
      m.stadium || '',
      m.tvChannel || '',
      m.status || (m.homeScore !== undefined ? `הסתיים (${m.homeScore}-${m.awayScore})` : 'עתידי')
    ]);
  });

  // If no matches in Firestore, build demo structure
  if (rawRows.length === 0) {
    rawRows.push(
      ['מחזור 1', '22/08/2026', 'שבת', '20:00', 'מכבי חיפה', 'הפועל רמת גן', 'ליגת WINNER', 'סמי עופר', 'ספורט 1', 'הסתיים (2-0)'],
      ['מחזור 2', '29/08/2026', 'שבת', '20:30', 'מכבי תל אביב', 'בית"ר ירושלים', 'ליגת WINNER', 'בלומפילד', 'ספורט 5', 'הסתיים (1-1)'],
      ['מחזור 3', '05/09/2026', 'שבת', '20:00', 'הפועל באר שבע', 'מכבי נתניה', 'ליגת WINNER', 'טרנר', 'ספורט 1', 'עתידי']
    );
  }

  // Interactive Top Control Panel + Full Archive
  const fullSheetData = [
    ['⚽ לוח משחקי ליגת העל והגביע - תצוגה ממוקדת לפי מחזור', '', '', '', '', '', '', '', '', ''],
    ['בחר מחזור להצגה:', 'מחזור 3', '◄ לחץ על התא משמאל לבחירת מחזור! (או השתמש בסינון בטור קבוצה/ערוץ)', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    ['מחזור', 'תאריך', 'יום', 'שעה', 'קבוצת בית', 'קבוצת חוץ', 'מפעל', 'אצטדיון', 'ערוץ שידור', 'סטטוס / תוצאה'],
    ['=FILTER(A12:J300, A12:J300 = B2)', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    ['════════════════════════════════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '', '', ''],
    ['📅 לוח המשחקים המלא לכל העונה', '', '', '', '', '', '', '', '', ''],
    ['מחזור', 'תאריך', 'יום', 'שעה', 'קבוצת בית', 'קבוצת חוץ', 'מפעל', 'אצטדיון', 'ערוץ שידור', 'סטטוס / תוצאה'],
    ...rawRows
  ];

  // Try updating sheet tab '📅 משחקי ליגת העל' or 'משחקי ליגת העל' or 'גיליון1'
  const targetSheetName = '📅 משחקי ליגת העל';

  const payload = JSON.stringify({
    action: 'replace_all',
    sheetName: targetSheetName,
    headers: null,
    rows: fullSheetData
  });

  const res = await axios.post(webhookUrl, payload, {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    maxRedirects: 10,
    timeout: 60000
  });

  console.log(`✅ Sheet tab '${targetSheetName}' upgraded with Surgical UX:`, res.data);
}

upgradeRealFixturesSheetUX().catch(console.error);
