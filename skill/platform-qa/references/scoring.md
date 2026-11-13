# Scoring

## Rubric

Score each area, each phase result and the whole app from 1 to 5.

| Score | Meaning |
|---|---|
| 5 | Everything in scope works and is covered by tests. No blind spots above low severity. |
| 4 | Minor issues only: cosmetic problems, low-severity blind spots, small coverage holes on non-critical features. |
| 3 | A non-critical feature is broken, or there are significant gaps: several untested features, medium blind spots, or a high-priority missing feature. |
| 2 | A critical path is partly broken (works for some roles, states or inputs but not others), or there are major gaps such as a high-severity blind spot on money, permissions or data. |
| 1 | A critical path is broken, or the app fails to start with its own documented commands. (When the skill itself refuses or cannot reach the target for safety reasons, give no score instead.) |

## Rules

1. **Weakest critical path caps the total.** The overall score can be no higher than the lowest score of any critical area. Passing minor features never average a broken critical path upward.
2. **Proof only.** Only findings with reproduction steps and evidence count. Suspected findings are listed but do not change any score.
3. **Untestable lowers confidence, not score, except on critical paths.** Roles, features or checks that could not be reached are listed under "Could not test" with the reason. Report confidence as high (under 10% of in-scope checks untestable), medium (10-30%) or low (over 30%), with the main reason. If more than half of a critical area's checks could not be run, treat that area as untested: the overall score is capped at 3 and the verdict says which critical area was not tested. If no critical area could be tested, give no overall score.
4. **Pre-existing failures count.** A failing existing test is a real failure even if it failed before this run; say it was pre-existing.
5. **Missing features affect the score only when high priority** and the app's own docs do not exclude them.
6. **Whole-app failures hit every critical area.** A defect that takes the whole app down (a crash from one request, data lost on restart, every page failing) counts against every critical area it can interrupt.
7. **Depth is stated, not penalized.** A `quick` run scores only what it checked and lists what it skipped.

## Worked example

Areas: sign-in 5, catalogue 4, checkout (critical) 2 (refund over payment amount accepted), admin reports 3 (export untested and broken for empty months).

- Average would be 3.5, but checkout is critical and scored 2.
- **Overall: 2/5**, "checkout refunds accept amounts above the payment".
- Confidence: medium (owner role untestable: no seed).
