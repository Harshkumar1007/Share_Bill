# ShareBill - AI Integration & Usage Report

This document records the AI tools I used during the development of ShareBill, how I used them, the prompts I wrote, and the deployment issues and AI mistakes I had to debug along the way.

---

## 1. How I Used AI Tools

### ChatGPT
I used ChatGPT as a sounding board during the early design stages. It helped me with:
* **Architecture discussions:** Bouncing ideas on how to model the database relationships using PostgreSQL and Prisma, and deciding how to store expense splits.
* **CSV compliance discussions:** Planning how to structure the 13 CSV validation checks and how to map severities.
* **Deployment troubleshooting:** Working through database connection errors and container setups.
* **Documentation refinement:** Polishing the layout of my deployment and evolution logs.

### Claude
I used Claude to double-check my business logic and brainstorm options. It helped me with:
* **Logic validation:** Reviewing my greedy cash-simplification algorithm to make sure it handles balance edge cases and round-offs correctly.
* **Alternative implementation ideas:** Evaluating whether to store CSV uploads in database staging tables (transient) versus holding them in frontend React state (which I chose because it avoids database bloat).

### Antigravity
Antigravity was my active pair programmer throughout the project. It helped me with:
* **Code generation:** Writing the Prisma database queries, the Express routes, and the React front-end page layouts.
* **Refactoring:** Cleaning up imports, reorganizing directories, and updating components.
* **Feature implementation:** Integrating the Gemini 1.5 Flash API RAG framework, coding the offline 9-language fallback reasoning engine, and implementing specialized AI intent handlers.

---

## 2. Key Prompts

### A. CSV Import Anomaly Analysis
```text
You are an AI Resolution Assistant for the ShareBill expense manager app.
Your task is to analyze validation issues from a CSV upload and suggest resolutions.

Inputs:
- validationIssues: ${JSON.stringify(validationIssues, null, 2)}
- csvRows: ${JSON.stringify(csvRows.map(r => ({ rowNumber: r.rowNumber, record: r.record })), null, 2)}
- groupMembers: ${JSON.stringify(groupMembers.map(m => m.user?.name || m.name))}

Provide suggested resolutions for all issues. You MUST support:
- DUPLICATE_CONFIRMED (exact duplicates)
- POSSIBLE_DUPLICATE (similarity >85%)
- AMBIGUOUS_DATE (e.g. 04-05-2026)
- UNKNOWN_PAYER (payer not in group)
- PARTICIPANTS_MISSING (split participant not in group)
- FUTURE_DATE (dates beyond current date)
- MULTI_CURRENCY_IMPORT (mismatched currency codes)
- SPLIT_MISMATCH (splits don't sum to total)

Output MimeType must be application/json.
```

### B. AI Assistant System Prompt
```text
You are the ShareBill Financial Intelligence Agent.
You have access to live database context about a user's expense sharing group.

Available Context:
- Group Info: name, creator, members (with joinedAt/leftAt timeline)
- Expenses: description, amount, currency, date, splits, paidBy, isRefund
- Settlements: who paid whom, amounts, dates
- Net Balances: calculated standings (positive is owed money, negative owes money)
- Simplified Debt Minimization Plan: optimal cash transfers

Instructions:
1. Answer any financial query with high precision using the live context.
2. Format lists, tables, and settlement instructions cleanly using markdown.
```

---

## 3. Four Real AI Mistakes & How I Fixed Them

### Mistake 1: Prisma Command Permission Denied on Linux
* **The Error:** The AI generated a build script in my `package.json` that ran `prisma generate` directly. When I deployed to Render (which runs on Linux), the build failed with: `sh: 1: prisma: Permission denied`.
* **How I Fixed It:** I prefix all Prisma commands in `package.json` with `npx` (e.g., `npx prisma generate` and `npx prisma migrate deploy`). This tells the build environment to run the commands using the Node Package Executor, bypassing binary permission issues.

### Mistake 2: Railway Deployment Assumptions
* **The Error:** The AI assumed the project would deploy to Railway and generated configuration instructions, start-up logic, and a `RAILWAY_DEPLOYMENT.md` guide. However, my final deployment architecture uses Render for the backend and Vercel for the frontend.
* **How I Fixed It:** I audited the codebase, deleted `RAILWAY_DEPLOYMENT.md`, updated all configuration templates to target Render, and standardized the setup scripts for my active deployment environment.

### Mistake 3: Converting Negative Refund Amounts
* **The Error:** In early iterations of the CSV engine, the AI-generated code automatically converted any negative amount in a spreadsheet (like a `-30.00` refund) into a positive absolute value (`30.00`) and flagged it as a refund. This was problematic because it lost the original negative sign representation from the raw spreadsheet.
* **How I Fixed It:** I updated `csvValidator.service.js` and `import.controller.js` to preserve the original negative refund amounts exactly as negative values in the database and in all import statistics. When the backend calculates balances, it checks the `isRefund` flag and multiplies by `-1` dynamically in calculation standings.

### Mistake 4: Committing node_modules to Git
* **The Error:** The AI suggested keeping local backups of dependency folders or relying on them during the deployment pipeline. This was a bad assumption.
* **How I Fixed It:** I learned that **node_modules should never be committed or relied upon during deployment because build servers generate dependencies automatically.** I added `node_modules` to my `.gitignore` files, ensuring that Render and Vercel fetch clean, platform-specific packages from scratch using `package.json` configurations.

---

## 4. Deployment Debugging & Troubleshooting

### Neon PostgreSQL Connection Issues
* **The Issue:** Neon's serverless databases automatically sleep when they aren't active. When the app made its first database request after some time, it would hang or throw a `P1001: Can't reach database server` error because the database took a few seconds to spin up.
* **The Fix:** I updated my database client initialization to perform up to three retries with a short delay if the connection fails on start. This gives Neon enough time to wake up.

### Render Deployment Debugging
* **The Issue:** Render's free tier has strict memory limits, and the initial start command was running slow migrations and generating client files simultaneously, causing container timeouts.
* **The Fix:** I split the steps cleanly: `npx prisma generate` runs during the **Build Command** phase, and `npx prisma migrate deploy && npm start` runs during the **Start Command** phase, minimizing start-up memory usage.

### Vercel Build Troubleshooting
* **The Issue:** When deploying my Vite frontend on Vercel, requests to sub-routes (like `/groups/some-id`) returned a `404 Not Found` on refresh. This happened because Vercel was looking for a physical file instead of letting React Router handle the path.
* **The Fix:** I added a `vercel.json` file in the frontend folder with rewrite rules that redirect all client requests to `index.html` so React Router can process them.
