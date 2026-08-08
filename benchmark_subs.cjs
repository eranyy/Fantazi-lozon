const { performance } = require('perf_hooks');

const createTeam = (subsCount = 1) => {
    const published_lineup = Array.from({length: 11}, (_, i) => ({ name: `PlayerOut${i}`, position: 'MID' }));
    const published_subs_out = Array.from({length: 15}, (_, i) => ({ name: `PlayerIn${i}`, position: 'MID' }));
    const transfers = [];
    for(let i = 0; i < subsCount; i++) {
        transfers.push({
            type: 'HALFTIME_SUB',
            round: 1,
            status: 'APPROVED',
            timestamp: `2023-10-01T12:0${i}:00Z`,
            playerOut: `PlayerOut${i}`,
            playerIn: `PlayerIn${i}`
        });
    }
    // Add some noise
    for(let i = 0; i < 50; i++) {
        transfers.push({ type: 'TRANSFER', round: 1, status: 'APPROVED', timestamp: `2023-10-01T12:0${i}:00Z` });
    }
    return { published_lineup, published_subs_out, transfers };
};

const currentRound = 1;

const originalApply = (team) => {
    if (!team) return [];
    let currentLineup = [...(team.published_lineup || [])];
    const bench = team.published_subs_out || [];
    const roundSubs = (team.transfers || []).filter((t) => t.type === 'HALFTIME_SUB' && t.round === currentRound && t.status !== 'CANCELLED');
    const sortedSubs = roundSubs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    sortedSubs.forEach((sub) => {
      const outIndex = currentLineup.findIndex(p => p.name === sub.playerOut);
      const inPlayer = bench.find((p) => p.name === sub.playerIn);
      if (outIndex !== -1 && inPlayer) { currentLineup[outIndex] = inPlayer; }
    });
    return currentLineup;
};

const optimizedApply = (team) => {
    if (!team) return [];
    let currentLineup = [...(team.published_lineup || [])];
    const bench = team.published_subs_out || [];
    const transfers = team.transfers || [];

    // Sort ISO date strings directly (much faster than new Date)
    // Filter and sort in one go
    const roundSubs = [];
    for (let i = 0; i < transfers.length; i++) {
        const t = transfers[i];
        if (t.type === 'HALFTIME_SUB' && t.round === currentRound && t.status !== 'CANCELLED') {
            roundSubs.push(t);
        }
    }

    if (roundSubs.length > 0) {
        roundSubs.sort((a, b) => a.timestamp < b.timestamp ? -1 : (a.timestamp > b.timestamp ? 1 : 0));

        // Only map the bench, since lineup updates can just use findIndex (which is fast on array length 11)
        // Creating an object/map for 11 items has more overhead than a few findIndex calls
        const benchMap = {};
        for (let i = 0; i < bench.length; i++) {
            benchMap[bench[i].name] = bench[i];
        }

        for (let i = 0; i < roundSubs.length; i++) {
            const sub = roundSubs[i];
            const outIndex = currentLineup.findIndex(p => p.name === sub.playerOut);
            if (outIndex !== -1) {
                const inPlayer = benchMap[sub.playerIn];
                if (inPlayer) {
                    currentLineup[outIndex] = inPlayer;
                }
            }
        }
    }

    return currentLineup;
};

// Warmup
const team = createTeam(3);
for (let i = 0; i < 10000; i++) {
    originalApply(team);
    optimizedApply(team);
}

// Benchmark
const ITERS = 100000;

const startOriginal = performance.now();
for (let i = 0; i < ITERS; i++) {
    originalApply(team);
}
const endOriginal = performance.now();

const startOptimized = performance.now();
for (let i = 0; i < ITERS; i++) {
    optimizedApply(team);
}
const endOptimized = performance.now();

console.log(`Original: ${endOriginal - startOriginal} ms`);
console.log(`Optimized: ${endOptimized - startOptimized} ms`);
console.log(`Improvement: ${((endOriginal - startOriginal) / (endOptimized - startOptimized)).toFixed(2)}x`);
