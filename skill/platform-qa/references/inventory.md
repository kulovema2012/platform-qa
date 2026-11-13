# Phase 1-2: Feature inventory and coverage map

## Sources

Merge features from every source that exists; one source alone misses things.

| Source | What it reveals |
|---|---|
| Routes and pages (file-based routing folders, router config) | Screens and who can reach them |
| API endpoints, server actions, RPC handlers | Operations, including ones with no screen |
| Background jobs, cron, queues, webhooks | Work that happens without a user |
| Authorization rules, middleware, policies | Who is meant to be allowed or denied |
| Database schema and migrations | Entities, state fields (`status`, `deleted_at`), limits |
| Navigation menus, admin panels | What users are told exists |
| Docs, README, decision records, issue templates | Intended features, including unbuilt ones |

## Feature record

One record per feature, written as JSON lines to `inventory.jsonl` in the run folder:

```json
{
  "id": "refund-create",
  "area": "payments",
  "name": "Create refund",
  "critical": true,
  "rolesAllowed": ["admin", "owner"],
  "rolesDenied": ["member", "guest"],
  "states": ["no payments", "paid", "partly refunded", "fully refunded"],
  "inputs": ["amount", "reason"],
  "surfaces": ["ui:/admin/payments/:id", "api:POST /api/refunds"],
  "source": "app/api/refunds/route.ts:14"
}
```

Mark `critical` when the feature touches money, sign-in or permissions, data loss or deletion, or the app's main job.

## Coverage map

For each feature, one row per angle. Write it to `coverage.md` in the run folder.

| Feature | Who | State | Input | Timing |
|---|---|---|---|---|
| refund-create | partly: admin only (`tests/refunds.spec.ts`) | untested | covered (`tests/refunds.test.ts`) | untested |

Values: `covered` (test file), `partly: <what>` (test file), `untested`. Base this on reading test code, not names: a test called "refunds" that only checks the page loads covers nothing about refunds.

## Run folder layout

```
<run folder>/
  preflight.md
  inventory.jsonl
  coverage.md
  findings.jsonl        one finding per line (see below)
  suspected.jsonl       findings without proof
  missing-features.jsonl
  ai/                   message set, free-check results, approved paid results
  evidence/             screenshots and logs, named <finding-id>-<n>.png|txt
  report.html
```

Finding ids are `F-<area letter>-<number>` (for example `F-M-01` for money, `F-R-03` for roles), using the letter of the feature's area whether or not a helper found it, so parallel helpers never collide. Suspected findings use `S-`, missing features `MF-`.

`severity` is exactly one of `high`, `medium`, `low`. `reproduced` is the number of times the finding was reproduced (0 means suspected).

Finding record:

```json
{
  "id": "F-M-07",
  "feature": "refund-create",
  "kind": "blind-spot",
  "severity": "high",
  "title": "Refund larger than the payment is accepted",
  "steps": ["Sign in as admin", "Open payment P-1 (paid 100.00)", "Refund 150.00", "Submit"],
  "expected": "Rejected: refund exceeds remaining amount",
  "actual": "Refund saved; balance shows -50.00",
  "evidence": ["evidence/F-M-07-1.png", "evidence/F-M-07-2.txt"],
  "source": "app/api/refunds/route.ts:31",
  "reproduced": 2,
  "helper": "qa-money"
}
```

## Project state

`~/.agents/platform-qa/state/<project>/state.json`:

```json
{
  "reportUrl": "https://... (private page; omit when there is none)",
  "reportPath": "<run folder>/report.html (when no page was published)",
  "lastCommit": "a1b2c3d",
  "lastDepth": "standard",
  "lastRunDir": "<path to last run folder>",
  "lastScore": 3
}
```

Write it only after the report is published or saved. It holds no secrets and no app data.
