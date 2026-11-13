# Edge cases: state

Apply to every list, dashboard, detail page and multi-step flow.

| Probe | How to try it | What a failure looks like |
|---|---|---|
| Empty data | New account or empty table; open every list and dashboard | Blank page, error, or misleading zeros instead of a helpful empty state |
| One item | Exactly one record | Plural text, broken layout, wrong totals |
| Many items | Seed hundreds or thousands | Missing pagination, slow page, broken totals, timeouts |
| Page boundaries | Record count exactly at page size and page size + 1 | Last record missing or duplicated across pages |
| Deleted or archived | Delete a record; open old links, related records and reports | Errors, ghost records, or deleted data still counted |
| Soft-deleted parent | Archive a parent (project, customer); open children | Children orphaned or still editable |
| Unknown values | Records with missing optional data | Shown as 0, "undefined", "null" or crashes; unknown financial values must stay unknown, never zero |
| Partly finished flow | Abandon a multi-step flow midway; return later | Stuck state, duplicate drafts, lost data |
| Status transitions | Try every move between statuses, including backwards and skipping steps | Invalid transitions allowed (cancelled → paid), or valid ones blocked |
| Terminal states | Edit a record after it is closed, paid, posted or voided | Changes allowed that should be locked |
| Stale screen | Change a record in one tab; act on it from an older tab | Old data overwrites newer data silently |
| Limits and quotas | Reach a plan limit, storage limit or maximum count | No message, server error, or limit not enforced |
| First run | Brand-new install or tenant with no settings | Errors from missing configuration |
| Feature flags | Toggle relevant flags in the test environment | Half-visible features or broken screens |
