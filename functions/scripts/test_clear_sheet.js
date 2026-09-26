const axios = require('axios');

const webhookUrl = 'https://script.google.com/macros/s/AKfycbxl5IFlmuqfk_CZ4fMBuPDLMQ7GHTp8dwPxNmTJYqSzDho2_qFz-K0lnjB1Vy-6GlTl/exec';

async function testClearSheet() {
    console.log('--- TESTING CLEAR SHEET IN WEBHOOK ---');

    try {
        const res = await axios.post(webhookUrl, JSON.stringify({
            sheetName: '🏆 טבלת הליגה',
            action: 'clear',
            clear: true,
            headers: ['מיקום', 'קבוצת פנטזי', 'משחקים', 'נצחונות', 'תיקו', 'הפסדים', 'שערי זכות (ניקוד שנצבר)', 'שערי חובה (ניקוד שיריב צבר)', 'הפרש שערים', 'נקודות ליגה'],
            rows: [
                ['🥇 1', 'פיצ\'יצי (שלומי)', 5, 4, 0, 1, 258, 212, '+46', 8],
                ['🥈 2', 'חמסילי (ערן ואסף)', 5, 2, 0, 3, 245, 221, '+24', 6],
                ['🥉 3', 'חראלה (גיא)', 5, 3, 0, 2, 219, 200, '+19', 6],
                ['4', 'תומאלי (אלי ותום)', 5, 3, 0, 2, 236, 227, '+9', 6],
                ['5', 'טמפה (יינון)', 5, 2, 0, 3, 216, 259, '-43', 4],
                ['6', 'חולוניה (ארז)', 5, 1, 0, 4, 197, 252, '-55', 2]
            ]
        }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });

        console.log('Response:', res.status, res.data);
    } catch (e) {
        console.error('Error:', e.message);
    }

    process.exit(0);
}

testClearSheet();
