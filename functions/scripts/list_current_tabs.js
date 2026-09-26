const axios = require('axios');

const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

async function listCurrentTabs() {
    console.log('=== LISTING CURRENT TABS IN SPREADSHEET ===\n');

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
    const res = await axios.get(url);
    const html = res.data;

    const regex = /name: "([^"]+)"[^]*?gid: "([0-9]+)"/g;
    let match;
    const tabs = [];
    while ((match = regex.exec(html)) !== null) {
        tabs.push({ name: match[1], gid: match[2] });
    }

    console.log(`Found ${tabs.length} tabs:`);
    tabs.forEach((t, i) => console.log(` ${i + 1}. ${t.name} (gid: ${t.gid})`));

    process.exit(0);
}

listCurrentTabs().catch(e => {
    console.error(e);
    process.exit(1);
});
