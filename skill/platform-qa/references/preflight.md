# Phase 0: Preflight

Goal: know exactly what you are testing, how to run it safely, and how to sign in as every role, before touching anything. Write the answers to `preflight.md` in the run folder.

## 1. Read the project's own rules first

Read, in this order, whatever exists: `AGENTS.md`, `CLAUDE.md`, `.claude/rules/`, `CONTRIBUTING.md`, `README.md`, docs on local development and testing. Note:

- package manager and runtime versions (use these; never substitute another)
- required branch, worktree and commit rules
- review gates (for example owner review before push)
- named environments (local, staging, production) and which commands target which
- rules about databases, seeding and test data

Where the project is stricter than this skill, the project wins.

## 2. Find how to run the app locally

Look at `package.json` scripts (or `Makefile`, `pyproject.toml`, `docker-compose.yml`, `Procfile`, framework config), CI workflows and the README. Record:

- the start command and the URL it serves
- environment files it needs and whether example files exist (`.env.example`, `.dev.vars.example`)
- whether something is already running on that port, and who started it

If an instance is already running and you did not start it, do not stop it. Use it only if you can confirm it serves this checkout and uses disposable data; otherwise start your own instance on a free port.

## 3. Confirm the target is local

Allowed hosts: `localhost`, `127.0.0.1`, `[::1]`, any `*.localhost`. Anything else, stop:

> The target `<url>` is not on this machine. platform-qa only tests local apps so it never changes live data. Start the app locally and run me again.

Also check what the local app connects to: env files, framework and platform config (for example bindings marked `remote`, database URLs, API base URLs), and provider keys. Inspect the values to tell local from remote, without printing them. If anything points at a remote database, a staging or production API, a live payment provider, a real email or SMS sender, or a paid AI model:

- swap it for a local, mock or test-mode alternative the project supports, in your own instance's environment only; or
- if it cannot be swapped, do not drive the app at all. Reading a remote database through the app can expose real customer data even without writing. Stop and report what is connected and what would make it testable.

A paid AI model that cannot be mocked is the exception: the app may run, but AI requests follow hard rule 3 (blocked until approved in Phase 6). Record every connection and its status (local, mocked, test mode, blocked) in the preflight record.

## 4. Set up a disposable data environment

Choose the first option that works and record which one you used:

1. **Project-provided test environment**: a test database, an isolated local preview command, fixtures, or a seed command the project documents for testing.
2. **Skill-created environment**: create a new local database (a new SQLite or libSQL file, a new local Postgres database or container, a new local emulator state directory) in the run folder, point only your app instance at it, and run the project's own migrate and seed commands against it.

Before running any migrate, seed, preview or test command, resolve where it will actually write: which database URL, file or state directory, and whether any flag or config makes it remote (for example `--remote`, a remote binding, or an env value inherited from the shell or an env file). Run it only when the resolved target is the disposable environment.
3. **Read-only**: if neither is possible, test without writing. Mark every data-changing check as blocked and say why in the report.

Never:

- reset, migrate or seed a database you did not create in this run
- reuse another session's database or preview stack
- point your instance at the user's existing local dev data
- use staging or production as a shortcut

Before and after the run, record the modified time of any existing local data file you can see, so the report can show it was not touched.

## 5. Roles and sign-in

1. List every role from the authorization code, database enums, seed files and docs (for example guest, member, staff, admin, owner, super admin, tenant admin).
2. For each role, find a safe way in: seeded test users, fixture accounts, a documented test sign-in, or a development-only auth bypass the project already ships.
3. If a role has no way in, create a synthetic user for it inside your disposable environment, through the project's seed scripts or the app's own local sign-up and invite flows. Use obviously fake names and emails at reserved domains (`example.com`, `example.org`).
4. If a role still cannot be reached, mark it **untestable**, propose the seed that would fix it, and continue. Untestable roles lower the report's confidence, not its score, except on critical paths (see [scoring](scoring.md)).

Never invent credentials for real accounts and never sign in as a real person.

## 6. AI features

Search for calls to model providers and AI SDKs, prompt files, `system` prompts, chat or completion endpoints, embeddings and agent frameworks. Record:

- which features use AI and what each is supposed to do
- how it is called (endpoint, server function, queue job)
- which model and provider, and whether a local or mock model exists for tests
- whether the project already has AI tests, and whether they call a paid API

## 7. Write the preflight record

```
target: http://localhost:5173 (started by this run, pid 1234)
data: skill-created SQLite at <run folder>/db.sqlite, migrated + seeded with project commands
roles: guest (no login), member (seed user), admin (seed user), owner (UNTESTABLE: no seed; proposed seed in report)
tests: Vitest unit (`bun run test`), Playwright e2e (`bun run test:e2e`)
ai: document reader (server fn readDocument, provider X), project AI tests call paid API -> ask first
rules: feature branch + worktree, gitmoji commits, owner review before push
untouched-data check: dev.db mtime 2026-11-13T09:12:04Z
```
