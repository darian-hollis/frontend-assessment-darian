# Notes

## What I changed and why

### Task 1 - Pagination and search
- Search and paging both happen on the server now: `GET /api/transactions?page=1&pageSize=20&q=quail` returns one page plus the total count and summary
- Bad params (page 0, page size over 100, a search over 100 characters) get a clear 400 error
- Search looks at id, merchant, card brand and status, ignoring case, across all transactions - not just the current page
- The summary is for the whole search, not just the 20 rows on screen
- The list is now an antd `Table` with page controls
- The search and page number are kept in the URL, so refresh, sharing a link and the browser Back button all work
- The app waits until you stop typing (300ms) before searching, so typing "quail" sends one request instead of five
- If an older request comes back late, it's ignored so it can't overwrite newer results
- Back after a search takes you to the page you were on, not through every letter you typed
- A page number that's too high goes to the last page; a broken one goes to page 1
- If loading fails you see an error with a Retry button instead of a spinner that never stops
- A few small speed-ups on the server and in formatting

### Task 2 - Summary total
- **Bug:** it added up the `amount` (before surcharge) of every transaction, including declined and refunded ones
- It showed **$25,438,084.33** - the right number is **$6,488,615.40** (2,446 approved transactions)
- Now it only counts approved transactions and uses `total` (amount + surcharge)
- It's worked out on the server, so it still works with pagination
- Money is added up in cents so decimals don't drift
- Refunds aren't counted - I'd check with the team whether they want them included
- The label now says "approved, incl. surcharge" so it's clear what the number means
- Removed an unused summary endpoint that had the same bug, and `lodash`, which was only used there

### Task 3 - New Transaction form
- **Money bug:** the form used `parseInt`, so `12.99` was saved as `12`
- The amount is now sent as text (`"12.99"`) and the server turns it into cents exactly, without decimal rounding issues
- The API checks every field and sends back an error for each one that's wrong:
  - merchant name: required, max 100 characters, no hidden/odd characters
  - card brand: must be one of the four brands
  - amount: a number above 0, max $1,000,000, up to 2 decimal places
- The server works out the id, surcharge, total, status and date - the browser can't set these
- New transactions start as **PENDING** because nothing has actually charged the card yet
- Surcharge is a flat **3%** - the existing data uses 2.5-3.5% with no pattern I could find, so this needs confirming
- The form now has labels, shows errors next to each field, and shows server errors in the right place too
- The amount box doesn't auto-correct big numbers (antd would quietly change 2,000,000 to 1,000,000) - it shows an error instead
- The button shows it's loading, and clicking twice can't create two transactions
- If the server takes longer than 15 seconds the request gives up; Cancel is disabled while it's saving
- After saving you see a confirmation and go straight to the new transaction
- The form is centred with a Back link, and the "New transaction" button is hidden while you're on it

### Task 4 - Transaction detail page
- New page at `/transactions/:id` instead of the old popup, so every transaction has its own link
- Shows a loading state, a "not found" message, an error with Retry, or the details
- Shows the surcharge as an amount and a percentage (`$48.50 (3.0%)`) and the total charged
- Click the transaction id or anywhere on the row to open it
- "Back to transactions" takes you back to the same page and search
- Any unknown URL shows a simple "Page not found" page with a button back home
- **Dates:** they're stored in UTC at midnight, so in US time every transaction showed the day before. Dates now show in UTC and say so
  - New transactions made in the evening (US time) will show the next day's date in UTC. If the team prefers US time, I'd store the date separately

## Task 5 - Improvements I'd prioritise
1. **Data loading** - the list and detail pages each have their own copy of the loading/retry code, and nothing is cached, so going back to a page loads it again. A library like TanStack Query would handle caching and retries in one place
2. **Keeping types in sync** - the frontend copies the API's types and rules by hand and trusts whatever the API sends back. Sharing one definition between the two (e.g. with zod) would stop them drifting apart
3. **Accessibility** - when you change page, keyboard focus doesn't move and the browser tab title doesn't change, so screen reader users aren't told anything happened
4. **Crashes and load size** - one unexpected error blanks the whole app, and the app downloads about 1 MB of JavaScript (mostly antd). I'd add error boundaries and load pages only when they're needed
5. **Tests** - only the helper functions have tests. I'd add tests for the components and the main flows (search, open, create) and run them on every change

Backend and security, outside the frontend scope: the committed `sk_live_` key needs replacing (see Q3), the API has no login, `express 4.17.1` has known security issues, and data is lost when the server restarts.

## Questions

### 1. Data flow
Before:
- The page loaded all 10,000 transactions at once (~2.1 MB)
- Every keystroke re-ran the search over all 10,000 in the browser
- Every match was drawn on screen - up to 10,000 rows
- So the first load was slow and typing got laggy, and it would only get worse with more data

Now:
- Typing updates the URL, and one request goes out once you stop typing
- The server does the searching and sends back just 20 rows (a few KB)

### 2. Pagination/search split
- Searching, paging and the summary all happen on the server
- If only paging were on the server, the browser could only search the 20 rows it has, so results would be wrong
- At ~10 million rows:
  - Use a real database with indexes and proper text search
  - Page by "the next 20 after the last one I saw" instead of skipping rows - skipping millions of rows is slow
  - Pre-calculate the totals instead of adding them up on every search
  - Cache common searches and limit how often people can search

### 3. Ship / no-ship
- The live `sk_live_` payment key and webhook secret saved in `config.ts`
- I'd treat them as leaked: get new keys from the payment provider, keep them in environment variables (done), and add a check that blocks secrets being committed
- Just deleting the line isn't enough - it's still in the git history
- Close second: the API has no login at all. (Error messages leaking internal details is fixed)

## With more time
- Filters for status, card brand and date, and sortable columns
- Make it work on small screens - the table and search box don't fit on a phone
- Shared types between the API and the frontend
- Move focus and update the tab title when you change page
- Tests for the components and main flows
- Error boundaries, and load pages only when needed
- On the API side: login, rate limits, and a real database
