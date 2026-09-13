export const parseCsvRow = (str: string) => {
    if (!str || typeof str !== 'string') return [];
    let result = [], cur = '', inQuotes = false;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '"') inQuotes = !inQuotes;
        else if (str[i] === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
        else { cur += str[i]; }
    }
    result.push(cur.trim());
    return result.map(s => s.replace(/^"|"$/g, ''));
};
