# Edge cases: files

Apply to every upload, import, attachment, avatar and export.

| Probe | How to try it | What a failure looks like |
|---|---|---|
| Wrong type | Upload an `.exe`, `.html` or `.svg` where images or PDFs are expected | Accepted and served back; script runs when opened |
| Renamed extension | A text file renamed to `.pdf` | Trusted by extension; processing crashes |
| Empty file | 0-byte file | Server error or empty record saved |
| Oversize | Just over the limit, and far over it | No clear message; server runs out of memory; limit only checked on the client |
| Exactly at the limit | File exactly the maximum size | Rejected though allowed |
| Duplicate upload | Same file twice | Duplicate records or double processing |
| Strange file names | Very long names, spaces, emoji, `../../x`, names in Thai or Chinese | Path errors, overwritten files, broken downloads |
| Corrupt file | Truncated PDF or image | Crash, stuck "processing" state with no way out |
| Encrypted or password-protected | Password-protected PDF or zip | Stuck processing; unclear message |
| Many files at once | Upload 50 files | Partial failures without a list of which failed |
| Access to stored files | Open another user's file URL; open a file after its record is deleted | File still reachable |
| Import with bad rows | CSV with wrong columns, wrong encoding, extra commas, formulas (`=cmd|...`) | Whole import fails without row-level errors; formulas run in spreadsheets after export |
| Export of special data | Export records containing commas, quotes, line breaks, unicode | Broken CSV columns; garbled text |
| Large export | Export thousands of rows | Timeout, missing rows |
