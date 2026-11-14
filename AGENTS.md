# Golden Target — Codex and gstack working agreement

This repository is an operational print-shop application, not a disposable demo. Apply the following rules when using Codex, gstack, Claude Code, or other coding agents.

## Core product workflow
- Customers send artwork via WhatsApp Business Platform (when formally configured) or operators create requests manually.
- Compare customer phone numbers in normalized international format; never silently merge ambiguous name matches.
- Employees manually place files in date/printer folders, then move them into each printer's `done` folder when complete.
- The app records the observed file name, printer, date and optionally dimensions/quantity; it must never claim actual hardware print counts without printer telemetry.
- Prices, paid amounts and customer balances are optional. Do not double count ledger balances as invoices.
- Preserve customer records, job links, earlier artwork names and print history.

## Safe development and gstack use
- Prefer gstack-review, gstack-investigate, gstack-qa, gstack-verify, gstack-plan-eng-review, gstack-cso, and gstack-design-review when available.
- Use `gstack-office-hours` for scope discussions and `gstack-plan-eng-review` for architectural changes before implementation.
- Use `gstack-investigate` for unexplained bugs. Make a reproducible failing test before fixing.
- Run `npm run lint`, `npm run test:management`, and `npm run build` for significant code changes.
- Use a **separate test folder** and SQLite test databases for browser QA. Never operate on real print shares as test fixtures.
- Do not modify/delete/move genuine artwork or any production `done` folder. Do not reset `.data`, or touch real customer / financial records without specific approval.
- Never open or print `.env` contents, passwords, API keys, WhatsApp tokens, session cookies, or real client messages into logs, PRs, reviews, or third-party services.
- Never publish the admin app directly to the Internet. A four-digit PIN is for a trusted LAN only.
- Do not enable third-party telemetry, install browser extensions, import browser cookies, expose ports/tunnels or deploy infrastructure without explicit user authorization.
- Never run gstack's team-mode `required` hook automatically. Do not merge, deploy, run `gstack-ship` or `gstack-land-and-deploy` without explicit user authorization.
- Keep the original app's real file-path setup intact. Work on isolated feature branches and present diffs for review.
- gstack for Codex is **experimental** per upstream docs; use advisory results, review changes and validate locally.

## Local Windows onboarding
See `docs/GSTACK_CODEX_WINDOWS_AR.md`. The installation of gstack itself is per-user on the operator's Windows PC; repository documents do not install it.
