const lineup = Array.from({ length: 11 }, (_, i) => ({ id: `player_${i}`, position: 'MID', name: `Player ${i}` }));
const selectedPlayer = { id: 'player_5', position: 'MID', name: 'Player 5' };

function oldRender() {
    let output = '';
    output += lineup.find(p => p.id === selectedPlayer.id) ? 'lineup' : 'bench';
    output += lineup.find(p => p.id === selectedPlayer.id) ? 'bg-red' : 'bg-green';
    output += lineup.find(p => p.id === selectedPlayer.id) ? '⬇️' : '⬆️';
    output += lineup.find(p => p.id === selectedPlayer.id) ? 'הורד לספסל' : 'העלה להרכב';
    return output;
}

function newRender() {
    let output = '';
    const isStarting = !!lineup.find(p => p.id === selectedPlayer.id);
    output += isStarting ? 'lineup' : 'bench';
    output += isStarting ? 'bg-red' : 'bg-green';
    output += isStarting ? '⬇️' : '⬆️';
    output += isStarting ? 'הורד לספסל' : 'העלה להרכב';
    return output;
}

const ITERATIONS = 1_000_000;

const startOld = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    oldRender();
}
const endOld = performance.now();

const startNew = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    newRender();
}
const endNew = performance.now();

console.log(`Old render time: ${(endOld - startOld).toFixed(2)} ms`);
console.log(`New render time: ${(endNew - startNew).toFixed(2)} ms`);
console.log(`Improvement: ${(((endOld - startOld) - (endNew - startNew)) / (endOld - startOld) * 100).toFixed(2)}%`);
