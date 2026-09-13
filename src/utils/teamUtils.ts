export interface TeamColors {
  prim: string;
  sec: string;
  text: string;
}

export const cleanStr = (s?: string | null) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

export const getHistoricalName = (tName: string) => {
    if (!tName) return '';
    const n = cleanStr(tName);
    if (n.includes('חמסילי')) return 'חמסילי';
    if (n.includes('חמסה')) return 'חמסה';
    if (n.includes('חראלה')) return 'חראלה';
    if (n.includes('טמפה')) return 'טמפה';
    if (n.includes('תומאלי')) return 'תומאלי';
    if (n.includes('חולוניה')) return 'חולוניה';
    if (n.includes('פיציצי') || n.includes('פציצי')) return "פיצ'יצ'י";
    return tName;
};

export const getTeamColors = (teamName: string, isGK: boolean): TeamColors => {
  if (isGK) return { prim: '#bef264', sec: '#4d7c0f', text: '#14532d' }; 
  const name = teamName || '';
  if (name.includes('טמפה')) return { prim: '#ef4444', sec: '#991b1b', text: '#ffffff' }; 
  if (name.includes('תומאלי') || name.includes('פיצ\'יצ\'י') || name.includes('פציצי')) return { prim: '#facc15', sec: '#1d4ed8', text: '#ffffff' }; 
  if (name.includes('חמסילי')) return { prim: '#18181b', sec: '#16a34a', text: '#facc15' }; 
  if (name.includes('חולוניה')) return { prim: '#a855f7', sec: '#4c1d95', text: '#ffffff' }; 
  if (name.includes('חראלה')) return { prim: '#78350f', sec: '#b91c1c', text: '#ffffff' }; 
  return { prim: '#3b82f6', sec: '#1e3a8a', text: '#ffffff' }; 
};

export const normalizeTeamName = (name: string): string => {
    if (!name) return '';
    let n = name.trim().toLowerCase().replace(/["'״׳.]/g, '').replace(/-/g, ' '); 
    if (n.includes('תל אביב')) n = n.replace('תל אביב', 'תא');
    if (n.includes('באר שבע')) n = n.replace('באר שבע', 'בש');
    if (n.includes('קרית שמונה')) n = n.replace('קרית שמונה', 'קש');
    if (n.includes('פתח תקוה') || n.includes('פתח תקווה')) n = n.replace(/פתח תקו[ו]?ה/, 'פת');
    if (n.includes('ריינה')) return 'מכבי בני ריינה';
    if (n.includes('אשדוד')) return 'מס אשדוד';
    if (n.includes('טבריה')) return 'עירוני טבריה';
    if (n.includes('סכנין')) return 'בני סכנין';
    if (n.includes('נתניה') && n.includes('מכבי')) return 'מכבי נתניה';
    if (n.includes('חדרה')) return 'הפועל חדרה';
    return n.replace(/\s+/g, ' ').trim();
};
