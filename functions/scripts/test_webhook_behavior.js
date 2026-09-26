const axios = require('axios');

const webhookUrl = 'https://script.google.com/macros/s/AKfycbxl5IFlmuqfk_CZ4fMBuPDLMQ7GHTp8dwPxNmTJYqSzDho2_qFz-K0lnjB1Vy-6GlTl/exec';

async function testWebhookOptions() {
    console.log('--- TESTING WEBHOOK OPTIONS ---');

    try {
        const res = await axios.post(webhookUrl, JSON.stringify({
            sheetName: 'טסט_בדיקה',
            headers: ['שם', 'ערך'],
            rows: [['בדיקה 1', 100]],
            clear: true,
            action: 'replace',
            mode: 'overwrite'
        }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, maxRedirects: 10, timeout: 30000 });

        console.log('Response:', res.status, res.data);
    } catch (e) {
        console.error('Error:', e.message);
    }

    process.exit(0);
}

testWebhookOptions().catch(e => {
    console.error(e);
    process.exit(1);
});
