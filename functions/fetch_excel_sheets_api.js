const axios = require('axios');

async function fetchWithGvizAndApi() {
  const spreadsheetId = '1Ru6w8bk7G1Mx_uPHyEuEKEeqseLqVj0NuOhMdCExiYQ';
  const apiKey = 'AIzaSyARwamUBjcirbqFtWn_RpKkOdiHmeGlis0';

  console.log('=== ATTEMPT 1: GVIZ CSV ENDPOINT ===');
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=1846967038`;
    const res = await axios.get(gvizUrl);
    console.log('Gviz CSV Success! First 50 lines:');
    const lines = res.data.split('\n');
    lines.slice(0, 50).forEach((l, i) => console.log(`${i+1}: ${l}`));
    process.exit(0);
  } catch (err) {
    console.log('Gviz CSV failed:', err.message);
  }

  console.log('\n=== ATTEMPT 2: GOOGLE SHEETS API V4 ===');
  try {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    const metaRes = await axios.get(metaUrl);
    console.log('Sheet metadata sheets:', metaRes.data.sheets.map(s => s.properties.title));
    
    const r2Sheet = metaRes.data.sheets.find(s => s.properties.title.includes('2') || s.properties.title.includes('מחזור 2'));
    const title = r2Sheet ? r2Sheet.properties.title : metaRes.data.sheets[0].properties.title;
    
    const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}?key=${apiKey}`;
    const dataRes = await axios.get(dataUrl);
    console.log(`Sheet "${title}" values rows count: ${dataRes.data.values?.length}`);
    dataRes.data.values?.slice(0, 50).forEach((row, i) => console.log(`Row ${i+1}:`, row));
  } catch (err) {
    console.log('Sheets API V4 failed:', err.message);
  }

  process.exit(0);
}

fetchWithGvizAndApi();
