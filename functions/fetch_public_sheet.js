const axios = require('axios');

async function testUrls() {
  const id = '1Ru6w8bk7G1Mx_uPHyEuEKEeqseLqVj0NuOhMdCExiYQ';
  const urls = [
    `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=1846967038`,
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=1846967038`,
    `https://docs.google.com/spreadsheets/d/${id}/pub?output=csv&gid=1846967038`,
    `https://docs.google.com/spreadsheets/d/${id}/htmlview?gid=1846967038`
  ];

  for (const u of urls) {
    try {
      console.log(`Trying ${u} ...`);
      const res = await axios.get(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      console.log(`  SUCCESS! Length: ${res.data.length}, Preview: ${res.data.substring(0, 200)}`);
      process.exit(0);
    } catch (e) {
      console.log(`  Failed: ${e.message}`);
    }
  }
  process.exit(0);
}

testUrls();
