export const ALLOWED_FORMATIONS = ['5-3-2', '5-4-1', '4-5-1', '4-4-2', '4-3-3', '3-5-2', '3-4-3'];

export interface SeasonHistory {
  season: number;
  champ: string;
  runnerUp: string;
  cup: string;
  relegated: string;
}

export const DEFAULT_SEASONS: SeasonHistory[] = [
  { season: 13, champ: 'תומאלי', runnerUp: 'חראלה', cup: 'חמסילי', relegated: '' },
  { season: 12, champ: 'חמסילי', runnerUp: 'חראלה', cup: "פיצ'יצ'י", relegated: 'טמפה' },
  { season: 11, champ: 'חראלה', runnerUp: "פיצ'יצ'י", cup: 'טמפה', relegated: 'טמפה' },
  { season: 10, champ: 'חמסילי', runnerUp: 'חולוניה', cup: 'חראלה', relegated: 'תומאלי' },
  { season: 9, champ: 'טמפה', runnerUp: 'תומאלי', cup: 'חמסילי', relegated: 'חמסילי' },
  { season: 8, champ: 'חמסילי', runnerUp: 'תומאלי', cup: 'חמסילי', relegated: 'טמפה' },
  { season: 7, champ: "פיצ'יצ'י", runnerUp: 'חמסילי', cup: 'חראלה', relegated: 'תומאלי' },
  { season: 6, champ: 'חמסילי', runnerUp: 'חראלה', cup: 'חמסילי', relegated: 'חולוניה' },
  { season: 5, champ: 'תומאלי', runnerUp: 'טמפה', cup: 'חולוניה', relegated: 'וסילי' },
  { season: 4, champ: "פיצ'יצ'י", runnerUp: 'וסילי', cup: 'תומאלי', relegated: 'תומאלי' },
  { season: 3, champ: 'חמסה', runnerUp: 'חולוניה', cup: 'חמסה', relegated: 'טמפה' },
  { season: 2, champ: 'טמפה', runnerUp: 'תומאלי', cup: 'חראלה', relegated: 'חודורוב' },
  { season: 1, champ: 'טמפה', runnerUp: 'חולוניה', cup: 'תומאלי', relegated: 'תומאלי' },
];
