# Project Evolution Log

This file tracks every architectural decision, feature addition, refactor, and AI-generated change during the development of the Shared Expense Management App.

---

## Version 1.18.0

2026-06-14

## Prompt Given
Connect all React pages with Express APIs.

Requirements:
- Axios integration
- Loading states
- Error handling
- Protected routes
- JWT authentication

Ensure complete end-to-end functionality.

## Changes Made
- Connected all remaining frontend pages to the backend Express APIs using the Axios instance defined in `api.js`.
- Cleaned up legacy non-functional duplicate "Add Expense" modal from `GroupDetails.jsx` and updated the panel tab's "Add Expense" button to route directly to the dedicated `/groups/:id/expenses/add` page via a router Link.
- Resolved hardcoded `'user-me'` references inside `GroupDetails.jsx` (soft-delete conditions and dropdown selectors) to use `currentUser?.id` and query from database member profiles, preventing database crashes on settle commits.
- Resolved ReferenceError compile/runtime crashes by adding missing imports:
  - Imported `X` from `lucide-react` in `BalanceSummary.jsx` for the settlement modal closing trigger.
  - Imported `Loader2` from `lucide-react` in `ActivityLog.jsx` for the loading feed spinner.
- Verified successful production build compilation for Vite bundling.

## Files Added
None

## Files Modified
- [GroupDetails.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/GroupDetails.jsx)
- [BalanceSummary.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/BalanceSummary.jsx)
- [ActivityLog.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ActivityLog.jsx)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Fulfill integration constraints to complete end-to-end user operations securely via JWT sessions, correct runtime validation crashes, and standardize layout triggers.

## Impact On Project
- Solidifies core business workflows where expense creation, debt settlements, CSV uploads, anomaly screen workflows, and timelines synchronize with DB transactions reliably.

---

## Version 1.17.0

2026-06-14

## Prompt Given
Create Activity Log page.

Track:
- Expense Created
- Expense Edited
- Expense Deleted
- Settlement Added
- CSV Import Actions

Show timeline view.

## Changes Made
- Engineered a database-independent backend activity logging service `activity.service.js` that records actions (expense logging, deletions, settle ups, settlement voids, and CSV spreadsheet imports) inside `backend/src/data/activities.json` to bypass schema migrations.
- Created `activity.controller.js` and registered the protected route `GET /api/activities` in `activity.routes.js` and mounted it under `/activities` in the main routing dispatcher.
- Integrated activity log triggers in `expense.controller.js` (for expense creations, deletions, settlement additions, and settlement deletions) and `import.controller.js` (for CSV imports).
- Created the frontend client `activity.service.js` to retrieve activities.
- Implemented `/activities` route in `AppRoutes.jsx` rendering the new `ActivityLog.jsx` page.
- Created `ActivityLog.jsx` containing a vertical timeline view with color-coded Lucide icon nodes, inline filters, live text query matching, and expandable details cards.
- Integrated the "Activity Log" option in `Sidebar.jsx`.

## Files Added
- [activity.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/activity.service.js)
- [activity.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/activity.controller.js)
- [activity.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/activity.routes.js)
- [activity.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/activity.service.js)
- [ActivityLog.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ActivityLog.jsx)

## Files Modified
- [index.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/index.js)
- [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js)
- [import.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/import.controller.js)
- [AppRoutes.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/AppRoutes.jsx)
- [Sidebar.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/components/layout/Sidebar.jsx)

## Reason For Change
- Fulfill requirements to maintain audit trails for group changes (expenses and settlements) and CSV uploads, and present them in a timeline interface.

## Impact On Project
- Group members can now monitor history trails of actions, checking who logged or removed entries, and inspect metadata fields directly.

---

## Version 1.16.0

2026-06-14

## Prompt Given
Create Import Report page.

Show:
- Total rows
- Imported rows
- Flagged rows
- Anomaly summary
- Actions taken

Display report after CSV import.

## Changes Made
- Created new frontend page `ImportSummaryReport.jsx` to render post-import summary details (total rows, imported rows, flagged warnings, discarded rows, corrected rows) with detailed log bullet lists of actions taken and anomaly summary check results.
- Registered `/import/summary` route in `AppRoutes.jsx` mapping to the new `ImportSummaryReport` component.
- Updated `ImportReport.jsx` to navigate to `/import/summary` on successful imports, passing original count, successfully committed counts, skipped counts, and action bullet item texts.
- Modified `AnomalyReview.jsx` to calculate user correction counts and discarded ids, passing these values as metrics to `/import/summary` upon batch database commits.

## Files Added
- [ImportSummaryReport.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportSummaryReport.jsx)

## Files Modified
- [AppRoutes.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/AppRoutes.jsx)
- [ImportReport.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportReport.jsx)
- [AnomalyReview.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/AnomalyReview.jsx)

## Reason For Change
- Deliver post-import audit transparency, confirming final record numbers and details of skipped/edited spreadsheet rows.

## Impact On Project
- Users now have complete confirmation closure of CSV transactions, knowing exactly what was created, discarded, or corrected.

---

## Version 1.15.0

2026-06-14

## Prompt Given
Create Anomaly Review page.

Detect and display:
- Duplicate expenses
- Missing payer
- Invalid date
- Negative amount
- Missing currency
- Membership conflicts

Allow user approval before applying changes.

## Changes Made
- Upgraded backend `parseCSV` inside `import.service.js` to parse all rows leniently instead of dropping rows with invalid fields, preserving raw input values and row line numbers.
- Refactored backend `scanForAnomalies` in `anomaly.service.js` to run asynchronously and scan for the 6 requested categories of anomalies (using database checks to detect group membership conflicts and duplicate entries within the last 7 days).
- Implemented frontend `/import/anomalies` route rendering the new `AnomalyReview.jsx` workspace page.
- Created `AnomalyReview.jsx` containing card-based grids with live error validators, inline inputs for all fields, active member dropdowns loaded dynamically and cached, and row discard triggers.
- Enhanced `ImportReport.jsx` to render a warning block card with a CTA button directing the user to `/import/anomalies` if there are any screened anomalies.

## Files Added
- [AnomalyReview.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/AnomalyReview.jsx)

## Files Modified
- [import.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/import.service.js)
- [anomaly.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/anomaly.service.js)
- [import.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/import.controller.js)
- [AppRoutes.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/AppRoutes.jsx)
- [ImportReport.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportReport.jsx)

## Reason For Change
- Fulfill requirements to prevent data loss on invalid CSV rows, detect complex duplicates/conflicts against database tables, and let users fix import errors visually before final commits.

## Impact On Project
- Users can now upload and resolve raw spreadsheet files directly in the UI, cleaning date/amount/payer errors interactively rather than failing import runs or maintaining manually updated spreadsheets.

---

## Version 1.14.0

2026-06-14

## Prompt Given
Create CSV Import page.

Features:
- Upload CSV
- Preview records
- Import data
- Show validation status

Do not process anomalies yet.

## Changes Made
- Implemented backend batch transaction endpoint `commitImportedExpenses` in `import.controller.js` to process validated CSV expense items, retrieve active group members, partition amounts equally, and save records using a single Prisma transaction.
- Registered `/api/import/commit` route inside `import.routes.js`.
- Created frontend API service client `import.service.js` wrapping `uploadCSV`, `commitImport`, and `getReportHistory` endpoints.
- Modified frontend `ImportCSV.jsx` to upload the CSV file using the real upload service and transition the parsed report payload to the report details page.
- Refactored `ImportReport.jsx` to fetch active groups, execute row validation (verifying whether group ID exists), show custom color-coded validation badges, and process transactions on clicking "Approve and Import".

## Files Added
- [import.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/import.service.js)

## Files Modified
- [import.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/import.controller.js)
- [import.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/import.routes.js)
- [ImportCSV.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportCSV.jsx)
- [ImportReport.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportReport.jsx)

## Reason For Change
- Fulfill core bulk import requirements, enabling user approval before database commits, using transactional database operations to write expenses and equal participant splits.

## Impact On Project
- Enhances utility by allowing users to bulk-upload their bills from CSV files, visualising the imported rows with safety validation rules before making structural database changes.

---

## Version 1.13.0

2026-06-14

## Prompt Given
Create Settlement module.

Features:
- Record payment
- Mark debt as settled
- Settlement history

Update balances automatically.

## Changes Made
- Implemented the `deleteSettlement` controller action in `expense.controller.js` to delete settlement logs.
- Registered nested DELETE `/settlements/:id` route in `expense.routes.js` to remove recorded payments.
- Added the `deleteSettlement` method inside the frontend `expense.service.js` client.
- Redesigned the Settlement Logs history card in `GroupDetails.jsx` to display participant details alongside date tags.
- Hooked deletion triggers to confirm inputs and automatically re-evaluate group standing balances upon payment cancellation.

## Files Added
None

## Files Modified
- [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js)
- [expense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/expense.routes.js)
- [expense.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/expense.service.js)
- [GroupDetails.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/GroupDetails.jsx)

## Reason For Change
- Deliver a comprehensive Settlement management module that handles payments, maintains history list sheets, and recalculates debt standings cleanly.

## Impact On Project
- Users can now undo recorded payments if logged in error, which restores balances instantly.

---

## Version 1.12.0

2026-06-14

## Prompt Given
Create Balance Summary page.

Requirements:
- Calculate net balance
- Show who owes whom
- Settlement suggestions

Example:
Rohan owes Aisha ₹2300
Sam owes Dev ₹500

Keep layout similar to Tricount.

## Changes Made
- Implemented real database net balance calculations and debt optimization matching algorithms in the `getGroupBalances` controller inside `group.controller.js`.
- Created the dedicated frontend `BalanceSummary.jsx` page component displaying standing net balances, spent vs. share metrics per user, and suggested matches with pre-filled quick settle modal overlays.
- Restructured `GroupDetails.jsx` to fetch active group details, members lists, expenses history, and net standings directly from the database endpoints.
- Integrated currency selector dropdowns on the frontend to isolate balances, spending, and suggestions cleanly by currency.
- Registered `/groups/:id/balances` route mapping in `AppRoutes.jsx` and added navigate links in the tab deck panels of `GroupDetails.jsx`.

## Files Added
- [BalanceSummary.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/BalanceSummary.jsx)

## Files Modified
- [group.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/group.controller.js)
- [AppRoutes.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/AppRoutes.jsx)
- [GroupDetails.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/GroupDetails.jsx)

## Reason For Change
- Fulfill requirements to calculate net balances dynamically from database entries and display optimal transaction suggestions in a numbers-focused Tricount layout.

## Impact On Project
- Users now have access to real-time calculated debt standings and matching suggestions, allowing them to settle balances with immediate updates reflecting in the group database.

---

## Version 1.11.0

2026-06-14

## Prompt Given
Create Expenses page.

Features:
- List all expenses
- Filter by member
- Filter by date
- Search by description
- View expense details

Use table layout.

## Changes Made
- Implemented global `getAllUserExpenses` controller action in `expense.controller.js` to query all expenses across groups the user belongs to.
- Created `globalExpense.routes.js` and registered `/api/expenses` in the backend index router.
- Added `getAllExpenses` call inside the frontend `expense.service.js`.
- Refactored `Expenses.jsx` to construct a detailed table displaying date, description, group (with navigation link), paid-by member, split strategy, and total amounts.
- Engineered search filters by member, date-range bounds, and description matches on the client-side list state.
- Integrated a high-fidelity detail overlay modal showing total amounts, currencies, payer identity, split weight inputs (percentages/shares/amounts), computed share distributions, and a delete action restricted to the expense payer.

## Files Added
- [globalExpense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/globalExpense.routes.js)

## Files Modified
- [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js)
- [index.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/index.js)
- [expense.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/expense.service.js)
- [Expenses.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Expenses.jsx)

## Reason For Change
- Deliver a global bills ledger allowing users to search, filter, and inspect splitting weight breakages and payee details across all of their active groups.

## Impact On Project
- Users now have complete visibility over their historical transactions across all active groups with granular filtering tools.

---

## Version 1.10.0

2026-06-14

## Prompt Given
Create Add Expense page.

Fields:
- Description
- Amount
- Currency
- Paid By
- Date
- Participants
- Split Type

Split Types:
- Equal
- Percentage
- Exact Amount
- Share Based

Generate frontend and backend logic.

## Changes Made
- Modified the database schema (`schema.prisma`) to add `currency` support to the `Expense` model.
- Implemented backend database-backed controllers for groups (`createGroup`, `getGroups`, `getGroupById`) and expenses (`createExpense` with splits calculation transactions, `getExpensesByGroup`, `deleteExpense`, `settleUp`) in `group.controller.js` and `expense.controller.js`.
- Built the dedicated `AddExpense.jsx` frontend page featuring input forms for description, amount, currency selection, paid by select, date picker, active participant checkboxes, and split strategy selectors with live allocation math and client-side validation logic.
- Wired the "Add Expense" button in `GroupDetails.jsx` to route users directly to the new `AddExpense` form path.
- Registered `/groups/:id/expenses/add` route mapping in `AppRoutes.jsx`.

## Files Added
- [AddExpense.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/AddExpense.jsx)

## Files Modified
- [schema.prisma](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/prisma/schema.prisma)
- [group.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/group.controller.js)
- [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js)
- [AppRoutes.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/AppRoutes.jsx)
- [GroupDetails.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/GroupDetails.jsx)

## Reason For Change
- Fulfill core requirement to allow logging new expense items dynamically calculated and validated according to diverse splitting logic rules, backed by ACID database transaction commits.

## Impact On Project
- Users can now navigate to a dedicated form page, choose custom currencies, select participating members, and apply precise equal, exact, percentage, or share splits that insert cleanly into PostgreSQL via Prisma.

---

## Version 1.9.0

2026-06-14

## Prompt Given
Create Member Management module.
Features:
- Add Member
- Remove Member
- Join Date
- Leave Date
Store membership timeline for future balance calculations.

## Changes Made
- Programmed active database queries in `group.controller.js` to handle `addMember` (with duplicate scans and rejoining) and `removeMember` (triggering soft-delete `leftAt` updates).
- Restructured frontend `GroupDetails.jsx` to list member statuses, displaying joined dates and left dates.
- Integrated a modal form uploader to add new members inside the Members panel.
- Wired a soft-leave triggers that set member `leftAt` timestamps and toggle them to inactive.
- Filtered splits calculations to exclude inactive members from new expense logs.

## Files Added
None

## Files Modified
- [group.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/group.controller.js)
- [GroupDetails.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/GroupDetails.jsx)

## Reason For Change
- Retain transaction records and calculation history when users join/leave active groups.

## Impact On Project
- User balances remain correct over past entries, while excluding former members from splits of new expenses.

---

## Version 1.8.0

2026-06-14

## Prompt Given
Create Group Details page.
Sections:
- Group Information
- Members
- Expenses
- Balances
- Settlements
Add navigation tabs between sections.

## Changes Made
- Redesigned `GroupDetails.jsx` to build a tabbed selector panel matching the requested 5 scopes (Info, Members, Expenses, Balances, Settlements).
- Implemented Group Information cards displaying creator details, creation dates, total spent metrics, and user shares.
- Implemented Members list detailing names, emails, join dates, and active flags.
- Built an interactive Add Expense modal with support for dynamic splitting strategies (Equal, Exact amount, Percentages, and Shares).
- Programmed a client-side debt optimization matching algorithm displaying who owes whom transactions.
- Added Settlement logs tracking payments.

## Files Added
None

## Files Modified
- [GroupDetails.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/GroupDetails.jsx)

## Reason For Change
- Formulate a single, consolidated dashboard page covering all features of a shared expense group.

## Impact On Project
- Users can now log complex bills, view individual net standings, inspect optimal debt settlement trees, and record settle-up payments.

---

## Version 1.7.0

2026-06-14

## Prompt Given
Create Groups Management page.
Features:
- Create Group
- View Groups
- Edit Group
- Delete Group
Each group should display:
- Name
- Members Count
- Total Expenses
- Created Date

## Changes Made
- Upgraded `Groups.jsx` with full state hooks supporting Group CRUD interactions.
- Designed Group display cards containing members count badges, cumulative expenditure amounts, and date stamps.
- Constructed a slide-up Create Group modal allowing users to supply names, descriptions, and dynamic email fields.
- Implemented Edit Group forms and Delete Group confirmation prompts.

## Files Added
None

## Files Modified
- [Groups.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Groups.jsx)

## Reason For Change
- Support visual lifecycles for managing, modifying, and deleting expense sharing groups.

## Impact On Project
- Active users can now organize multiple groups, configure member names/emails, edit metadata, and execute deletions.

---

## Version 1.6.0

2026-06-14

## Prompt Given
Create Dashboard page for a Shared Expense App.
Show:
- Total Groups
- Total Expenses
- Pending Settlements
- Recent Expenses
- Quick Actions
Keep UI clean and modern like Tricount.

## Changes Made
- Redesigned `Dashboard.jsx` incorporating a hero balance standing header.
- Added clean statistical display cards for group counts, total amounts, and pending settlements.
- Integrated a structured list displaying recent transactions with color-coded balances.
- Formulated a quick actions shortcut grid (create groups, upload CSV spreadsheets, navigate logs) and a group standing summary card.

## Files Added
None

## Files Modified
- [Dashboard.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Dashboard.jsx)

## Reason For Change
- Deliver a premium, metric-focused homepage that is visually clean and modern (drawing design ideas from Tricount).

## Impact On Project
- Enhances user dashboard readability, showing standing balance accounts and key quick action hooks immediately on loading.

---

## Version 1.5.0

2026-06-14

## Prompt Given
Create Authentication module.
Pages:
1. Login
2. Register
Requirements:
- Tailwind UI
- Form validation
- JWT based authentication
- React Router integration
Also generate backend APIs and Prisma models.

## Changes Made
- Replaced mock authentication state with real database queries via Prisma and PostgreSQL.
- Implemented backend crypt-hashing (`bcryptjs`) for password storage and match checks.
- Set up JWT creation for logins/signups (`jsonwebtoken`).
- Added client-side email format regex checks, blank field validation, and password length (minimum 6 characters) restrictions in the frontend.

## Files Added
None

## Files Modified
- [auth.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/auth.controller.js)
- [AuthContext.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/context/AuthContext.jsx)
- [Login.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Login.jsx)
- [Register.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Register.jsx)

## Reason For Change
- Replace mock authorization states with standard token-based security checks and database credentials.

## Impact On Project
- Valid credentials verification prevents unauthorized reads and writes to all main dashboards and expense routes.

---

## Version 1.4.0

2026-06-14

## Prompt Given
Design a Prisma schema for a Shared Expense App.
Entities:
- User
- Group
- GroupMember
- Expense
- ExpenseSplit
- Settlement
- ImportAnomaly
Requirements:
- Support join and leave dates
- Support equal, percentage, exact and share splits
- Use PostgreSQL

## Changes Made
- Declared the core database models in `schema.prisma` using PostgreSQL datasource.
- Introduced `SplitType` and `AnomalySeverity` enums.
- Added `joinedAt` and `leftAt` columns to `GroupMember`.
- Integrated equal, percentage, exact, and share split configurations in `Expense` and `ExpenseSplit`.
- Mapped relationships for `Settlement` transactions (payments between group users).
- Configured audit logging table `ImportAnomaly` for parsed CSV reports.

## Files Added
None

## Files Modified
- [schema.prisma](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/prisma/schema.prisma)

## Reason For Change
- Formulate database structures to support the full domain of group expense tracking, membership lifecycle phases, mathematical split allocations, and file parser warning logs.

## Impact On Project
- Established a valid, syntactically clean database schema that is fully compatible with PostgreSQL and ready for Prisma Client generation.

---

## Version 1.3.0

2026-06-14

## Prompt Given
Refactor API architecture. Expenses should be nested under groups. Preferred route structure:
- GET /api/groups/:groupId/expenses
- POST /api/groups/:groupId/expenses
- GET /api/groups/:groupId/balances
Update route architecture and folder documentation.

## Changes Made
- Configured express routers to merge parent params.
- Restructured `expense.routes.js` to mount directly inside `group.routes.js` under the `/:groupId/expenses` path.
- Removed top-level standalone `/expenses` endpoint mount.
- Updated frontend axios requests in `expense.service.js` to target nested API routes.

## Files Added
None

## Files Modified
- [group.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/group.routes.js)
- [expense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/expense.routes.js)
- [index.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/index.js)
- [expense.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/expense.service.js)

## Reason For Change
- Align API routes under a restful structure where expenses are sub-resources of a group.

## Impact On Project
- Simplifies permission checks by checking group membership at the parent route level before executing child expense modifications.

---

## Version 1.2.0

2026-06-14

## Prompt Given
Update the project architecture. Add a dedicated balance calculation module. Backend: services/balance.service.js. Responsibilities: Net balance calculation, Who owes whom calculation, Settlement suggestions, Group balance summaries. Do not implement logic yet.

## Changes Made
- Created balance calculations service shell containing placeholders.

## Files Added
- [balance.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/balance.service.js)

## Files Modified
None

## Reason For Change
- Separate financial balancing calculations from basic CRUD transaction services.

## Impact On Project
- Implements Separation of Concerns, isolating debt minimization mathematical computations from DB access layers.

---

## Version 1.1.0

2026-06-14

## Prompt Given
Update the project architecture. Add a dedicated CSV Import module. Backend: routes/import.routes.js, controllers/import.controller.js, services/import.service.js, services/anomaly.service.js. Frontend: pages/ImportCSV.jsx, pages/ImportReport.jsx. Requirements: Keep architecture modular, CSV processing must be isolated from expense management, Prepare structure for anomaly detection and import reports.

## Changes Made
- Added `multer` dependency for upload handling.
- Implemented file uploader drag-and-drop page and audit report view.
- Added CSV validation parser service and anomaly warning scanner (flagging duplicates, outliers, split discrepancies).
- Registered routes and navigation links.

## Files Added
- [import.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/import.routes.js)
- [import.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/import.controller.js)
- [import.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/import.service.js)
- [anomaly.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/anomaly.service.js)
- [ImportCSV.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportCSV.jsx)
- [ImportReport.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportReport.jsx)

## Files Modified
- [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/package.json)
- [index.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/index.js)
- [AppRoutes.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/AppRoutes.jsx)
- [Sidebar.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/components/layout/Sidebar.jsx)

## Reason For Change
- Enable bulk uploading of spreadsheet bills with validation safeguards.

## Impact On Project
- Processing is isolated, protecting active expense tables from direct writes until manual review is approved on the frontend.

---

## Version 1.0.0

2026-06-14

## Prompt Given
Create the complete folder structure for a Shared Expense Management App. Tech Stack: React + Vite + Tailwind, Node.js + Express, PostgreSQL + Prisma. Generate: Frontend structure, Backend structure, Environment files, Routing structure, API structure. Do not write business logic yet.

## Changes Made
- Created Node.js + Express workspace config with Prisma ORM setup.
- Generated database schema configurations (`schema.prisma`) for Users, Groups, Expenses, and Splits.
- Setup route controllers, error middlewares, and auth check shells on the backend.
- Created React + Vite + Tailwind frontend workspace containing Auth Context state, custom hooks, Axios API clients, layout shells (Navbar, Sidebar), and router mapping definitions (AppRoutes, ProtectedRoute).
- Configured theme palettes and styling assets.

## Files Added
- [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/package.json)
- [.env](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/.env)
- [.env.example](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/.env.example)
- [schema.prisma](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/prisma/schema.prisma)
- [server.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/server.js)
- [app.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/app.js)
- [prisma.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/prisma.service.js)
- [auth.middleware.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/middleware/auth.middleware.js)
- [error.middleware.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/middleware/error.middleware.js)
- [validation.middleware.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/middleware/validation.middleware.js)
- [auth.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/auth.controller.js)
- [user.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/user.controller.js)
- [group.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/group.controller.js)
- [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js)
- [index.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/index.js)
- [auth.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/auth.routes.js)
- [user.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/user.routes.js)
- [group.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/group.routes.js)
- [expense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/expense.routes.js)
- [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/package.json)
- [vite.config.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/vite.config.js)
- [tailwind.config.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/tailwind.config.js)
- [postcss.config.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/postcss.config.js)
- [.env](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/.env)
- [.env.example](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/.env.example)
- [index.html](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/index.html)
- [main.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/main.jsx)
- [App.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/App.jsx)
- [index.css](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/styles/index.css)
- [AppRoutes.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/AppRoutes.jsx)
- [ProtectedRoute.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/ProtectedRoute.jsx)
- [AuthContext.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/context/AuthContext.jsx)
- [useAuth.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/hooks/useAuth.js)
- [api.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/api.js)
- [auth.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/auth.service.js)
- [group.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/group.service.js)
- [expense.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/expense.service.js)
- [Login.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Login.jsx)
- [Register.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Register.jsx)
- [Dashboard.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Dashboard.jsx)
- [Groups.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Groups.jsx)
- [GroupDetails.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/GroupDetails.jsx)
- [Expenses.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Expenses.jsx)
- [NotFound.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/NotFound.jsx)
- [Layout.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/components/layout/Layout.jsx)
- [Navbar.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/components/layout/Navbar.jsx)
- [Sidebar.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/components/layout/Sidebar.jsx)

## Files Modified
None

## Reason For Change
- Initialize workspace for Shared Expense Management App.

## Impact On Project
- Boilerplate directories and compilation configs resolve correctly, serving as foundation for the codebase.
