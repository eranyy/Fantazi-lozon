const axios = require('axios');

async function testFetchSheet() {
  console.log('=== TESTING REAL FIXTURES GOOGLE SHEET FETCH ===\n');

  const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=0`;

  try {
    const res = await axios.get(csvUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    console.log('✅ Successfully fetched Real Fixtures CSV!');
    const lines = res.data.split('\n');
    console.log(`Total lines: ${lines.length}`);
    lines.slice(0, 25).forEach((l, i) => console.log(`Line ${i+1}: ${l.trim()}`));
  } catch (err) {
    console.error('❌ Error fetching CSV:', err.message);
  }

  process.exit(0);
}

testFetchSheet();
