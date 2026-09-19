const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

const parseCsvLine = (line) => {
    const result = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (insideQuote && line[i + 1] === '"') {
                entry += '"';
                i++;
            } else {
                insideQuote = !insideQuote;
            }
        } else if (char === ',' && !insideQuote) {
            result.push(entry.trim());
            entry = '';
        } else {
            entry += char;
        }
    }
    result.push(entry.trim());
    return result;
};

(async () => {
    const primaryUrl = 'https://docs.google.com/spreadsheets/d/14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s/gviz/tq?tqx=out:csv';
    const res = await axios.get(primaryUrl);
    const csvData = res.data;
    const lines = csvData.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const matches = [];
    const cupMatches = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 6) continue;

        const roundStage = cols[0];
        const dateStr = cols[1];
        const dayStr = cols[2];
        const timeStr = cols[3];
        const homeTeam = cols[4];
        const awayTeam = cols[5];
        const competition = cols[6] || '';
        const stadium = cols[7] || '';
        const tvChannel = cols[8] || '';
        const status = cols[9] || '';

        const roundNum = parseInt(cols[0].replace(/[^\d]/g, ''), 10) || 1;

        const matchItem = {
            round: roundNum,
            roundStage,
            date: dateStr,
            day: dayStr,
            time: timeStr,
            homeTeam,
            awayTeam,
            competition,
            stadium,
            tvChannel,
            status
        };

        if (competition.includes('גביע')) {
            cupMatches.push(matchItem);
        } else {
            matches.push(matchItem);
        }
    }

    await db.doc('leagueData/real_fixtures').set({
        matches,
        cupMatches,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'Google Sheet Sync Authoritative'
    }, { merge: true });

    console.log(`✅ Successfully synced ${matches.length} league matches from official Google Sheet to Firestore real_fixtures!`);
    
    // Print upcoming matches for Round 2
    const round2 = matches.filter(m => m.round === 2);
    console.log('\nROUND 2 MATCHES FROM OFFICIAL GOOGLE SHEET:');
    round2.forEach(m => console.log(`• ${m.day} ${m.date} at ${m.time}: ${m.homeTeam} vs ${m.awayTeam}`));

    process.exit(0);
})();
