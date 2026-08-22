const fs = require('fs');

async function getLuzonReply(userPrompt, senderPhone) {
    return new Promise(resolve => setTimeout(() => resolve('Reply'), 50));
}

const sock = {
    sendMessage: async (fromJid, text, quoted) => {
        return new Promise(resolve => setTimeout(resolve, 50));
    }
};

async function processSequentially(messages) {
    for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const fromJid = msg.key.remoteJid;
        const messageText = msg.message.conversation || '';
        const senderPhone = (msg.key.participant || fromJid).split('@')[0].split(':')[0];

        if (!messageText) continue;

        const replyText = await getLuzonReply(messageText, senderPhone);
        await sock.sendMessage(fromJid, { text: replyText }, { quoted: msg });
    }
}

async function processConcurrently(messages) {
    const promises = messages.map(async (msg) => {
        if (!msg.message || msg.key.fromMe) return;

        const fromJid = msg.key.remoteJid;
        const messageText = msg.message.conversation || '';
        const senderPhone = (msg.key.participant || fromJid).split('@')[0].split(':')[0];

        if (!messageText) return;

        const replyText = await getLuzonReply(messageText, senderPhone);
        await sock.sendMessage(fromJid, { text: replyText }, { quoted: msg });
    });

    await Promise.all(promises);
}

async function runBenchmark() {
    const messages = Array(20).fill().map((_, i) => ({
        message: { conversation: 'לוזון test' },
        key: { remoteJid: 'test@g.us', fromMe: false, participant: '123456@s.whatsapp.net' }
    }));

    const startSeq = Date.now();
    await processSequentially(messages);
    const endSeq = Date.now();

    const startCon = Date.now();
    await processConcurrently(messages);
    const endCon = Date.now();

    console.log(`Sequential: ${endSeq - startSeq}ms`);
    console.log(`Concurrent: ${endCon - startCon}ms`);
}

runBenchmark();
