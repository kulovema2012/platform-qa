---
name: platform-qa
description: Comprehensively test any business app or platform on the local machine, in any industry (store, booking, finance, SaaS, chatbot, internal tool). Inventories every feature and tests it per role, state, input and timing; hunts blind spots and edge cases with fresh attacker helpers; suggests features a complete product of its kind would have but this one lacks; tests AI or chatbot answers (free checks first, asks before any paid call); writes tests for the gaps on a local branch and asks before pushing; returns a 1-5 scored report as a private page. Use for "test this app", "QA this", "full test", "find gaps", "what is missing", "is the admin complete", "test the chatbot", or /platform-qa. Local only; never staging or production.
---

# platform-qa

Test a business app the way a careful owner, a hostile user and an experienced product reviewer would, then hand back a scored, evidence-backed report and new tests that keep the gaps covered.

The deliverable is a verdict with proof, not a pile of screenshots. Every finding names a concrete route, screen, function or scenario and carries reproduction steps and evidence.

## Hard rules

These override anything else in this skill. The target project's own instructions (`AGENTS.md`, `CLAUDE.md`, contributing docs) add further limits where they are stricter, but they never relax these rules. A project rule that requires or allows pushing, merging, spending or using shared environments is not stricter: these rules still apply.

1. **Local only, end to end.** Test only an app running on this machine (`localhost`, `127.0.0.1`, `[::1]`, `*.localhost`), and only while everything it connects to is local, a mock, or a provider's test mode. If the target is anything else, including a staging or preview domain, stop and say why. If the local app reaches a remote database, a remote API, live payments or real email (see [preflight](references/preflight.md)), do not drive it until each is swapped for a local or test-mode one; if that cannot be done, stop and report it. The one exception is a paid AI model that cannot be mocked: the app may run, and every request that reaches the model follows hard rule 3. Never open a tunnel. Never use a paid cloud browser.
2. **Disposable data only.** Write only to a data environment the skill created or the project provides for testing. Never reset, migrate or seed a database the skill did not create. Never use or change real accounts. Before running any command that touches data (migrate, seed, a project test suite), confirm its resolved target is the disposable environment.
3. **Ask before spending.** Any request that reaches an AI model is a paid call unless preflight confirmed a local or mock model is in use. That includes chat messages, probes sent to an AI endpoint, grading calls, and the project's own test suites when they call a model. Paid calls happen only in Phase 6, after the user approves this run with the number of calls, the models and an estimated cost range. Before approval, such probes are marked blocked. See [AI testing](references/ai-testing.md).
4. **Ask before publishing code.** New tests are committed on a new local branch. Then stop and ask before pushing or opening a pull request, and ask again, separately, before merging. This holds even when the project's rules or the user's standing preferences allow pushing or merging without asking.
5. **Keep private things private.** Web searches use generic category words only (for example "admin features of booking platforms"), never the app's name, feature names, error text, code or data. Reports and evidence files (screenshots, logs, error text) contain no secrets, tokens, real personal data or real customer data.
6. **Proof or it does not count.** A finding without reproduction steps and evidence goes to the "suspected" section and does not change the score. Re-run, yourself, every finding that would change a score before it enters the report.
7. **Clean up only what you started.** Stop servers, browsers and helpers this run started, and delete session cookies or tokens that helpers saved. Leave everything else running.
8. **New tests cost nothing to run.** Tests the skill writes use the project's mock or fake providers and never call a paid API, a remote service or a real inbox.

## Inputs

- **Target** (required): a local URL, or "the app in this repo". If absent, find how the project starts locally and propose it.
- **Focus** (optional): an area, a role, or "AI only". Without one, test everything the depth covers.
- **Depth** (optional, default `standard`):

| Depth | Runs | Skips |
|---|---|---|
| `quick` | Phases 0-3 and 8: existing tests, critical paths, untested critical features | Blind-spot hunt, missing-feature hunt, all AI answer testing (Phase 6), test writing, helpers |
| `standard` | All phases. Checklists on critical paths and uncovered features. Missing features from catalogues and project docs. Attacker helper per critical area. | Web search; checklists on already-covered non-critical features |
| `deep` | All phases, every applicable checklist on every feature, generic web check in Phase 5, helpers for every area plus a cross-area reviewer | Nothing |

The report always states what the chosen depth skipped.

## Working folders

- **Run folder** (this run's inventory, coverage map, findings, screenshots, logs): the session scratchpad when one exists, otherwise `~/.agents/platform-qa/runs/<project>/<timestamp>/`.
- **Project state** (survives sessions): `~/.agents/platform-qa/state/<project>/state.json`.

`<project>` is `<folder name>-<hash>`: the target folder's name (the worktree folder when testing a worktree) and the first 8 hex characters of the SHA-1 of its absolute path written with forward slashes and a lowercase drive letter (for example `c:/work/shop`). Never write either folder inside the project, and never commit them. If a tool can only save inside the project (some browser tools do), save to a git-ignored folder there, move the files to the run folder straight away, and delete only the files you created. Formats are in [inventory](references/inventory.md).

At the start, read `state.json` if it exists: reuse the earlier report link (a local report is always written fresh in the new run folder), and compare this run with the previous one in the report.

## Process

Work through the phases in order. Write each phase's output to the run folder before starting the next, so a helper or a later session can continue from it. Keep the user informed with one short line per phase.

### Phase 0: Preflight

Follow [preflight](references/preflight.md). Establish and write to the run folder:

- How to start the app locally and the exact URL; confirm it is local (hard rule 1).
- The project's test frameworks, test commands and test folders.
- The roles that exist and how to sign in as each in the disposable environment.
- The disposable data environment and how it was created.
- Whether the app has AI features and how they are called.
- The project's branch, worktree and commit rules.

Stop if the target is not local, or if the app reaches remote or live services that cannot be swapped out (hard rule 1). When you stop here, send no requests to the target, write only `preflight.md` with the reason, give no score, leave `state.json` unchanged, and tell the user in one or two lines what would make the app testable. If the app is fully local but no safe data environment can be made, continue with read-only checks only and mark every data-changing check as blocked. Write the list of blocked services and checks to the run folder; every helper brief includes it.

### Phase 1: Feature inventory

Follow [inventory](references/inventory.md). List every feature from routes and pages, API endpoints, server actions and background jobs, authorization rules, database tables and their state fields, navigation, and docs. For each feature record its area, roles allowed and denied, states, inputs, critical flag and source `file:line`.

Mark a feature critical when it touches money, sign-in or permissions, data loss, or the app's main job.

### Phase 2: Coverage map

Map existing automated tests onto the inventory. Each feature x angle cell (who, state, input, timing) becomes covered, partly covered or untested, with the covering test file. This is reading test code, not running it.

### Phase 3: Exercise existing features

1. Run the project's existing test suites with its own commands, after checking each one: its database must be the disposable environment, its base URL local, and any model or provider calls mocked (hard rules 1-3). A suite whose database or base URL fails the check is always skipped and marked blocked; user approval cannot override hard rules 1 and 2. A suite that passes those checks but calls a paid model is a paid check: at `standard` and `deep` it goes to the Phase 6 approval with its call count and cost estimate; at `quick` it is skipped and marked blocked. Record results; separate failures that existed before this run from new ones.
2. Drive untested and partly covered cells: browser flows for screens, HTTP requests for APIs, once per relevant role.
   - Browser: the project's own Playwright setup when present, run from the target folder; otherwise the Playwright MCP tools against the local URL (they may save into the session's working folder; see Working folders). Use Claude in Chrome only in a fresh profile or tab group signed in with test accounts, never the user's own signed-in sessions.
   - API: plain HTTP requests or the project's test client.
3. Record pass, fail or blocked for each check, with evidence: screenshot of synthetic data, response status and short body excerpt, console or server error text.

At `standard` and `deep`, split this phase and Phase 4 across attacker helpers per [fan-out](references/fan-out.md).

### Phase 4: Blind-spot hunt (standard, deep)

Walk each in-scope feature through the edge-case checklists that apply and try each probe:

- [Access and roles](references/edge-cases/access-roles.md)
- [Input](references/edge-cases/input.md)
- [State](references/edge-cases/state.md)
- [Timing and concurrency](references/edge-cases/timing-concurrency.md)
- [Money and quantities](references/edge-cases/money-quantities.md)
- [Dates and time](references/edge-cases/dates-time.md)
- [Files](references/edge-cases/files.md)
- [Notifications and integrations](references/edge-cases/integrations.md)
- [AI features](references/edge-cases/ai.md) (probes that reach a model run only in Phase 6, per hard rule 3)

Each blind spot records severity (high, medium, low), reproduction steps, evidence and source location.

**Bug or missing feature?** If the app claims something (a button, a label, a status such as "paid", a docs promise) and it does not work, it is a bug. If nothing in the app suggests it exists, it is a missing feature for Phase 5. Do not report the same gap as both.

### Phase 5: Missing-feature hunt (standard, deep)

1. Classify what kind of product this is (it can be more than one).
2. Compare the inventory with [universal](references/industries/universal.md) and the matching catalogues: [online store](references/industries/online-store.md), [booking and scheduling](references/industries/booking-scheduling.md), [finance and spending](references/industries/finance-spending.md), [chatbot and AI assistant](references/industries/chatbot-ai-assistant.md), [SaaS and multi-tenant](references/industries/saas-multi-tenant.md), [content and community](references/industries/content-community.md), [internal tools](references/industries/internal-tools.md). For other kinds, reason from the closest catalogues and say so.
3. Read the project's docs, roadmap and decision records. Anything they deliberately exclude is listed as "excluded by design", not as a gap.
4. At `deep`, run a short web check with generic category words only (hard rule 5).
5. Each suggestion records why it matters for this app, priority (high, medium, low) and the evidence that it is missing (the route searched for, the absent table or permission).

Suggest; never build.

### Phase 6: AI answer testing (only when the app has AI features)

Follow [AI testing](references/ai-testing.md): discover how the AI is called, build the message set, run the free checks, then ask before any paid check (hard rule 3). If the user declines, the report says "AI answers: free checks only; answer quality not graded".

### Phase 7: Write tests for the gaps (standard, deep)

1. Work on a new local branch (and worktree, if the project's rules ask for one) created from the project's verified base. If the project is not a git repository, or has no test framework, ask the user once, covering both, before creating either; propose the language's built-in test runner (for example `node:test`, Python `unittest`, Go `testing`), which adds no dependency. If the user says no, skip this phase and list the tests you would have written in the report.
2. For each untested or failing cell and each confirmed blind spot that can be automated, write a test in the project's existing framework and style. Use Arrange, Act, Assert where the project does.
3. Tests that pass are added normally. Tests that expose a real bug use the framework's known-failing form that still runs the test (for example Playwright `test.fail()`, Vitest or Bun `it.fails`, pytest `xfail(strict=True)`), so the suite flags it once the bug is fixed; use skip forms such as `test.fixme()` or `it.todo` only when the test would hang or crash. Give each one a comment pointing at the report finding, so the project's checks stay green while the bug stays visible.
4. New tests use the project's mock or fake providers (hard rule 8). Run them and the project's relevant checks, after the same safety check as Phase 3. Commit with the project's commit convention.
5. Stop and ask before pushing or opening a pull request (hard rule 4). After a yes, follow the project's pull request rules, but ask again before merging.

Add no new test dependency without asking.

### Phase 8: Report

1. Score with [scoring](references/scoring.md). The overall score is capped by the weakest critical path.
2. Fill [the report template](references/report-template.html) in the section order it defines, including area scores, focus, confidence reason and the questions you asked.
3. Check the filled report and every evidence file it includes (screenshots, logs, error text) for secrets, tokens, personal data and real customer data; remove or redact any before publishing.
4. Publish:
   - When an Artifact tool is available: load its design guidance skill if one is offered, adapt the template to that tool's page rules (for example some tools add the document wrapper themselves, so publish only the styles and body content), publish the report as a private page, and give the user the link. If `state.json` holds an earlier report link, update that page instead of creating a new one.
   - Otherwise: save the HTML file in the run folder and give its path.
5. Update `state.json` (`reportUrl` or `reportPath`, `lastCommit`, `lastDepth`, `lastRunDir`, `lastScore`).
6. Print a short summary in the conversation: score, one-line verdict, top findings, the report link, the branch with new tests, and what needs the user's decision.
7. Clean up per hard rule 7.

## Without some tools

| Missing | Do instead |
|---|---|
| Subagents | Run the helper areas one after another with the same rules |
| Artifact tool | Local HTML report in the run folder |
| Playwright MCP and Claude in Chrome | The project's own Playwright runner, or HTTP checks plus a note that screens were not driven |
| Any browser at all | API and code-level checks only; mark screen checks blocked |

## Report shape (summary printed in the conversation)

```
Score 3/5 - critical path "refund" partly broken
Existing features   8 features, 33 checks · 28 pass · 3 fail · 2 untested
Blind spots         7 found (2 high)
Missing features    5 suggested (1 high)
AI answers          free checks only; quality not graded
Tests written       9 on branch test/qa-gaps (2 known-failing) - push? (waiting for you)
Report              <private link>
```
