export const safeArray = (val: any): any[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return [val];
};

export const cleanStr = (s: string) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');

export const normalizeHebrew = (s: string) => cleanStr(s).replace(/א+/g, 'א').replace(/ו+/g, 'ו').replace(/י+/g, 'י');

export const isSamePlayer = (a: any, b: any) => {
    if (!a || !b) return false;
    if (a.id && b.id && a.id === b.id) return true;
    const cA = cleanStr(a.name);
    const cB = cleanStr(b.name);
    if (!cA || !cB) return false;
    const nA = normalizeHebrew(a.name);
    const nB = normalizeHebrew(b.name);
    return cA === cB || cA.includes(cB) || cB.includes(cA) || nA === nB || nA.includes(nB) || nB.includes(nA);
};

export const updatePlayerInList = (list: any[], player: any, finalPoints: any, cleanStats: any) =>
    safeArray(list).map((p: any) =>
        isSamePlayer(p, player) ? { ...p, points: finalPoints, stats: cleanStats } : p
    );
