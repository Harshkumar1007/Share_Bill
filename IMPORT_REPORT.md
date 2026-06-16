# ShareBill - Ingestion & Anomaly Import Report

This report describes how the CSV Import Validation and Resolution Engine in ShareBill screens and resolves various issues when users upload spreadsheets of transactions. I tested the engine with a standard 37-row CSV file containing real expense logs to verify all validation rules.

---

## 1. CSV Anomaly Handling Policy Table

The engine scans each row of the uploaded CSV and classifies issues using four severity levels:
* **CRITICAL:** Rejects the row and blocks the upload until fixed.
* **REVIEW_REQUIRED:** Suspends the row in the dashboard so the user can make a manual choice.
* **WARNING:** Flags the row as an informational alert but allows import.
* **AUTO_FIXED:** Automatically cleans up formatting issues and logs the change.

Here is the policy table for how the system handles different problems:

| Problem | Detection | Handling Policy |
| :--- | :--- | :--- |
| **Refunds** | Amount is less than zero (`< 0`) or description matches refund keywords (like "refund", "reimbursement"). | **WARNING / AUTO_FIXED:** Negative values are preserved exactly in the database and stats (not converted to positive values) and the `isRefund` flag is set to true. |
| **Duplicates** | Exact match of date, payer, description, and amount with an existing record or another row in the CSV. | **WARNING:** Flagged as `DUPLICATE_CONFIRMED` and skipped on import by default. Near-duplicates (>85% Levenshtein similarity) are flagged as `POSSIBLE_DUPLICATE` for manual review. |
| **Unknown Payers** | Payer name in `paid_by` does not match any registered group member. | **REVIEW_REQUIRED:** Flagged as `UNKNOWN_PAYER`. User must manually map the name to an existing member or choose to create a Guest member profile. |
| **Missing Participants** | Split participant listed in `split_with` is not a member of the group. | **REVIEW_REQUIRED:** Flagged as `PARTICIPANTS_MISSING`. User must map the participant to a member or create a Guest member profile. |
| **Future Dates** | The transaction date is set in the future (beyond the current system clock). | **WARNING:** Flagged as `FUTURE_DATE`. User can choose to import the backdated or future-dated expense. |
| **Currency Mismatch** | Currency code in the CSV cell differs from the default group base currency. | **WARNING:** Flagged as `MULTI_CURRENCY_IMPORT`. System preserves the original currency code without auto-converting, allowing the user to map it manually. |
| **Split Mismatch** | Splits do not balance (percentage weights do not total 100%, or exact split shares do not sum to total expense amount). | **CRITICAL:** Flagged as a split mismatch. Blocks database saving until splits are edited manually or normalized proportionally in the UI. |

---

## 2. Testing Examples

Below are concrete examples from testing the CSV engine:

### A. Refunds (Negative Amounts)
* **Example:** Row 26 in the test CSV had the description `"Parasailing refund"` and an amount of `-30.00`.
* **Behavior:** The engine detected the negative amount, preserved the value of `-30.00` exactly, and stored it in the database with the `isRefund` flag active. When calculations run, this refund adjusts the payer's standing down correctly instead of adding to it.

### B. Duplicate Detection
* **Example:** Row 5 was `"Dinner at Marina Bites"` (3200.00 INR) paid by Dev. Row 6 was `"dinner - marina bites"` (3200.00 INR) paid by Dev on the same date.
* **Behavior:** Row 6 was flagged as `DUPLICATE_CONFIRMED` because the dates, amounts, and casing/spacing-normalized descriptions matched. Row 6 was skipped. Row 24 (`"Dinner at Thalassa"`, 2400.00 INR) and Row 25 (`"Thalassa dinner"`, 2450.00 INR) were flagged as `POSSIBLE_DUPLICATE` due to description similarity, and I chose to keep both because the amounts differed slightly.

### C. Unknown Payers & Missing Participants
* **Example:** Row 11 listed the payer as `"Priya S"`. Row 19 listed a participant `"Dev"` who wasn't in the group.
* **Behavior:** 
  * Row 11 triggered an `UNKNOWN_PAYER` review. I resolved it in the UI by selecting the registered member **Priya** from the dropdown list.
  * Row 19 triggered a `PARTICIPANTS_MISSING` review. I resolved it by clicking "Create Guest Profile for Dev", which created a guest account for him during the import commit.

### D. Date & Currency Warnings
* **Example:** Row 2 listed date `01-02-2026` (which could be Jan 2 or Feb 1). Row 28 had an empty currency cell while the group base currency was `INR`.
* **Behavior:**
  * The ambiguous date was flagged. I selected "Interpret as DD-MM-YYYY" (February 1st, 2026).
  * The empty currency cell was auto-filled with `INR` (group base default) and flagged as a warning.

### E. Split Mismatches
* **Example:** Row 29 was an exact split type with a total amount of `1500`, but split columns added up to `1400`.
* **Behavior:** The engine marked the row as `CRITICAL` due to split mismatch and disabled the save button until I edited the splits in the UI modal to balance them.
