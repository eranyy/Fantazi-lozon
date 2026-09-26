const axios = require('axios');

const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

const roundGids = {
    'מחזור 1': '463496420',
    'מחזור 2': '480808470',
    'מחזור 3': '873633618'
};

async function inspectRoundTabs() {
    console.log('=== INSPECTING INDIVIDUAL ROUND TABS ===\n');

    for (const [name, gid] of Object.entries(roundGids)) {
        console.log(`--- TAB: ${name} (gid: ${gid}) ---`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
            const res = await axios.get(url);
            const lines = res.data.split('\n');
            console.log(`Total lines: ${lines.length}`);
            lines.slice(0, 30).forEach((line, idx) => {
                if (line.trim()) console.log(` Row ${idx + 1}: ${line.trim()}`);
            });
        } catch (e) {
            console.error(`Error fetching gid ${gid}:`, e.message);
        }
        console.log('\n');
    }

    process.exit(0);
}

inspectRoundTabs().catch(e => {
    console.error(e);
    process.exit(1);
});
