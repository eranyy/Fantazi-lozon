const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'fantasy-luzon' });
const db = admin.firestore();

// 🏟️ Real-life Fan Clubs for each Fantasy Luzon Manager 🏟️
const DEFAULT_FAN_PROFILES = {
    'hamsili': { teamName: 'חמסילי', managers: 'אסף & ערן', realFanOf: 'מכבי חיפה', banter: 'משחד את השופטים עם ירוק' },
    'harale': { teamName: 'חראלה', managers: 'גיא', realFanOf: 'בית"ר ירושלים', banter: 'מאמין שבית"ר לקחה אליפות בכל עונה' },
    'holonia': { teamName: 'חולוניה', managers: 'ארז', realFanOf: 'הפועל תל אביב', banter: 'מתגעגע לימים של האדומים בליגה הבכירה' },
    'pichichi': { teamName: 'פיציצי', managers: 'שלומי', realFanOf: 'מכבי תל אביב', banter: 'בטוח שהצהובים תמיד צודקים' },
    'tampa': { teamName: 'טמפה', managers: 'יינון', realFanOf: 'הפועל באר שבע', banter: 'מחכה לצלחת בטרנר' },
    'tumali': { teamName: 'תומאלי', managers: 'אלי & תום', realFanOf: 'מכבי תל אביב', banter: 'צהוב בנשמה' }
};

async function seedFanProfiles() {
    await db.doc('bot_league_memory/fan_profiles').set(DEFAULT_FAN_PROFILES, { merge: true });
    console.log('✅ Fan profiles initialized in Firestore bot_league_memory/fan_profiles!');
    process.exit(0);
}

seedFanProfiles();
