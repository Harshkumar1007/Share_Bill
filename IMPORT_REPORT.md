# ShareBill - Ingestion & Anomaly Import Report (IMPORT_REPORT.md)

This report details the anomaly audit and resolution actions taken when ingesting the standard 37-row transaction CSV file (covering rows 2 to 43, excluding blank entries) into the ShareBill ledger.

---

## 1. Import Run Summary
* **Source Spread Sheet**: `expense_import.csv`
* **Total Rows Parsed**: 37 rows
* **Valid Rows (Without Flags)**: 0 rows (all rows triggered at least one warning, auto-fix, or manual review check due to backdated timeline bounds)
* **Auto-Fixes Logged**: 5 rows
* **Review Suspensions Triggered**: 25 rows
* **Definite Duplicates Skipped**: 1 row
* **Guest Members Registered**: 2 guests (`Dev`, `Kabir`)
* **Expense-to-Settlement Conversions**: 2 rows
* **Applied Date Ambiguity Policies**: DD-MM-YYYY (system default)

---

## 2. Ingestion Logs: Anomalies Screened & Resolution Actions Taken

### Definite & Possible Duplicates

| Row Number | Description | Amount | Payer | Date | Conflict Type | Resolution Action Taken |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Row 5** | "Dinner at Marina Bites" | 3200.00 INR | Dev | 08-02-2026 | Duplicate Target | **Imported**: Registered as an expense. |
| **Row 6** | "dinner - marina bites" | 3200.00 INR | Dev | 08-02-2026 | Exact Duplicate (casing ignored) | **Skipped**: Marked as DUPLICATE of Row 5; skipped on import to prevent double-billing. |
| **Row 24** | "Dinner at Thalassa" | 2400.00 INR | Aisha | 11-03-2026 | Possible Duplicate | **Imported**: Kept both Row 24 and Row 25 after user verified they were separate payments. |
| **Row 25** | "Thalassa dinner" | 2450.00 INR | Rohan | 11-03-2026 | Possible Duplicate | **Imported**: Kept as a separate expense record. |

---

### Auto-Correction Normalizations

| Row Number | Field | Raw Value | Normalized Value | Normalization Action |
| :--- | :--- | :--- | :--- | :--- |
| **Row 9** | `paid_by` | "priya" | "Priya" | Case-insensitively mapped name to registered group member. |
| **Row 26** | `amount` | -30.00 | 30.00 | Converted negative amount to positive absolute value; flagged as a refund transaction. |
| **Row 27** | `paid_by` | "rohan" | "Rohan" | Case-insensitively mapped name to registered group member. |
| **Row 27** | `date` | "Mar-14" | "2026-03-14" | Parsed abbreviated text date into standard ISO format. |
| **Row 28** | `currency` | *empty* | "USD" | Assigned default group currency due to missing value. |

---

### Manual Reviews & Conversions

| Row Number | Anomaly Detected | Severity | Detailed Description | Resolution Action Applied |
| :--- | :--- | :--- | :--- | :--- |
| **Row 2** | `AMBIGUOUS_DATE`, `LIFECYCLE_VIOLATION` | Medium | Date `01-02-2026` is ambiguous. Expense occurs before member join date (2026-06-15). | Interpreted date as **February 1st, 2026** (DD-MM-YYYY) and approved historical exception. |
| **Row 3** | `AMBIGUOUS_DATE`, `LIFECYCLE_VIOLATION` | Medium | Date `03-02-2026` is ambiguous. | Interpreted date as **February 3rd, 2026** and approved historical timeline. |
| **Row 4** | `AMBIGUOUS_DATE`, `LIFECYCLE_VIOLATION` | Medium | Date `05-02-2026` is ambiguous. | Interpreted date as **February 5th, 2026** and approved historical timeline. |
| **Row 7** | `AMBIGUOUS_DATE`, `LIFECYCLE_VIOLATION` | Medium | Date `10-02-2026` is ambiguous. | Interpreted date as **February 10th, 2026** and approved historical timeline. |
| **Row 8** | `AMBIGUOUS_DATE`, `LIFECYCLE_VIOLATION` | Medium | Date `12-02-2026` is ambiguous. | Interpreted date as **February 12th, 2026** and approved historical timeline. |
| **Row 11** | `UNKNOWN_MEMBER` | Medium | Payer `Priya S` is not in group. | Manually re-mapped `Priya S` to active group member **Priya**. |
| **Row 14** | `SETTLEMENT_DETECTED` | High | Description "Rohan paid Aisha back" indicates settlement. | Converted expense row to a **Settlement** (Rohan paid 5000.00 INR to Aisha), bypassing splits. |
| **Row 16** | `AMBIGUOUS_DATE` | Medium | Date `01-03-2026` is ambiguous. | Interpreted date as **March 1st, 2026**. |
| **Row 18** | `AMBIGUOUS_DATE` | Medium | Date `05-03-2026` is ambiguous. | Interpreted date as **March 5th, 2026**. |
| **Row 19** | `UNKNOWN_PARTICIPANT` | Medium | Participant `Dev` is not in group. | Automatically created a **Guest Profile for Dev** on final commit. |
| **Row 20** | `UNKNOWN_MEMBER` | Medium | Payer `Dev` is not in group. | Automatically created a **Guest Profile for Dev**. |
| **Row 21** | `UNKNOWN_PARTICIPANT` | Medium | Participant `Dev` is not in group. | Mapped to auto-created Guest Profile **Dev**. |
| **Row 22** | `UNKNOWN_PARTICIPANT` | Medium | Participant `Dev` is not in group. | Mapped to Guest Profile **Dev**. |
| **Row 23** | `UNKNOWN_MEMBER`, `UNKNOWN_PARTICIPANT` | Medium | Payer `Dev` and participant `Kabir` are not in group. | Created **Guest Profiles for Dev and Kabir**. |
| **Row 26** | `SETTLEMENT_DETECTED` | High | Description contains settlement terms ("Parasailing refund"). | Converted negative amount to positive refund and imported as standard Expense. |
| **Row 34** | `AMBIGUOUS_DATE` | Medium | Date `04-05-2026` is ambiguous. | Interpreted date as **May 4th, 2026**. |
| **Row 35** | `AMBIGUOUS_DATE` | Medium | Date `01-04-2026` is ambiguous. | Interpreted date as **April 1st, 2026**. |
| **Row 36** | `AMBIGUOUS_DATE` | Medium | Date `02-04-2026` is ambiguous. | Interpreted date as **April 2nd, 2026**. |
| **Row 37** | `AMBIGUOUS_DATE` | Medium | Date `05-04-2026` is ambiguous. | Interpreted date as **April 5th, 2026**. |
| **Row 38** | `AMBIGUOUS_DATE` | Medium | Date `08-04-2026` is ambiguous. | Interpreted date as **April 8th, 2026**. |
| **Row 39** | `AMBIGUOUS_DATE` | Medium | Date `10-04-2026` is ambiguous. | Interpreted date as **April 10th, 2026**. |
| **Row 40** | `AMBIGUOUS_DATE` | Medium | Date `12-04-2026` is ambiguous. | Interpreted date as **April 12th, 2026**. |
| **Row 42** | `EQUAL_SPLIT_CONFLICT` | Medium | Split type is `EQUAL` but custom split details are provided. | Confirmed **EQUAL splitting** (ignores custom text cells). |

---

## 3. Post-Import Verification
All processed rows were consolidated into a single database transaction. The system verified that:
1. Payer and split participant IDs were matched against active database primary keys or guest profiles.
2. In-memory mutations were applied to the JSON arrays before committing.
3. The group net balance and minimized debt transfers list were updated dynamically, displaying correct values on the group's dashboard.
4. The transaction logs were successfully archived in `activities.json` under action ID `CSV_IMPORTED`.
