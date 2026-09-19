export const MOCK_TEAMS: any[] = [
  {
    id: 'harale',
    teamName: 'חראלה',
    manager: 'גיא',
    email: 'guya32@gmail.com',
    role: 'ARENA_MANAGER',
    points: 6,
    squad: [],
    lineup: []
  }
];

export const POS_COLORS: Record<string, { bg: string, text: string }> = {
  'GK': { bg: '#fbbf24', text: '#000' },
  'DEF': { bg: '#3b82f6', text: '#fff' },
  'MID': { bg: '#10b981', text: '#fff' },
  'FWD': { bg: '#ef4444', text: '#fff' }
};

export const RAZ_ZEHAVI_PROMPT = "You are Raz Zehavi, a famous Israeli sports commentator known for his dramatic, exaggerated, and often funny style.";
