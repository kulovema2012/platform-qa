# platform-qa

An agent skill that tests any business app or platform on your own machine and tells you, with evidence:

- whether every existing feature works, for every role, state, input and timing
- which edge cases and blind spots nobody has tested yet
- which features a complete product of its kind would normally have, but yours lacks
- how well its AI or chatbot answers, when it has any

It ends with a 1–5 scored report and writes automated tests for the gaps it found.

It works for any industry: online stores, booking, finance, SaaS, chatbots, community sites, internal tools.

## Install

With the [skills](https://github.com/vercel-labs/skills) CLI:

```bash
npx skills add kulovema2012/platform-qa
```

Or with the bundled installer, straight from GitHub:

```bash
npx github:kulovema2012/platform-qa install
```

The installer puts the skill in `~/.agents/skills/platform-qa` and links it into `~/.claude/skills`. If you edited an installed copy, it is backed up first. Remove it with `npx github:kulovema2012/platform-qa uninstall`.

An npm package (`npx platform-qa install`) is planned.

## Use

In Claude Code (or another agent that reads `~/.agents/skills`), ask in plain words:

```
/platform-qa test the app in this repo
test the admin area of localhost:3000, deep
QA the chatbot only
what is this app missing compared with other booking apps?
```

Depths:

| Depth | What it does |
|---|---|
| `quick` | Runs existing tests and checks critical paths and untested critical features |
| `standard` (default) | Everything: blind-spot hunt with attacker helpers, missing-feature hunt, AI answer testing, tests for the gaps |
| `deep` | Every checklist on every feature, a generic web comparison, and a final "what did everyone miss?" review |

## Safety rules

- **Local only.** It tests apps running on your machine, and only while everything they connect to is local, mocked or in test mode. It refuses staging and production, and never opens a tunnel.
- **Disposable data.** It creates its own throwaway database or uses one your project provides for testing. It never resets or seeds data it did not create, and never uses real accounts.
- **Asks before spending.** Free checks run first. Any call to a paid AI model waits for your approval, with the number of calls and an estimated cost.
- **Asks before publishing code.** New tests are committed on a local branch. It asks before pushing, and again before merging.
- **Keeps private things private.** Web searches use generic category words only. Reports and evidence use synthetic data and are checked for secrets.

## What you get

- A scored report: verdict, failures and blind spots with reproduction steps and evidence, missing-feature suggestions, a coverage map, the tests it wrote, what it could not test, and what it cost. Published as a private page when your agent supports it, otherwise saved as an HTML file.
- A local branch with new tests in your project's own framework. Tests that expose a real bug are marked known-failing so your checks stay green while the bug stays visible.

## Development

```bash
bun test                 # installer and checker tests
bun run lint:skill       # structure and private-data check of the skill files
```

Set `PLATFORM_QA_PRIVATE_PATTERNS` to a local file of extra regexes (one per line) to block private names from ever being committed.

## License

MIT
