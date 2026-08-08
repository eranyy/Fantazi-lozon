const teams = Array.from({ length: 50 }, (_, i) => ({ id: `team_${i}`, name: `Team ${i}` }));
const matches = Array.from({ length: 25 }, (_, i) => ({ h: `team_${i * 2}`, a: `team_${i * 2 + 1}` }));

function runBenchmark() {
  const startFind = performance.now();
  for(let i=0; i<10000; i++) {
    matches.forEach(match => {
      const hTeam = teams.find(t => t.id === match.h);
      const aTeam = teams.find(t => t.id === match.a);
    });
  }
  const endFind = performance.now();
  console.log(`find: ${endFind - startFind} ms`);

  const startLookupSetup = performance.now();
  const lookup = {};
  teams.forEach(t => lookup[t.id] = t);
  const endLookupSetup = performance.now();
  console.log(`lookup setup: ${endLookupSetup - startLookupSetup} ms`);

  const startLookup = performance.now();
  for(let i=0; i<10000; i++) {
    matches.forEach(match => {
      const hTeam = lookup[match.h];
      const aTeam = lookup[match.a];
    });
  }
  const endLookup = performance.now();
  console.log(`lookup: ${endLookup - startLookup} ms`);
}

runBenchmark();
