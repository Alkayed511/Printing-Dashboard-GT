# Golden Target workspace improvements

The local workspace now has a consistent dark and gold interface, grouped navigation, a daily overview, printer workload, useful empty states, and mobile navigation. Existing production, design intake, CRM, ledger, reports, departments, and voice tools remain available.

## Daily use

- Press **Ctrl+K** (or **Cmd+K**) to search current-date files, customer names on those files, printers, and workspace pages. Search respects the selected department.
- The header shows server connection status, the last successful file refresh, and the work folder date. Failed refreshes retain the last loaded data and offer a retry.
- Navigation preserves the selected page in `?tab=…`. Display mode continues to open the production board.
- Sign out from the account area in the sidebar. Expired sessions return to the login screen.

## Preferences

Settings are grouped into general/storage, notifications, appearance/language, and display screens. Advanced network details are collapsed. Saves wait for server confirmation; failed saves retain the draft. Leaving a changed settings page asks before discarding it, and browser navigation warns about unsaved changes.

Local display links are described accurately: external access still requires hosting, network configuration, and HTTPS. Display screens require authentication. Uploaded alert sounds are size checked and applied only when settings are saved. Department/printer edits likewise wait for server confirmation; optional voice tools are collapsible.

Unavailable print storage now shows registered orders only. Seeded example files no longer appear as real production or inflate the dashboard. No real print files are moved, edited, or removed by this change.

## Reliability and validation

- Workspace sections load on demand. The main production bundle decreased from approximately 991 KB to 278 KB before compression.
- The service worker bypasses API requests, prefers fresh HTML for online navigation, and limits cache cleanup to this application's caches.
- Tests explicitly close their temporary SQLite connections before cleanup, supporting Windows without removing `.data`.
- Run `npm.cmd run lint`, `npm.cmd run test:management`, and `npm.cmd run build` on Windows.
- Chrome checks covered actual authentication, all workspace sections, keyboard search, a 390 px viewport, English/LTR, server failure/recovery, unsaved-change handling, and sign-out. Settings write requests were intercepted during browser checks; production settings and print files were not changed by those tests.
- To repeat the browser checks, launch an isolated Chrome session with remote debugging on port 9291, then run `node scripts/verify-workspace.cjs` from the project root while the app runs on port 3000. The script reads the local admin credential without logging it and stores screenshots in the system temporary directory.

The existing `.env` remains local and ignored by Git. No credentials are included in this document or the source changes.
