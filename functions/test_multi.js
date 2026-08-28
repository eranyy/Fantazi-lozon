const axios = require('axios');
const cheerio = require('cheerio');

async function testONE() {
    try {
        const res = await axios.get('https://www.one.co.il/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(res.data);
        console.log('ONE Title:', $('title').text().trim());
    } catch (err) {
        console.error('ONE Error:', err.message);
    }
}

async function test365() {
    try {
        const res = await axios.get('https://www.365scores.com/he', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(res.data);
        console.log('365Scores Title:', $('title').text().trim());
    } catch (err) {
        console.error('365Scores Error:', err.message);
    }
}

(async () => {
    await testONE();
    await test365();
})();
