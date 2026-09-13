export const normalizeTeamName = (name: string) => {
    if (!name) return '';
    let n = name.trim().toLowerCase().replace(/["'״׳.]/g, '').replace(/-/g, ' ');
    n = n.replace(/\s+/g, ' ').trim(); // Normalize spaces first before replacement rules

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
