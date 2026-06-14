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
  const expectedHeaders = ['description', 'amount', 'date', 'groupid', 'paidbyid'];
  
  // Create a mapping of expected header to column index
  const headerMap = {};
  headers.forEach((header, idx) => {
    // Map alternate names
    if (header.includes('desc')) headerMap['description'] = idx;
    else if (header.includes('amt') || header === 'amount') headerMap['amount'] = idx;
    else if (header.includes('date') || header === 'time') headerMap['date'] = idx;
    else if (header.includes('group') || header.includes('groupid')) headerMap['groupid'] = idx;
    else if (header.includes('paid') || header.includes('paidbyid')) headerMap['paidbyid'] = idx;
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
    const row = lines[i].split(',').map(cell => cell.trim());
    
    // Skip row if it doesn't match column size (approximate check)
    if (row.length < Object.keys(headerMap).length) {
      errors.push({ line: i + 1, message: 'Incomplete columns, skipping row.' });
      continue;
    }

    const description = row[headerMap['description']];
    const amountStr = row[headerMap['amount']];
    const dateStr = headerMap['date'] !== undefined ? row[headerMap['date']] : '';
    const groupId = row[headerMap['groupid']];
    const paidById = headerMap['paidbyid'] !== undefined ? row[headerMap['paidbyid']] : 'default-user';

    // Validate fields
    if (!description) {
      errors.push({ line: i + 1, message: 'Description is required.' });
      continue;
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      errors.push({ line: i + 1, message: `Invalid amount "${amountStr}". Must be positive number.` });
      continue;
    }

    const date = dateStr ? new Date(dateStr) : new Date();
    if (dateStr && isNaN(date.getTime())) {
      errors.push({ line: i + 1, message: `Invalid date format "${dateStr}". Falling back to current date.` });
    }

    parsedExpenses.push({
      description,
      amount,
      date: isNaN(date.getTime()) ? new Date() : date,
      groupId,
      paidById,
      splits: [] // Placeholder for parsed splits
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
