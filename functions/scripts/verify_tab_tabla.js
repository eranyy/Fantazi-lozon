const axios = require('axios');

const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

async function verifyTabTabla() {
    console.log('=== VERIFYING TAB "טבלה" CONTENT ===\n');

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
    const res = await axios.get(url);
    const html = res.data;

    const tablaMatch = /name: "טבלה"[^]*?gid: "([0-9]+)"/.exec(html);
    console.log('GID for tab "טבלה":', tablaMatch ? tablaMatch[1] : 'NOT FOUND');

    if (tablaMatch) {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${tablaMatch[1]}`;
        const csvRes = await axios.get(csvUrl);
        csvRes.data.split('\n').forEach((line, idx) => {
            if (line.trim()) console.log(` Row ${idx + 1}: ${line.trim()}`);
        });
    }

    process.exit(0);
}

verifyTabTabla().catch(e => {
    console.error(e);
    process.exit(1);
});
