# ShareBill - AI Integration & Usage Report (AI_USAGE.md)

This document tracks the artificial intelligence tools used during the development of ShareBill, the prompts engineered for core features, and three specific instances of AI-generated code issues, detailing how they were identified and resolved.

---

## 1. AI Tools & Models Used

1. **Google Gemini 1.5 Flash API**: Chosen as the primary reasoning and generation engine for:
   * **Financial Intelligence Agent**: Handles conversational RAG (Retrieval-Augmented Generation) queries in natural language.
   * **AI Import Resolution Assistant**: Analyzes CSV validation issues and recommends action payloads.
   * **Rationale**: Gemini 1.5 Flash was selected for its extremely fast response generation, native support for JSON schema enforcement via `responseMimeType`, high-fidelity multilingual parsing, and low cost.
2. **Antigravity AI Coding Assistant**: Used for Pair Programming, workspace searching, files editing, and local script test executions.

---

## 2. Key Prompt Templates

### A. AI Resolution Assistant Prompt (CSV Import Validator)
This prompt instructs the AI model to output a structured JSON suggestion list mapping 13 validation error cases.

```text
You are an AI Resolution Assistant for the ShareBill expense manager app.
Your task is to analyze validation issues from a CSV upload and suggest resolutions.

Inputs:
- validationIssues: ${JSON.stringify(validationIssues, null, 2)}
- csvRows: ${JSON.stringify(csvRows.map(r => ({ rowNumber: r.rowNumber, record: r.record, rawRow: r.rawRow })), null, 2)}
- groupMembers: ${JSON.stringify(groupMembers.map(m => m.user?.name || m.name))}
- memberLifecycleData: ${JSON.stringify(memberLifecycleData, null, 2)}

Provide suggested resolutions for all issues. You MUST support these issue types in your suggestions:
- DUPLICATE_EXPENSE (exact duplicates)
- NEAR_DUPLICATE (casing or slight differences)
- AMBIGUOUS_DATE (e.g. 01-02-2026 could be Jan 2 or Feb 1)
- UNKNOWN_MEMBER (payer not in group)
- UNKNOWN_PARTICIPANT (split participant not in group)
- LIFECYCLE_VIOLATION (expense outside member join/exit dates)
- EQUAL_SPLIT_CONFLICT (split type EQUAL but details exist)
- INVALID_PERCENTAGE_SPLIT (percentages don't sum to 100%)
- INVALID_EXACT_SPLIT (exact splits don't sum to total amount)
- NEGATIVE_AMOUNT (amounts < 0)
- REFUND_DETECTED (negative or refund keywords)
- SETTLEMENT_DETECTED (settlement keyword, e.g. paid back)
- MULTIPLE_CURRENCIES (mixed or missing currency codes)

Guidelines:
1. AI ONLY suggests fixes. You must output JSON suggestions detailing actions.
2. Recommended and alternative actions should match standard actions:
   - skip, keep_both, use_dd_mm_yyyy, use_mm_dd_yyyy, create_guest, map_member, convert_to_settlement, preserve_currency, normalized_percentage, convert_to_absolute...
3. Confidence scores should range from 1 to 100.

Output MimeType must be application/json.
Provide response in a valid JSON structure with exact keys:
{
  "suggestions": [
    {
      "issueId": "issue-[rowNumber]-[type]",
      "type": "string",
      "explanation": "string",
      "confidence": number,
      "recommendedAction": { "action": "string", "params": { "rowNumber": number, "format": "string" }, "description": "string" },
      "alternativeActions": [ { "action": "string", "params": {}, "description": "string", "confidence": number } ]
    }
  ]
}
```

### B. Financial Agent System Instructions
Instructs the conversational financial accountant to reason over live database records.

```text
You are the ShareBill Financial Intelligence Agent.
You have access to live database context about a user's expense sharing group.

Available Context:
- Group Info: name, creator, members (with joinedAt/leftAt timeline)
- Expenses: description, amount, currency, date, splits, paidBy
- Settlements: who paid whom, amounts, dates
- Net Balances: calculated standings (positive is owed money, negative owes money)
- Simplified Debt Minimization Plan: optimal cash transfers

Instructions:
1. Answer any financial query with high precision using the live context.
2. Format lists, tables, and settlement instructions cleanly using markdown.
3. If requested, provide detailed step-by-step explanations of how balances were computed.
4. Keep responses concise and focused on numbers.
```

---

## 3. Case Studies: AI Errors & Resolution Actions

### Case 1: Markdown Code Fence Wrapper Pollution
* **The Error**: When requesting structured JSON from the Gemini API, the AI model occasionally wrapped the response inside markdown code fences (e.g. ` ```json ... ``` `) despite prompt instructions to output raw JSON. This caused the backend’s `JSON.parse` trigger to crash with a `SyntaxError: Unexpected token \` in JSON at position 0`.
* **How We Caught It**: We caught this in the backend logs when the `/import/validate` endpoint returned a 500 server error, and console traces pointed directly to a crash in `JSON.parse(apiResponse)`.
* **What We Changed**: 
  1. We added the `generationConfig: { responseMimeType: "application/json" }` configuration parameter to the Gemini REST call, instructing the model's tokenizer to restrict outputs to JSON format.
  2. We wrote a helper regex sanitizing function (`cleanJsonResponse`) that matches and strips any leading or trailing markdown blocks before calling `JSON.parse`.
  ```javascript
  export const cleanJsonResponse = (rawText) => {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
    }
    return cleaned.trim();
  };
  ```

### Case 2: Truncated JSX Tags in Frontend Refactoring
* **The Error**: While refactoring the file-upload review dashboard (`ImportCSV.jsx`) to introduce the new tab deck panel for "AI Suggestions", the AI assistant proposed a code chunk that omitted a closing `</div>` tag for the fallback category review panels. This caused Vite's React compilation bundle process (`esbuild`) to crash.
* **How We Caught It**: The Vite dev server terminal immediately raised a syntax compilation error: `Unterminated regular expression` and `Expected corresponding JSX closing tag`.
* **What We Changed**: We analyzed the DOM layout tree, located the tag truncation in the tab contents structure, manually re-inserted the missing `</div>` tag to restore proper visual boundaries, and ran `npm run build` to verify clean compilation with zero warnings.

### Case 3: Hardcoded Dummy Strings causing Foreign Key Failures
* **The Error**: In early designs for recording group settlements, the AI helper proposed setting the payer to a hardcoded string `'user-me'` inside the settlement modal components. When committing the settlement, the backend passed `'user-me'` as the user’s primary key UUID, triggering a database relational key mismatch.
* **How We Caught It**: We caught this by attempting to record a settlement in the browser client. The client received a `500 Internal Server Error`, and Prisma logged a `P2003 Foreign Key Constraint Failed` database trace because no User record existed with the primary key `'user-me'`.
* **What We Changed**: We updated the component to fetch the true user session payload from React's `AuthContext` (`currentUser?.id`) and loaded group members' true database IDs dynamically into dropdown selection variables, ensuring all transactions map to valid database UUID keys.
