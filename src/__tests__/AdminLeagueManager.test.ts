import { describe, it, expect } from 'vitest';
import { getHistoricalName } from '../utils/teamUtils';

describe('getHistoricalName', () => {
  it('should return empty string for empty input', () => {
    expect(getHistoricalName('')).toBe('');
  });

  it('should map team names correctly', () => {
    expect(getHistoricalName('חמסילי FC')).toBe('חמסילי');
    expect(getHistoricalName('קבוצת חמסה')).toBe('חמסה');
    expect(getHistoricalName('חראלה הישנה')).toBe('חראלה');
    expect(getHistoricalName('טמפה (אלופה)')).toBe('טמפה');
    expect(getHistoricalName('תומאלי אגדות')).toBe('תומאלי');
    expect(getHistoricalName('חולוניה עיר')).toBe('חולוניה');
    expect(getHistoricalName("פציצי")).toBe("פיצ'יצ'י");
    expect(getHistoricalName("פיציצי FC")).toBe("פיצ'יצ'י");
  });

  it('should return original name for unknown teams', () => {
    expect(getHistoricalName('מכבי תל אביב')).toBe('מכבי תל אביב');
    expect(getHistoricalName('קבוצה לא ידועה')).toBe('קבוצה לא ידועה');
  });
});
