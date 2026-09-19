import re

with open('functions/src/index.ts', 'r') as f:
    content = f.read()

# Replace the first `import * as admin from 'firebase-admin';` with the new import
# Actually, wait, it's better to add the import at the top of the file, let's say after the cheerio import.

import_str = "import { isSamePlayer, updatePlayerInList } from './utils/playerUtils';\n"
if "import { isSamePlayer, updatePlayerInList }" not in content:
    content = content.replace("import * as cheerio from 'cheerio';\n", "import * as cheerio from 'cheerio';\n" + import_str)

# Now we need to remove the inline definitions and replace isSameP with isSamePlayer
# Also replace updatePlayerInList with the new imported one

old_block = """
        const cleanStr = (s: string) => String(s || '').toLowerCase().replace(/['"״׳`\-\s()]/g, '');
        const normalizeHebrew = (s: string) => cleanStr(s).replace(/א+/g, 'א').replace(/ו+/g, 'ו').replace(/י+/g, 'י');

        const isSameP = (a: any, b: any) => {
            if (!a || !b) return false;
            if (a.id && b.id && a.id === b.id) return true;
            const cA = cleanStr(a.name);
            const cB = cleanStr(b.name);
            if (!cA || !cB) return false;
            const nA = normalizeHebrew(a.name);
            const nB = normalizeHebrew(b.name);
            return cA === cB || cA.includes(cB) || cB.includes(cA) || nA === nB || nA.includes(nB) || nB.includes(nA);
        };

        const updatePlayerInList = (list: any[]) => safeArray(list).map((p: any) =>
            isSameP(p, player) ? { ...p, points: finalPoints, stats: cleanStats } : p
        );

        let updatedLineup = updatePlayerInList(freshTeam.published_lineup);
        let updatedSubsOut = updatePlayerInList(freshTeam.published_subs_out);
        let updatedSquad = updatePlayerInList(freshTeam.squad);

        const foundInLineup = updatedLineup.some((p: any) => isSameP(p, player));
        const foundInSubsOut = updatedSubsOut.some((p: any) => isSameP(p, player));"""

new_block = """
        let updatedLineup = updatePlayerInList(freshTeam.published_lineup, player, finalPoints, cleanStats);
        let updatedSubsOut = updatePlayerInList(freshTeam.published_subs_out, player, finalPoints, cleanStats);
        let updatedSquad = updatePlayerInList(freshTeam.squad, player, finalPoints, cleanStats);

        const foundInLineup = updatedLineup.some((p: any) => isSamePlayer(p, player));
        const foundInSubsOut = updatedSubsOut.some((p: any) => isSamePlayer(p, player));"""

content = content.replace(old_block, new_block)

old_block_2 = """
        let updatedRLineup = updatePlayerInList(currentRData.lineup || freshTeam.published_lineup || []);
        let updatedRSubsOut = updatePlayerInList(currentRData.subsOut || freshTeam.published_subs_out || []);

        const rFoundInLineup = updatedRLineup.some((p: any) => isSameP(p, player));
        const rFoundInSubsOut = updatedRSubsOut.some((p: any) => isSameP(p, player));"""

new_block_2 = """
        let updatedRLineup = updatePlayerInList(currentRData.lineup || freshTeam.published_lineup || [], player, finalPoints, cleanStats);
        let updatedRSubsOut = updatePlayerInList(currentRData.subsOut || freshTeam.published_subs_out || [], player, finalPoints, cleanStats);

        const rFoundInLineup = updatedRLineup.some((p: any) => isSamePlayer(p, player));
        const rFoundInSubsOut = updatedRSubsOut.some((p: any) => isSamePlayer(p, player));"""

content = content.replace(old_block_2, new_block_2)

with open('functions/src/index.ts', 'w') as f:
    f.write(content)
