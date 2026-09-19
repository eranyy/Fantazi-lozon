export interface DraftedPlayerInfo {
  team: string;
  manager: string;
}

export function buildDraftedPlayersIndex(users: any[]) {
  const exactMap = new Map<string, DraftedPlayerInfo>();
  const entryList: Array<{ key: string; info: DraftedPlayerInfo }> = [];

  (users || []).forEach(u => {
    const squad = u.published_lineup || u.lineup || u.squad || [];
    if (Array.isArray(squad)) {
      squad.forEach((pl: any) => {
        const normName = String(pl.name || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');
        if (normName) {
          const info = {
            team: u.teamName || u.name || 'קבוצת פנטזי',
            manager: u.manager || u.assistantName || ''
          };
          exactMap.set(normName, info);
          if (normName.length >= 3) {
            entryList.push({ key: normName, info });
          }
        }
      });
    }
  });

  const lookup = (normName: string): DraftedPlayerInfo | undefined => {
    if (!normName) return undefined;
    const exact = exactMap.get(normName);
    if (exact) return exact;

    for (let i = 0; i < entryList.length; i++) {
      const entry = entryList[i];
      if (normName.length >= 3 && (normName.includes(entry.key) || entry.key.includes(normName))) {
        return entry.info;
      }
    }
    return undefined;
  };

  return { exactMap, lookup };
}
