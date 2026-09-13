const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const admin = require('firebase-admin');
const path = require('path');

if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'fantasy-luzon' });
}
const db = admin.firestore();
const INVITE_CODE = process.env.WA_INVITE_CODE || process.env.VITE_WA_INVITE_CODE || '';
const BOT_PHONE_NUMBER = process.env.BOT_PHONE_NUMBER || '';

// Smart Router for Bot Responses
async function getLuzonReply(userPrompt, senderPhone) {
    const p = userPrompt.toLowerCase().trim();
    
    // Intro
    if (p.includes('תציג') || p.includes('מי אתה') || p.includes('הכרות') || p.includes('מיזה') || p.includes('מי זה')) {
        return `⚽ **שלום לכל 6 המנג'רים של פנטזי לוזון 14!** 🏆\n\nאני **לוזון Bot** – ה-AI הרשמי, הטקטיקן והפרשן של הליגה!\n\n🔔 **איך מפעילים אותי? (חוק הברזל 🚨):**\nפשוט כותבים בתחילת המשפט **"לוזון"** או **"היי לוזון"** (למשל: *"לוזון מתי המשחק של חיפה?"*).\nאם לא תכתבו *"לוזון"* בתחילת המשפט – אשאר שקט 100% ולא אציק בשיחה בקבוצה!\n\n💡 **מה אני יודע לעשות עבורכם?**\n👤 **מזהה את כולכם אישית**: ערן ואסף (*חמסילי*), יינון הטמפון (*טמפה*), אלי ותום (*תומאלי*), שלומי (*פיצ'יצי*), גיא (*חראלה*) וארז (*חולוניה*)!\n📊 **עדכוני ניקוד ואירועים בלייב**: כותבים בקבוצה *"לוזון חוגי כבש"* או *"לוזון ניקוד חמסילי 14"*.\n🧠 **ייעוץ טקטי וליגת העל**: שואלים אותי *"לוזון מתי המשחק של חיפה?"* או *"לוזון איזה הרכב לפתוח?"*.\n📜 **היכל התהילה**: מכיר את כל 13 העונות, האליפויות והגביעים של כל הזמנים!\n\n📢 **בסיום כל מחזור**: אשלח לכם פה בקבוצה **סיכום מחזור, טבלה מעודכנת ואת המשחקים של המחזור הבא!**\n\n⚠️ **הערה קטנה**: אני כרגע בגרסת פיילוט/הרצה חדשה. אם פספסתי משהו, תהיו סבלניים – ערן ואני משדרגים אותי בלייב בכל יום!\n\n**בהצלחה לכולם בדראפט! 🔥⚽**`;
    }

    // Link & App Install
    if (p.includes('לינק') || p.includes('קישור') || p.includes('אתר') || p.includes('אפליקציה') || p.includes('הורדה') || p.includes('פוש') || p.includes('התראות')) {
        return `🌐 **הלינק הרשמי לאתר פנטזי לוזון 14:**\n🔗 https://fantasy-luzon.web.app\n\n📲 **איך מתקינים את האפליקציה בנייד?**\n🍏 **אייפון (Safari):**\n1. פותחים את הלינק ב-Safari.\n2. לוחצים על כפתור השיתוף (מרובע עם חץ למעלה 📤).\n3. בוחרים **"הוסף למסך הבית"** 📲.\n\n🤖 **אנדרואיד (Chrome):**\n1. פותחים את הלינק ב-Chrome.\n2. לוחצים על 3 הנקודות 🛠️ בצד למעלה.\n3. בוחרים **"התקן אפליקציה"**.\n\n🔔 **חשיבות אישור התראות פוש:**\nקבלת התראות בלייב על שערים וניקוד בזמן אמת!\n• **באייפון:** הגדרות ⚙️ ⬅️ התראות ⬅️ Safari / פנטזי לוזון ⬅️ **אפשר!**\n• **באנדרואיד:** הגדרות ⚙️ ⬅️ אפליקציות ⬅️ Chrome / פנטזי לוזון ⬅️ **אפשר!**`;
    }

    // Dates
    if (p.includes('מתחיל') || p.includes('מתי הליגה') || p.includes('פתיחת') || p.includes('מתי מתחילה')) {
        return `⚽ **פנטזי לוזון 14:**\nאהלן! הדראפט נערך השבוע! 🏆\nמשחקי מחזור 1 בליגת העל מתחילים ב-**22/08/2026** (מכבי חיפה נגד הפועל רמת גן בשעה 20:00 בסמי עופר)! 🏟️🔥`;
    }

    // Champions
    if (p.includes('אלופה מכהנת') || p.includes('אלופה כרגע') || p.includes('מי האלופה') || p.includes('מי אלופה')) {
        return `⚽ **אלופות מכהנות:**\n👑 **בפנטזי לוזון (עונה 13):** קבוצת **תומאלי** (אלי ותום) היא האלופה המכהנת! 🏆\n⚽ **בליגת העל האמיתית:** **הפועל באר שבע** היא האלופה המכהנת! 🏆`;
    }

    // Player Nir Bitton
    if (p.includes('ניר ביטון') || p.includes('ביטון')) {
        return `⚽ **ניר ביטון (Nir Bitton):**\nבלם/קשר נבחרת ישראל, מכבי תל אביב וסלטיק לשעבר. כיום (2026) שחקן חופשי לאחר סיום חוזהו במכבי תל אביב ושיקום מפציעה בברך! ⚽`;
    }

    return `⚽ **לוזון Bot:**\nאהלן! אני כאן לשירותכם. לשאילתות על משחקים, היכל התהילה, ניקוד בלייב או לינק לאתר - פשוט תשאלו! 🏆`;
}

let activeGroupJid = null;

async function startBot() {
    console.log('🚀 Starting Luzon Bot WhatsApp Baileys Bridge...');
    const fs = require('fs');
    const authFolder = path.join(__dirname, 'auth_info');
    if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true });
    }
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();
    
    const qrcodeTerminal = require('qrcode-terminal');

    const { Browsers } = require('@whiskeysockets/baileys');

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        browser: ['Mac OS', 'Desktop', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000
    });

    sock.ev.on('creds.update', async () => {
        try {
            if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });
            await saveCreds();
        } catch (e) {}
    });

    const QRCode = require('qrcode');

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n==================================================');
            console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP CAMERA:');
            qrcodeTerminal.generate(qr, { small: true });
            console.log('==================================================\n');

            try {
                const qrImgPath = 'C:/Users/user/.gemini/antigravity/brain/46b28d56-9505-4e85-bf2b-3ac3433ba0ed/qr.png';
                await QRCode.toFile(qrImgPath, qr, { margin: 2, scale: 8 });
                console.log('🖼️ Saved QR Code PNG image to:', qrImgPath);
            } catch (qrErr) {
                console.error('Error saving QR PNG:', qrErr.message);
            }
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp Luzon Bot Bridge is ONLINE & CONNECTED!');
            
            try {
                activeGroupJid = await sock.groupAcceptInvite(INVITE_CODE);
                console.log('🎉 Successfully joined WhatsApp Group! JID:', activeGroupJid);
            } catch (err) {
                console.log('ℹ️ Group Join Note:', err.message || err);
            }

            // 🟢 Listener for live scoring/events broadcast from Firestore to WhatsApp group 🟢
            try {
                db.collection('wa_broadcasts').where('sent', '==', false).onSnapshot(async (snapshot) => {
                    if (snapshot.empty) return;
                    for (const docSnap of snapshot.docs) {
                        const data = docSnap.data();
                        if (data.message && activeGroupJid) {
                            try {
                                console.log('📢 Broadcasting live update to WhatsApp group:', data.message.substring(0, 50) + '...');
                                await sock.sendMessage(activeGroupJid, { text: data.message });
                                await docSnap.ref.update({ sent: true, sentAt: admin.firestore.FieldValue.serverTimestamp() });
                                console.log('✅ Marked broadcast document as sent:', docSnap.id);
                                await new Promise(res => setTimeout(res, 2000));
                            } catch (sendErr) {
                                console.error('❌ Error broadcasting message:', sendErr.message || sendErr);
                            }
                        }
                    }
                }, (err) => {
                    console.error('Firestore wa_broadcasts listener error:', err);
                });
            } catch (e) {
                console.error('Failed to initialize wa_broadcasts listener:', e);
            }

        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log('⚠️ Connection closed (statusCode: ' + statusCode + ').');
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                console.log('🔑 Credentials expired/logged out. Resetting auth_info directory...');
                try {
                    const fs = require('fs');
                    fs.rmSync(path.join(__dirname, 'auth_info'), { recursive: true, force: true });
                } catch (e) {}
            }
            console.log('Reconnecting in 3 seconds...');
            setTimeout(() => startBot(), 3000);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        await Promise.all(messages.map(async (msg) => {
            if (!msg.message || msg.key.fromMe) return;

            const fromJid = msg.key.remoteJid;
            const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || '';
            const senderPhone = (msg.key.participant || fromJid).split('@')[0].split(':')[0];

            if (!messageText) return;

            const isGroup = fromJid.endsWith('@g.us');
            const trimmed = messageText.trim().toLowerCase();
            const startsWithLuzon = /^(לוזון|היי לוזון|שלום לוזון|אהלן לוזון|luzon|hi luzon|!לוזון|לוזון:)/i.test(trimmed);

            // Iron Rule: If group chat, only trigger if sentence starts with Luzon
            if (isGroup && !startsWithLuzon) return;

            console.log(`📩 Processing message from ${senderPhone} in ${fromJid}: "${messageText}"`);

            const replyText = await getLuzonReply(messageText, senderPhone);

            // Send message to WhatsApp chat or group
            await sock.sendMessage(fromJid, { text: replyText }, { quoted: msg });
            console.log(`✅ Replied to ${fromJid}`);
        }));
    });
}

startBot();
