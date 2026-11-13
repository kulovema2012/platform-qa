# Edge cases: access and roles

Apply to every feature with `rolesDenied`, every admin screen, and every API that reads or changes another person's data.

| Probe | How to try it | What a failure looks like |
|---|---|---|
| Direct URL as a lower role | Sign in as member; paste the admin page URL | Admin page renders, even partly, or flashes before redirect with data visible |
| API without the screen | Call the admin endpoint with a member session, using the request the admin screen sends | 200 response or data in the body instead of 401/403 |
| Signed out | Clear the session; call the endpoint and open the page | Data returned, or an error page that leaks stack traces |
| Someone else's ID | As user A, request user B's record by changing the ID in the URL or body | B's data shown or changed |
| Another tenant or organization | In multi-tenant apps, request a record from a different organization | Cross-tenant data visible or editable |
| Guessable IDs | Look for sequential numeric IDs on private records | Records enumerable by counting |
| Role changed mid-session | Demote an admin in another session; retry an admin action in the first | Old session keeps admin powers |
| Removed or disabled user | Disable a user; reuse their open session or an old link | Access continues |
| Expired session | Let a session expire (or shorten its expiry in the test environment); submit a form | Data lost silently, or action saved without a valid session |
| Invite and sign-up abuse | Reuse an invite link, use it as a different email, change the role in the request | Extra accounts or raised role |
| Hidden buttons only | Find actions hidden in the UI for a role but not blocked on the server | Server accepts the action |
| Mass assignment | Add fields like `role`, `isAdmin`, `ownerId`, `price` to an update request | Server saves fields the user should not control |
| Ownership transfer | Try to transfer or delete the last owner/admin | Organization left with no owner |
| Audit of privileged actions | Perform an admin action; look for an audit entry | No record of who did what |
| Error messages | Trigger a denied action | Message reveals whether a hidden record exists, or internal details |
