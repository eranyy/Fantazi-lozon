const axios = require('axios');

const apiKey = process.env.GOOGLE_API_KEY || 'AIzaSyARwamUBjcirbqFtWn_RpKkOdiHmeGlis0';

async function testGemini() {
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
    for (const model of models) {
        try {
            console.log(`Testing model: ${model}...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await axios.post(url, {
                contents: [{
                    parts: [{
                        text: 'שלום! תגיד היי בעברית'
                    }]
                }]
            });
            console.log(`SUCCESS [${model}]:`, res.data?.candidates?.[0]?.content?.parts?.[0]?.text);
            return;
        } catch (e) {
            console.error(`ERROR [${model}]:`, e.response?.data?.error?.message || e.message);
        }
    }
}

testGemini();
