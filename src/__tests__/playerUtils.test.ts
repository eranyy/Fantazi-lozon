import { describe, it, expect } from 'vitest';
import { buildDraftedPlayersIndex } from '../utils/playerUtils';

describe('playerUtils - buildDraftedPlayersIndex', () => {
  it('builds exact map and lookup function correctly', () => {
    const users = [
      {
        id: 'u1',
        teamName: 'חמסילי FC',
        manager: 'ערן',
        published_lineup: [
          { name: 'דור פרץ' },
          { name: 'ערן זהבי' }
        ]
      },
      {
        id: 'u2',
        teamName: 'טמפה',
        manager: 'יינון',
        squad: [
          { name: 'עומר אצילי' }
        ]
      }
    ];

    const { exactMap, lookup } = buildDraftedPlayersIndex(users);

    expect(exactMap.size).toBe(3);

    const infoDor = lookup('דורפרץ');
    expect(infoDor).toBeDefined();
    expect(infoDor?.team).toBe('חמסילי FC');
    expect(infoDor?.manager).toBe('ערן');

    // Partial substring match
    const infoAtsili = lookup('אצילי');
    expect(infoAtsili).toBeDefined();
    expect(infoAtsili?.team).toBe('טמפה');

    // Non-existent player
    const infoUnknown = lookup('שחקןלאקיים');
    expect(infoUnknown).toBeUndefined();
  });

  it('handles empty users array safely', () => {
    const { exactMap, lookup } = buildDraftedPlayersIndex([]);
    expect(exactMap.size).toBe(0);
    expect(lookup('test')).toBeUndefined();
  });
});
