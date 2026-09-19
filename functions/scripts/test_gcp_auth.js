const { google } = require('googleapis');

async function testGCPAuth() {
  console.log('Testing GCP Application Default Credentials for Google Sheets API...');
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    console.log('✅ Auth success! Spreadsheet title:', res.data.properties.title);
  } catch (e) {
    console.log('Auth error:', e.message);
  }
}

testGCPAuth();
