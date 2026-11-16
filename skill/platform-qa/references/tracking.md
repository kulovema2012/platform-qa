# Keeping the report current

The report is a living checklist, not a one-time snapshot. Every finding and missing feature carries a status that people change on the page and that you change as work happens. The tracker block at the end of [the report template](report-template.html) draws the status pickers, the progress card and the contents index; copy it unchanged.

## Item IDs

- Findings: `F-<area letter>-<number>` (for example `F-M-07`). Missing features: `MF-<number>` (for example `MF-03`).
- Put the ID on the article as `data-item="F-M-07"` and as the first text of its grey details line.
- An ID belongs to one problem forever. On a later run, a problem that was reported before keeps its old ID; a new problem gets the next unused number. Never reuse a retired ID for something else.

## Statuses

| Key | Shown as | Meaning | Who usually sets it |
|---|---|---|---|
| `todo` | Not started | Nobody has worked on it | Default |
| `doing` | In progress | A fix or build is underway | Person or AI when work starts |
| `blocked` | Blocked | Waiting on a decision, access or other work | Person or AI, with a note saying what it waits on |
| `fixed` | Fixed – needs re-test | A change was made or merged, but the problem has not been re-checked | AI after the fix's pull request merges |
| `verified` | Verified | Re-tested and the problem is gone (missing feature: built and checked) | AI after a passing re-test |
| `reopened` | Reopened | It was fixed or verified, then failed again | AI when a re-test fails |
| `wontfix` | Won't fix | Accepted risk or out of scope, by the owner's decision | Person (AI only when the owner says so) |

Verified and Won't fix count as closed. Each status record is `{ "status": "<key>", "note": "<short text, 300 characters or fewer>", "updatedAt": "<ISO time>" }`. The note is shown under the picker: put the pull request link, the run that verified it, or what a blocked item waits on. Never put secrets, personal data or customer data in a note.

## Where statuses are stored

- **Published page (Artifact tool):** publish the report with the `db` capability (`capabilities: { db: {} }`). Statuses live in the collection `statuses`, one document per item ID. Write them with the artifact database tool (`ArtifactData` in Claude Code): `set` on collection `statuses`, `doc_id` = the item ID; for a document that already exists, read it first and pass its version as `if_version`. Use `batch` when updating several. Statuses survive republishing the page.
- **Local HTML report:** fill `{{status_seed_json}}` with a JSON object keyed by item ID (`{}` for a first run) and update it by editing the file. Changes a person makes in the browser stay in that browser only; say so when you hand over a local report.

Before changing a status, read the current one. Never overwrite a status a person set more recently than the event you are recording, except to mark `reopened` with proof.

## When to update

| Event | New status | Note |
|---|---|---|
| You start fixing or building an item | `doing` | Branch name |
| The work stops on a decision or access | `blocked` | What it waits on |
| The fix or feature merges | `fixed` | Pull request link and merge commit |
| You re-run the item's reproduction steps (or its test) and it passes | `verified` | Date and how it was checked |
| A re-test of a `fixed` or `verified` item fails | `reopened` | What failed, with the evidence file |
| The owner decides not to fix | `wontfix` | The owner's reason, in their words |

Update the page in the same turn as the event, then say in one line which items changed. Do not mark `verified` from a green CI run alone unless that run includes a test that reproduces the item; otherwise re-run the steps.

## On a later run

1. Read the earlier report's statuses (database collection `statuses`, or the seed in the earlier local file) before Phase 3.
2. Re-test every item that is not `wontfix`, using its reproduction steps or its test. `verified` items get a quick check only.
3. Items that still fail keep their ID. A `fixed` or `verified` item that fails becomes `reopened`. A `todo`, `doing` or `blocked` item that now passes becomes `verified` with the note "passed in run <date>".
4. Carry every earlier status into the new report, so the progress card shows the whole history. Keep closed items in the report (the page can hide them) until the owner says they can go.
5. In the report's comparison line, say how many items were verified, reopened and newly found since the last run.
