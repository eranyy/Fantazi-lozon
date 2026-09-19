const axios = require('axios');

async function fetchSheetData() {
  console.log('=== FETCHING GOOGLE SHEET CSV FOR ROUND 2 (1Ru6w8bk7G1Mx_uPHyEuEKEeqseLqVj0NuOhMdCExiYQ) ===\n');

  // Sheet ID: 1Ru6w8bk7G1Mx_uPHyEuEKEeqseLqVj0NuOhMdCExiYQ
  // Tab gid: 1846967038 (מחזור 2)
  const spreadsheetId = '1Ru6w8bk7G1Mx_uPHyEuEKEeqseLqVj0NuOhMdCExiYQ';
  const gid = '1846967038';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

  try {
    const res = await axios.get(csvUrl);
    console.log('--- ROUND 2 CSV OUTPUT ---');
    const lines = res.data.split('\n');
    lines.forEach((line, idx) => {
      if (line.trim()) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
      }
    });
  } catch (err) {
    console.error('Error fetching sheet CSV:', err.message);
  }

  process.exit(0);
}

fetchSheetData();
