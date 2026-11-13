# Edge cases: timing and concurrency

Apply to every action that creates, pays, sends or changes something. Probes marked **exclusive** need shared state; helpers queue them for the main agent.

| Probe | How to try it | What a failure looks like |
|---|---|---|
| Double submit | Double-click submit, or send the same request twice quickly | Two records, two charges, two emails |
| Back after submit | Submit, press back, submit again | Duplicate action |
| Refresh during submit | Reload while a slow request is in flight | Lost data or duplicate action |
| Retry after timeout | Make the request slow (throttle network); retry when it seems to fail | Duplicates because the first attempt actually succeeded |
| Idempotency | Repeat a payment, webhook or job with the same key or payload | Processed twice |
| **Exclusive:** two editors | Two sessions edit the same record and save | Last write silently wins over the other person's changes |
| **Exclusive:** race on limited stock or seats | Two users claim the last item or slot at once | Both succeed; count goes negative |
| **Exclusive:** rate limits | Send many requests quickly | No limit on expensive or abusable actions; or a limit that breaks normal use |
| Slow network | Throttle to slow 3G | No loading state, buttons stay active, timeouts without messages |
| Offline | Disconnect mid-flow | Data lost without warning |
| Long-running jobs | Start an export or import, navigate away, come back | Job lost, duplicated, or no way to see status |
| **Exclusive:** scheduled jobs | Run the job twice, or while related data is being edited | Duplicate processing, partial updates |
| Session in many tabs | Sign out in one tab; act in another | Actions succeed after sign-out |
| Order of events | Deliver related events out of order (webhook "refunded" before "paid") | Wrong final state |
