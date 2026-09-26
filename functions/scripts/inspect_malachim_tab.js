const axios = require('axios');

const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';
const gid = '1802099045';

async function inspectMalachimTab() {
    console.log('=== INSPECTING TAB מלאכים ===\n');

    try {
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
        const res = await axios.get(url);
        const lines = res.data.split('\n');
        console.log(`Total lines in מלאכים: ${lines.length}`);
        lines.forEach((line, idx) => {
            if (line.trim()) console.log(` Row ${idx + 1}: ${line.trim()}`);
        });
    } catch (e) {
        console.error('Error fetching tab מלאכים:', e.message);
    }

    process.exit(0);
}

inspectMalachimTab();
