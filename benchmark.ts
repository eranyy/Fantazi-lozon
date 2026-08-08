import { performance } from 'perf_hooks';

const normalizeTeamName = (name: string) => {
    if (!name) return '';
    let n = name.trim().toLowerCase().replace(/["'״׳.]/g, '').replace(/-/g, ' ');
    if (n.includes('תל אביב')) n = n.replace('תל אביב', 'תא');
    if (n.includes('באר שבע')) n = n.replace('באר שבע', 'בש');
    if (n.includes('קרית שמונה')) n = n.replace('קרית שמונה', 'קש');
    if (n.includes('פתח תקוה') || n.includes('פתח תקווה')) n = n.replace(/פתח תקו[ו]?ה/, 'פת');
    if (n.includes('ריינה')) return 'מכבי בני ריינה';
    if (n.includes('אשדוד')) return 'מס אשדוד';
    if (n.includes('טבריה')) return 'עירוני טבריה';
    if (n.includes('סכנין')) return 'בני סכנין';
    if (n.includes('נתניה') && n.includes('מכבי')) return 'מכבי נתניה';
    if (n.includes('חדרה')) return 'הפועל חדרה';
    return n.replace(/\s+/g, ' ').trim();
};

const generateMockMatches = (count: number) => {
    const matches = [];
    for (let i = 0; i < count; i++) {
        matches.push({
            homeTeam: `TeamA${i}`,
            awayTeam: `TeamB${i}`,
            round: i % 10,
            time: '20:00'
        });
    }
    return matches;
};

const formatTimeWithUS = (time: string) => time;

const oldMethod = (currentMatches: any[], extractedMatches: any[]) => {
    const newMatches = [...currentMatches];
    extractedMatches.forEach((m: any) => {
        m.time = formatTimeWithUS(m.time);

        const exists = newMatches.find(em => normalizeTeamName(em.homeTeam) === normalizeTeamName(m.homeTeam) && normalizeTeamName(em.awayTeam) === normalizeTeamName(m.awayTeam) && em.round === m.round);

        if (exists) {
            Object.assign(exists, m);
        } else {
            newMatches.push(m);
        }
    });
    return newMatches;
};

const newMethod = (currentMatches: any[], extractedMatches: any[]) => {
    const newMatches = [...currentMatches];

    const matchMap = new Map();
    newMatches.forEach(em => {
        const key = `${normalizeTeamName(em.homeTeam)}|${normalizeTeamName(em.awayTeam)}|${em.round}`;
        matchMap.set(key, em);
    });

    extractedMatches.forEach((m: any) => {
        m.time = formatTimeWithUS(m.time);

        const key = `${normalizeTeamName(m.homeTeam)}|${normalizeTeamName(m.awayTeam)}|${m.round}`;
        const exists = matchMap.get(key);

        if (exists) {
            Object.assign(exists, m);
        } else {
            newMatches.push(m);
            matchMap.set(key, m);
        }
    });
    return newMatches;
};

const runBenchmark = () => {
    const N = 5000;
    const currentMatches = generateMockMatches(N);
    const extractedMatches = generateMockMatches(N / 2).map(m => ({...m, time: '21:00'}));

    const startOld = performance.now();
    oldMethod(currentMatches, extractedMatches);
    const endOld = performance.now();

    const startNew = performance.now();
    newMethod(currentMatches, extractedMatches);
    const endNew = performance.now();

    console.log(`Old Method: ${endOld - startOld} ms`);
    console.log(`New Method: ${endNew - startNew} ms`);
    console.log(`Improvement: ${((endOld - startOld) / (endNew - startNew)).toFixed(2)}x`);
};

runBenchmark();
