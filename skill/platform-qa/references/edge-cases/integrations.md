# Edge cases: notifications and integrations

Apply to email, SMS, push, payments, webhooks, third-party APIs and anything the app calls out to. Use the project's mocks, sandboxes or test-mode adapters; never send to real people or charge real cards.

| Probe | How to try it | What a failure looks like |
|---|---|---|
| Provider down | Make the mock return errors or refuse connections | Action fails silently, or the record is saved as if the call succeeded |
| Provider slow | Add a long delay in the mock | Page hangs; user retries and causes duplicates |
| Duplicate webhook | Deliver the same webhook twice | Processed twice (double credit, double email) |
| Out-of-order webhook | Deliver "completed" before "created" | Wrong final state |
| Unsigned or wrongly signed webhook | Send a webhook without a valid signature | Accepted |
| Partial failure | First of two outbound calls succeeds, second fails | Half-done state with no retry or clean-up |
| Retry behaviour | Fail a send, then let the retry run | Gives up silently, or retries forever |
| Email content | Trigger each email; read the rendered output in the test mailbox | Broken links, wrong names, raw template tags, links to localhost in production config |
| Unsubscribe and preferences | Turn notifications off; trigger events | Still sent |
| Missing configuration | Remove an optional provider setting in the test environment | Crash instead of a clear "not configured" state |
| Bounces and invalid addresses | Send to an address the sandbox marks as bouncing | No record or retry of failures |
| Secrets in logs | Trigger provider errors; read app logs | API keys or tokens printed |
| Test mode leaks | Check that test configuration cannot reach real providers | Real sends or charges possible from a test setup |
