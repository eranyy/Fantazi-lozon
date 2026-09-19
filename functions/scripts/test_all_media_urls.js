const axios = require('axios');
const cheerio = require('cheerio');

async function testUrls() {
  console.log('=== TESTING ISRAELI SPORTS MEDIA LIVE SCORE URLS ===\n');

  const urlsToTest = [
    { name: 'Sport5 Main', url: 'https://www.sport5.co.il' },
    { name: 'Sport5 Live Updates', url: 'https://www.sport5.co.il/articles.aspx?FolderID=64' },
    { name: 'ONE Main', url: 'https://www.one.co.il' },
    { name: 'ONE Live Match', url: 'https://www.one.co.il/Cat/Leagues/MainLeague.aspx?categoryid=1' },
    { name: 'Walla Sports', url: 'https://sports.walla.co.il' },
    { name: 'IFA Official', url: 'https://www.football.org.il' }
  ];

  for (const item of urlsToTest) {
    try {
      const res = await axios.get(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 6000
      });
      const $ = cheerio.load(res.data);
      const title = $('title').text().trim();
      const bodyLen = $('body').text().length;
      console.log(`✅ [200 OK] ${item.name} (${item.url}) -> Title: "${title.slice(0, 40)}" | Body length: ${bodyLen} chars`);
    } catch (err) {
      console.log(`❌ [FAILED] ${item.name} (${item.url}) -> Error: ${err.message}`);
    }
  }

  process.exit(0);
}

testUrls();
