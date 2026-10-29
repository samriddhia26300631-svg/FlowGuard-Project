# Architecture inspection and minimal migration

## Existing implementation

React 19 + TypeScript + Vite + Tailwind. `src/App.tsx` switches nine in-memory pages. `src/context/FlowGuardContext.tsx` holds all collections, mutators, and calculations. `src/data/initialData.ts` supplies demo records. `src/types/index.ts` defines the application types. There was no backend server, database client, or database schema in the uploaded ZIP. Express and dotenv were dependencies but no active server implementation was found.

| Persisted model | Existing fields / relationships |
|---|---|
| Client | string ID, contact, industry, tier, health, spending, joined date |
| Project | clientId/clientName, named owner, deadlines, status/stage, progress, budget/hours, scope, onboarding/handover checklists, review approval, stage history |
| Task | projectId/projectName, named assignee, status/progress, hours/due date/priority; blocker reason/party/owner/since; optional dependsOnTaskId |
| ChangeRequest | project reference, requester, scope description, hour/budget/timeline impacts, approval, optional convertedToTaskId |
| TeamMember | named identity/role, weekly capacity and workload fields, activeProjects |
| Commitment | project/client references, promise text, deadline, owner/responsibleMember, confidence/SLA/status |
| Dependency | project reference, free-text blockingTask and blockedTask titles, owner, impact, notes/status |
| ActionItem | persisted legacy alerts with category, urgency, owner, optional project target, resolved flag |
| HandoverGate | project reference, five boolean gates, target date, readiness/status |

SmartActionItem, workload summaries, project progress, prerequisite waiting, readiness, and stage validation are derived in the context. They remain calculated; no additional table is needed. Blockers are part of tasks. Dependencies include both legacy/free-text records and task-to-task prerequisite links. Owners/assignees are existing display names, not auth user foreign keys; this is preserved.

## Minimal proposed schema (implemented)

`public.flowguard_workspaces(owner_id uuid PK -> auth.users, revision integer, data jsonb, updated_at timestamptz)`.

`data` holds the nine collections under the original camelCase property names. Authenticated users can select, insert, and update only their own row. No public/anon table privilege and no delete privilege are granted. Anonymous Auth users still use the authenticated database role, with individual user IDs. All policies require owner_id = auth.uid().

A snapshot matches the app's existing state architecture and lets a blocker operation save its task and dependency changes together. It avoids rewriting every mutator, converting string IDs, or dropping nested checklists immediately before a demonstration. The tradeoff is whole-workspace reads/writes and no database-level entity foreign keys or cross-user collaboration.

`src/data/cloudRepository.ts` handles Supabase Auth/read/insert/versioned update and propagates errors. `src/data/workspace.ts` defines the snapshot, validates required field types and IDs, and exports backups. `src/context/useCloudPersistence.ts` manages opt-in connection, pre-load backup, serial saves, retry/pause, and pending-save navigation warning. The original context retains business logic and localStorage fallback. The top bar exposes connection status and backup controls without replacing any views or dialogs.

## Migration sequence

1. Preserve the uploaded source separately; retain original browser keys before initialization.
2. Load existing v4 → v3 → v2 → v1 records; keep the existing project/checklist/task defaults, but do not inject a new demo project into saved work.
3. Configure Supabase and apply the migration SQL. Enable anonymous sign-in.
4. Explicitly connect. Back up local state. Read the owner's row. Only insert local state when no cloud row exists. A duplicate insert race fails safely rather than upserting over another tab.
5. For subsequent edits retain local storage, debounce 600 ms, and update cloud with owner_id plus expected revision. Pause on failure/conflict. Never automatically overwrite a newer cloud revision.
6. Perform the live verification checklist in README before presenting.

## Later relational migration

When collaboration/reporting warrants it, add workspaces and memberships, then clients, projects, tasks, change_requests, team_members, commitments, dependencies, action_items and handovers with workspace-scoped IDs. Retain existing string IDs in composite keys `(workspace_id, id)` and backfill snapshots in a transaction. Task blockers remain task fields; dependsOnTaskId becomes a same-workspace prerequisite foreign key. Keep legacy free-text dependency fields until explicit links can be mapped; never infer identity from a title alone. Convert name-based owners only through an explicit mapping. Recalculate derived action recommendations rather than copying them.

Validate collection counts/IDs and relationships against the snapshot, compare core workflows, switch the repository behind the existing context API, and keep the snapshot read-only for rollback. Do not drop the JSONB column or browser backup keys until verification is complete. This future schema is not implemented in this hackathon build.

## Narrow fixes made during integration

- Dependencies page now calls a context mutator instead of `dependencies.unshift`, ensuring rendering and persistence both run.
- Resolving a blocker scopes legacy title matching to the same project, avoiding cross-project resolutions.
- Reset no longer calls localStorage.clear, which would remove auth and unrelated data.
- Saved projects no longer receive an extra sample p-7 automatically.
- v3 fallback keys are recognized consistently across collections.
- Existing esbuild range conflicted with Vite 8. The range was updated to 0.28 and a package lock added; no forced/legacy dependency resolution was used.

## Verification scope

Automated checks: TypeScript, production bundling, 26 tests across workflow state and remount persistence; all nine views render; local-to-cloud initialization and cloud-to-local hydration; failed connection/save; retry and serial queued saves; owner/revision query filters, conflict rejection, validation and secret-key rejection with a mocked Supabase client.

These are component/data-layer tests, not full browser click-through tests. PostgreSQL SQL execution, live Auth, actual RLS enforcement, cross-profile isolation, and hosted behavior require the user's project and remain pending. See README.


## Corrected release

The seven findings in the earlier readiness review are repaired. Project Details now includes Onboarding and Stage Gates & Handover tabs, using the original context operations. Final completion goes through lifecycle validation, including both the existing five delivery verification flags and the five supporting handover records. These sets stay distinct: billing approval is not substituted for client acceptance. The Handover page and Project Details edit the same delivery verification records. A missing legacy handover record can be initialized from the lifecycle panel. Reopening a completed project returns it to Execution (or Review when selected), retaining history and data.

Generated task dependency records now include optional `source: task_blocker` and `blockedTaskId`. A shared reconciler updates names/statuses by ID, retains resolved history on completion/deletion, and preserves manual/free-text records. Old records with the app's `Responsible:` marker are linked only if their project/title identifies exactly one task. Ambiguous/unmarked legacy records remain manual; no historic record is deleted. Missing records for currently blocked tasks are generated. These additions live inside JSONB and need no SQL migration. Normalization occurs for local and loaded cloud state; it can produce a regular cloud save after connection.

The Rebalance Tasks action navigates to Team Workload. Lifecycle actions open the relevant project tab. Due-soon counts use an inclusive today-through-day-seven date range, excluding completed and overdue tasks. Internal and external prerequisite blockers follow their responsible party rather than always being attributed to clients. Reset requires confirmation.

All 26 checks pass, including the seven formerly failing assertions, UI-driven stage progression, dependency ID/rename/deletion/history/manual-data handling, seven-day boundaries, legacy linking, handover verification and date-based overdue commitments. They remain automated component/state/repository checks; live RLS isolation and a final rehearsal against the user's Supabase project remain separate checks.
