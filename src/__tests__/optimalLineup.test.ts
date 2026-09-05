import { describe, it, expect } from 'vitest';
import { calculateOptimalLineup } from '../utils/optimalLineup';
import { Player } from '../types';

describe('optimalLineup', () => {
  it('returns default empty result for null/empty squad', () => {
    const resEmpty = calculateOptimalLineup([]);
    expect(resEmpty.optimalPoints).toBe(0);
    expect(resEmpty.potentialGain).toBe(0);
    expect(resEmpty.optimalLineup).toEqual([]);

    const resNull = calculateOptimalLineup(null as any);
    expect(resNull.optimalPoints).toBe(0);
    expect(resNull.optimalLineup).toEqual([]);
  });

  it('selects best players and calculates optimal points correctly', () => {
    const squad: Player[] = [
      { id: '1', name: 'GK1', position: 'GK', points: 10, isStarting: true, price: 5 } as any,
      { id: '2', name: 'GK2', position: 'GK', points: 2, isStarting: false, price: 5 } as any,
      
      // Defs
      { id: '3', name: 'DEF1', position: 'DEF', points: 8, isStarting: true, price: 5 } as any,
      { id: '4', name: 'DEF2', position: 'DEF', points: 7, isStarting: true, price: 5 } as any,
      { id: '5', name: 'DEF3', position: 'DEF', points: 6, isStarting: true, price: 5 } as any,
      { id: '6', name: 'DEF4', position: 'DEF', points: 5, isStarting: true, price: 5 } as any,
      { id: '7', name: 'DEF5', position: 'DEF', points: 1, isStarting: false, price: 5 } as any,

      // Mids
      { id: '8', name: 'MID1', position: 'MID', points: 12, isStarting: true, price: 5 } as any,
      { id: '9', name: 'MID2', position: 'MID', points: 9, isStarting: true, price: 5 } as any,
      { id: '10', name: 'MID3', position: 'MID', points: 8, isStarting: true, price: 5 } as any,
      { id: '11', name: 'MID4', position: 'MID', points: 7, isStarting: false, price: 5 } as any,

      // Fwds
      { id: '12', name: 'FWD1', position: 'FWD', points: 15, isStarting: true, price: 5 } as any,
      { id: '13', name: 'FWD2', position: 'FWD', points: 14, isStarting: true, price: 5 } as any,
      { id: '14', name: 'FWD3', position: 'FWD', points: 11, isStarting: false, price: 5 } as any,
    ];

    const result = calculateOptimalLineup(squad);
    
    // Check that GK1 (10 pts) was chosen over GK2 (2 pts)
    expect(result.optimalLineup.some(p => p.id === '1')).toBe(true);
    expect(result.optimalBench.some(p => p.id === '2')).toBe(true);

    // Starting actual points: GK1(10)+DEF1..4(26)+MID1..3(29)+FWD1..2(29) = 94
    expect(result.actualPoints).toBe(94);

    // Optimal should pick FWD3(11) or MID4(7) over DEF4(5) to get higher points
    expect(result.optimalPoints).toBeGreaterThanOrEqual(result.actualPoints);
    expect(result.potentialGain).toBe(result.optimalPoints - result.actualPoints);
  });

  it('normalizes Hebrew position strings correctly', () => {
    const squad: Player[] = [
      { id: 'g1', name: 'שוער א', position: 'שוער', points: 6, isStarting: true } as any,
      { id: 'd1', name: 'בלם א', position: 'הגנה', points: 5, isStarting: true } as any,
      { id: 'd2', name: 'מגן א', position: 'מגן', points: 5, isStarting: true } as any,
      { id: 'd3', name: 'בלם ב', position: 'בלם', points: 5, isStarting: true } as any,
      { id: 'd4', name: 'הגנה ב', position: 'DEF', points: 5, isStarting: true } as any,
      { id: 'm1', name: 'קשר א', position: 'קשר', points: 10, isStarting: true } as any,
      { id: 'm2', name: 'קישור ב', position: 'קישור', points: 10, isStarting: true } as any,
      { id: 'm3', name: 'קשר ג', position: 'MID', points: 10, isStarting: true } as any,
      { id: 'f1', name: 'חלוץ א', position: 'חלוץ', points: 12, isStarting: true } as any,
      { id: 'f2', name: 'התקפה ב', position: 'התקפה', points: 12, isStarting: true } as any,
      { id: 'f3', name: 'חלוץ ג', position: 'FWD', points: 12, isStarting: true } as any,
    ];

    const result = calculateOptimalLineup(squad);
    expect(result.optimalLineup.length).toBe(11);
    expect(result.optimalPoints).toBe(6 + 5*4 + 10*3 + 12*3); // 4-3-3 formation
  });
});
