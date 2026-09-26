const axios = require('axios');

const webhookUrl = 'https://script.google.com/macros/s/AKfycbxl5IFlmuqfk_CZ4fMBuPDLMQ7GHTp8dwPxNmTJYqSzDho2_qFz-K0lnjB1Vy-6GlTl/exec';
const spreadsheetId = '14kSevz6bRm_4xX1jGxGztB0ZDVm8po01tXujvZBgf-s';

async function verifyLineCount(stepName) {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
    const res = await axios.get(url);
    const html = res.data;

    const match = /name: "🏆 טבלת הליגה"[^]*?gid: "([0-9]+)"/.exec(html);
    if (!match) {
        console.log(`[${stepName}] Could not find GID for 🏆 טבלת הליגה!`);
        return null;
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${match[1]}`;
    const csvRes = await axios.get(csvUrl);
    const lines = csvRes.data.split('\n').filter(l => l.trim());
    console.log(`[${stepName}] Total non-empty lines in 🏆 טבלת הליגה: ${lines.length}`);
    return lines.length;
}

async function testAppsScriptDeduplication() {
    console.log('=== TESTING GOOGLE APPS SCRIPT DEDUPLICATION (CLEAR CONTENTS) ===\n');

    // Check initial count
    const initialCount = await verifyLineCount('Initial Check');

    // Post sample standings
    console.log('\nSending test post #1 to 🏆 טבלת הליגה...');
    await axios.post(webhookUrl, JSON.stringify({
        sheetName: '🏆 טבלת הליגה',
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

    const post1Count = await verifyLineCount('After Post #1');

    console.log('\nSending test post #2 to 🏆 טבלת הליגה...');
    await axios.post(webhookUrl, JSON.stringify({
        sheetName: '🏆 טבלת הליגה',
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

    const post2Count = await verifyLineCount('After Post #2');

    console.log('\n=== RESULT SUMMARY ===');
    if (post2Count === 7) {
        console.log('✅ SUCCESS! Google Apps Script clears the sheet before writing. Line count is strictly 7!');
    } else {
        console.log(`⚠️ WARNING: Line count is ${post2Count} (expected 7). Apps Script deployment needs update.`);
    }

    process.exit(0);
}

testAppsScriptDeduplication().catch(e => {
    console.error(e);
    process.exit(1);
});
