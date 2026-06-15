# ShareBill - Architectural Decisions Log (DECISIONS.md)

This log details the key architectural, technical, and UX design decisions made during the development of the ShareBill application. It outlines the problem contexts, options considered, trade-offs evaluated, and the rationale behind each final decision.

---

## 1. AI Suggestion Generation: Hybrid API + Deterministic Offline Fallback

* **Context**: The application required an AI Resolution Assistant to analyze spreadsheet import errors and suggest resolutions for all 13 supported anomaly types.
* **Options Considered**:
  1. **Option A (Pure API Integration)**: Rely exclusively on Google's Gemini 1.5 Flash API. If the key is missing or the API returns an error, block suggestions and show a connection error message.
  2. **Option B (Pure Hardcoded Rule Engine)**: Bypass external AI APIs entirely. Code a rule-based mapper in JavaScript to inspect errors and output structured suggestion cards.
  3. **Option C (Hybrid Architecture)**: Attempt to call the Gemini API using structured JSON schema instructions (`responseMimeType: "application/json"`). If the API key is not configured (or if the endpoint fails due to rate limits or network issues), automatically fall back to a local, deterministic rule-based JavaScript execution engine that mimics the exact JSON schema.
* **Decision Chosen**: **Option C (Hybrid Architecture)**
* **Rationale**: Production environments must be highly resilient. Relying solely on external APIs risks downtime if API quotas are exhausted or keys are revoked. Implementing the fallback engine guarantees that the "AI Suggestions" tab remains functional, fast, and informative under all conditions, while still leveraging AI capabilities for rich explanation formatting when online.

---

## 2. Validation Safety Rules: Programmatic JS Filters vs. AI Prompt Tuning

* **Context**: Safety constraints mandate that suggested changes with confidence < 90%, row deletion/skips, member merges, or lifecycle violations must never be automatically applied via the "Apply All Safe AI Suggestions" button.
* **Options Considered**:
  1. **Option A (Prompt Engineering)**: Instruct the Gemini model inside the system prompt to check these boundaries and output `safeToAutoApply: true/false` directly in the generated JSON.
  2. **Option B (Programmatic Post-Processing)**: Let the AI generate suggested parameters, but pipe the resulting suggestions through a strict, sandboxed JavaScript validation function (`calculateSuggestionSafety`) that overwrites the `safeToAutoApply` flag based on hardcoded rules before returning the API payload.
* **Decision Chosen**: **Option B (Programmatic Post-Processing)**
* **Rationale**: LLM prompt boundaries can be bypassed or hallucinated. For financial ledgers where data integrity is critical, trusting generative models to enforce absolute safety rules is high-risk. Programmatic JS checks provide a mathematical guarantee that no skip, merge, or lifecycle overwrite is ever auto-applied, regardless of what the LLM outputs.

---

## 3. Spreadsheet Data Resolution: Transient UI Session State vs. Database Staging Tables

* **Context**: When validation issues are identified (e.g. duplicate rows, ambiguous dates, missing names), the user needs to resolve them before the expenses are saved.
* **Options Considered**:
  1. **Option A (Database Staging)**: Write uploaded CSV rows to a temporary database staging table (e.g., `ImportStagingRow`). Allow the frontend to update these staging rows directly via API calls, then run a backend migration to push them to `Expense` tables once the user approves.
  2. **Option B (Transient React Session State)**: Read and parse the CSV on upload. Return the validation report and suggestions to the React client. Maintain the resolution data in the React state. When the user clicks "Approve and Import", submit the modified/resolved rows in a single batch API call.
* **Decision Chosen**: **Option B (Transient React Session State)**
* **Rationale**: Database staging tables introduce database bloat, complicate the schema, and require cron cleanups for abandoned import runs. React state session management is high-performing, keeps the PostgreSQL database free of half-clean records, and provides an instant UI feedback loop since resolving an issue updates metrics in real-time.

---

## 4. Member Management: Soft Lifecycle Timeline Bounds vs. Cascade Deletes

* **Context**: When a user leaves a group, their past expenses and debts must remain intact, but they should be excluded from future expense splits.
* **Options Considered**:
  1. **Option A (Cascade Deletion)**: Delete the user from the group. Recalculate or drop their past transaction participations.
  2. **Option B (Hard-coded Flags)**: Use an `isActive` boolean. If inactive, exclude them from splits.
  3. **Option C (Soft Membership Timeline with `joinedAt` and `leftAt`)**: Introduce `joinedAt` and `leftAt` timestamps in the `GroupMember` model. Expenses only split among members whose active membership window overlaps with the expense date.
* **Decision Chosen**: **Option C (Soft Membership Timeline)**
* **Rationale**: Cascade deletes corrupt ledger history. Simple boolean flags don't handle backdated historical CSV uploads. A soft membership timeline allows backdated expenses to split only among members who were in the group at *that point in time*, keeping balances correct.

---

## 5. Payer and Participant Name Matching: Case-Insensitive Normalization with Guest Fallback

* **Context**: CSV files often contain spelling or casing variations (e.g. `priya` instead of `Priya`) and names of non-group members.
* **Options Considered**:
  1. **Option A (Strict Rejection)**: Reject any rows containing names that do not exactly match active group members.
  2. **Option B (Auto-Mapping & Guest Creation)**: Normalise case-insensitive matches automatically. For names that have no match, flag a warning and prompt the user to map them or automatically create guest profiles with dummy emails.
* **Decision Chosen**: **Option B (Auto-Mapping & Guest Creation)**
* **Rationale**: User friction is reduced.ニックネームや casing differences are handled without blocking imports. Auto-creating guests with unique dummy emails allows transactions to import immediately, and their profiles can be linked to real accounts later.
