const axios = require('axios');

const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

async function verifyRounds4and5() {
    console.log('=== VERIFYING TABS FOR מחזור 4 AND מחזור 5 ===\n');

    // Fetch htmlview to get gids
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
    const res = await axios.get(url);
    const html = res.data;

    const r4Match = /name: "מחזור 4"[^]*?gid: "([0-9]+)"/.exec(html);
    const r5Match = /name: "מחזור 5"[^]*?gid: "([0-9]+)"/.exec(html);

    console.log('Found GID for מחזור 4:', r4Match ? r4Match[1] : 'NOT FOUND');
    console.log('Found GID for מחזור 5:', r5Match ? r5Match[1] : 'NOT FOUND');

    if (r4Match) {
        console.log('\n--- CONTENT SAMPLE FOR מחזור 4 ---');
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${r4Match[1]}`;
        const csvRes = await axios.get(csvUrl);
        csvRes.data.split('\n').slice(0, 15).forEach((line, idx) => console.log(` Row ${idx + 1}: ${line.trim()}`));
    }

    if (r5Match) {
        console.log('\n--- CONTENT SAMPLE FOR מחזור 5 ---');
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${r5Match[1]}`;
        const csvRes = await axios.get(csvUrl);
        csvRes.data.split('\n').slice(0, 15).forEach((line, idx) => console.log(` Row ${idx + 1}: ${line.trim()}`));
    }

    process.exit(0);
}

verifyRounds4and5().catch(e => {
    console.error(e);
    process.exit(1);
});
