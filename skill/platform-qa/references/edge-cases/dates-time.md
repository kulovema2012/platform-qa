# Edge cases: dates and time

Apply to bookings, deadlines, reports by period, subscriptions, reminders, timestamps and anything "per day/month".

| Probe | How to try it | What a failure looks like |
|---|---|---|
| Time zones | Set browser and user time zones far apart (UTC+7 vs UTC-8); create and view records | Wrong day shown; bookings off by hours |
| Midnight boundary | Create a record at 23:59 and 00:01 local time | Counted in the wrong day or report period |
| Daylight saving | Times inside the skipped and repeated hour in a DST region | Missing or duplicate slots; wrong durations |
| Month ends | 31st of the month, "add one month" to Jan 31 | Invalid dates, skipped months |
| Leap day | 29 February; yearly items created on it | Errors or wrong renewal date |
| Year end | 31 Dec → 1 Jan reports and numbering | Reports split wrongly; sequence numbers reset or collide |
| Past and future | Booking in the past, due date before start date, birth date in the future | Accepted when it should not be |
| Far future | Year 2100 and beyond | Errors or wrong formatting |
| Date formats | Typed dates in DD/MM vs MM/DD; Buddhist calendar years where relevant | Misread dates (03/04 meaning March vs April) |
| Durations | Zero-length and overnight events; events longer than 24 hours | Wrong totals or display |
| Server vs client clock | Compare times stored by the server with what the screen shows | Inconsistent times between screens and exports |
| Expiry | Links, trials, codes and sessions exactly at expiry | Valid items rejected early or expired items accepted |
| Recurring items | Weekly or monthly items across DST and month ends | Drifting times, skipped occurrences |
