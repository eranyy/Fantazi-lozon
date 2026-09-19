export const TEAM_NAMES: Record<string, string> = {
  tumali: 'תומאלי',
  tampa: 'טמפה',
  pichichi: "פיצ'יצ'י",
  hamsili: 'חמסילי',
  harale: 'חראלה',
  holonia: 'חולוניה'
};

export const POS_ORDER: Record<string, number> = {
  'GK': 1, 'שוער': 1,
  'DEF': 2, 'הגנה': 2, 'בלם': 2, 'מגן': 2,
  'MID': 3, 'קשר': 3, 'קישור': 3,
  'FWD': 4, 'חלוץ': 4, 'התקפה': 4
};

export const cleanStr = (s?: string | null): string =>
  String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

export const getPlayerName = (p: any): string => {
  if (!p) return '';
  if (typeof p === 'string') return p.trim();
  const val = p.name || p.player || p.playerName || p.label || p.playerIn || p.playerOut || p.title || p.id || '';
  return typeof val === 'string' ? val.trim() : String(val).trim();
};

export const getNormalizedTeamId = (nameOrId: string): string => {
  const s = cleanStr(nameOrId);
  if (!s) return 'unknown';
  if (s.includes('חרא') || s.includes('וסילי') || s === 'harale') return 'harale';
  if (s.includes('חולו') || s.includes('holonia')) return 'holonia';
  if (s.includes('תומ') || s.includes('tumali')) return 'tumali';
  if (s.includes('טמפ') || s.includes('tampa')) return 'tampa';
  if (s.includes('חמס') || s.includes('hamsili')) return 'hamsili';
  if (s.includes('פיצ') || s.includes('pichichi')) return 'pichichi';
  return s;
};

export const isPosMatch = (pPos: string, category: string): boolean => {
  if (!pPos) return false;
  if (category === 'GK') return ['GK', 'שוער'].includes(pPos);
  if (category === 'DEF') return ['DEF', 'הגנה', 'בלם', 'מגן'].includes(pPos);
  if (category === 'MID') return ['MID', 'קשר', 'קישור'].includes(pPos);
  if (category === 'FWD') return ['FWD', 'חלוץ', 'התקפה'].includes(pPos);
  return false;
};

export const getFormation = (lineup: any[]): string => {
  if (!lineup || lineup.length !== 11) return '';
  const def = lineup.filter(p => ['DEF', 'הגנה', 'בלם', 'מגן'].includes(p.position)).length;
  const mid = lineup.filter(p => ['MID', 'קשר', 'קישור'].includes(p.position)).length;
  const fwd = lineup.filter(p => ['FWD', 'חלוץ', 'התקפה'].includes(p.position)).length;
  return `${def}-${mid}-${fwd}`;
};

export const safeArray = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') {
    if (Array.isArray(val.Ku)) return val.Ku;
    for (const key of Object.keys(val)) {
      if (Array.isArray(val[key])) return val[key];
    }
    const vals = Object.values(val).filter(x => x && typeof x === 'object');
    if (vals.length > 0) return vals;
  }
  return [];
};

export const isSubLog = (t: any): boolean => {
  if (!t || typeof t !== 'object') return false;
  const type = (t.type || '').toUpperCase();
  if (type === 'CANCELLED_SUB' || (t.status || '').toUpperCase() === 'CANCELLED') return false;
  return type === 'HALFTIME_SUB' || type === 'HALFTIME' || type === 'ADMIN_MANUAL_SUB' || type === 'MANUAL_SUB' || (type.includes('SUB') && !type.includes('VAR') && !type.includes('REGULAR'));
};
