import { describe, it, expect } from 'vitest';
import {
  TEAM_NAMES,
  POS_ORDER,
  cleanStr,
  getPlayerName,
  getNormalizedTeamId,
  isPosMatch,
  getFormation,
  safeArray,
  isSubLog
} from '../utils/liveArenaUtils';

describe('liveArenaUtils', () => {
  it('has correct TEAM_NAMES map', () => {
    expect(TEAM_NAMES['hamsili']).toBe('חמסילי');
    expect(TEAM_NAMES['tampa']).toBe('טמפה');
  });

  it('has correct POS_ORDER map', () => {
    expect(POS_ORDER['GK']).toBe(1);
    expect(POS_ORDER['FWD']).toBe(4);
  });

  it('normalizes string correctly with cleanStr', () => {
    expect(cleanStr('  חמסילי FC-1 ')).toBe('חמסיליfc1');
    expect(cleanStr(null)).toBe('');
  });

  it('extracts player name correctly with getPlayerName', () => {
    expect(getPlayerName(' ערן  ')).toBe('ערן');
    expect(getPlayerName({ name: 'ערן לוי' })).toBe('ערן לוי');
    expect(getPlayerName({ playerName: 'דור פרץ' })).toBe('דור פרץ');
    expect(getPlayerName(null)).toBe('');
  });

  it('normalizes team ID correctly with getNormalizedTeamId', () => {
    expect(getNormalizedTeamId('חראלה הישנה')).toBe('harale');
    expect(getNormalizedTeamId('חולוניה עיר')).toBe('holonia');
    expect(getNormalizedTeamId('קבוצה לא ידועה')).toBe('קבוצהלאידועה');
  });

  it('matches positions correctly with isPosMatch', () => {
    expect(isPosMatch('שוער', 'GK')).toBe(true);
    expect(isPosMatch('הגנה', 'DEF')).toBe(true);
    expect(isPosMatch('קשר', 'MID')).toBe(true);
    expect(isPosMatch('חלוץ', 'FWD')).toBe(true);
    expect(isPosMatch('שוער', 'FWD')).toBe(false);
  });

  it('calculates formation correctly with getFormation', () => {
    const lineup = [
      { position: 'GK' },
      { position: 'DEF' }, { position: 'DEF' }, { position: 'DEF' }, { position: 'DEF' },
      { position: 'MID' }, { position: 'MID' }, { position: 'MID' }, { position: 'MID' },
      { position: 'FWD' }, { position: 'FWD' }
    ];
    expect(getFormation(lineup)).toBe('4-4-2');
    expect(getFormation([])).toBe('');
  });

  it('handles safeArray safely', () => {
    expect(safeArray(null)).toEqual([]);
    expect(safeArray([1, 2])).toEqual([1, 2]);
    expect(safeArray({ a: [3, 4] })).toEqual([3, 4]);
  });

  it('detects sub logs with isSubLog', () => {
    expect(isSubLog({ type: 'HALFTIME_SUB' })).toBe(true);
    expect(isSubLog({ type: 'CANCELLED_SUB' })).toBe(false);
    expect(isSubLog({ type: 'VAR_POINTS_UPDATE' })).toBe(false);
  });
});
