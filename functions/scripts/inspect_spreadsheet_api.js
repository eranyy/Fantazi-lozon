const { google } = require('googleapis');
const { execSync } = require('child_process');

const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

async function getAccessToken() {
    return execSync('gcloud auth print-access-token').toString().trim();
}

async function inspectSpreadsheetAPI() {
    console.log('=== INSPECTING SPREADSHEET VIA GOOGLE SHEETS API ===\n');

    const token = await getAccessToken();
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const res = await sheets.spreadsheets.get({
        spreadsheetId,
        includeGridData: false
    });

    console.log(`Spreadsheet Title: "${res.data.properties.title}"`);
    console.log(`Total Sheets (Tabs): ${res.data.sheets.length}\n`);

    res.data.sheets.forEach((s, idx) => {
        const props = s.properties;
        console.log(`Tab ${idx + 1}: name="${props.title}", sheetId=${props.sheetId}, rowCount=${props.gridProperties?.rowCount}, colCount=${props.gridProperties?.columnCount}`);
    });

    process.exit(0);
}

inspectSpreadsheetAPI().catch(err => {
    console.error('API Error:', err.message || err);
    process.exit(1);
});
