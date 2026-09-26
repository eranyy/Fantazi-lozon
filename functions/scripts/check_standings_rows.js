const axios = require('axios');

const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

async function checkStandingsRows() {
    console.log('=== CHECKING ROWS IN 🏆 טבלת הליגה ===\n');

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
    const res = await axios.get(url);
    const html = res.data;

    const match = /name: "🏆 טבלת הליגה"[^]*?gid: "([0-9]+)"/.exec(html);
    console.log('GID for 🏆 טבלת הליגה:', match ? match[1] : 'NOT FOUND');

    if (match) {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${match[1]}`;
        const csvRes = await axios.get(csvUrl);
        const lines = csvRes.data.split('\n').filter(l => l.trim());
        console.log(`Total non-empty lines in 🏆 טבלת הליגה: ${lines.length}`);
        lines.forEach((line, idx) => console.log(` Row ${idx + 1}: ${line.trim()}`));
    }

    process.exit(0);
}

checkStandingsRows().catch(e => {
    console.error(e);
    process.exit(1);
});
