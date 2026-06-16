# ShareBill - Scope Specifications

This document defines what features are currently implemented in the ShareBill application and outlines what enhancements I plan to work on next.

---

## 1. Implemented Features

These features are fully completed, tested, and active in the production codebase:

* **Authentication:** User registration and secure login pathways utilizing JWT (JSON Web Token) tokens for route access verification.
* **Groups:** Ability to create groups, add descriptions, and manage participant lists. It supports member timeline tracking (`joinedAt` and `leftAt` timestamps) so members are only included in bill splits if they were in the group on the transaction date.
* **Expenses:** Recording bills with custom allocation rules: split equally, split by custom percentages, split by exact currency values, or split by share ratios.
* **Settlements:** greedy debt-minimizer algorithm that simplifies all outstanding debts down to the fewest payments. Users can log cash transfers and delete wrong entries to restore balances.
* **CSV Import Engine:** Batch expense upload engine supporting column validations (casing corrections, missing payer maps, and date ambiguity selections) with tab panels (Warnings, Review Required, Auto-fixed, Rejected, and AI Suggestions) to review rows in memory before saving.
* **Refund Handling:** Negative amounts inside CSV files are preserved exactly as negative values in the database (with the `isRefund: true` flag set) rather than converting them to positive absolute values. Standings are recalculated correctly using the flag.
* **Duplicate Detection:** Checks for duplicates against database logs and within the CSV batch (intra-batch) using exact matching and Levenshtein description similarity scores (threshold >85%).
* **AI Assistant:** Conversional chat system that answers financial queries in natural language using live group context. It queries tables using a RAG (Retrieval-Augmented Generation) pipeline.
* **Activity Logs:** Audit trail dashboard storing records of creations, edits, deletions, settlements, and bulk imports with filters.
* **Multi-language Support:** An offline fallback reasoning engine that calculates top spenders, category totals, and settlement paths locally and translates answers into 9 languages (English, Hindi, Bengali, Marathi, Gujarati, Tamil, Telugu, Malayalam, Punjabi) if the Google Gemini API key is missing or offline.

---

## 2. Future Enhancements

These are the features I plan to implement in future versions of the application:

* **Invite Links:** Allow group creators to click a button and generate a unique join URL (e.g. `/groups/join/:token`) that they can send to friends. Anyone clicking the link will be automatically added as a member after signing up.
* **Advanced AI Insights:** Add trend analysis features to the AI Assistant so it can track spending habits over months, highlight budget overlaps, warn about anomalous spikes, and forecast upcoming trip totals.
* **Guest Member Enhancements:** Create a merge profile utility. When a guest member signs up for a real account using their email, the system will link and merge their guest profile history (past expenses, splits, and debts) to their new user ID.
* **Additional Analytics:** Create interactive visual graphs (such as category spending pie charts and monthly timeline bar graphs) on the group dashboard to supplement textual analytics.
