export const parseCsvRow = (str: string): string[] => {
  if (!str) return [];
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '"') inQuotes = !inQuotes;
    else if (str[i] === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += str[i];
    }
  }
  result.push(cur.trim());
  return result.map(s => s.replace(/^"|"$/g, '').trim());
};
