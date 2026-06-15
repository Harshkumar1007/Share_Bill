import { cleanJsonResponse } from './aiAgent.service.js';

/**
 * Categorizes an expense based on its description.
 * @param {string} description 
 * @returns {string} Category name
 */
const getCategoryFromDesc = (description) => {
  const descLower = (description || '').toLowerCase();
  if (descLower.includes('food') || descLower.includes('dinner') || descLower.includes('lunch') || descLower.includes('breakfast') || descLower.includes('meal') || descLower.includes('restaurant') || descLower.includes('cafe')) {
    return 'Food';
  } else if (descLower.includes('hotel') || descLower.includes('stay') || descLower.includes('airbnb') || descLower.includes('room') || descLower.includes('hostel') || descLower.includes('accommodation')) {
    return 'Accommodation';
  } else if (descLower.includes('taxi') || descLower.includes('cab') || descLower.includes('uber') || descLower.includes('flight') || descLower.includes('train') || descLower.includes('bus') || descLower.includes('travel') || descLower.includes('fuel') || descLower.includes('transport')) {
    return 'Travel';
  } else if (descLower.includes('ticket') || descLower.includes('movie') || descLower.includes('show') || descLower.includes('museum') || descLower.includes('entry') || descLower.includes('event') || descLower.includes('fun')) {
    return 'Entertainment';
  }
  return 'Misc';
};

/**
 * Runs rule-based offline analysis on the CSV validation report and group context
 * @param {Object} report 
 * @param {Object} groupContext 
 * @returns {Object} Fallback AI insights
 */
export const runLocalFallbackImportAnalysis = (report, groupContext) => {
  const defaultCurrency = groupContext.balances?.defaultCurrency || 'USD';
  const cleanRows = (report.rows || []).filter(r => r.status !== 'REJECTED' && r.record);

  // 1. Spend Stats
  const totalsByCurrency = {};
  const categoryTotals = { Food: 0, Travel: 0, Accommodation: 0, Entertainment: 0, Misc: 0 };
  const spenderTotals = {};
  let maxAmount = 0;
  let maxExpenseDesc = '';

  cleanRows.forEach(row => {
    const { amount, currency, description, paidBy } = row.record;
    const cur = currency || defaultCurrency;
    totalsByCurrency[cur] = (totalsByCurrency[cur] || 0) + amount;
    
    // Categorize
    const category = getCategoryFromDesc(description);
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;

    // Spenders
    spenderTotals[paidBy] = (spenderTotals[paidBy] || 0) + amount;

    if (amount > maxAmount) {
      maxAmount = amount;
      maxExpenseDesc = description;
    }
  });

  const currenciesPresent = Object.keys(totalsByCurrency);
  const mainCurrency = currenciesPresent[0] || defaultCurrency;
  const totalSpendVal = totalsByCurrency[mainCurrency] || 0;

  // Import Summary Text
  let importSummary = `${cleanRows.length} expenses imported.\n\n`;
  if (currenciesPresent.length > 0) {
    const spendsStr = currenciesPresent.map(c => `${c} ${totalsByCurrency[c].toLocaleString()}`).join(', ');
    importSummary += `Total Spend ${spendsStr}\n\n`;
  } else {
    importSummary += `Total Spend ${mainCurrency} 0\n\n`;
  }
  
  const categoryLines = Object.entries(categoryTotals)
    .filter(([_, val]) => val > 0)
    .map(([cat, val]) => `${cat} ${mainCurrency} ${val.toLocaleString()}`);
  
  if (categoryLines.length > 0) {
    importSummary += categoryLines.join('\n');
  } else {
    importSummary += 'No spending category breakdown available.';
  }

  // 2. Duplicate Insights
  const dupRows = (report.rows || []).filter(r => r.issues && r.issues.some(i => i.type === 'DUPLICATE'));
  let duplicateInsights = '';
  if (dupRows.length > 0) {
    duplicateInsights = `Detected ${dupRows.length} duplicate expense(s) in this batch.\n` +
      dupRows.map(r => {
        const issue = r.issues.find(i => i.type === 'DUPLICATE');
        return `- Row ${r.rowNumber} ("${r.record?.description}"): ${issue.explanation}`;
      }).join('\n');
  } else {
    duplicateInsights = 'No duplicate expenses or suspicious patterns detected in this import.';
  }

  // 3. Anomaly Detection
  // Calculate average of existing expenses in the group
  const existingExpenses = groupContext.expenses || [];
  const existingCount = existingExpenses.length;
  let avgExisting = 0;
  if (existingCount > 0) {
    const totalEx = existingExpenses.reduce((sum, e) => sum + e.amount, 0);
    avgExisting = totalEx / existingCount;
  }

  const anomaliesList = [];
  cleanRows.forEach(row => {
    const { amount, description, currency } = row.record;
    // Anomaly if amount > 3x existing average (when average exists)
    if (avgExisting > 0 && amount > 3 * avgExisting) {
      anomaliesList.push(`Expense "${description}" (${currency || defaultCurrency} ${amount.toLocaleString()}) on Row ${row.rowNumber} is significantly higher than group average (${currency || defaultCurrency} ${Math.round(avgExisting).toLocaleString()}).`);
    } else if (amount > 10000) {
      // General high-value fallback anomaly
      anomaliesList.push(`High value expense "${description}" (${currency || defaultCurrency} ${amount.toLocaleString()}) detected on Row ${row.rowNumber}.`);
    }
  });

  // Check for conversion warnings
  const setRows = (report.rows || []).filter(r => r.issues && r.issues.some(i => i.type === 'SETTLEMENT_DETECTED'));
  setRows.forEach(r => {
    anomaliesList.push(`Row ${r.rowNumber} ("${r.record?.description}") looks like a settlement transaction rather than a group expense.`);
  });

  let anomalyDetection = '';
  if (anomaliesList.length > 0) {
    anomalyDetection = anomaliesList.join('\n\n');
  } else {
    anomalyDetection = 'No financial anomalies or extreme values detected in this import batch.';
  }

  // 4. Expense Insights
  const insightsList = [];
  if (totalSpendVal > 0) {
    // Top Spender
    const topSpenders = Object.entries(spenderTotals).sort((a, b) => b[1] - a[1]);
    if (topSpenders.length > 0) {
      insightsList.push(`Highest spender = ${topSpenders[0][0]}`);
    }

    // Top Category
    const topCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (topCats.length > 0 && topCats[0][1] > 0) {
      insightsList.push(`Largest category = ${topCats[0][0]}`);
      const pct = Math.round((topCats[0][1] / totalSpendVal) * 100);
      insightsList.push(`${topCats[0][0]} = ${pct}% of total spend`);
    }

    if (maxAmount > 0) {
      insightsList.push(`Largest individual import = "${maxExpenseDesc}" (${mainCurrency} ${maxAmount.toLocaleString()})`);
    }
  } else {
    insightsList.push('No import expense transactions available to derive insights.');
  }

  return {
    importSummary,
    duplicateInsights,
    anomalyDetection,
    expenseInsights: insightsList.join('\n\n')
  };
};

/**
 * Generate AI Analysis for imported CSV spreadsheet validation run.
 * @param {Object} report 
 * @param {Object} groupContext 
 * @returns {Promise<Object>} Analyzed summary blocks
 */
export const generateAiImportAnalysis = async (report, groupContext) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured. Running Local Fallback CSV Analysis.');
    return runLocalFallbackImportAnalysis(report, groupContext);
  }

  const prompt = `
You are a Financial Intelligence Agent.
You are given a CSV validation report containing parsed expense rows (some may have warning issues like duplicate flags, negative amount flags, currency differences, lifecycle mismatches, or suggested settlement conversions) and the active group context.

CSV Validation Report:
${JSON.stringify({ summary: report.summary, rows: (report.rows || []).map(r => ({ rowNumber: r.rowNumber, status: r.status, issues: r.issues, record: r.record })) }, null, 2)}

Active Group Context:
- Group Name: ${groupContext.group?.name || 'Unnamed Group'}
- Members List: ${JSON.stringify(groupContext.members || [])}
- Existing Expenses Count: ${groupContext.expensesCount}
- Existing Spender Totals: ${JSON.stringify(groupContext.tripSummary?.topSpenders || [])}
- Average Group Expense Value: ${groupContext.expensesCount > 0 ? Math.round((groupContext.expenses || []).reduce((sum, e) => sum + e.amount, 0) / groupContext.expensesCount) : 0}

Analyze the data and generate four distinct components:
1. "importSummary": A text description of the expenses to be imported. E.g.
"42 expenses imported
Total Spend ₹54,200
Food ₹12,000
Travel ₹18,050
Accommodation ₹20,000
Misc ₹4,150"

2. "duplicateInsights": Explain why records look duplicated. E.g., which row numbers match existing database rows in dates, descriptions and amounts, and advice on resolution (Keep Existing, Keep Both).

3. "anomalyDetection": Identify any suspicious records. For example, if a specific row has an amount significantly higher than the group's average expense amount, or if it represents a reimbursement/settlement transaction, or is a negative amount conversion. E.g., "Expense ₹25,000 is significantly higher than group average of ₹3,000."

4. "expenseInsights": High-level bullet metrics on spending patterns in this batch. E.g.
"Travel = 48% of total spend
Highest spender = Harsh
Largest category = Accommodation"

Provide your response in a valid JSON format with exact keys:
{
  "importSummary": "string",
  "duplicateInsights": "string",
  "anomalyDetection": "string",
  "expenseInsights": "string"
}

Do not use markdown code blocks like \`\`\`json ... \`\`\` in your response. Return ONLY the raw JSON string.
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
      console.error(`Gemini CSV Analysis failed with status ${response.status}. Falling back.`);
      return runLocalFallbackImportAnalysis(report, groupContext);
    }

    const resJson = await response.json();
    const candidateText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error('No candidate content from Gemini.');

    const cleanedText = cleanJsonResponse(candidateText);
    const parsed = JSON.parse(cleanedText);

    return {
      importSummary: parsed.importSummary || '',
      duplicateInsights: parsed.duplicateInsights || '',
      anomalyDetection: parsed.anomalyDetection || '',
      expenseInsights: parsed.expenseInsights || '',
      engine: 'Google Gemini 1.5 Flash API'
    };
  } catch (err) {
    console.error('Gemini CSV analysis failed, falling back to local reasoning:', err);
    return runLocalFallbackImportAnalysis(report, groupContext);
  }
};
