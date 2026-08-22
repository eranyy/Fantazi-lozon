const axios = require('axios');
const cheerio = require('cheerio');

async function testSport5() {
    try {
        const res = await axios.get('https://www.sport5.co.il/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(res.data);
        console.log('Sport5 Title:', $('title').text().trim());
    } catch (err) {
        console.error('Sport5 Error:', err.message);
    }
}

async function testIFA() {
    try {
        const res = await axios.get('https://www.football.org.il/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(res.data);
        console.log('IFA Title:', $('title').text().trim());
    } catch (err) {
        console.error('IFA Error:', err.message);
    }
}

(async () => {
    await testSport5();
    await testIFA();
})();
