/**
 * Helper to split a CSV line into fields, respecting double quotes
 * to allow commas inside field values (e.g., descriptions).
 * @param {string} line Raw CSV line text
 * @returns {string[]} Array of field values
 */
export const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

/**
 * Calculates Levenshtein distance between two strings.
 * @param {string} s1 
 * @param {string} s2 
 * @returns {number}
 */
export const levenshteinDistance = (s1, s2) => {
  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return track[s2.length][s1.length];
};

/**
 * Calculates a similarity score between two strings (0.0 to 1.0)
 * after lowercasing them and stripping all non-alphanumeric characters.
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number}
 */
export const getSimilarityScore = (str1, str2) => {
  if (!str1 || !str2) return 0.0;
  const clean1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean1 === clean2) return 1.0;
  const len1 = clean1.length;
  const len2 = clean2.length;
  if (len1 === 0 || len2 === 0) return 0.0;

  const maxLen = Math.max(len1, len2);
  const dist = levenshteinDistance(clean1, clean2);
  return (maxLen - dist) / maxLen;
};

/**
 * Helper to match an identifier (name or email) against active group members
 * @param {string} identifier 
 * @param {Array} groupMembers 
 * @returns {Object|null}
 */
export const findGroupMember = (identifier, groupMembers) => {
  if (!identifier) return null;
  const cleanId = identifier.trim().toLowerCase();
  return groupMembers.find(member => 
    (member.user && member.user.email && member.user.email.toLowerCase() === cleanId) ||
    (member.user && member.user.name && member.user.name.toLowerCase() === cleanId)
  ) || null;
};

/**
 * Parses raw CSV content, converts rows into JSON, validates required columns,
 * and splits records into separate arrays of valid and invalid rows.
 * 
 * Required Columns: description, amount, paidBy, date
 * 
 * @param {string} csvContent The raw string content of the uploaded CSV file.
 * @returns {Object} { valid: Array, invalid: Array }
 * @throws {Error} If header row is missing or required column headers are missing.
 */
export const parseCSVData = (csvContent) => {
  if (!csvContent || typeof csvContent !== 'string') {
    throw new Error('CSV content must be a non-empty string.');
  }

  const lines = csvContent.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
  if (lines.length < 1) {
    throw new Error('CSV file is empty.');
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());

  // Define required columns and map their header positions
  const requiredFields = ['description', 'amount', 'paidby', 'date'];
  const headerMap = {};

  requiredFields.forEach(field => {
    headerMap[field] = headers.indexOf(field);
  });

  // Check for missing required column headers
  const missingHeaders = requiredFields.filter(field => headerMap[field] === -1);
  if (missingHeaders.length > 0) {
    // Standardize casing for user output
    const cleanMissing = missingHeaders.map(h => h === 'paidby' ? 'paidBy' : h);
    throw new Error(`CSV is missing required column headers: ${cleanMissing.join(', ')}`);
  }

  const valid = [];
  const invalid = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const row = parseCSVLine(rawLine);
    const rowNumber = i + 1;

    // Extract raw fields using mapped indices
    const rawDescription = row[headerMap['description']] || '';
    const rawAmount = row[headerMap['amount']] || '';
    const rawPaidBy = row[headerMap['paidby']] || '';
    const rawDate = row[headerMap['date']] || '';

    const errors = [];

    // 1. Validate description
    const description = rawDescription.trim();
    if (!description) {
      errors.push('Description is required.');
    }

    // 2. Validate amount
    const amount = parseFloat(rawAmount);
    if (!rawAmount.trim()) {
      errors.push('Amount is required.');
    } else if (isNaN(amount)) {
      errors.push('Amount must be a numeric value.');
    } else if (amount <= 0) {
      errors.push('Amount must be greater than zero.');
    }

    // 3. Validate paidBy
    const paidBy = rawPaidBy.trim();
    if (!paidBy) {
      errors.push('PaidBy is required.');
    }

    // 4. Validate date
    const dateObj = new Date(rawDate);
    if (!rawDate.trim()) {
      errors.push('Date is required.');
    } else if (isNaN(dateObj.getTime())) {
      errors.push('Date must be a valid date format (e.g. YYYY-MM-DD).');
    }

    // Prepare row JSON representation
    const record = {
      rowNumber,
      description,
      amount: isNaN(amount) ? rawAmount : amount,
      paidBy,
      date: isNaN(dateObj.getTime()) ? rawDate : dateObj.toISOString().split('T')[0],
      rawRow: rawLine
    };

    if (errors.length > 0) {
      invalid.push({
        ...record,
        errors
      });
    } else {
      valid.push(record);
    }
  }

  return {
    valid,
    invalid
  };
};

/**
 * Advanced 9-column CSV parser that validates group membership and flags duplicates.
 * CSV Format: date,description,paid_by,amount,currency,split_type,split_with,split_details,notes
 *
 * @param {string} csvContent Raw CSV text
 * @param {Array} groupMembers Active group members list fetched from database
 * @param {Array} existingExpenses Existing expenses in the database for the group
 * @returns {Object} Structured lists of validated, duplicated, suspicious, and invalid rows
 */
export const parseCSVForPreview = (csvContent, groupMembers = [], existingExpenses = []) => {
  if (!csvContent || typeof csvContent !== 'string') {
    throw new Error('CSV content must be a non-empty string.');
  }

  const lines = csvContent.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
  if (lines.length < 1) {
    throw new Error('CSV file is empty.');
  }

  // Parse headers case-insensitively and handle both formats (with/without underscores)
  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/_/g, ''));

  const requiredFields = ['date', 'description', 'paidby', 'amount', 'splittype', 'splitwith'];
  const headerMap = {
    date: headers.indexOf('date'),
    description: headers.indexOf('description'),
    paid_by: headers.indexOf('paidby'),
    amount: headers.indexOf('amount'),
    currency: headers.indexOf('currency'),
    split_type: headers.indexOf('splittype'),
    split_with: headers.indexOf('splitwith'),
    split_details: headers.indexOf('splitdetails'),
    notes: headers.indexOf('notes')
  };

  const missingHeaders = requiredFields.filter(f => {
    if (f === 'paidby') return headerMap['paid_by'] === -1;
    if (f === 'splittype') return headerMap['split_type'] === -1;
    if (f === 'splitwith') return headerMap['split_with'] === -1;
    return headerMap[f] === -1;
  });

  if (missingHeaders.length > 0) {
    const cleanMissing = missingHeaders.map(f => {
      if (f === 'paidby') return 'paid_by';
      if (f === 'splittype') return 'split_type';
      if (f === 'splitwith') return 'split_with';
      return f;
    });
    throw new Error(`CSV is missing required column headers: ${cleanMissing.join(', ')}`);
  }

  const validRows = [];
  const duplicateRows = [];
  const suspiciousRows = [];
  const invalidRows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const row = parseCSVLine(rawLine);
    const rowNumber = i + 1;

    const rawDate = row[headerMap['date']] || '';
    const rawDescription = row[headerMap['description']] || '';
    const rawPaidBy = row[headerMap['paid_by']] || '';
    const rawAmount = row[headerMap['amount']] || '';
    const rawCurrency = headerMap['currency'] !== -1 ? (row[headerMap['currency']] || 'USD') : 'USD';
    const rawSplitType = row[headerMap['split_type']] || '';
    const rawSplitWith = row[headerMap['split_with']] || '';
    const rawSplitDetails = headerMap['split_details'] !== -1 ? (row[headerMap['split_details']] || '') : '';
    const rawNotes = headerMap['notes'] !== -1 ? (row[headerMap['notes']] || '') : '';

    const errors = [];

    // 1. Validate date
    let dateStr = '';
    if (!rawDate.trim()) {
      errors.push('Date is required.');
    } else {
      const dateObj = new Date(rawDate);
      if (isNaN(dateObj.getTime())) {
        errors.push('Date must be a valid date format (e.g. YYYY-MM-DD).');
      } else {
        dateStr = dateObj.toISOString().split('T')[0];
      }
    }

    // 2. Validate description
    const description = rawDescription.trim();
    if (!description) {
      errors.push('Description is required.');
    }

    // 3. Validate amount
    let amount = null;
    if (!rawAmount.trim()) {
      errors.push('Amount is required.');
    } else {
      amount = parseFloat(rawAmount);
      if (isNaN(amount)) {
        errors.push('Amount must be a numeric value.');
      } else if (amount <= 0) {
        errors.push('Amount must be greater than zero.');
      }
    }

    // 4. Validate split_type
    const splitType = rawSplitType.trim().toUpperCase();
    const validSplitTypes = ['EQUAL', 'PERCENTAGE', 'EXACT', 'SHARE'];
    if (!rawSplitType.trim()) {
      errors.push('Split type is required.');
    } else if (!validSplitTypes.includes(splitType)) {
      errors.push(`Invalid split type '${rawSplitType}'. Must be one of: EQUAL, PERCENTAGE, EXACT, SHARE.`);
    }

    // 5. Validate paid_by member
    let paidByMember = null;
    const paidByStr = rawPaidBy.trim();
    if (!paidByStr) {
      errors.push('Paid by user is required.');
    } else {
      paidByMember = findGroupMember(paidByStr, groupMembers);
      if (!paidByMember) {
        errors.push(`Payer '${paidByStr}' is not an active member of this group.`);
      }
    }

    // 6. Validate split_with members
    const splitWithStr = rawSplitWith.trim();
    if (!splitWithStr) {
      errors.push('Split with participants are required.');
    } else {
      const parts = splitWithStr.split(/[;,]/).map(p => p.trim()).filter(p => p !== '');
      if (parts.length === 0) {
        errors.push('Split with participants are required.');
      } else {
        parts.forEach(part => {
          const member = findGroupMember(part, groupMembers);
          if (!member) {
            errors.push(`Participant '${part}' is not an active member of this group.`);
          }
        });
      }
    }

    const record = {
      rowNumber,
      date: dateStr || rawDate,
      description,
      paidBy: rawPaidBy,
      amount: isNaN(amount) || amount === null ? rawAmount : amount,
      currency: rawCurrency,
      splitType: rawSplitType,
      splitWith: rawSplitWith,
      splitDetails: rawSplitDetails,
      notes: rawNotes,
      rawRow: rawLine
    };

    if (errors.length > 0) {
      invalidRows.push({
        ...record,
        status: 'INVALID',
        reason: errors.join('; '),
        errors
      });
      continue;
    }

    // Payer exists as user; get their ID
    const paidById = paidByMember.user.id;

    // A. Check exact duplicate
    const exactDup = existingExpenses.find(exp => {
      const expDateStr = new Date(exp.date).toISOString().split('T')[0];
      const samePayer = exp.paidById === paidById;
      const sameAmount = Math.abs(exp.amount - amount) < 0.001;
      const sameDate = expDateStr === dateStr;
      const sameDesc = exp.description.trim() === description;
      return samePayer && sameAmount && sameDate && sameDesc;
    });

    if (exactDup) {
      duplicateRows.push({
        ...record,
        status: 'DUPLICATE',
        reason: `Exact duplicate of existing expense on ${dateStr}`,
        errors: []
      });
      continue;
    }

    // B. Check similar duplicate
    let highestSim = 0;
    let similarDup = null;
    existingExpenses.forEach(exp => {
      const samePayer = exp.paidById === paidById;
      const sameAmount = Math.abs(exp.amount - amount) < 0.001;
      if (samePayer && sameAmount) {
        const sim = getSimilarityScore(exp.description, description);
        if (sim > highestSim) {
          highestSim = sim;
          similarDup = exp;
        }
      }
    });

    if (similarDup && highestSim > 0.85) {
      const pct = Math.round(highestSim * 100);
      const similarDateStr = new Date(similarDup.date).toISOString().split('T')[0];
      suspiciousRows.push({
        ...record,
        status: 'POSSIBLE_DUPLICATE',
        reason: `Similar description to existing expense on ${similarDateStr}: "${similarDup.description}" (similarity: ${pct}%)`,
        errors: []
      });
      continue;
    }

    // Valid record
    validRows.push({
      ...record,
      status: 'VALID',
      reason: '',
      errors: []
    });
  }

  const summary = {
    totalRows: validRows.length + duplicateRows.length + suspiciousRows.length + invalidRows.length,
    validCount: validRows.length,
    duplicateCount: duplicateRows.length,
    suspiciousCount: suspiciousRows.length,
    invalidCount: invalidRows.length
  };

  return {
    totalRows: summary.totalRows,
    validRows,
    duplicateRows,
    suspiciousRows,
    invalidRows,
    summary
  };
};

export default {
  parseCSVLine,
  parseCSVData,
  levenshteinDistance,
  getSimilarityScore,
  findGroupMember,
  parseCSVForPreview
};

