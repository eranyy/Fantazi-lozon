import { Player } from '../types';

export interface OptimalLineupResult {
  optimalLineup: Player[];
  optimalBench: Player[];
  optimalFormation: string; // e.g. '4-3-3'
  optimalPoints: number;
  actualPoints: number;
  potentialGain: number; // optimalPoints - actualPoints
}

const ALLOWED_FORMATIONS = [
  { def: 5, mid: 3, fwd: 2, name: '5-3-2' },
  { def: 5, mid: 4, fwd: 1, name: '5-4-1' },
  { def: 4, mid: 5, fwd: 1, name: '4-5-1' },
  { def: 4, mid: 4, fwd: 2, name: '4-4-2' },
  { def: 4, mid: 3, fwd: 3, name: '4-3-3' },
  { def: 3, mid: 5, fwd: 2, name: '3-5-2' },
  { def: 3, mid: 4, fwd: 3, name: '3-4-3' }
];

const getNormalizedPos = (posStr: string): 'GK' | 'DEF' | 'MID' | 'FWD' => {
  const p = String(posStr || '').toUpperCase().trim();
  if (p.includes('GK') || p.includes('שוער')) return 'GK';
  if (p.includes('DEF') || p.includes('הגנה') || p.includes('בלם') || p.includes('מגן')) return 'DEF';
  if (p.includes('MID') || p.includes('קשר') || p.includes('קישור')) return 'MID';
  if (p.includes('FWD') || p.includes('חלוץ') || p.includes('התקפה')) return 'FWD';
  return 'MID';
};

export function calculateOptimalLineup(squad: Player[], actualLineup?: Player[]): OptimalLineupResult {
  if (!Array.isArray(squad) || squad.length === 0) {
    return {
      optimalLineup: [],
      optimalBench: [],
      optimalFormation: '4-4-2',
      optimalPoints: 0,
      actualPoints: 0,
      potentialGain: 0
    };
  }

  // Calculate actual points if actualLineup provided (NO captain multiplier in Fantasy Luzon 14)
  let actualPoints = 0;
  if (Array.isArray(actualLineup) && actualLineup.length > 0) {
    actualPoints = actualLineup.reduce((sum, pl) => sum + (Number(pl.points) || 0), 0);
  } else {
    // If no actualLineup given, calculate from starting players in squad
    actualPoints = squad.reduce((sum, pl) => {
      if (pl.isStarting) {
        return sum + (Number(pl.points) || 0);
      }
      return sum;
    }, 0);
  }

  // Group squad by position
  const gks: Player[] = [];
  const defs: Player[] = [];
  const mids: Player[] = [];
  const fwds: Player[] = [];

  squad.forEach(pl => {
    const pos = getNormalizedPos(pl.position);
    if (pos === 'GK') gks.push(pl);
    else if (pos === 'DEF') defs.push(pl);
    else if (pos === 'MID') mids.push(pl);
    else if (pos === 'FWD') fwds.push(pl);
  });

  // Sort each position by points descending
  const sortByPts = (a: Player, b: Player) => (Number(b.points) || 0) - (Number(a.points) || 0);
  gks.sort(sortByPts);
  defs.sort(sortByPts);
  mids.sort(sortByPts);
  fwds.sort(sortByPts);

  let bestResult: {
    lineup: Player[];
    bench: Player[];
    formation: string;
    totalPoints: number;
  } | null = null;

  // Best GK is top GK
  const bestGK = gks[0] || null;
  if (!bestGK) {
    return {
      optimalLineup: squad.slice(0, 11),
      optimalBench: squad.slice(11),
      optimalFormation: '4-4-2',
      optimalPoints: actualPoints,
      actualPoints,
      potentialGain: 0
    };
  }

  // Test all 7 legal formations
  for (const form of ALLOWED_FORMATIONS) {
    if (defs.length < form.def || mids.length < form.mid || fwds.length < form.fwd) {
      continue;
    }

    const selectedDefs = defs.slice(0, form.def);
    const selectedMids = mids.slice(0, form.mid);
    const selectedFwds = fwds.slice(0, form.fwd);

    const starting11 = [bestGK, ...selectedDefs, ...selectedMids, ...selectedFwds];

    // Total points for starting 11 (1x points each, no captain multiplier)
    const totalPts = starting11.reduce((sum, pl) => sum + (Number(pl.points) || 0), 0);

    if (!bestResult || totalPts > bestResult.totalPoints) {
      const startingIds = new Set(starting11.map(p => p.id || p.name));
      const bench = squad.filter(p => !startingIds.has(p.id || p.name));

      bestResult = {
        lineup: starting11,
        bench,
        formation: form.name,
        totalPoints: totalPts
      };
    }
  }

  if (!bestResult) {
    return {
      optimalLineup: squad.slice(0, 11),
      optimalBench: squad.slice(11),
      optimalFormation: '4-4-2',
      optimalPoints: actualPoints,
      actualPoints,
      potentialGain: 0
    };
  }

  return {
    optimalLineup: bestResult.lineup,
    optimalBench: bestResult.bench,
    optimalFormation: bestResult.formation,
    optimalPoints: bestResult.totalPoints,
    actualPoints,
    potentialGain: Math.max(0, bestResult.totalPoints - actualPoints)
  };
}
