const axios = require('axios');
const apiKey = 'AIzaSyARwamUBjcirbqFtWn_RpKkOdiHmeGlis0';
const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

async function inspectSpreadsheetTabs() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
  console.log('Fetching spreadsheet metadata...');
  try {
    const res = await axios.get(url);
    console.log('Spreadsheet Title:', res.data.properties.title);
    console.log('Tabs (Sheets):');
    res.data.sheets.forEach(s => {
      console.log(` - ${s.properties.title} (ID: ${s.properties.sheetId}, rows: ${s.properties.gridProperties.rowCount}, cols: ${s.properties.gridProperties.columnCount})`);
    });
  } catch (e) {
    console.error('Error fetching sheets metadata:', e.response?.data || e.message);
  }
}

inspectSpreadsheetTabs();
