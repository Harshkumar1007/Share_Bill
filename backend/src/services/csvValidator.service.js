import { parseCSVLine, getSimilarityScore, findGroupMember } from './csvParser.service.js';
import prisma from './prisma.service.js';

/**
 * Parses a date string and checks for standard formats and ambiguities.
 */
export const normalizeDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return { normalized: null, ambiguous: false, error: true };
  const clean = dateStr.trim();
  if (!clean) return { normalized: null, ambiguous: false, error: true };

  // 1. Check if ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const d = new Date(clean);
    return isNaN(d.getTime()) 
      ? { normalized: null, ambiguous: false, error: true }
      : { normalized: clean, ambiguous: false, error: false };
  }

  // 2. Check for Ambiguous formats with 4-digit years: DD-MM-YYYY or MM-DD-YYYY or DD/MM/YYYY or MM/DD/YYYY
  const regexAmbiguous = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
  const matchAmb = clean.match(regexAmbiguous);
  if (matchAmb) {
    const val1 = parseInt(matchAmb[1]);
    const val2 = parseInt(matchAmb[2]);
    const year = matchAmb[3];
    
    // If both values are <= 12, it is ambiguous (e.g., 04-05-2026 could be April 5th or May 4th)
    if (val1 <= 12 && val2 <= 12 && val1 !== val2) {
      return { 
        normalized: `${year}-${String(val1).padStart(2, '0')}-${String(val2).padStart(2, '0')}`,
        ambiguous: true, 
        rawValues: { val1, val2, year },
        error: false 
      };
    }
    
    if (val1 > 12 && val2 <= 12) {
      return { 
        normalized: `${year}-${String(val2).padStart(2, '0')}-${String(val1).padStart(2, '0')}`, 
        ambiguous: false, 
        error: false 
      };
    }
    
    if (val2 > 12 && val1 <= 12) {
      return { 
        normalized: `${year}-${String(val1).padStart(2, '0')}-${String(val2).padStart(2, '0')}`, 
        ambiguous: false, 
        error: false 
      };
    }
  }

  // 3. Support formats like "14/03/26" (DD/MM/YY)
  const regexTwoDigitYear = /^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/;
  const matchTwo = clean.match(regexTwoDigitYear);
  if (matchTwo) {
    const val1 = parseInt(matchTwo[1]);
    const val2 = parseInt(matchTwo[2]);
    const yy = parseInt(matchTwo[3]);
    const year = yy < 50 ? 2000 + yy : 1900 + yy;
    
    if (val1 > 12 && val2 <= 12) {
      return {
        normalized: `${year}-${String(val2).padStart(2, '0')}-${String(val1).padStart(2, '0')}`,
        ambiguous: false,
        error: false
      };
    } else if (val2 > 12 && val1 <= 12) {
      return {
        normalized: `${year}-${String(val1).padStart(2, '0')}-${String(val2).padStart(2, '0')}`,
        ambiguous: false,
        error: false
      };
    } else if (val1 <= 12 && val2 <= 12 && val1 !== val2) {
      return {
        normalized: `${year}-${String(val1).padStart(2, '0')}-${String(val2).padStart(2, '0')}`,
        ambiguous: true,
        rawValues: { val1, val2, year },
        error: false
      };
    }
  }

  // 4. Support YY/MM/DD or YYYY/MM/DD
  const regexYearFirst = /^(\d{2,4})[-/](\d{1,2})[-/](\d{1,2})$/;
  const matchYearFirst = clean.match(regexYearFirst);
  if (matchYearFirst) {
    const yrRaw = parseInt(matchYearFirst[1]);
    const month = parseInt(matchYearFirst[2]);
    const day = parseInt(matchYearFirst[3]);
    let year = yrRaw;
    if (matchYearFirst[1].length === 2) {
      year = yrRaw < 50 ? 2000 + yrRaw : 1900 + yrRaw;
    }
    if (month <= 12 && day <= 31) {
      return {
        normalized: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        ambiguous: false,
        error: false
      };
    }
  }

  // 5. Support Month-Day abbreviations like "Mar-14" or "14-Mar"
  const monthsMap = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
  };
  
  const monthRegex = /([a-zA-Z]+)[-/ ](\d{1,4})|(\d{1,4})[-/ ]([a-zA-Z]+)/;
  const matchMonth = clean.match(monthRegex);
  if (matchMonth) {
    let mName = matchMonth[1] || matchMonth[4];
    let numVal = parseInt(matchMonth[2] || matchMonth[3]);
    const mNum = monthsMap[mName.toLowerCase().substring(0, 3)];
    if (mNum) {
      let day = numVal;
      let year = new Date().getFullYear();
      
      const fullDateRegex = /([a-zA-Z]+)[-/ ](\d{1,2})[-/ ](\d{2,4})|(\d{1,2})[-/ ]([a-zA-Z]+)[-/ ](\d{2,4})/;
      const matchFull = clean.match(fullDateRegex);
      if (matchFull) {
        mName = matchFull[1] || matchFull[5];
        day = parseInt(matchFull[2] || matchFull[4]);
        const yrRaw = parseInt(matchFull[3] || matchFull[6]);
        year = yrRaw;
        if (String(yrRaw).length === 2) {
          year = yrRaw < 50 ? 2000 + yrRaw : 1900 + yrRaw;
        }
      }
      
      return {
        normalized: `${year}-${String(mNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        ambiguous: false,
        error: false
      };
    }
  }

  // 6. Try parsing with standard Date parser
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return {
      normalized: parsed.toISOString().split('T')[0],
      ambiguous: false,
      error: false
    };
  }

  return { normalized: null, ambiguous: false, error: true };
};

/**
 * Parsers split details cell value flexibly.
 */
export const parseSplitDetails = (detailsStr, participants = []) => {
  if (!detailsStr) return [];
  const parts = detailsStr.split(/[;,]/).map(d => d.trim()).filter(d => d !== '');
  const isNamed = parts[0] && parts[0].includes(':');
  
  if (isNamed) {
    const result = [];
    parts.forEach(p => {
      const [name, val] = p.split(':').map(x => x.trim());
      const value = parseFloat(val);
      if (name && !isNaN(value)) {
        result.push({ identifier: name, value });
      }
    });
    return result;
  } else {
    return parts.map((p, idx) => {
      const value = parseFloat(p);
      return {
        identifier: participants[idx] || null,
        value: isNaN(value) ? 0 : value
      };
    });
  }
};

/**
 * Scans a single CSV row for compliance rules and outputs issue arrays.
 */
export const validateCSVRow = (rowFields, headerMap, groupMembers, existingExpenses, defaultCurrency) => {
  const rawDate = rowFields[headerMap['date']] || '';
  const rawDescription = rowFields[headerMap['description']] || '';
  const rawPaidBy = rowFields[headerMap['paid_by']] || '';
  const rawAmount = rowFields[headerMap['amount']] || '';
  const rawCurrency = headerMap['currency'] !== -1 ? (rowFields[headerMap['currency']] || '') : '';
  const rawSplitType = headerMap['split_type'] !== -1 ? (rowFields[headerMap['split_type']] || '') : '';
  const rawSplitWith = headerMap['split_with'] !== -1 ? (rowFields[headerMap['split_with']] || '') : '';
  const rawSplitDetails = headerMap['split_details'] !== -1 ? (rowFields[headerMap['split_details']] || '') : '';
  const rawNotes = headerMap['notes'] !== -1 ? (rowFields[headerMap['notes']] || '') : '';

  const issues = [];
  const autoFixes = [];
  
  // Required fields defaults
  let cleanDate = rawDate.trim();
  let cleanDesc = rawDescription.trim();
  let cleanPaidBy = rawPaidBy.trim();
  let cleanAmount = rawAmount.trim();
  let cleanCurrency = rawCurrency.trim();
  let cleanSplitType = rawSplitType.trim().toUpperCase() || 'EQUAL';
  let cleanSplitWith = rawSplitWith.trim();
  let cleanSplitDetails = rawSplitDetails.trim();
  let cleanNotes = rawNotes.trim();

  // 1. Missing Required Fields
  const missing = [];
  if (!cleanDate) missing.push('Date');
  if (!cleanDesc) missing.push('Description');
  if (!cleanAmount) missing.push('Amount');
  if (!cleanPaidBy) missing.push('Paid By');

  if (missing.length > 0) {
    issues.push({
      type: 'MISSING_FIELDS',
      severity: 'CRITICAL',
      explanation: `Missing required columns: ${missing.join(', ')}`,
      resolutionPolicy: 'Rejected. You must supply all required fields.'
    });
    return { status: 'REJECTED', issues, autoFixes, record: null };
  }

  // 2. Validate Amount Bounds
  let parsedAmount = parseFloat(cleanAmount);
  if (isNaN(parsedAmount)) {
    issues.push({
      type: 'INVALID_AMOUNT',
      severity: 'CRITICAL',
      explanation: `Amount '${cleanAmount}' must be numeric.`,
      resolutionPolicy: 'Rejected. Provide a valid amount.'
    });
    return { status: 'REJECTED', issues, autoFixes, record: null };
  } else if (parsedAmount === 0) {
    issues.push({
      type: 'ZERO_AMOUNT',
      severity: 'CRITICAL',
      explanation: 'Expense amount is 0.',
      resolutionPolicy: 'Rejected. Expenses cannot have a zero value.'
    });
    return { status: 'REJECTED', issues, autoFixes, record: null };
  } else if (parsedAmount < 0) {
    const absVal = Math.abs(parsedAmount);
    autoFixes.push({
      field: 'amount',
      from: parsedAmount,
      to: absVal,
      type: 'REFUND_CONVERSION'
    });
    issues.push({
      type: 'NEGATIVE_AMOUNT',
      severity: 'WARNING',
      explanation: `Negative amount (${cleanAmount}) detected. Auto-converting to a refund with absolute value ${absVal}.`,
      resolutionPolicy: 'Converted negative amount to positive absolute refund value.'
    });
    parsedAmount = absVal;
    cleanAmount = String(absVal);
  }

  // 3. Date Normalization & Ambiguity checks
  const dateRes = normalizeDate(cleanDate);
  if (dateRes.error) {
    issues.push({
      type: 'INVALID_DATE',
      severity: 'CRITICAL',
      explanation: `Date '${cleanDate}' is not a valid date format.`,
      resolutionPolicy: 'Rejected. Provide YYYY-MM-DD or standard parseable format.'
    });
    return { status: 'REJECTED', issues, autoFixes, record: null };
  } else {
    if (dateRes.normalized !== cleanDate) {
      autoFixes.push({
        field: 'date',
        from: cleanDate,
        to: dateRes.normalized,
        type: 'DATE_NORMALIZATION'
      });
      issues.push({
        type: 'INVALID_DATE_FORMAT',
        severity: 'WARNING',
        explanation: `Date format '${cleanDate}' normalized automatically to '${dateRes.normalized}'.`,
        resolutionPolicy: 'Automatic date format normalization.'
      });
      cleanDate = dateRes.normalized;
    }

    if (dateRes.ambiguous) {
      issues.push({
        type: 'AMBIGUOUS_DATE',
        severity: 'REVIEW_REQUIRED',
        explanation: `Date '${cleanDate}' is ambiguous. It could mean DD-MM-YYYY or MM-DD-YYYY.`,
        resolutionPolicy: 'Presents user choices to resolve date ambiguity (e.g. Month/Day mapping).'
      });
    }
  }

  // 4. Currency Validations
  if (!cleanCurrency) {
    autoFixes.push({
      field: 'currency',
      from: '',
      to: defaultCurrency,
      type: 'CURRENCY_DEFAULT'
    });
    issues.push({
      type: 'MISSING_CURRENCY',
      severity: 'WARNING',
      explanation: `Missing currency. Defaulted to group currency '${defaultCurrency}'.`,
      resolutionPolicy: 'Assigned group default currency.'
    });
    cleanCurrency = defaultCurrency;
  } else if (cleanCurrency.toUpperCase() !== defaultCurrency.toUpperCase()) {
    issues.push({
      type: 'MULTIPLE_CURRENCIES',
      severity: 'WARNING',
      explanation: `Preserved currency '${cleanCurrency}' which differs from default '${defaultCurrency}'.`,
      resolutionPolicy: 'Preserved original currency (converts values on demand).'
    });
  }

  // 5. Split Type verification
  const validSplitTypes = ['EQUAL', 'PERCENTAGE', 'EXACT', 'SHARE'];
  if (!validSplitTypes.includes(cleanSplitType)) {
    issues.push({
      type: 'INVALID_SPLIT_TYPE',
      severity: 'CRITICAL',
      explanation: `Invalid split type '${cleanSplitType}'. Must be one of EQUAL, PERCENTAGE, EXACT, SHARE.`,
      resolutionPolicy: 'Rejected. Select a correct split type.'
    });
    return { status: 'REJECTED', issues, autoFixes, record: null };
  }

  // 6. Split Details Casing checks (Equal Split Conflicts)
  if (cleanSplitType === 'EQUAL' && cleanSplitDetails) {
    issues.push({
      type: 'EQUAL_SPLIT_CONFLICT',
      severity: 'REVIEW_REQUIRED',
      explanation: `Split type is EQUAL but custom split details were provided ('${cleanSplitDetails}').`,
      resolutionPolicy: 'Verify whether split type should be EQUAL (ignores custom details) or custom.'
    });
  }

  // 7. Payer resolution (Name Normalization & Unknown Members)
  let resolvedPayer = null;
  const matchedPayer = findGroupMember(cleanPaidBy, groupMembers);
  if (matchedPayer) {
    if (matchedPayer.user.name !== cleanPaidBy) {
      autoFixes.push({
        field: 'paid_by',
        from: cleanPaidBy,
        to: matchedPayer.user.name,
        type: 'NAME_NORMALIZATION'
      });
      issues.push({
        type: 'NAME_NORMALIZATION',
        severity: 'WARNING',
        explanation: `Payer name '${cleanPaidBy}' auto-normalized to group member '${matchedPayer.user.name}'.`,
        resolutionPolicy: 'Auto-resolved matching name case-insensitively.'
      });
      cleanPaidBy = matchedPayer.user.name;
    }
    resolvedPayer = matchedPayer;
  } else {
    issues.push({
      type: 'UNKNOWN_MEMBER',
      severity: 'WARNING',
      explanation: `Payer '${cleanPaidBy}' is not a member of the group.`,
      resolutionPolicy: 'A guest profile will be automatically created on final commit.'
    });
  }

  // 8. Split With members check
  const splitWithList = cleanSplitWith ? cleanSplitWith.split(/[;,]/).map(s => s.trim()).filter(s => s !== '') : [];
  if (splitWithList.length === 0) {
    issues.push({
      type: 'MISSING_PARTICIPANTS',
      severity: 'CRITICAL',
      explanation: 'At least one split participant is required.',
      resolutionPolicy: 'Rejected. You must supply split participants.'
    });
    return { status: 'REJECTED', issues, autoFixes, record: null };
  } else {
    splitWithList.forEach(participant => {
      const matchedPart = findGroupMember(participant, groupMembers);
      if (matchedPart) {
        if (matchedPart.user.name !== participant) {
          autoFixes.push({
            field: 'split_with',
            from: participant,
            to: matchedPart.user.name,
            type: 'NAME_NORMALIZATION'
          });
          participant = matchedPart.user.name;
        }
      } else {
        issues.push({
          type: 'UNKNOWN_MEMBER_PARTICIPANT',
          severity: 'WARNING',
          explanation: `Participant '${participant}' is not in the group.`,
          resolutionPolicy: 'A guest profile will be created on import.'
        });
      }
    });
  }

  // 9. Split Percentage sum validation (100% check)
  if (cleanSplitType === 'PERCENTAGE' && cleanSplitDetails) {
    const details = parseSplitDetails(cleanSplitDetails, splitWithList);
    const sum = details.reduce((acc, cur) => acc + (cur.value || 0), 0);
    if (Math.abs(sum - 100) > 0.05) {
      issues.push({
        type: 'PERCENTAGE_SPLIT_CONFLICT',
        severity: 'CRITICAL',
        explanation: `Split type is PERCENTAGE but details sum to ${sum}% instead of 100%.`,
        resolutionPolicy: 'Rejected. Percentage weights must sum to exactly 100%.'
      });
      return { status: 'REJECTED', issues, autoFixes, record: null };
    }
  }

  // 10. Member Lifecycle bounds validation
  const expenseDate = new Date(cleanDate);
  const checkLifecycleMember = (memberObj, name) => {
    if (memberObj) {
      const joinDate = new Date(memberObj.joinedAt);
      if (expenseDate < joinDate) {
        issues.push({
          type: 'LIFECYCLE_VIOLATION',
          severity: 'WARNING',
          explanation: `Payer/Participant '${name}' has joined date '${memberObj.joinedAt.toISOString().split('T')[0]}' which is after the expense date '${cleanDate}'.`,
          resolutionPolicy: 'Review required. Verify if the member list joins align.'
        });
      }
      if (memberObj.leftAt) {
        const leftDate = new Date(memberObj.leftAt);
        if (expenseDate > leftDate) {
          issues.push({
            type: 'LIFECYCLE_VIOLATION',
            severity: 'WARNING',
            explanation: `Payer/Participant '${name}' left the group on '${memberObj.leftAt.toISOString().split('T')[0]}' which is before the expense date '${cleanDate}'.`,
            resolutionPolicy: 'Review required. Verify if transaction date is incorrect.'
          });
        }
      }
    }
  };

  // Run lifecycle check for resolved payer
  checkLifecycleMember(resolvedPayer, cleanPaidBy);

  // Run lifecycle check for split_with members
  splitWithList.forEach(participant => {
    const matchedPart = findGroupMember(participant, groupMembers);
    checkLifecycleMember(matchedPart, participant);
  });

  // 11. Settlement detected as Expense
  const settlementKeywords = ['paid back', 'reimbursement', 'settled', 'refund transfer', 'payment to', 'settle debt', 'refund'];
  const descLower = cleanDesc.toLowerCase();
  const isSettlement = settlementKeywords.some(kw => descLower.includes(kw));
  let suggestedSettlement = null;

  if (isSettlement) {
    const recipient = splitWithList[0] || 'Unknown';
    suggestedSettlement = {
      from: cleanPaidBy,
      to: recipient,
      amount: parsedAmount
    };
    issues.push({
      type: 'SETTLEMENT_DETECTED',
      severity: 'REVIEW_REQUIRED',
      explanation: `Description contains settlement terms. Suggested converting expense to settlement from '${cleanPaidBy}' to '${recipient}'.`,
      resolutionPolicy: 'User review required. Can toggle to settlement instead of expense.'
    });
  }

  // 12. Duplicate Check
  let status = 'VALID';
  const hasReviewRequired = issues.some(i => i.severity === 'REVIEW_REQUIRED');
  if (hasReviewRequired) {
    status = 'REVIEW_REQUIRED';
  } else if (issues.some(i => i.severity === 'WARNING')) {
    status = 'WARNING';
  }

  // If not already rejected/review required, verify duplicates in database
  if (status !== 'REJECTED') {
    const isPayerMember = !!resolvedPayer;
    
    // exact duplicate scan
    const exactDup = existingExpenses.find(exp => {
      const expDateStr = new Date(exp.date).toISOString().split('T')[0];
      const samePayer = isPayerMember && exp.paidById === resolvedPayer.user.id;
      const sameAmount = Math.abs(exp.amount - parsedAmount) < 0.001;
      const sameDate = expDateStr === cleanDate;
      const sameDesc = exp.description.trim() === cleanDesc;
      return samePayer && sameAmount && sameDate && sameDesc;
    });

    if (exactDup) {
      status = 'WARNING';
      issues.push({
        type: 'DUPLICATE',
        severity: 'WARNING',
        explanation: `Exact duplicate of existing expense on ${cleanDate}`,
        resolutionPolicy: 'Choose: Keep Existing (skip row), Import New (create duplicate), or Keep Both.'
      });
    } else {
      // near duplicate scan
      let highestSim = 0;
      let similarDup = null;
      existingExpenses.forEach(exp => {
        const samePayer = isPayerMember && exp.paidById === resolvedPayer.user.id;
        const sameAmount = Math.abs(exp.amount - parsedAmount) < 0.001;
        if (samePayer && sameAmount) {
          const sim = getSimilarityScore(exp.description, cleanDesc);
          if (sim > highestSim) {
            highestSim = sim;
            similarDup = exp;
          }
        }
      });

      if (similarDup && highestSim > 0.85) {
        status = 'WARNING';
        const pct = Math.round(highestSim * 100);
        issues.push({
          type: 'DUPLICATE',
          severity: 'WARNING',
          explanation: `Near duplicate: similarity ${pct}% to expense on ${new Date(similarDup.date).toISOString().split('T')[0]}: "${similarDup.description}"`,
          resolutionPolicy: 'Choose: Keep Existing, Import New, or Keep Both.'
        });
      }
    }
  }

  const record = {
    date: cleanDate,
    description: cleanDesc,
    paidBy: cleanPaidBy,
    amount: parsedAmount,
    currency: cleanCurrency,
    splitType: cleanSplitType,
    splitWith: cleanSplitWith,
    splitDetails: cleanSplitDetails,
    notes: cleanNotes,
    suggestedSettlement
  };

  return {
    status,
    issues,
    autoFixes,
    record
  };
};

/**
 * Parses and runs comprehensive rule validations on a raw CSV file.
 * Returns structured validation report.
 */
export const runCSVValidation = (csvContent, groupMembers = [], existingExpenses = [], defaultCurrency = 'USD') => {
  if (!csvContent || typeof csvContent !== 'string') {
    throw new Error('CSV content must be a non-empty string.');
  }

  const lines = csvContent.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
  if (lines.length < 1) {
    throw new Error('CSV file is empty.');
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/_/g, ''));

  const requiredFields = ['date', 'description', 'paidby', 'amount'];
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
    return headerMap[f] === -1;
  });

  if (missingHeaders.length > 0) {
    const cleanMissing = missingHeaders.map(f => f === 'paidby' ? 'paid_by' : f);
    throw new Error(`CSV is missing required column headers: ${cleanMissing.join(', ')}`);
  }

  const rows = [];
  const summary = {
    totalRows: 0,
    validCount: 0,
    warningCount: 0,
    reviewCount: 0,
    rejectedCount: 0
  };

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const rowFields = parseCSVLine(rawLine);
    const rowNumber = i + 1;

    let rowRes;
    try {
      rowRes = validateCSVRow(rowFields, headerMap, groupMembers, existingExpenses, defaultCurrency);
    } catch (err) {
      rowRes = {
        status: 'REJECTED',
        issues: [{ type: 'CRITICAL_PARSING_ERROR', severity: 'CRITICAL', explanation: err.message, resolutionPolicy: 'Rejected due to syntax error.' }],
        autoFixes: [],
        record: null
      };
    }

    summary.totalRows += 1;
    if (rowRes.status === 'VALID') summary.validCount += 1;
    else if (rowRes.status === 'WARNING') summary.warningCount += 1;
    else if (rowRes.status === 'REVIEW_REQUIRED') summary.reviewCount += 1;
    else if (rowRes.status === 'REJECTED') summary.rejectedCount += 1;

    rows.push({
      rowNumber,
      rawRow: rawLine,
      status: rowRes.status,
      issues: rowRes.issues,
      autoFixes: rowRes.autoFixes,
      record: rowRes.record
    });
  }

  return {
    summary,
    rows
  };
};

export default {
  normalizeDate,
  parseSplitDetails,
  validateCSVRow,
  runCSVValidation
};
