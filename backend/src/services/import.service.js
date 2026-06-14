// Import Service

/**
 * Parse CSV buffer content and convert to a list of structured expense objects.
 * Supports basic headers: description, amount, date, groupId, paidById
 * @param {string} csvContent The raw text string of the CSV file.
 * @returns {Object} { data: Array, errors: Array } parsed records and validation warnings.
 */
export const parseCSV = (csvContent) => {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    return { data: [], errors: [{ line: 0, message: 'CSV file is empty or lacks data rows.' }] };
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Create a mapping of expected header to column index
  const headerMap = {};
  headers.forEach((header, idx) => {
    // Map alternate names
    if (header.includes('desc')) headerMap['description'] = idx;
    else if (header.includes('amt') || header === 'amount') headerMap['amount'] = idx;
    else if (header.includes('date') || header === 'time') headerMap['date'] = idx;
    else if (header.includes('group') || header.includes('groupid')) headerMap['groupid'] = idx;
    else if (header.includes('paid') || header.includes('paidbyid')) headerMap['paidbyid'] = idx;
    else if (header.includes('curr') || header === 'currency') headerMap['currency'] = idx;
  });

  // Verify core headers are present
  const missingHeaders = [];
  if (headerMap['description'] === undefined) missingHeaders.push('description');
  if (headerMap['amount'] === undefined) missingHeaders.push('amount');
  if (headerMap['groupid'] === undefined) missingHeaders.push('groupId');

  if (missingHeaders.length > 0) {
    return {
      data: [],
      errors: [{ line: 1, message: `Missing required columns: ${missingHeaders.join(', ')}` }]
    };
  }

  const parsedExpenses = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const row = rawLine.split(',').map(cell => cell.trim());
    
    const description = headerMap['description'] !== undefined ? (row[headerMap['description']] || '') : '';
    const amountStr = headerMap['amount'] !== undefined ? (row[headerMap['amount']] || '') : '';
    const dateStr = headerMap['date'] !== undefined ? (row[headerMap['date']] || '') : '';
    const groupId = headerMap['groupid'] !== undefined ? (row[headerMap['groupid']] || '') : '';
    const paidById = headerMap['paidbyid'] !== undefined ? (row[headerMap['paidbyid']] || '') : '';
    const currency = headerMap['currency'] !== undefined ? (row[headerMap['currency']] || '') : '';

    const amount = parseFloat(amountStr);
    const parsedAmount = isNaN(amount) ? null : amount;
    const date = dateStr ? new Date(dateStr) : null;
    const parsedDate = date && !isNaN(date.getTime()) ? date : null;

    parsedExpenses.push({
      line: i + 1,
      description,
      amount: parsedAmount,
      rawAmount: amountStr,
      date: parsedDate,
      rawDate: dateStr,
      groupId,
      paidById,
      currency
    });
  }

  return {
    data: parsedExpenses,
    errors
  };
};

export default {
  parseCSV
};
