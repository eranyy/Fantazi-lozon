import { vi } from "vitest";
vi.mock("../firebaseConfig", () => ({ db: {}, messaging: {} }));

import { describe, it, expect } from 'vitest';
import { getTeamColors } from '../AdminLeagueManager';

describe('getTeamColors', () => {
  it('should return goalkeeper colors when isGK is true, regardless of team', () => {
    const expected = { prim: '#bef264', sec: '#4d7c0f', text: '#14532d' };
    expect(getTeamColors('טמפה', true)).toEqual(expected);
    expect(getTeamColors('Unknown Team', true)).toEqual(expected);
    expect(getTeamColors('', true)).toEqual(expected);
  });

  it('should return colors for טמפה', () => {
    expect(getTeamColors('טמפה', false)).toEqual({ prim: '#ef4444', sec: '#991b1b', text: '#ffffff' });
    expect(getTeamColors('קבוצת טמפה', false)).toEqual({ prim: '#ef4444', sec: '#991b1b', text: '#ffffff' });
  });

  it('should return colors for תומאלי / פיצ\'יצ\'י / פציצי', () => {
    const expected = { prim: '#facc15', sec: '#1d4ed8', text: '#ffffff' };
    expect(getTeamColors('תומאלי', false)).toEqual(expected);
    expect(getTeamColors('פיצ\'יצ\'י', false)).toEqual(expected);
    expect(getTeamColors('פציצי', false)).toEqual(expected);
    expect(getTeamColors('קבוצת תומאלי המקורית', false)).toEqual(expected);
  });

  it('should return colors for חמסילי', () => {
    expect(getTeamColors('חמסילי', false)).toEqual({ prim: '#18181b', sec: '#16a34a', text: '#facc15' });
  });

  it('should return colors for חולוניה', () => {
    expect(getTeamColors('חולוניה', false)).toEqual({ prim: '#a855f7', sec: '#4c1d95', text: '#ffffff' });
  });

  it('should return colors for חראלה', () => {
    expect(getTeamColors('חראלה', false)).toEqual({ prim: '#78350f', sec: '#b91c1c', text: '#ffffff' });
  });

  it('should return default colors for unknown teams or empty strings', () => {
    const expected = { prim: '#3b82f6', sec: '#1e3a8a', text: '#ffffff' };
    expect(getTeamColors('Maccabi', false)).toEqual(expected);
    expect(getTeamColors('', false)).toEqual(expected);
    // @ts-expect-error - testing runtime fallback for null/undefined if applicable
    expect(getTeamColors(undefined as unknown as string, false)).toEqual(expected);
  });
});
