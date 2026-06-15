import { cleanJsonResponse } from './aiAgent.service.js';

/**
 * Programmatic check to determine if an AI suggestion is safe to auto-apply.
 * Criteria:
 * - confidence >= 90
 * - no deletion (no skip/delete actions)
 * - no member merge (no map_member actions)
 * - no lifecycle modification (no lifecycle validations or approve_lifecycle actions)
 */
export const calculateSuggestionSafety = (suggestion) => {
  const confidence = suggestion.confidence || 0;
  const issueType = suggestion.type || '';
  const action = suggestion.recommendedAction?.action || '';

  if (confidence < 90) return false;
  if (action === 'skip' || action === 'delete') return false;
  if (action === 'map_member') return false;
  if (issueType === 'LIFECYCLE_VIOLATION' || action === 'approve_lifecycle') return false;

  return true;
};

/**
 * Generate suggestions offline using a deterministic rule-based mapping engine.
 */
export const generateLocalFallbackSuggestions = (validationIssues = [], csvRows = [], groupMembers = [], memberLifecycleData = {}) => {
  const suggestions = [];

  validationIssues.forEach(issue => {
    const rowNum = issue.rowNumber;
    const row = csvRows.find(r => r.rowNumber === rowNum);
    const desc = row?.record?.description || 'Expense';
    const amount = row?.record?.amount || 0;
    const payer = row?.record?.paidBy || '';
    const dateVal = row?.record?.date || '';

    const issueId = `issue-${rowNum}-${issue.type}`;
    let type = issue.type;
    let explanation = issue.explanation || '';
    let confidence = 85;
    let recommendedAction = null;
    let alternativeActions = [];

    // Map duplicate categories if they come as 'DUPLICATE'
    if (type === 'DUPLICATE') {
      if (explanation.toLowerCase().includes('exact')) {
        type = 'DUPLICATE_EXPENSE';
      } else {
        type = 'NEAR_DUPLICATE';
      }
    }

    switch (type) {
      case 'DUPLICATE_EXPENSE':
        explanation = `Exact duplicate check: Row ${rowNum} ("${desc}", ${amount}) exactly matches an existing transaction.`;
        confidence = 98;
        recommendedAction = {
          action: 'skip',
          params: { rowNumber: rowNum },
          description: `Skip Row ${rowNum} to avoid duplicate transaction.`
        };
        alternativeActions = [
          {
            action: 'keep_both',
            params: { rowNumber: rowNum },
            description: `Import anyway as a separate expense (duplicate).`,
            confidence: 2
          }
        ];
        break;

      case 'NEAR_DUPLICATE':
        explanation = `Near duplicate check: Row ${rowNum} ("${desc}", ${amount}) has similar description/amount.`;
        confidence = 88;
        recommendedAction = {
          action: 'skip',
          params: { rowNumber: rowNum },
          description: `Skip Row ${rowNum} to avoid potential duplicate.`
        };
        alternativeActions = [
          {
            action: 'keep_both',
            params: { rowNumber: rowNum },
            description: `Import anyway (keep both).`,
            confidence: 12
          }
        ];
        break;

      case 'AMBIGUOUS_DATE':
        explanation = `Ambiguous date: Date "${dateVal}" on Row ${rowNum} is ambiguous between DD-MM-YYYY and MM-DD-YYYY.`;
        confidence = 95;
        // Check parsing details from raw date
        let recVal1 = 'DD-MM-YYYY';
        let altVal2 = 'MM-DD-YYYY';
        recommendedAction = {
          action: 'use_dd_mm_yyyy',
          params: { rowNumber: rowNum, format: 'DD-MM-YYYY' },
          description: `Interpret date as DD-MM-YYYY (default system policy).`
        };
        alternativeActions = [
          {
            action: 'use_mm_dd_yyyy',
            params: { rowNumber: rowNum, format: 'MM-DD-YYYY' },
            description: `Interpret date as MM-DD-YYYY.`,
            confidence: 5
          }
        ];
        break;

      case 'UNKNOWN_MEMBER':
        explanation = `Unknown payer: Payer "${payer}" on Row ${rowNum} is not a member of the group.`;
        confidence = 92;
        recommendedAction = {
          action: 'create_guest',
          params: { rowNumber: rowNum, memberName: payer },
          description: `Automatically create a guest profile for payer "${payer}".`
        };
        
        // Attempt to find a similar existing member name
        const match = groupMembers.find(m => m.name && m.name.toLowerCase().substring(0, 3) === payer.toLowerCase().substring(0, 3));
        alternativeActions = [
          {
            action: 'map_member',
            params: { rowNumber: rowNum, targetName: match ? match.name : (groupMembers[0]?.name || '') },
            description: `Map payer to existing group member "${match ? match.name : (groupMembers[0]?.name || 'Priya')}".`,
            confidence: 8
          }
        ];
        break;

      case 'UNKNOWN_MEMBER_PARTICIPANT':
      case 'UNKNOWN_PARTICIPANT':
        type = 'UNKNOWN_PARTICIPANT'; // normalize
        const unknownPart = explanation.match(/'([^']+)'/)?.[1] || 'Unknown';
        explanation = `Unknown participant: Participant "${unknownPart}" on Row ${rowNum} is not in the group.`;
        confidence = 92;
        recommendedAction = {
          action: 'create_guest',
          params: { rowNumber: rowNum, memberName: unknownPart },
          description: `Automatically create a guest profile for participant "${unknownPart}".`
        };
        const partMatch = groupMembers.find(m => m.name && m.name.toLowerCase().substring(0, 3) === unknownPart.toLowerCase().substring(0, 3));
        alternativeActions = [
          {
            action: 'map_member',
            params: { rowNumber: rowNum, targetName: partMatch ? partMatch.name : (groupMembers[0]?.name || '') },
            description: `Map participant to existing group member "${partMatch ? partMatch.name : (groupMembers[0]?.name || 'Priya')}".`,
            confidence: 8
          }
        ];
        break;

      case 'LIFECYCLE_VIOLATION':
        explanation = `Lifecycle violation: Expense on Row ${rowNum} occurred outside active membership bounds.`;
        confidence = 95;
        recommendedAction = {
          action: 'approve_lifecycle',
          params: { rowNumber: rowNum },
          description: `Approve and import as historical ledger data.`
        };
        alternativeActions = [
          {
            action: 'skip',
            params: { rowNumber: rowNum },
            description: `Skip Row ${rowNum} due to lifecycle timeline conflict.`,
            confidence: 5
          }
        ];
        break;

      case 'EQUAL_SPLIT_CONFLICT':
        explanation = `Split conflict: Row ${rowNum} has EQUAL split strategy but custom share details were provided.`;
        confidence = 85;
        recommendedAction = {
          action: 'keep_equal',
          params: { rowNumber: rowNum },
          description: `Ignore custom details and split equally.`
        };
        alternativeActions = [
          {
            action: 'convert_to_share',
            params: { rowNumber: rowNum },
            description: `Convert split strategy to SHARE using weight ratios.`,
            confidence: 15
          }
        ];
        break;

      case 'PERCENTAGE_SPLIT_CONFLICT':
      case 'INVALID_PERCENTAGE_SPLIT':
        type = 'INVALID_PERCENTAGE_SPLIT'; // normalize
        explanation = `Invalid percentage splits: Row ${rowNum} weights do not sum to exactly 100%.`;
        confidence = 90;
        recommendedAction = {
          action: 'normalize_percentage',
          params: { rowNumber: rowNum },
          description: `Normalize split percentages proportionally to sum to 100%.`
        };
        alternativeActions = [
          {
            action: 'skip',
            params: { rowNumber: rowNum },
            description: `Skip Row ${rowNum}.`,
            confidence: 10
          }
        ];
        break;

      case 'INVALID_EXACT_SPLIT':
        explanation = `Invalid exact splits: Row ${rowNum} amounts do not sum to total expense.`;
        confidence = 85;
        recommendedAction = {
          action: 'normalize_exact',
          params: { rowNumber: rowNum },
          description: `Adjust exact split amounts to sum to the total expense value.`
        };
        alternativeActions = [
          {
            action: 'skip',
            params: { rowNumber: rowNum },
            description: `Skip Row ${rowNum}.`,
            confidence: 15
          }
        ];
        break;

      case 'NEGATIVE_AMOUNT':
        explanation = `Negative amount: Row ${rowNum} contains negative amount ${amount}.`;
        confidence = 95;
        recommendedAction = {
          action: 'convert_to_absolute',
          params: { rowNumber: rowNum },
          description: `Convert amount to positive absolute value (${Math.abs(amount)}) and flag as a Refund.`
        };
        alternativeActions = [
          {
            action: 'skip',
            params: { rowNumber: rowNum },
            description: `Skip Row ${rowNum}.`,
            confidence: 5
          }
        ];
        break;

      case 'REFUND_DETECTED':
        explanation = `Refund detected: Row ${rowNum} is indicated as a refund or negative amount.`;
        confidence = 95;
        recommendedAction = {
          action: 'convert_to_absolute',
          params: { rowNumber: rowNum },
          description: `Convert to positive absolute value and register as a refund.`
        };
        alternativeActions = [
          {
            action: 'convert_to_settlement',
            params: { rowNumber: rowNum },
            description: `Convert to negative Settlement flow.`,
            confidence: 5
          }
        ];
        break;

      case 'SETTLEMENT_DETECTED':
        explanation = `Settlement detected: Row ${rowNum} contains settlement keywords ("paid back", "reimbursement", etc.).`;
        confidence = 90;
        recommendedAction = {
          action: 'convert_to_settlement',
          params: { rowNumber: rowNum },
          description: `Convert expense row into a Settlement payment record from payer.`
        };
        alternativeActions = [
          {
            action: 'keep_as_expense',
            params: { rowNumber: rowNum },
            description: `Import as standard expense anyway.`,
            confidence: 10
          }
        ];
        break;

      case 'MISSING_CURRENCY':
      case 'MULTIPLE_CURRENCIES':
        type = 'MULTIPLE_CURRENCIES'; // normalize
        explanation = `Currency mismatch: Row ${rowNum} currency code differs from default group currency.`;
        confidence = 95;
        recommendedAction = {
          action: 'preserve_currency',
          params: { rowNumber: rowNum },
          description: `Preserve the original currency code and convert balances on demand.`
        };
        alternativeActions = [
          {
            action: 'convert_to_group_default',
            params: { rowNumber: rowNum },
            description: `Convert amount to group default currency.`,
            confidence: 5
          }
        ];
        break;

      default:
        // Generic low-confidence suggestion if issue type not explicitly matched
        recommendedAction = {
          action: 'keep_as_is',
          params: { rowNumber: rowNum },
          description: `Keep row configuration as is.`
        };
        break;
    }

    if (recommendedAction) {
      const sug = {
        issueId,
        type,
        explanation,
        confidence,
        recommendedAction,
        alternativeActions,
        safeToAutoApply: false
      };
      sug.safeToAutoApply = calculateSuggestionSafety(sug);
      suggestions.push(sug);
    }
  });

  return { suggestions };
};

/**
 * Core service function that calls Google Gemini 1.5 Flash to generate resolution suggestions
 * or falls back to rule-based offline suggestions.
 */
export const generateResolutionSuggestions = async (validationReport, groupMembers = [], defaultCurrency = 'USD') => {
  const csvRows = validationReport.rows || [];
  const validationIssues = [];

  csvRows.forEach(row => {
    if (row.issues && Array.isArray(row.issues)) {
      row.issues.forEach(issue => {
        validationIssues.push({
          rowNumber: row.rowNumber,
          type: issue.type,
          explanation: issue.explanation,
          severity: issue.severity
        });
      });
    }
  });

  // Load member lifecycle map
  const memberLifecycleData = {};
  groupMembers.forEach(m => {
    if (m.user && m.user.name) {
      memberLifecycleData[m.user.name] = {
        joinedAt: m.joinedAt,
        leftAt: m.leftAt
      };
    }
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured. Running offline local fallback suggestions.');
    return generateLocalFallbackSuggestions(validationIssues, csvRows, groupMembers, memberLifecycleData);
  }

  const prompt = `
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
   - skip (skips row)
   - keep_both (keeps duplicates)
   - use_dd_mm_yyyy (dd-mm-yyyy format)
   - use_mm_dd_yyyy (mm-dd-yyyy format)
   - create_guest (creates guest user profile)
   - map_member (maps name to target member)
   - convert_to_settlement (converts to settlement record)
   - keep_as_expense (keeps as expense)
   - preserve_currency (keeps original currency)
   - keep_equal (split equal and ignore details)
   - convert_to_share (split as custom share weights)
   - normalize_percentage (scales weights to sum to 100)
   - convert_to_absolute (converts negative values to positive absolute)
   - approve_lifecycle (approves timeline lifecycle violations)
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
      "recommendedAction": {
        "action": "string",
        "params": {
          "rowNumber": number,
          "format": "string" // e.g. if date ambiguity
        },
        "description": "string"
      },
      "alternativeActions": [
        {
          "action": "string",
          "params": {},
          "description": "string",
          "confidence": number
        }
      ]
    }
  ]
}

Ensure all JSON returns are compliant. Return ONLY raw JSON text. No markdown block wrap.
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.error(`Gemini API resolution assistant failed with status ${response.status}. Falling back offline.`);
      return generateLocalFallbackSuggestions(validationIssues, csvRows, groupMembers, memberLifecycleData);
    }

    const resJson = await response.json();
    const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No suggestions content in Gemini response.');

    const cleanedText = cleanJsonResponse(text);
    const parsed = JSON.parse(cleanedText);

    // Dynamic program safety post-processing check
    const processedSuggestions = (parsed.suggestions || []).map(sug => {
      // Ensure issueId exists
      if (!sug.issueId && sug.recommendedAction?.params?.rowNumber) {
        sug.issueId = `issue-${sug.recommendedAction.params.rowNumber}-${sug.type}`;
      }
      return {
        ...sug,
        safeToAutoApply: calculateSuggestionSafety(sug)
      };
    });

    return {
      suggestions: processedSuggestions,
      engine: 'Google Gemini 1.5 Flash API'
    };

  } catch (err) {
    console.error('Gemini resolution suggestions query failed. Falling back to local offline reasoning:', err);
    return generateLocalFallbackSuggestions(validationIssues, csvRows, groupMembers, memberLifecycleData);
  }
};
