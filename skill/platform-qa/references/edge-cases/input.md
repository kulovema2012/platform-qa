# Edge cases: input

Apply to every form field, query parameter, request body field and uploaded text.

| Probe | How to try it | What a failure looks like |
|---|---|---|
| Empty | Submit with the field empty | Saved anyway, or a server error instead of a clear message |
| Whitespace only | Enter spaces or tabs | Treated as a real value; blank names in lists |
| Very long | Paste 10,000 characters | Server error, layout broken, or silent truncation of meaningful data |
| Unicode and emoji | Names with accents, Thai, Arabic (right-to-left), Chinese, emoji, combining marks | Garbled text, broken sorting or search, length counted wrong |
| Leading and trailing spaces | `" alice@example.com "` | Duplicate accounts, failed sign-in |
| Case | `Alice@Example.com` vs `alice@example.com` | Two accounts for one person, or failed lookup |
| HTML and script | `<b>x</b>`, `<img src=x onerror=alert(1)>` | Rendered as markup or executed |
| Query-shaped text | `' OR 1=1 --`, `"; DROP TABLE x; --` | Server error or changed results |
| Wrong type | Text where a number is expected; an array where a string is expected (via the API) | Server error or saved as a strange value |
| Numbers at the edges | 0, -1, 0.1 + 0.2, 1e309, very large integers, numbers with commas | Negative quantities accepted, precision lost, overflow |
| Missing required field via API | Omit a field the UI always sends | Server error or record saved incomplete |
| Extra unknown fields via API | Add fields the UI never sends | Saved or acted on (see mass assignment) |
| Format validation | Bad email, phone, URL, postcode; valid but unusual ones (`+` in email, long TLDs) | Valid input rejected or invalid input accepted |
| Copy-paste artifacts | Invisible characters, line breaks, smart quotes | Mismatches in search, codes or IDs |
| Client-only validation | Bypass the UI and send invalid values directly | Server accepts what the screen rejects |
| Search and filter input | Empty search, `%`, `_`, `*`, a very long query | All records returned, errors, or slow queries |
