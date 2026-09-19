# Project Mandatory Guidelines & Rules: Fantazi Luzon

## 1. 🛡️ Pre-Task Full Data Backup Mandate (חובה מוחלטת לפני כל משימה)
Before approaching, executing, or testing any task, database script, schema change, migration, or refactoring that affects Firestore data or session state:
1. **Mandatory Backup Execution:** You MUST verify or create a full, up-to-date backup snapshot of the entire Firestore database (`users`, `squads`, `lineups`, `lineupsByRound`, `transfers`, `fixtures`, `settings`, `arena`).
2. **Backup Script Tool:** Execute `node functions/scripts/create_full_league_backup.js` or ensure `round_backups/backup_auto_latest` exists and is current before proceeding with any data-altering operation.
3. **Report to User:** Always confirm to the user in the initial response that a fresh backup has been verified/created before making changes.

## 2. 👤 Strict User Credentials & Squad Protection Rule
1. **No Mock Credential Overwrites:** NEVER overwrite existing Firestore user documents with dummy/mock credentials or empty squads (e.g. `manager: 'ערן'` for Guy's team `harale`, or empty `squad: []`).
2. **Preserve User Roles:** Ensure `role` fields (e.g. `ARENA_MANAGER`, `MODERATOR`) and user emails (`guya32@gmail.com`) are strictly preserved and never mutated by fallback scripts.

## 3. 🧪 Testing & Verification Guarantee
1. **100% Pass Required:** Every task change must pass `npm --prefix functions run build`, `npx tsc --noEmit`, and `npx vitest run` with 100% success before committing or pushing to `origin main`.
