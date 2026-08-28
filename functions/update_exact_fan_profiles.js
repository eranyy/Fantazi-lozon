const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

// 🏟️ Exact Authoritative Real-Life Fan Profiles provided by Eran 🏟️
const AUTHORITATIVE_FAN_PROFILES = {
    'hamsili': {
        teamName: 'חמסילי',
        managers: 'ערן & אסף',
        realFanOf: 'ערן - מכבי חיפה | אסף - מכבי נתניה',
        teamsList: ['מכבי חיפה', 'מכבי נתניה', 'חיפה', 'נתניה'],
        banter: 'ערן ירוק בנשמה (מכבי חיפה) ואסף צהוב-שחור מנתניה!'
    },
    'harale': {
        teamName: 'חראלה',
        managers: 'גיא',
        realFanOf: 'ניטרלי (נטייה להפועל תל אביב)',
        teamsList: ['הפועל תל אביב', 'הפועל ת"א', 'הפועל'],
        banter: 'גיא ניטרלי עם חיבה לאדומים מתל אביב'
    },
    'holonia': {
        teamName: 'חולוניה',
        managers: 'ארז',
        realFanOf: 'הפועל חולון (סגול בנשמה)',
        teamsList: ['הפועל חולון', 'חולון'],
        banter: 'ארז אוהד הפועל חולון בכדורסל וניטרלי בכדורגל!'
    },
    'pichichi': {
        teamName: 'פיציצי',
        managers: 'שלומי',
        realFanOf: 'מכבי תל אביב',
        teamsList: ['מכבי תל אביב', 'מכבי ת"א', 'מכבי תא', 'מכבי'],
        banter: 'שלומי צהוב בנשמה מתל אביב!'
    },
    'tampa': {
        teamName: 'טמפה',
        managers: 'יינון',
        realFanOf: 'הפועל תל אביב',
        teamsList: ['הפועל תל אביב', 'הפועל ת"א', 'הפועל תא', 'הפועל'],
        banter: 'יינון אדום בנשמה ממתחם חודורוב!'
    },
    'tumali': {
        teamName: 'תומאלי',
        managers: 'אלי & תום',
        realFanOf: 'מכבי תל אביב',
        teamsList: ['מכבי תל אביב', 'מכבי ת"א', 'מכבי תא', 'מכבי'],
        banter: 'אלי ותום צהובים בנשמה מתל אביב!'
    }
};

async function updateExactFanProfiles() {
    await db.doc('bot_league_memory/fan_profiles').set(AUTHORITATIVE_FAN_PROFILES, { merge: true });
    console.log('✅ AUTHORITATIVE fan profiles updated 100% in Firestore bot_league_memory/fan_profiles!');
    process.exit(0);
}

updateExactFanProfiles();
