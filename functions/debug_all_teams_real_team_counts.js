const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const getCanonicalRealTeam = (teamName) => {
  if (!teamName) return 'unknown';
  const c = teamName.replace(/['"״׳.\-\s]/g, '').toLowerCase();
  if (c.includes('מכבי') && (c.includes('תא') || c.includes('תלאביב'))) return 'מכבי תל אביב';
  if ((c.includes('הפועל') && (c.includes('תא') || c.includes('תלאביב'))) || c === 'הפועל' || c === 'הפועלתא') return 'הפועל תל אביב';
  if (c.includes('מכבי') && c.includes('חיפה')) return 'מכבי חיפה';
  if (c.includes('הפועל') && c.includes('חיפה')) return 'הפועל חיפה';
  if (c.includes('הפועל') && c.includes('ירושלים')) return 'הפועל ירושלים';
  if (c.includes('ביתר')) return 'בית"ר ירושלים';
  if (c.includes('מכבי') && (c.includes('פת') || c.includes('תקוה') || c.includes('תקווה'))) return 'מכבי פתח תקווה';
  if (c.includes('הפועל') && (c.includes('פת') || c.includes('תקוה') || c.includes('תקווה'))) return 'הפועל פתח תקווה';
  if (c.includes('בש') || c.includes('בארשבע')) return 'הפועל באר שבע';
  if (c.includes('קש') || c.includes('שמונה')) return 'עירוני קריית שמונה';
  if (c.includes('ריינה')) return 'ריינה';
  if (c.includes('אשדוד')) return 'אשדוד';
  if (c.includes('טבריה')) return 'טבריה';
  if (c.includes('סכנין')) return 'סכנין';
  if (c.includes('נתניה')) return 'מכבי נתניה';
  if (c.includes('חדרה')) return 'הפועל חדרה';
  return c;
};

async function debugAllTeamsRealTeamCounts() {
  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(docSnap => {
    const u = docSnap.data();
    if (docSnap.id === 'admin' || docSnap.id === 'system') return;
    const lineup = u.lineup || u.published_lineup || [];
    const counts = {};
    lineup.forEach(p => {
      const canonical = getCanonicalRealTeam(p.realTeam || p.team);
      counts[canonical] = (counts[canonical] || 0) + 1;
    });
    console.log(`Team '${u.teamName || docSnap.id}':`, counts);
  });
}

debugAllTeamsRealTeamCounts().catch(console.error);
