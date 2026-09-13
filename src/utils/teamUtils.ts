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
