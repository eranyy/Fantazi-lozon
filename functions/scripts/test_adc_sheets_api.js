const { google } = require('googleapis');
const { execSync } = require('child_process');

const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

async function getADCToken() {
    return execSync('gcloud auth application-default print-access-token').toString().trim();
}

async function testADCGoogleSheetsAPI() {
    console.log('=== TESTING ADC WITH GOOGLE SHEETS API ===\n');

    const token = await getADCToken();
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const res = await sheets.spreadsheets.get({
        spreadsheetId,
        includeGridData: false
    });

    console.log(`✅ SUCCESS! Spreadsheet Title: "${res.data.properties.title}"`);
    console.log(`Found ${res.data.sheets.length} sheets (tabs):`);
    res.data.sheets.forEach(s => console.log(` - ${s.properties.title} (sheetId: ${s.properties.sheetId})`));

    process.exit(0);
}

testADCGoogleSheetsAPI().catch(err => {
    console.error('❌ ADC API Error:', err.message || err);
    process.exit(1);
});
