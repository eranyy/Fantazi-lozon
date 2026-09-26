const axios = require('axios');

const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

const gids = {
    '📅 משחקי ליגת העל': '744687763',
    'טבלת הנביאים': '1922580775',
    'טבלת הליגה': '772790942',
    'תוצאות מפגשי פנטזי': '1737694043',
    'ארכיון ניקוד מחזורים': '10461379'
};

async function checkSheetTabs() {
    console.log('=== CHECKING CONTENT OF ALL GIDS IN GOOGLE SHEET ===\n');

    for (const [name, gid] of Object.entries(gids)) {
        console.log(`--- TAB: ${name} (gid: ${gid}) ---`);
        try {
            const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
            const res = await axios.get(url);
            const lines = res.data.split('\n').filter(l => l.trim());
            console.log(`Total non-empty lines: ${lines.length}`);
            lines.slice(0, 8).forEach((line, idx) => console.log(` Row ${idx + 1}: ${line.trim()}`));
        } catch (e) {
            console.error(`Error fetching gid ${gid}:`, e.message);
        }
        console.log('\n');
    }

    process.exit(0);
}

checkSheetTabs().catch(e => {
    console.error(e);
    process.exit(1);
});
