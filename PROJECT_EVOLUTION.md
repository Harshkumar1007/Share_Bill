# Project Evolution Log

This file tracks every architectural decision, feature addition, refactor, and AI-generated change during the development of the Shared Expense Management App.

---

## Version 1.30.0

2026-06-15

## Prompt Given
Implement a Production-Grade CSV Import Validation & Resolution Engine.

## Changes Made
- Developed backend CSV validation engine [csvValidator.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/csvValidator.service.js) and [importValidator.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/importValidator.controller.js) with rules, severities, lifecycles, and conversions.
- Implemented AI import intelligence layer [aiImportAnalysis.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/aiImportAnalysis.service.js) summarizing import totals, duplicate patterns, financial anomalies, and category metrics.
- Mounted route mappings `/api/expenses/import/validate` and `/api/expenses/import/commit-clean` inside [globalExpense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/globalExpense.routes.js).
- Updated React import services [import.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/import.service.js).
- Built high-fidelity interactive review dashboard page [ImportCSV.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportCSV.jsx) featuring tabs for Warnings, Review Required, Auto-fixed, and Rejected rows with options for duplicate resolution, date format ambiguity resolution, payer mapping dropdowns, and conversion of expense settlements.

## Files Added
- [aiImportAnalysis.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/aiImportAnalysis.service.js)

## Files Modified
- [globalExpense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/globalExpense.routes.js)
- [import.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/import.service.js)
- [ImportCSV.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportCSV.jsx)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Validation Rules & Engine Specifications
- **Severity Levels**:
  - **CRITICAL**: Rejects row. E.g. Zero Amount, Split Percentage not 100%, Missing Required Fields (date, description, amount, paid_by), Invalid Split Types.
  - **REVIEW_REQUIRED**: User must intervene. E.g. Missing Payer, Settlement Detected as Expense, Ambiguous Date formats, Equal Split Conflicts.
  - **WARNING**: Informational issues. E.g. Duplicate Expenses, Unknown Members, Negative Amount (Treat as Refund), Missing Currency, Multiple Currencies, Date Normalizations, Member Lifecycle violations.
- **Resolution Policies**:
  - **Duplicate Policy**: Choose Keep Existing (skips import), Import New, or Keep Both.
  - **Name Normalization**: Case-insensitive names are auto-corrected and logged.
  - **Guest Member Handling**: Auto-create user profiles with unique domain email wrappers when non-members are imported.
  - **Refund Policy**: Negative amounts converted to positive absolute refund value with WARNING.
  - **Settlement Policy**: Convert to settlement suggested if keyword patterns ("settled", "reimbursement", "refund transfer", "paid back") are detected.
  - **Date Ambiguity**: Choose formatting interpretation (MM-DD-YYYY vs DD-MM-YYYY).
  - **Lifecycle Policy**: Flag warning if expense date lies outside member's join/left bounds.

---

## Version 1.29.0

2026-06-15

## Prompt Given
Create a Financial Intelligence Agent for the Shared Expense Management App.

## Changes Made
- Created backend data retrieval tool service [aiTools.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/aiTools.service.js) querying Group, Members, Expenses, Splits, settlements, trip breakdowns, category totals, and anomaly statistics via Prisma.
- Developed AI agent execution core [aiAgent.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/aiAgent.service.js):
  - Bundles the entire group profile into a single prompt context.
  - Queries Google's Gemini 1.5 Flash REST API securely using `process.env.GEMINI_API_KEY` with context memory support (sending previous message threads).
  - Implements an offline **Local Fallback Reasoning Engine** that parses query keyword strings, computes real-time mathematics dynamically on live database records, and outputs translations in 9 localized languages (English, Hindi, Bengali, Marathi, Gujarati, Tamil, Telugu, Malayalam, Punjabi).
- Built AI transaction query history log database [aiLog.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/aiLog.service.js) writing query parameters, languages, response times, and timestamps to [ai_queries.json](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/data/ai_queries.json).
- Implemented `queryFinancialAgent` controller in [ai.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/ai.controller.js) validating group membership limits (Privacy/Security) and tracking response speed.
- Registered backend route `/api/ai/query` inside [ai.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/ai.routes.js) and mounted it in the main index router [index.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/index.js).
- Built React client service [ai.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/ai.service.js) wrapping axios queries.
- Created the AI Assistant Page [AIAssistant.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/AIAssistant.jsx) containing:
  - Configuration drop selectors (pick Group and Language).
  - Chat stream displaying User and Assistant messages, suggested prompt bubbles, typing status indicator, and automatic scroll-to-bottom effects.
  - Custom React markdown parser rendering lists, bold highlights, blockquotes, and code elements.
  - Interactive custom widgets rendering insights list tags, responsive tabular sheets, and flow-direction arrow plans for simplified suggested settlements.
- Integrated route path `/ai-assistant` into sidebar navigation list [Sidebar.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/components/layout/Sidebar.jsx) and registered path mapping in [AppRoutes.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/AppRoutes.jsx).

## Files Added
- [aiTools.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/aiTools.service.js)
- [aiLog.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/aiLog.service.js)
- [aiAgent.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/aiAgent.service.js)
- [ai.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/ai.controller.js)
- [ai.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/ai.routes.js)
- [ai.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/ai.service.js)
- [AIAssistant.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/AIAssistant.jsx)

## Files Modified
- [index.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/index.js)
- [Sidebar.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/components/layout/Sidebar.jsx)
- [AppRoutes.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/AppRoutes.jsx)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Fulfill requirements to deliver an intelligent conversational finance agent that reasons over group expenses, computes minimum-transaction settlements, summarizes trip events, respects group membership scopes, logs operations, and provides interactive UI visual aids in 9 languages.

## Impact On Project
- Empowers group members to explore and understand their financial transactions using natural language, calculate settlement steps, and run analytics.

---

## Version 1.28.0

2026-06-15

## Prompt Given
Create a CSV Import Preview & Duplicate Detection Engine.

## Changes Made
- Upgraded the backend CSV parser helper in [csvParser.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/csvParser.service.js) to support the new 9-column CSV format (`date,description,paid_by,amount,currency,split_type,split_with,split_details,notes`).
- Added a Levenshtein distance similarity scoring helper to [csvParser.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/csvParser.service.js) to compare descriptions case-insensitively, stripping special characters.
- Implemented `parseCSVForPreview(csvContent, groupMembers, existingExpenses)` with validations (date, description, amount, split type, paid_by, and split_with participant membership in group) and classification logic:
  - `VALID`: correctly formatted rows with no duplicates.
  - `DUPLICATE`: same date, amount, payer (user ID), and description exactly matching an existing database expense.
  - `POSSIBLE_DUPLICATE`: same amount, same payer, and description similarity score > 85%.
  - `INVALID`: missing/incorrect fields or non-member names.
- Updated the `importPreview` controller in [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js) to validate group existence, load active group members and all existing expenses, run the updated preview validation engine, log a `CSV_PREVIEWED` activity audit trail, and clean up temporary uploaded files.
- Redesigned the frontend [ImportCSV.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportCSV.jsx):
  - Added a dropdown selector to choose a Group before processing files.
  - Rendered a 5-column metric summary dashboard (Total, Valid, Possible Duplicates, Exact Duplicates, Invalid).
  - Replaced multiple split tables with a single unified, sorted table tracking Row Number, Description, Amount, Paid By, Status, and Reason/Inline Errors.
- Expanded the client service wrapper `previewImport` in [import.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/import.service.js) to pass the selected group ID alongside the multipart file payload.

## Files Added
None

## Files Modified
- [csvParser.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/csvParser.service.js)
- [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js)
- [import.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/import.service.js)
- [ImportCSV.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportCSV.jsx)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Fulfill requirements to build an advanced duplicate detection engine that cross-references uploaded spreadsheets with database records, highlights similar descriptions via Levenshtein scores, and renders a unified review table.

## Impact On Project
- Eliminates duplicate entries and enhances user control during bulk spreadsheet imports by showing status details and inline errors.

---

## Version 1.27.0

2026-06-15

## Prompt Given
Integrate CSV imports with Activity Log.

When CSV import completes:
- Create activity entry
- Store:
  imported rows count
  group name
  imported by user
  timestamp

## Changes Made
- Integrated the database-connected CSV import API with the local Activity Log dispatcher inside [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js):
  - Configured the `logActivity` invocation parameters to pass a detailed metadata structure.
  - Mapped specific transaction elements inside the log details payload:
    - `importedRowsCount`: Total valid expense rows successfully saved.
    - `groupName`: Name of the group target.
    - `importedByUser`: Name of the authenticated operator importing files.
    - `timestamp`: Date-time check string recorded on final commit completion.

## Files Added
None

## Files Modified
- [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Fulfill requirements to record clear audits of bulk spreadsheet imports, capturing users, sizes, groups, and timings securely.

## Impact On Project
- Enhances tracking by populating activity streams with structured metadata, verifying the size of uploads and identifying who executed the uploads.

---

## Version 1.26.0

2026-06-15

## Prompt Given
Create Final Import API.

Requirements:
- Save validated CSV rows as expenses
- Associate expenses with selected group
- Create expense splits automatically
- Skip invalid rows
- Return import summary

Response:
- imported count
- skipped count
- error list

## Changes Made
- Modified the `importCSV` controller in [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js) to implement the database persistence engine:
  - Fetches the targeted `groupId` from `req.body` and verifies the group and its active members exist.
  - Processes valid CSV rows inside a database transaction block (`prisma.$transaction`):
    - Dynamically resolves payer identities (`paidBy` column) by matching database emails or names, falling back to the authenticated user ID.
    - Divides expense amounts equally across all active group members, handling rounding differences.
    - Saves the `Expense` record and executes a bulk `createMany` query to save split details.
  - Skips and tracks invalid rows (either from initial syntax checks or database errors), incrementing `skippedCount` and appending error summaries.
  - Deletes uploaded files inside a `finally` block to keep storage clear.
  - Logs a `CSV_IMPORTED` audit trail in the activities ledgers.
  - Returns: `{ success: true, importedCount, skippedCount, errors }`.

## Files Added
None

## Files Modified
- [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Complete the end-to-end bulk expense import workflow by persisting valid records, auto-allocating splits, skipping formatting errors, and returning detailed logs.

## Impact On Project
- Users can import multiple expenses in a single upload, resolving payer IDs and splitting debts equally among group members.

---

## Version 1.25.0

2026-06-15

## Prompt Given
Create CSV Import page.

Features:
- Drag and drop upload area
- File picker
- Upload CSV
- Call preview API
- Show preview table
- Show validation errors

Use Tailwind UI.

## Changes Made
- Rewrote the CSV import page [ImportCSV.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportCSV.jsx) to display inline upload previews:
  - Drag and drop zone supporting drop actions and `.csv` extensions, and a standard file picker with validation messages.
  - Integration with `importService.previewImport` (calling the new `POST /api/expenses/import/preview` API endpoint).
  - Summary metrics display cards (Total Rows, Valid Rows, Invalid Rows) styled with glassmorphic cards and dynamic icons.
  - Interactive table of valid records showing Row Number, Description, Amount, Paid By, and Date.
  - Alert warnings and auditing section for invalid records detailing row numbers, raw line previews, and individual validation error badges.
  - Inline reset action button to clear the preview and upload another file.
- Added mapping for `previewImport` in the frontend client [import.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/import.service.js) pointing to the `/expenses/import/preview` backend route.

## Files Added
None

## Files Modified
- [ImportCSV.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportCSV.jsx)
- [import.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/import.service.js)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Fulfill requirements to build an interactive CSV validation dashboard for users, highlighting spreadsheet cell errors early before any records are committed.

## Impact On Project
- Enhances user experience by visualizing bulk billing uploads inline, displaying formatting errors clearly, and eliminating blind database insert transactions.

---

## Version 1.24.0

2026-06-15

## Prompt Given
Create Import Preview API.

Requirements:
- Preview parsed CSV data
- Show:
  total rows
  valid rows
  invalid rows
  validation errors
- Do not save data to database

Response should be suitable for frontend preview screen.

## Changes Made
- Implemented and exported the `importPreview` controller function in [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js):
  - Parses uploaded CSV content using the reusable parsing service.
  - Extracts validation metadata and maps parsed entries into separate `validRows` and `invalidRows` arrays (containing detailed error lists for bad formats).
  - Returns a summary metrics payload: `{ totalRows, validCount, invalidCount }`.
  - Integrates disk cleanup inside a `finally` block to remove files synchronously from the `./uploads` directory.
  - Excludes database persistence operations (ensuring it is a pure-preview action).
- Registered the endpoint `POST /api/expenses/import/preview` inside [globalExpense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/globalExpense.routes.js), mapping it to JWT authentication and Multer file upload handlers.

## Files Added
None

## Files Modified
- [globalExpense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/globalExpense.routes.js)
- [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Fulfill requirements to supply frontend clients with structured layout previews of spreadsheet contents, highlighting row errors before final commit database transactions are executed.

## Impact On Project
- Enables the UI to display import validation errors on specific cells or rows, allowing users to make adjustments before submission.

---

## Version 1.23.0

2026-06-15

## Prompt Given
Create CSV Import API.

Requirements:
- POST /api/expenses/import
- Accept CSV file upload
- Use Multer for file uploads
- Store file in temporary uploads folder
- Validate file type (.csv only)
- Return parsed rows count

Do not create expenses yet.
Only upload and parse CSV.

## Changes Made
- Configured local Multer storage inside [globalExpense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/globalExpense.routes.js):
  - Setup disk destination mapping to a project-level temporary `./uploads` directory.
  - Defined strict file type filter rejecting any files without a `.csv` extension with a 400 Bad Request error.
- Exposed the route `POST /api/expenses/import` secured by JWT authentication middleware (`protect`).
- Implemented and exported the `importCSV` controller in [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js):
  - Reads the uploaded file content asynchronously.
  - Passes raw CSV strings to `csvParser.service.js` to extract JSON row collections.
  - Sums the counts of valid and invalid rows to determine the `parsedRowsCount`.
  - Integrates disk storage cleanup via `fs.unlinkSync` inside a `finally` block, ensuring temporary upload files are completely removed from disk under all success or failure outcomes.

## Files Added
None

## Files Modified
- [globalExpense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/globalExpense.routes.js)
- [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Fulfill requirements to expose a secure and sandboxed CSV parsing endpoint, validate formats, and manage server disk limits.

## Impact On Project
- Empowers user client interfaces to preview raw counts and check column compatibility of bulk spreadsheets before initiating database creation transactions.

---

## Version 1.22.0

2026-06-15

## Prompt Given
Create CSV parsing service.

Requirements:
- Read uploaded CSV file
- Convert rows into JSON
- Validate required columns:
  description
  amount
  paidBy
  date
- Return valid rows and invalid rows separately

Create reusable service layer.

## Changes Made
- Created a new reusable CSV parsing service [csvParser.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/csvParser.service.js) offering:
  - Header column presence checking for required fields: `description`, `amount`, `paidBy`, and `date`.
  - Quoted string CSV cell parsing support to prevent strings containing commas from breaking column alignment.
  - Formatting and boundary validation checks: non-empty descriptions, positive numeric amounts, non-empty paidBy strings, and standard valid dates.
  - Row separation returning arrays of valid JSON records and invalid records (each with specific row numbers and lists of validation errors).

## Files Added
- [csvParser.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/csvParser.service.js)

## Files Modified
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Introduce a robust and reusable parser utility in the service layer to process raw CSV expense uploads, validate records early, and categorize formatting anomalies clearly.

## Impact On Project
- Implements a generic CSV import engine that can be easily plugged into Express endpoints or file-processing routes, returning fine-grained validation logs.

---

## Version 1.21.0

2026-06-15

## Prompt Given
Prepare the backend for Render deployment and fix all Render compatibility issues.

Current Issue:
Render build fails with:
"sh: 1: prisma: Permission denied"

Tasks:
1. Review package.json and update scripts for Render best practices.
   - Keep "start" focused on starting the server only.
   - Do not run migrations inside package.json start script.
   - Ensure Prisma commands work correctly in Linux environments.
2. Make the backend fully compatible with Render, Prisma, PostgreSQL (Neon).
3. Add Node.js version configuration: Use Node.js 20 LTS, add appropriate engines configuration.
4. Verify Prisma CLI installation, @prisma/client installation, Prisma generate execution, Prisma migrate deploy execution.
5. Generate deployment-ready configuration (Build Command, Start Command, Environment Variables).
6. Update DEPLOYMENT.md, PROJECT_EVOLUTION.md.

## Changes Made
- Updated [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/package.json) scripts:
  - Changed the `"build"` script to `"npx prisma generate"` which runs the Prisma compilation using `npx`, bypassing the shebang permission wrapper issue in Linux environments (`sh: 1: prisma: Permission denied`).
  - Restored the `"start"` script to start-only behavior (`"node src/server.js"`) as requested.
- Confirmed the Node.js 20 engines configuration (`"engines": { "node": "20.x" }`) is correctly set in `package.json`.
- Rewrote [DEPLOYMENT.md](file:///c:/Users/ASUS/Desktop/Share_Bill/DEPLOYMENT.md) to provide targeted Render configuration guides, listing the recommended build command (`npm install && npm run build`), the start command (`npx prisma migrate deploy && npm start`), required environment variables, and verification checklists.

## Files Added
None

## Files Modified
- [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/package.json)
- [DEPLOYMENT.md](file:///c:/Users/ASUS/Desktop/Share_Bill/DEPLOYMENT.md)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Resolve permission bugs on Linux containers, satisfy separation of concerns between build and startup tasks, and configure runtime versioning.

## Impact On Project
- Eliminates Render deployment blockages, standardizes build configurations, and provides production-ready deployment scripts.

---

## Version 1.20.0

2026-06-15

## Prompt Given
Deploy the backend to Railway.

Requirements:
* Use PostgreSQL database provided by Railway
* Configure environment variables
* Configure Prisma for production
* Run migrations automatically during deployment
* Verify health endpoint works

Generate:
* RAILWAY_DEPLOYMENT.md
* Production environment variables list
* Deployment checklist

After deployment:
* Test GET /api/health
* Verify database connectivity
* Verify Prisma migrations

Update PROJECT_EVOLUTION.md.

## Changes Made
- Modified the start script in [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/package.json) to run `npm run db:migrate` before spawning Node, enabling automated database migrations on Railway container starts.
- Generated [RAILWAY_DEPLOYMENT.md](file:///c:/Users/ASUS/Desktop/Share_Bill/RAILWAY_DEPLOYMENT.md) at the workspace root, containing deployment instructions, checklist, database settings, and production environment variables.

## Files Added
- [RAILWAY_DEPLOYMENT.md](file:///c:/Users/ASUS/Desktop/Share_Bill/RAILWAY_DEPLOYMENT.md)

## Files Modified
- [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/package.json)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Automate deployment pipelines on Railway, ensuring the PostgreSQL database migrations are run safely and health endpoints report services status accurately.

## Impact On Project
- Eliminates manual release step friction by coupling migration deployments directly into host container initialization workflows.

---

## Version 1.19.0

2026-06-15

## Prompt Given
Prepare the backend for production deployment.

Requirements:
* Add health check endpoint: GET /api/health
* Validate required environment variables at startup
* Configure production-ready CORS
* Add centralized error handling
* Add request logging
* Add graceful shutdown handling
* Ensure Prisma client is properly initialized and disconnected

Generate:
* Deployment-ready backend configuration
* Health check route
* Production environment template

Do not modify business logic.
Update PROJECT_EVOLUTION.md.

## Changes Made
- Created environment variable validation module [validateEnv.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/config/validateEnv.js) checking for `DATABASE_URL` and `JWT_SECRET` at server startup to prevent silent failures.
- Added custom request logging middleware [logger.middleware.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/middleware/logger.middleware.js) recording HTTP method, path, status code, and response time to stdout.
- Updated [server.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/server.js) to run env validation before mounting the app, import configuration synchronously, and register handlers for SIGTERM/SIGINT signals for graceful HTTP server closure and Prisma client database disconnection.
- Created `GET /api/health` endpoint in [app.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/app.js) querying the database (`SELECT 1`) to check status, returning detailed UP/DOWN health metrics with status 200 or 503.
- Upgraded backend CORS policy to dynamically validate origins against wildcard subdomain formats (e.g. `*.vercel.app`) and multiple comma-separated entries in `CORS_ORIGIN`.
- Added standard production npm scripts (`build` for prisma compilation and `db:migrate` for non-interactive schema migration deployment) inside [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/package.json).
- Generated [DEPLOYMENT.md](file:///c:/Users/ASUS/Desktop/Share_Bill/DEPLOYMENT.md) guide and [.env.production.example](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/.env.production.example) configuration template.

## Files Added
- [validateEnv.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/config/validateEnv.js)
- [logger.middleware.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/middleware/logger.middleware.js)
- [.env.production.example](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/.env.production.example)
- [DEPLOYMENT.md](file:///c:/Users/ASUS/Desktop/Share_Bill/DEPLOYMENT.md)

## Files Modified
- [server.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/server.js)
- [app.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/app.js)
- [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/package.json)
- [PROJECT_EVOLUTION.md](file:///c:/Users/ASUS/Desktop/Share_Bill/PROJECT_EVOLUTION.md)

## Reason For Change
- Fulfill backend production deployment readiness, ensuring security, visibility, database connection safety, and fast startup failure tracking.

## Impact On Project
- Provides hosting platform compatibility, error metrics, audit trails via stdout, and dynamic access control.

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
