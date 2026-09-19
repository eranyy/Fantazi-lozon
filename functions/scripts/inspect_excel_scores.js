const axios = require('axios');

async function fetchExcelScores() {
  console.log('=== FETCHING EXACT SCORES FROM GOOGLE SHEET CSV ===\n');

  const primaryUrl = 'https://docs.google.com/spreadsheets/d/14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s/gviz/tq?tqx=out:csv';
  
  try {
    const res = await axios.get(primaryUrl);
    const csvData = res.data;
    console.log('CSV raw output (first 30 lines):');
    const lines = csvData.split('\n');
    lines.slice(0, 30).forEach((l, i) => console.log(`${i+1}: ${l}`));
  } catch (err) {
    console.error('Error fetching sheet CSV:', err.message);
  }

  process.exit(0);
}

fetchExcelScores();
