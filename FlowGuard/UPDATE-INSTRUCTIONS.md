# Install the corrected FlowGuard

Your existing Supabase project, table, login identity and saved workspace can be reused. This release does not require another SQL script.

1. In your current FlowGuard app, wait for Saved to PostgreSQL. Click Export backup and keep the downloaded JSON.
2. In VS Code's terminal, stop the old app with Ctrl+C. Keep the old project folder as your backup.
3. Extract FlowGuard-Fixed.zip into a NEW folder. Open its inner FlowGuard folder in VS Code.
4. Copy your existing `.env.local` file into that inner FlowGuard folder, beside package.json. The ZIP intentionally contains no connection credentials.
5. Open a terminal in that folder. Run `npm ci`, wait for it to finish, then run `npm run dev`.
6. Open Chrome at the SAME address you used before (normally http://localhost:3000). Keep the same Chrome profile; do not clear browsing data. Check the terminal: if Vite chooses a different port, stop the other old server and start again on port 3000.
7. Click Connect cloud / migrate local data. Your saved Supabase workspace should load. Do NOT click reset or rerun 001_workspace.sql.

## What changed

- Onboarding and Stage Gates & Handover tabs are available in Project Details.
- Completion explains missing requirements instead of bypassing lifecycle checks.
- Task edit, unblock, completion and deletion keep generated Dependencies consistent, using task IDs.
- Rebalance Tasks opens Team Workload.
- Due-soon counts and prerequisite responsibility categories are corrected.
- Handover delivery flags can be edited from either page; the supporting handover records have their own clearly labelled checklist.
- The reset button asks for confirmation.

Existing fields and IDs are retained. Newly linked task dependency records use optional JSON fields. The cloud JSON can be normalized and saved after connecting. Unmarked manual or ambiguous old dependency records are preserved; if such a historic record is now obsolete, resolve it explicitly in Dependencies. The app cannot safely infer its identity from a task title alone.

## Quick rehearsal before the jury

1. Create a client and project. Check its saved record in Supabase.
2. Open the project, add two tasks, and make the second depend on the first.
3. Flag the first task blocked; check Dependencies and Action Center. Edit its blocker, then resolve it. Repeat using the completion checkbox; no generated active blocker should remain.
4. Open Onboarding. Complete missing requirements and use Advance to Planning. A task plan is required before Execution.
5. Complete tasks before advancing to Review. In Stage Gates & Handover, record review approval before Delivery.
6. Confirm the delivery verification AND handover records. Resolve pending scope approvals and overdue/at-risk commitments. Only then complete the project. These are prototype manager attestations, not an independent client-approval login workflow.
7. Wait for Saved to PostgreSQL. Refresh, reconnect, and check the values return. Inspect Supabase too so you demonstrate actual cloud storage.
8. Rehearse using the same browser/profile and keep the terminal running.

## Verification completed

TypeScript check, production build, and 26 automated tests pass. The tests include UI interactions and all seven earlier failing cases, plus preservation of manual dependencies and lifecycle records. No live Supabase data was modified during development. Your earlier demonstration confirmed cloud writes; live cross-user RLS isolation, hosted deployment and a final manual rehearsal remain to be checked in your own project.

## Recovery

If the replacement does not start, stop it and run the old project again. The database schema has not changed. Keep the exported JSON and avoid Reset. A cloud revision conflict is handled by exporting pending local changes, refreshing, then reconnecting; Retry must not overwrite another tab's newer data.
