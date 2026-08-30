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

export const formatMatchDateDisplay = (dateStr?: string): string => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (str.includes('טרם') || str.includes('נדחה') || str.includes('ייקבע')) return str;

  // YYYY-MM-DD -> DD/MM/YYYY
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const yyyy = isoMatch[1];
    const mm = isoMatch[2].padStart(2, '0');
    const dd = isoMatch[3].padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }

  // DD/MM/YYYY or D/M/YYYY -> DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${dd}/${mm}/${yyyy}`;
  }

  // DD/MM -> DD/MM/2026
  const shortMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (shortMatch) {
    const dd = shortMatch[1].padStart(2, '0');
    const mm = shortMatch[2].padStart(2, '0');
    return `${dd}/${mm}/2026`;
  }

  return str;
};
