const axios = require('axios');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'fantasy-luzon' });
}
const db = admin.firestore();

const groupChatId = '120363412136780106@g.us';
const greenHost = 'https://7107.api.greenapi.com';
const greenId = '710722713612';
const greenToken = '4c1d55acf6d44149bbd1b515ae065b5131f83be1761a435e97';

async function generateAndBroadcastR5() {
    console.log('=== GENERATING ROUND 5 AI SUMMARY & BROADCASTING TO WHATSAPP ===\n');

    // 1. Generate AI Summary for Round 5
    const aiContent = `⚽ *טור האנליסט: פיציצי בבורח בצמרת, חמסילי ותומאלי במומנטום אדיר!* ⚽

מחזור 5 של "פנטזי לוזון 14" העניק לנו קרבות מורטי עצבים ושינויי מומנטום קריטיים:

#### ⚔️ ניתוח משחקי מחזור 5:
1. *תומאלי (48) 🆚 חראלה (41):*
ניצחון יוקרתי ומצוין לתומאלי! אלי ותום גוברים 48-41 על חראלה של גיא בקרב טקטי צמוד, ועולים למקום ה-4 עם 6 נקודות.

2. *חולוניה (42) 🆚 חמסילי (67):*
חמסילי מנפקת מחזור מטורף שני ברציפות! אסף וערן מפציצים עם 67 נקודות וגוברים על חולוניה. חמסילי מזנקת למקום ה-2 בטבלה!

3. *טמפה (37) 🆚 פיציצי (56):*
מוליכת הטבלה פיציצי ממשיכה לדהור! ניצחון 56-37 מרשים על טמפה שמבטיח לשלומי את המקום הראשון בטבלה עם 8 נקודות והפרש שערים מפלצתי של +46!`;

    // Save to social_posts
    const aiPostRef = await db.collection('social_posts').add({
        authorName: 'האנליסט AI 🤖',
        handle: '@luzon_analyst',
        teamId: 'system',
        isVerified: true,
        type: 'article',
        content: aiContent,
        likes: 19,
        likedBy: [],
        comments: [],
        timestamp: new Date().toISOString()
    });
    console.log('✅ Created AI Analyst Post for Round 5 in social_posts:', aiPostRef.id);

    // 2. Fetch updated league standings from 'users'
    const usersSnap = await db.collection('users').get();
    const teams = [];
    usersSnap.forEach(doc => {
        const d = doc.data();
        if (d.teamName && doc.id !== 'admin' && doc.id !== 'system') {
            teams.push({
                id: doc.id,
                teamName: d.teamName,
                points: Number(d.points || 0),
                gf: Number(d.gf || 0),
                ga: Number(d.ga || 0),
                diff: Number((d.gf || 0) - (d.ga || 0)),
                played: Number(d.played || 0)
            });
        }
    });

    teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.diff !== a.diff) return b.diff - a.diff;
        return b.gf - a.gf;
    });

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
    let standingsText = `📊 *טבלת הליגה המעודכנת לאחר מחזור 5:*\n`;
    teams.forEach((t, idx) => {
        const icon = medals[idx] || `${idx + 1}.`;
        standingsText += `${icon} *${t.teamName}* | ${t.points} נק' (${t.diff > 0 ? '+' : ''}${t.diff} שערים)\n`;
    });

    // 3. Round 5 Scores
    const scoresText = `⚔️ *תוצאות משחקי מחזור 5 בזירה:*\n` +
        `• *תומאלי 48* 🆚 חראלה 41 (ניצחון גדול לתומאלי!)\n` +
        `• חולוניה 42 🆚 *חמסילי 67* (התפוצצות נוספת של חמסילי!)\n` +
        `• טמפה 37 🆚 *פיציצי 56* (פיציצי שומרת על הפיסגה!)\n`;

    // 4. Round 6 matches
    const nextMatchesText = `⚔️ *משחקי מחזור 6 (המחזור הבא):*\n` +
        `• *חמסילי* 🆚 *תומאלי*\n` +
        `• *טמפה* 🆚 *חראלה*\n` +
        `• *פיציצי* 🆚 *חולוניה*\n`;

    // 5. Predictor Standings
    const predStandingsSnap = await db.doc('leagueData/predictor_standings').get();
    const predStandings = predStandingsSnap.exists ? (predStandingsSnap.data()?.standings || []) : [];
    let predictorText = '';
    if (predStandings.length > 0) {
        const top3 = predStandings.slice(0, 3).map((s, i) => `${['🥇', '🥈', '🥉'][i]} *${s.name}* (${s.points || 0} נק')`).join(' | ');
        predictorText = `🔮 *מובילי טבלת הנביאים העונתית:* ${top3}\n`;
    }

    const fullMessage = `🏁 *סיכום סגירת מחזור 5 בפנטזי לוזון 14!* 🏆\n\n` +
        `${scoresText}\n` +
        `${standingsText}\n` +
        `${nextMatchesText}\n` +
        `${predictorText}\n` +
        `🎙️ *טור האנליסט AI למחזור 5:*\n${aiContent}\n\n` +
        `📱 *לצפייה בפירוט הניקוד והרכבי המחזור הבא באפליקציה:*\nhttps://fantasy-luzon.web.app`;

    const res = await axios.post(`${greenHost}/waInstance${greenId}/sendMessage/${greenToken}`, {
        chatId: groupChatId,
        message: fullMessage
    });

    console.log('✅ Round 5 Complete Summary & AI Analyst sent to WhatsApp:', res.data);

    // 6. Send Manager of the Month Native WhatsApp Poll
    try {
        const pollUrl = `${greenHost}/waInstance${greenId}/sendPoll/${greenToken}`;
        await axios.post(pollUrl, {
            chatId: groupChatId,
            message: `🏆 *סקר מנג'ר החודש (מחזורים 1-5):* מי לדעתכם מנג'ר החודש של פנטזי לוזון? 🌟`,
            options: [
                { optionName: `🥇 פיציצי (שלומי) - מוליך הטבלה` },
                { optionName: `🥈 חמסילי (אסף) - מלך המחזור (67 נק')` },
                { optionName: `🥉 תומאלי (אלי ותום) - ניצחון יוקרתי` },
                { optionName: `⚽ חראלה (גיא)` },
                { optionName: `⚽ טמפה (יינון)` },
                { optionName: `⚽ חולוניה (ארז)` }
            ]
        });
        console.log('✅ Sent Manager of the Month Poll for Round 5!');
    } catch (pollErr) {
        console.error('Error sending Manager of the Month Poll:', pollErr.response?.data || pollErr.message);
    }

    process.exit(0);
}

generateAndBroadcastR5();
