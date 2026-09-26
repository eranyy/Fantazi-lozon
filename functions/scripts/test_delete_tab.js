const axios = require('axios');

const webhookUrl = 'https://script.google.com/macros/s/AKfycbxl5IFlmuqfk_CZ4fMBuPDLMQ7GHTp8dwPxNmTJYqSzDho2_qFz-K0lnjB1Vy-6GlTl/exec';

async function testDeleteTabs() {
    console.log('--- TESTING DELETE TABS VIA WEBHOOK ---');

    const tabsToDelete = ['ארכיון ניקוד מחזורים', 'טסט_בדיקה', 'טבלה', 'מלאכים'];

    for (const tabName of tabsToDelete) {
        try {
            console.log(`Attempting delete of tab "${tabName}"...`);
            const res = await axios.post(webhookUrl, JSON.stringify({
                action: 'deleteSheet',
                deleteSheet: tabName,
                sheetName: tabName,
                command: 'DELETE'
            }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });

            console.log(`Response for ${tabName}:`, res.status, res.data);
        } catch (e) {
            console.error(`Error deleting ${tabName}:`, e.message);
        }
    }

    process.exit(0);
}

testDeleteTabs();
