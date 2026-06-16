# ShareBill - Project Evolution Log

This file tracks how the ShareBill project evolved from a simple expense tracker into a production-grade ledger engine. Instead of a long list of version numbers and commits, I have summarized the development into 4 core phases.

---

## Phase 1 – Core Expense Management

In the first phase, I built the base database architecture and backend Express server to handle basic expense tracking.
* **Prisma Schema Setup:** Defined the schema for PostgreSQL using Prisma. Designed models for `User`, `Group`, `GroupMember`, `Expense`, `ExpenseSplit`, and `Settlement`.
* **Split Calculations:** Wrote calculations to handle splitting expenses equally, by custom percentage shares, exact currency figures, and ratio-based weights.
* **Debt Simplification:** Coded a greedy minimization algorithm. It analyzes everyone's net standings (total paid minus total split weights) and simplifies debts, generating a transfer plan with the absolute minimum number of peer-to-peer payments.
* **Authentication:** Set up JSON Web Tokens (JWT) to secure user logins and sessions.
* **Vite React UI:** Created the core dashboard pages where users can register, create groups, add members, record expenses, and log settle ups.

---

## Phase 2 – CSV Import Engine

In this phase, I implemented the spreadsheet ingestion pipeline so users can import large lists of expenses at once.
* **CSV Parsing:** Configured Multer for server uploads and wrote parser scripts to validate columns.
* **13 Validation Rules:** Built a validation pipeline that screens data for casing issues, date format ambiguities, duplicate items, out-of-group payers, split weight mismatches, and multi-currency formats.
* **Compliance Handling:** 
  * Preserved negative refund amounts exactly as negative values in the database, adjusting balance sums using the `isRefund` flag.
  * Added intra-batch duplicate checks to catch double entries inside the uploaded file itself.
  * Configured auto-creation of Guest members with generated emails for name-only registrations.
* **Dashboard Tab Deck:** Built a React review dashboard containing tabs for Warnings, Review Required, Auto-fixed, Rejected, and AI Suggestions. This allows users to map names, select date interpretations, or edit cells directly in UI state before saving the rows.

---

## Phase 3 – AI Assistant

In this phase, I integrated a RAG (Retrieval-Augmented Generation) assistant to answer questions about group finances.
* **RAG Context Queries:** Wrote services to retrieve active group expense logs, categories, balances, and simplified debt plans, formatting them into a prompt context.
* **Gemini REST API:** Connected the backend to Google's Gemini 1.5 Flash API with query memory to support follow-up questions.
* **Offline Fallback Engine:** Built an offline rule-based reasoning engine. If the Gemini API is offline or missing a key, the backend computes top spenders, category totals, and minimum transfer steps locally.
* **9-Language Support:** Formatted the local fallback outputs using templates translated into English, Hindi, Bengali, Marathi, Gujarati, Tamil, Telugu, Malayalam, or Punjabi.
* **Specialized Intent Handlers:** Coded dedicated matches to identify queries about refunds (`REFUND_ANALYSIS`), transaction lists (`EXPENSE_HISTORY`), high-debt spenders (`DEBT_CREATOR_ANALYSIS`), step-by-step settlement math (`SETTLEMENT_EXPLANATION`), or detailed trip summaries (`DETAILED_TRIP_SUMMARY`).

---

## Phase 4 – Deployment & Production Readiness

The final phase was focused on database hosting, backend container deployment, frontend compilation, and code cleanup.
* **Neon PostgreSQL hosting:** Migrated from a local database to serverless PostgreSQL hosted on Neon.
* **Render Backend Service:** Deployed the Node backend to Render. I resolved permissions issues running Prisma on Linux build containers by prefixing all commands with `npx` (such as `npx prisma generate` and `npx prisma migrate deploy`).
* **Vercel Frontend Hosting:** Deployed the Vite React bundle to Vercel and set up routing rewrite rules in `vercel.json` to handle client-side URLs without getting 404s.
* **Security & Cleanups:** Locked down routes so users can only view or query groups they are members of. Deleted duplicate guides, unused scripts, and Railway-specific configurations.
