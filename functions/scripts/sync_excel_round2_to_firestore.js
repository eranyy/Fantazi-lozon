const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();
const axios = require('axios');

async function syncRound2FromExcel() {
  console.log('=== FETCHING ROUND 2 FROM GOOGLE SHEET (1Ru6w8bk7G1Mx_uPHyEuEKEeqseLqVj0NuOhMdCExiYQ) ===\n');

  const spreadsheetId = '1Ru6w8bk7G1Mx_uPHyEuEKEeqseLqVj0NuOhMdCExiYQ';
  const gid = '1846967038'; // מחזור 2
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

  try {
    const res = await axios.get(csvUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    console.log('✅ Successfully fetched Round 2 CSV data!');
    
    const lines = res.data.split('\n');
    console.log(`Total lines in CSV: ${lines.length}`);
    lines.forEach((l, i) => console.log(`Line ${i+1}: ${l.trim()}`));

  } catch (err) {
    console.error('❌ Error fetching CSV:', err.message);
  }

  process.exit(0);
}

syncRound2FromExcel();
