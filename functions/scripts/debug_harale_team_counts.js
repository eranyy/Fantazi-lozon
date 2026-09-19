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

async function debugHaraleTeamCounts() {
  const doc = await db.collection('users').doc('harale').get();
  const u = doc.data();
  const lineup = u.lineup || [];
  const bench = u.published_subs_out || [];
  
  console.log('--- HARALE CURRENT LINEUP ---');
  const teamCounts = {};
  lineup.forEach((p, i) => {
    const rawTeam = p.realTeam || p.team || '';
    const canonical = getCanonicalRealTeam(rawTeam);
    teamCounts[canonical] = (teamCounts[canonical] || 0) + 1;
    console.log(`${i+1}. ${p.name} | rawTeam: "${rawTeam}" | canonical: "${canonical}"`);
  });

  console.log('\n--- TEAM COUNTS ON PITCH BEFORE SUB ---');
  console.log(teamCounts);

  console.log('\n--- HARALE BENCH PLAYERS ---');
  bench.forEach((p, i) => {
    const rawTeam = p.realTeam || p.team || '';
    const canonical = getCanonicalRealTeam(rawTeam);
    console.log(`${i+1}. ${p.name} | rawTeam: "${rawTeam}" | canonical: "${canonical}"`);
  });
}

debugHaraleTeamCounts().catch(console.error);
