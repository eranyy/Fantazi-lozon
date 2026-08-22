export const parseMatchDateTime = (m: any): number => {
  if (!m) return Infinity;
  if (typeof m.timestamp === 'number' && m.timestamp > 0) return m.timestamp;

  const dateStr = String(m.date || '').trim();
  const timeStr = String(m.time || '').trim();
  const statusStr = String(m.status || '').trim();

  if (!dateStr || dateStr.includes('נדחה') || dateStr.includes('טרם') || dateStr.includes('ייקבע') || statusStr.includes('נדחה')) {
    return Infinity;
  }

  const dateMatch = dateStr.match(/(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?/);
  if (!dateMatch) return Infinity;

  const day = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10) - 1;
  let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear();
  if (year < 100) year += 2000;

  let hours = 19;
  let minutes = 0;
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
  }

  return new Date(year, month, day, hours, minutes).getTime();
};

export const sortMatchesChronologically = (matches: any[]): any[] => {
  if (!Array.isArray(matches)) return [];
  return [...matches].sort((a, b) => parseMatchDateTime(a) - parseMatchDateTime(b));
};
