# ShareBill - Architectural Decisions Log

This log details the major design and architectural choices I made while developing ShareBill. I've explained the options I considered and my final decisions in the first person.

---

## 1. Relational Database: PostgreSQL + Prisma

* **Alternatives Considered:** MongoDB (with Mongoose) was my alternative. MongoDB is easy to set up and doesn't require schema migrations.
* **Final Choice:** PostgreSQL with Prisma ORM.
* **Reasoning:** I chose a relational database because financial ledgers are inherently structured. Expenses, splits, settlements, and group memberships are highly connected. If I used MongoDB, I would have to enforce these relationships manually in my code. PostgreSQL handles this at the database level with foreign keys, which prevents orphaned splits or users. Prisma made writing migrations and queries simple.

---

## 2. CSV Validation Design

* **Alternatives Considered:** Blocking the upload if a single error is found, or uploading raw data into temporary database staging tables first.
* **Final Choice:** A frontend-managed React state dashboard that receives backend validation reports containing 13 rules classified into 4 severity tiers (Critical, Review, Warning, Auto-fixed).
* **Reasoning:** Staging tables in the database require background cleanup scripts to avoid database bloat. Rejecting the whole file makes the app frustrating to use. By validation-screening the CSV in memory and returning a structured report, I can let the user resolve date ambiguities, map payer names, or edit values directly in React state before committing a clean batch transaction.

---

## 3. Refund Policy: Preserving Negative Values

* **Alternatives Considered:** Automatically converting negative amount strings to positive absolute values and just labeling them as "refunds".
* **Final Choice:** Storing negative amounts exactly as negative values in the database and setting the `isRefund: true` flag.
* **Reasoning:** I initially thought about converting negative numbers to positive values, but I realized that destroys the context of the user's raw spreadsheet. Storing it as a negative value matches the raw input. I adjusted the backend balance calculators and RAG tools to multiply balance allocations by `-1` when the `isRefund` flag is checked, which yields correct ledger totals.

---

## 4. Duplicate Detection Policy

* **Alternatives Considered:** Relying strictly on exact database checks, or letting the AI identify duplicate descriptions.
* **Final Choice:** A deterministic duplicate checker combined with Levenshtein-based similarity scoring (threshold >85%) and intra-batch checks.
* **Reasoning:** Relying on exact string matches misses minor casing or spacing differences (like "lunch at cafe" vs "Lunch at Cafe"). AI-driven duplicate checks are slow and can hallucinate. Using Levenshtein distance on normalized strings catches near-duplicates, while exact matching catches duplicate entries. I also added intra-batch checks to catch duplicates inside the uploaded file itself.

---

## 5. AI Assistant Design: Hybrid RAG & Offline Fallback

* **Alternatives Considered:** Relying entirely on the Google Gemini API, and showing an error page if it is offline.
* **Final Choice:** RAG context querying with an offline, rule-based reasoning fallback engine.
* **Reasoning:** If a user is offline or my Gemini API quota runs out, the assistant should not break. I built a local fallback engine that performs mathematical summaries (top spenders, category totals, and settlement steps) in Node, and returns answers formatted with templates. I also translated these templates into 9 languages so users can ask questions in their native language even when the external API is offline.

---

## 6. Guest Member Approach

* **Alternatives Considered:** Requiring an email address for every member, or using simple text fields for names.
* **Final Choice:** A "Soft Member" setup where name-only members are registered as Guest profiles with unique dummy emails.
* **Reasoning:** Forcing email registrations creates friction—sometimes you just want to split a bill with a friend who doesn't use the app. Simple text fields for names make it hard to link expenses or track who owes whom. Creating guest profiles with generated emails allows them to participate in splits immediately, and if they sign up later, I can easily map their guest history to their new account.

---

## 7. Security and Privacy Decisions

* **Alternatives Considered:** Allowing database queries across groups, or relying on client-side routing blocks to hide other groups.
* **Final Choice:** Database-level group membership enforcement on all backend API routes and RAG prompts.
* **Reasoning:** Client-side blocks are easily bypassed. To protect financial data, I enforce membership checks at the controller level on every API request. If the user ID in the JWT is not in the `GroupMember` table for the requested group, the backend returns a `403 Forbidden` error. In the AI assistant, the RAG prompts only query data from the requested group ID, keeping other groups completely isolated.
