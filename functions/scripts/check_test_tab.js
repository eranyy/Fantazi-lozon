const axios = require('axios');

async function checkTestTab() {
    try {
        const url = `https://docs.google.com/spreadsheets/d/14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s/htmlview`;
        const res = await axios.get(url);
        const hasTestTab = res.data.includes('טסט_בדיקה');
        console.log('Does spreadsheet contain טסט_בדיקה?', hasTestTab);
    } catch (e) {
        console.error(e.message);
    }
    process.exit(0);
}

checkTestTab();
