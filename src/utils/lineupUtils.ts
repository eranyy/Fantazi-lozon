export const POS_COLORS: Record<string, { bg: string, border: string, text: string }> = {
  'GK': { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600', border: 'border-yellow-300', text: 'text-yellow-950' },
  'DEF': { bg: 'bg-gradient-to-br from-blue-500 to-blue-700', border: 'border-blue-300', text: 'text-white' },
  'MID': { bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600', border: 'border-emerald-200', text: 'text-emerald-950' },
  'FWD': { bg: 'bg-gradient-to-br from-red-500 to-red-700', border: 'border-red-300', text: 'text-white' }
};

export const POS_ORDER: Record<string, number> = { 'GK': 1, 'שוער': 1, 'DEF': 2, 'הגנה': 2, 'בלם': 2, 'מגן': 2, 'MID': 3, 'קשר': 3, 'קישור': 3, 'FWD': 4, 'חלוץ': 4, 'התקפה': 4 };
export const POS_ARRAY = ['GK', 'DEF', 'MID', 'FWD'];
export const ALLOWED_FORMATIONS = ['5-3-2', '5-4-1', '4-5-1', '4-4-2', '4-3-3', '3-5-2', '3-4-3'];
export const REAL_TEAMS_ISRAEL = [
  'בית"ר ירושלים',
  'בני סכנין',
  'הפועל באר שבע',
  'הפועל חיפה',
  'הפועל ירושלים',
  'הפועל פתח תקווה',
  'הפועל רמת גן',
  'הפועל תל אביב',
  'עירוני קרית שמונה',
  'מכבי חיפה',
  'מכבי נתניה',
  'מכבי פתח תקווה',
  'מכבי תל אביב',
  'עירוני טבריה',
  'חופשי'
];

export const getTeamColors = (teamName: string, isGK: boolean) => {
  if (isGK) return { prim: '#bef264', sec: '#4d7c0f', text: '#14532d' };
  const name = teamName || '';
  if (name.includes('טמפה')) return { prim: '#ef4444', sec: '#991b1b', text: '#ffffff' };
  if (name.includes('תומאלי') || name.includes('פיצ\'יצ\'י') || name.includes('פציצי')) return { prim: '#facc15', sec: '#1d4ed8', text: '#ffffff' };
  if (name.includes('חמסילי')) return { prim: '#18181b', sec: '#16a34a', text: '#facc15' };
  if (name.includes('חולוניה')) return { prim: '#a855f7', sec: '#4c1d95', text: '#ffffff' };
  if (name.includes('חראלה')) return { prim: '#78350f', sec: '#b91c1c', text: '#ffffff' };
  return { prim: '#3b82f6', sec: '#1e3a8a', text: '#ffffff' };
};

export const isTeamMatch = (t1: string, t2: string) => {
    if (!t1 || !t2) return false;
    const normalize = (s: string) => s.replace(/['"״׳.-]/g, '').replace(/\s+/g, '').toLowerCase();
    const c1 = normalize(t1);
    const c2 = normalize(t2);

    if (c1 === c2) return true;

    const isMaccabiTA = (c: string) => c.includes('מכבי') && (c.includes('תא') || c.includes('תלאביב'));
    if (isMaccabiTA(c1) && isMaccabiTA(c2)) return true;

    const isHapoelTA = (c: string) => c.includes('הפועל') && (c.includes('תא') || c.includes('תלאביב'));
    if (isHapoelTA(c1) && isHapoelTA(c2)) return true;

    const isMaccabiHaifa = (c: string) => c.includes('מכבי') && c.includes('חיפה');
    if (isMaccabiHaifa(c1) && isMaccabiHaifa(c2)) return true;

    const isHapoelHaifa = (c: string) => c.includes('הפועל') && c.includes('חיפה');
    if (isHapoelHaifa(c1) && isHapoelHaifa(c2)) return true;

    const isHapoelJlm = (c: string) => c.includes('הפועל') && c.includes('ירושלים');
    if (isHapoelJlm(c1) && isHapoelJlm(c2)) return true;

    const isBeitarJlm = (c: string) => c.includes('ביתר') && c.includes('ירושלים');
    if (isBeitarJlm(c1) && isBeitarJlm(c2)) return true;

    const isMaccabiPT = (c: string) => c.includes('מכבי') && (c.includes('פת') || c.includes('תקוה') || c.includes('תקווה'));
    if (isMaccabiPT(c1) && isMaccabiPT(c2)) return true;

    const isHapoelPT = (c: string) => c.includes('הפועל') && (c.includes('פת') || c.includes('תקוה') || c.includes('תקווה'));
    if (isHapoelPT(c1) && isHapoelPT(c2)) return true;

    const isBS = (c: string) => c.includes('בש') || c.includes('בארשבע');
    if (isBS(c1) && isBS(c2)) return true;

    const isKS = (c: string) => c.includes('קש') || c.includes('שמונה');
    if (isKS(c1) && isKS(c2)) return true;

    if (c1.includes('ריינה') && c2.includes('ריינה')) return true;
    if (c1.includes('אשדוד') && c2.includes('אשדוד')) return true;
    if (c1.includes('טבריה') && c2.includes('טבריה')) return true;
    if (c1.includes('סכנין') && c2.includes('סכנין')) return true;
    if (c1.includes('נתניה') && c2.includes('נתניה')) return true;
    if (c1.includes('חדרה') && c2.includes('חדרה')) return true;

    return false;
};

export const normalizePos = (pos: string) => {
  if (!pos) return 'MID';
  const p = pos.trim().toUpperCase();
  if (p === 'GK' || p === 'שוער') return 'GK';
  if (p.includes('/') || (p.includes('MID') && p.includes('FWD')) || (p.includes('חלוץ') && p.includes('קשר'))) return 'FWD';
  if (p === 'DEF' || p === 'הגנה' || p === 'בלם' || p === 'מגן') return 'DEF';
  if (p === 'MID' || p === 'קישור' || p === 'קשר') return 'MID';
  if (p === 'FWD' || p === 'ATT' || p === 'חלוץ' || p === 'התקפה') return 'FWD';
  return 'FWD';
};

export const getHebrewRole = (pos: string) => {
  if (!pos) return 'קשר';
  const p = pos.trim().toUpperCase();
  if (p === 'GK' || p === 'שוער') return 'שוער';
  if (p.includes('/') || (p.includes('MID') && p.includes('FWD')) || (p.includes('חלוץ') && p.includes('קשר'))) return 'קשר - חלוץ';
  if (p === 'DEF' || p === 'הגנה' || p === 'בלם' || p === 'מגן') return 'מגן';
  if (p === 'MID' || p === 'קישור' || p === 'קשר') return 'קשר';
  if (p === 'FWD' || p === 'ATT' || p === 'חלוץ' || p === 'התקפה') return 'חלוץ';
  return pos;
};

export const cleanStr = (s?: string | null) => String(s || '').toLowerCase().replace(/['"״׳`\s]/g, '');

export const createCancelLog = (currentRound: number, playerInName: string, playerOutName: string) => ({
    id: `cancel_${Date.now()}`,
    type: 'CANCELLED_SUB',
    round: currentRound,
    playerIn: playerInName,
    playerOut: playerOutName,
    timestamp: new Date().toLocaleString('he-IL', { hour12: false })
});

export const isDualPlayer = (player: any) => {
  if (!player) return false;
  if (player.isDual === true || player.isDualPosition === true) return true;
  const p = String(player.position || player.pos || '').toUpperCase();
  if (p.includes('/') || (p.includes('MID') && p.includes('FWD'))) return true;
  return false;
};
