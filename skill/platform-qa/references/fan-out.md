# Attacker helpers

A fresh helper that did not build the inventory is not anchored on its assumptions, which is where blind spots hide. Use helpers for Phases 3-5 at `standard` and `deep`.

## How many

| Depth | Helpers |
|---|---|
| `quick` | None |
| `standard` | One attacker per critical area (money, sign-in and roles, data loss, AI, plus any other area marked critical), and one missing-feature helper for Phase 5 |
| `deep` | One attacker per area, the missing-feature helper, and a final cross-area reviewer |

Typical `standard` runs use 4-8 helpers. With a focus, use one attacker per critical area inside the focus, plus the missing-feature helper. Say the number before starting. Without a subagent tool, run the same areas one after another with the same briefs.

## Keeping helpers apart

Data prefixes only work when the app lets each helper create its own users and records. When it does not (fixed seed accounts, no free-text fields, shared in-memory state), give each helper its own app instance on its own port with its own fresh data, or run the helpers one after another, resetting the disposable data between them. Note which method you used in the brief.

Limits shared by every helper on one instance, such as sign-in rate limits per IP address, make helpers fail each other. Sign in once per role and hand helpers the session, or give each helper its own instance, or raise the limit in your own instance's local test configuration only. Note the change in the report.

Probes that may crash or hang the server (malformed requests, huge payloads, resource exhaustion) are queued, not run by helpers. The main agent runs them last, on its own instance, and restarts that instance afterwards.

## Helper brief

Give each helper exactly this, and nothing about other helpers' conclusions:

```
You are an attacker testing one area of a local app. Find what breaks, prove it, report it.

Area: <name>   Data prefix: qa-<area>-   Finding ids: F-<area letter>-NN
Isolation: <own instance on port N | shared instance, prefix only | run alone>
Shared-state notes: <anything other helpers may change that you could see>
Target: <local URL>   Sign-in: <how to sign in as each role, test accounts only>
Features (inventory slice): <records from inventory.jsonl for this area>
Coverage for these features: <rows from coverage.md>
Checklists to apply: <paths of the edge-case files that fit>
Evidence: save to <run folder>/evidence/<finding-id>-<n>.png|txt

Blocked services and checks (from preflight): <list>

Hard rules:
- Only this local URL. Never any other host. No tunnels. No web search or any other outside service.
- Create and change only records and users whose names start with your data prefix.
- Do not run probes that need exclusive shared state (two users editing the same record,
  global settings, rate limits, feature flags, scheduled jobs) or that may crash or hang
  the server. List them under "queued".
- Do not send anything that reaches an AI model unless the brief says a mock or local model
  is in use. Otherwise list those probes under "queued" for Phase 6.
- Do not start, stop or restart servers or databases. Do not run the project's test suites.
- No pushes, commits or file edits in the project.
- Use only the test accounts given here; never a browser profile with real sign-ins.
- No secrets, tokens or real personal data in your report or evidence files.

Save any helper files (scripts, saved sessions) only under <run folder>/tmp/<area>/.
Report as JSON lines, one per finding, using the finding record format
(severity exactly high | medium | low; reproduced = number of times reproduced), plus:
- "queued": probes you skipped for the main agent to run one at a time
- "suspected": problems you saw but could not reproduce, with what you tried
- "untestable": checks you could not run and why
```

The missing-feature helper gets the inventory, the project's docs paths, the matching industry catalogues, the depth, and the same hard rules except that at `deep` (only) it may run web searches using generic category words, never the app's name, feature names, error text, code or data. It does not drive the app. It reports suggestions in the missing-feature format.

## After the helpers return

1. Run the queued exclusive-state probes yourself, one at a time. Queued AI probes go to Phase 6 and its approval step.
2. Re-run, yourself, every finding that would change a score. Keep it only if it reproduces; otherwise move it to suspected.
3. Merge duplicates (same feature, same root cause) and keep the clearest evidence.
4. At `deep`, give the cross-area reviewer all findings plus the inventory and ask: what falls between areas? For example a member-created record that an admin export breaks on, or a refund that skips the audit log. Its findings follow the same proof rule.
5. Record the number of helpers that ran for the report's cost section.
