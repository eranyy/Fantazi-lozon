const axios = require('axios');
const apiKey = 'AIzaSyARwamUBjcirbqFtWn_RpKkOdiHmeGlis0';
const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

async function testWriteSheet() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/גיליון1:append?valueInputOption=USER_ENTERED&key=${apiKey}`;
  try {
    const res = await axios.post(url, {
      values: [['test']]
    });
    console.log('Write success:', res.data);
  } catch (e) {
    console.log('Write status:', e.response?.status);
    console.log('Write error detail:', e.response?.data?.error?.message);
  }
}

testWriteSheet();
