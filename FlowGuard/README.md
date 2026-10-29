# FlowGuard — corrected hackathon build

**Existing users: read `UPDATE-INSTRUCTIONS.md` first. Keep your existing `.env.local`; do not rerun SQL or reset your workspace.**

All nine views and existing workflow logic are retained. Cloud storage is optional; the browser demo works without any credentials.

## Run locally

Requires Node.js 22.12+ (tested with Node 24.21) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. To check the release:

```sh
npm run lint
npm test
npm run build
npm run preview
```

`lint` runs TypeScript checking. `test` covers state/workflow behavior, all nine view renders, and mocked cloud calls; it does not connect to a live database.

## Connect your Supabase project (remaining user setup)

1. Create a Supabase project. Open its SQL Editor and run `supabase/migrations/001_workspace.sql` once. Alternatively apply that file using your usual Supabase migration workflow. It creates the table, grants and RLS policies together. Do not disable RLS.
2. In Authentication settings, enable **anonymous sign-ins**. This authenticates each visitor with a private user ID. The app uses that ID as the owner; it never grants public access to the workspace.
3. Copy `.env.example` to `.env.local`. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from your project's connection/API settings. A legacy public `anon` key also works. Never use a service-role key, `sb_secret_` key, database password, or personal token. Vite environment variables are visible in the browser bundle. `.env.local` is ignored by Git.
4. Restart the development server (or rebuild for hosting). Leaving both variables unset keeps the local demo available. Invalid settings produce a visible connection error when connecting.
5. Export a backup using the new top bar. Click **Connect cloud / migrate local data**. If this user has no cloud row, the current browser workspace (including sample data when no local records exist) is uploaded atomically. Otherwise its saved cloud workspace is loaded. The browser workspace is backed up before either operation.
6. Wait for **saved to PostgreSQL**. Open Table Editor → `flowguard_workspaces`. You should see a row with `owner_id`, `revision`, and `data` containing all nine collections.

Official references: [Anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Verify the real backend before presenting

These checks require your configured project and have NOT been run against live Supabase here:

1. Connect, create a client, create its project, and add two tasks. Set the second task's prerequisite to the first.
2. Block the first task with a reason and responsible party. Check Dependencies and Action Center. Resolve its blocker through Action Center, complete it, and check the second task is no longer waiting.
3. After every change wait for **Saved to PostgreSQL**. In Table Editor confirm the JSON changes and revision increases. Refresh, click Connect again, and confirm the same data loads. Refresh alone demonstrates browser persistence, so inspect the database too.
4. Test all supporting views: scope approvals and task conversion, team capacity, commitments, onboarding/stage gates, and handover checklists.
5. In a second tab, connect before editing in the first. Save in the first, then edit the second. The second should report a conflict instead of overwriting the first. Export the second tab's work, reload, and reconnect to the latest cloud workspace.
6. In a separate browser profile, connect to create user B. User B must see a separate workspace. With B's authenticated client/session, querying A's `owner_id` must return no rows; inserting/updating a row owned by A must fail or affect zero rows. This checks RLS rather than just frontend filters. An unauthenticated request must have no table access.
7. Disconnect the network, make an edit, and wait for the save error. Local data must remain. Restore connectivity and use **Retry save**. A revision conflict needs reload/reconciliation, rather than repeated retries.

## Safe migration and recovery

The existing `flowguard_v1_store_*` through `flowguard_v4_store_*` keys are recognized. Existing IDs, nested data, and task prerequisites are preserved. A missing estimated-hours value is initialized by the existing loader. The old behavior that injected sample project p-7 into saved data was removed.

- The first launch retains raw legacy keys in `flowguard_pre_cloud_backup` before local migrations.
- Every connection retains the current normalized workspace in `flowguard_backup_<timestamp>` before loading cloud data.
- Local v4 storage continues saving after edits. A cloud error pauses cloud writes, reports the error, and keeps local operation available. Retry is explicit. Browser storage failure is also reported; use Export backup before closing.
- **Export backup** downloads the complete current workspace as JSON. **Restore backup** imports that JSON in local mode after retaining the current workspace as another browser backup. Reload into local mode before restoring if connected. Connecting afterward loads an existing cloud row; it does not silently overwrite that row with an imported file.
- Backups in localStorage remain tied to the current browser and origin. Keep a downloaded backup before reconnecting if you have unsynced edits. If a conflict occurs, export first, load cloud, and manually reconcile the differences.
- Automatic migration only works on the same origin (protocol/host/port) as the original demo. Moving from an AI Studio preview to localhost cannot read the preview's localStorage. Run the updated app at the original origin to export a backup, or transfer that origin's FlowGuard storage keys before launching the updated app.
- Reset demo data now resets only FlowGuard state; it preserves auth sessions, legacy keys, backups, and unrelated site storage. In cloud mode the reset is saved like any other edit, so export first if retaining the current data matters.

## Demo access model and limits

Anonymous Supabase Auth is a private, browser-bound demo identity. It is not shared team login. Clearing browser storage, signing out externally, changing origins, or using another device loses access to that anonymous account; a downloaded workspace backup can be restored under a new demo identity. Do not clear browser storage before presenting. Permanent account upgrade and shared workspaces are future work.

Each user owns one JSONB workspace row. Saving is atomic across collections. Updates include an expected revision; another tab's changes are rejected instead of silently overwritten. Saves are debounced and serialized; edits made while saving are drained afterward. There is no realtime subscription or automatic multi-user collaboration. Runtime validation checks collection IDs and required field types, while PostgreSQL checks collection containers; this is not a fully normalized relational schema with per-entity foreign keys.

The anonymous signup flow has no CAPTCHA integration in this build. Use a private hackathon demo project; public release needs abuse protection, permanent auth, workspace membership, and a separate production review.

## Delivered / pending

Completed: all seven review failures repaired (onboarding/lifecycle controls, completion enforcement, blocker/dependency synchronization, workload navigation, due-soon counts and ownership classification); data-layer integration, private-owner RLS migration, public environment configuration, explicit migration and backup recovery, visible save/error status, local fallback, serialized/versioned writes, dependency persistence fix, TypeScript and production build checks, 26 automated tests, and a dependency lockfile.

Pending: creating/configuring your Supabase project, applying SQL, supplying public environment values, and the live database/RLS/manual browser checks above. No database was provisioned and no claim is made that real cloud storage was exercised without credentials.

See `ARCHITECTURE.md` for the model inventory, schema decision and future migration path.
