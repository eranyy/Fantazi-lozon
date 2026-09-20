export interface MatchDateTimeInfo {
  timestamp?: number | null;
  date?: string | null;
  time?: string | null;
  status?: string | null;
  [key: string]: any;
}

export const parseMatchDateTime = (m?: MatchDateTimeInfo | null): number => {
  if (!m) return Infinity;
  if (typeof m.timestamp === 'number' && m.timestamp > 0) return m.timestamp;

  const dateStr = String(m.date || '').trim();
  const timeStr = String(m.time || m.matchTime || '').trim();
  const statusStr = String(m.status || '').trim();

  if (!dateStr || dateStr.includes('נדחה') || statusStr.includes('נדחה')) {
    return Infinity + 100000;
  }
  if (dateStr.includes('טרם') || dateStr.includes('ייקבע')) {
    return Infinity;
  }

  let year = new Date().getFullYear();
  let month = 0;
  let day = 0;

  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = dateStr.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10) - 1;
    day = parseInt(isoMatch[3], 10);
  } else {
    // 2. DMY format: DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY (e.g., 18/09/2026 (יום שישי))
    const dmyMatch = dateStr.match(/(\d{1,2})[-/. ](\d{1,2})(?:[-/. ](\d{2,4}))?/);
    if (!dmyMatch) return Infinity;
    day = parseInt(dmyMatch[1], 10);
    month = parseInt(dmyMatch[2], 10) - 1;
    if (dmyMatch[3]) {
      year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
    }
  }

  let hours = 23;
  let minutes = 59;
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
  }

  return new Date(year, month, day, hours, minutes).getTime();
};

export const sortMatchesChronologically = <T extends MatchDateTimeInfo>(matches: T[]): T[] => {
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

export const formatMatchTime = (t?: string): string => {
  if (!t) return '20:00';
  const str = String(t).trim();
  const parts = str.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return str;
};

export const formatTimeWithUS = (ilTime: string): string => {
  if (!ilTime) return '';
  if (ilTime.includes('🇺🇸')) return ilTime;

  const timeMatch = ilTime.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return ilTime;

  const h = parseInt(timeMatch[1], 10);
  const m = timeMatch[2];
  let usH = h - 7;
  if (usH < 0) usH += 24;

  const hStr = h.toString().padStart(2, '0');
  const usHStr = usH.toString().padStart(2, '0');

  return `${hStr}:${m} | ${usHStr}:${m} 🇺🇸`;
};
