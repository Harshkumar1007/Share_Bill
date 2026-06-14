import {
  getSimilarityScore,
  findGroupMember,
  parseCSVForPreview
} from '../../../../../Desktop/Share_Bill/backend/src/services/csvParser.service.js';

console.log('--- STARTING DUPLICATE DETECTION ENGINE TESTS ---');
// Mock group members database state
const mockMembers = [
  {
    id: 'member-1',
    user: {
      id: 'user-alice-id',
      name: 'Alice Cooper',
      email: 'alice@cooper.com'
    }
  },
  {
    id: 'member-2',
    user: {
      id: 'user-bob-id',
      name: 'Bob Marley',
      email: 'bob@marley.com'
    }
  }
];

// Mock existing group expenses database state
const mockExistingExpenses = [
  {
    id: 'exp-1',
    description: 'Pizza Dinner',
    amount: 32.50,
    date: new Date('2026-06-12T00:00:00.000Z'),
    paidById: 'user-alice-id'
  },
  {
    id: 'exp-2',
    description: 'Shared Taxi Cab',
    amount: 15.00,
    date: new Date('2026-06-13T00:00:00.000Z'),
    paidById: 'user-bob-id'
  }
];

// 1. Test similarity calculation
console.log('\n[Test 1] Similarity score calculations (Levenshtein):');
const sim1 = getSimilarityScore('Pizza Dinner', 'pizza dinner');
const sim2 = getSimilarityScore('Pizza Dinner', 'Pizza Dinner!!!');
const sim3 = getSimilarityScore('Pizza Dinner', 'Piza Diner');
const sim4 = getSimilarityScore('Pizza Dinner', 'Taxi Cab');

console.log(`- Exact same case-insensitive: ${sim1} (Expected: 1.0)`);
console.log(`- Stripping punctuation: ${sim2} (Expected: 1.0)`);
console.log(`- Typos (Piza Diner): ${sim3} (Expected: > 0.80)`);
console.log(`- Completely different: ${sim4} (Expected: < 0.20)`);

if (sim1 === 1.0 && sim2 === 1.0 && sim3 > 0.80 && sim4 < 0.20) {
  console.log('PASS: Levenshtein similarity working perfectly.');
} else {
  console.log('FAIL: Levenshtein similarity calculation issues.');
}

// 2. Test group member matching
console.log('\n[Test 2] Group member identifier resolution:');
const match1 = findGroupMember('alice@cooper.com', mockMembers);
const match2 = findGroupMember('Bob Marley', mockMembers);
const match3 = findGroupMember('bob@marley.com', mockMembers);
const match4 = findGroupMember('Charlie Chaplin', mockMembers);

console.log(`- Match by email: ${match1 ? match1.user.name : 'null'} (Expected: Alice Cooper)`);
console.log(`- Match by name (case-insensitive): ${match2 ? match2.user.name : 'null'} (Expected: Bob Marley)`);
console.log(`- Match by exact email: ${match3 ? match3.user.name : 'null'} (Expected: Bob Marley)`);
console.log(`- Non-member match: ${match4 ? match4.user.name : 'null'} (Expected: null)`);

if (match1 && match1.user.id === 'user-alice-id' &&
    match2 && match2.user.id === 'user-bob-id' &&
    match3 && match3.user.id === 'user-bob-id' &&
    match4 === null) {
  console.log('PASS: Group member identification is correct.');
} else {
  console.log('FAIL: Group member identification logic error.');
}

// 3. Test parseCSVForPreview with all statuses: VALID, DUPLICATE, POSSIBLE_DUPLICATE, INVALID
console.log('\n[Test 3] CSV parsing, validation, and status classification:');
const csvContent = `date,description,paid_by,amount,currency,split_type,split_with,split_details,notes
2026-06-12,Pizza Dinner,alice@cooper.com,32.50,USD,EQUAL,bob@marley.com,,dinner expense
2026-06-12,pizza dinner!!!,alice@cooper.com,32.50,USD,EQUAL,bob@marley.com,,pizza again
2026-06-13,Taxi,Bob Marley,15.00,USD,EQUAL,alice@cooper.com,,
2026-06-14,Hotel Booking,Alice Cooper,250.00,USD,EQUAL,Bob Marley,,
2026-06-15,Lunch,Charlie,12.00,USD,EQUAL,alice@cooper.com,,
2026-06-16,,Alice Cooper,10.00,USD,EQUAL,Bob Marley,,
2026-06-17,Dinner,Alice Cooper,-5.00,USD,EQUAL,Bob Marley,,
2026-06-18,Dinner,Alice Cooper,15.00,USD,BAD_SPLIT,Bob Marley,,`;

try {
  const result = parseCSVForPreview(csvContent, mockMembers, mockExistingExpenses);
  
  console.log('Summary:', JSON.stringify(result.summary));
  
  // Row 2 is exact duplicate of Pizza Dinner (Row 2 in CSV is date 2026-06-12, desc "pizza dinner!!!", amt 32.50, paidBy alice@cooper.com).
  // Wait! In the mock database, exp-1 has date 2026-06-12, description "Pizza Dinner", amount 32.50, paidById user-alice-id.
  // Wait, does "pizza dinner!!!" description match "Pizza Dinner" exactly? No! So it should be POSSIBLE_DUPLICATE, not DUPLICATE (exact duplicate requires exact description match, including casing or after trimming. Since one is lowercase and has exclamation marks, they are not exact match!).
  // Row 2 description: "pizza dinner!!!", DB description: "Pizza Dinner". Let's check:
  // Row 2 status should be POSSIBLE_DUPLICATE.
  // Wait, what about Row 2 in the CSV content (Row 2 in output)?
  // CSV Row 2 (rowNumber 2): date 2026-06-12, description "Pizza Dinner", which matches exp-1 exactly. This should be DUPLICATE.
  // CSV Row 3 (rowNumber 3): date 2026-06-12, description "pizza dinner!!!". This should be POSSIBLE_DUPLICATE.
  // Let's verify each parsed row's status:
  
  const rows = [
    ...(result.validRows || []),
    ...(result.duplicateRows || []),
    ...(result.suspiciousRows || []),
    ...(result.invalidRows || [])
  ].sort((a, b) => a.rowNumber - b.rowNumber);

  rows.forEach(r => {
    console.log(`Row ${r.rowNumber} (${r.description || '<empty>'}): Status = ${r.status}, Reason = "${r.reason || ''}"`);
  });

  const row2 = rows.find(r => r.rowNumber === 2);
  const row3 = rows.find(r => r.rowNumber === 3);
  const row4 = rows.find(r => r.rowNumber === 4);
  const row5 = rows.find(r => r.rowNumber === 5);
  const row6 = rows.find(r => r.rowNumber === 6);
  const row7 = rows.find(r => r.rowNumber === 7);
  const row8 = rows.find(r => r.rowNumber === 8);
  const row9 = rows.find(r => r.rowNumber === 9);

  const testsOk = 
    row2.status === 'DUPLICATE' &&
    row3.status === 'POSSIBLE_DUPLICATE' &&
    row4.status === 'POSSIBLE_DUPLICATE' && // Taxi (15.00) vs Shared Taxi Cab (15.00) similarity is > 85%? Wait, let's see. "taxi" vs "shared taxi cab".
    // Cleaned: "taxi" vs "sharedtaxicab". Length: 4 vs 13. Max length: 13. Distance: 9. Similarity: (13-9)/13 = 4/13 = 30.7%. So similarity is not > 85%!
    // Let's verify row 4 status: it should be VALID because similarity is not > 85%.
    row5.status === 'VALID' &&
    row6.status === 'INVALID' && // Charlie is not a member
    row7.status === 'INVALID' && // Description is empty
    row8.status === 'INVALID' && // Negative amount
    row9.status === 'INVALID'; // Bad split type

  console.log('\nDetailed verification assertions:');
  console.log(`- Row 2 (Exact Duplicate) status check: ${row2.status} (Expected: DUPLICATE)`);
  console.log(`- Row 3 (Similar Duplicate) status check: ${row3.status} (Expected: POSSIBLE_DUPLICATE)`);
  console.log(`- Row 4 (Low Similarity) status check: ${row4.status} (Expected: VALID)`);
  console.log(`- Row 5 (Valid) status check: ${row5.status} (Expected: VALID)`);
  console.log(`- Row 6 (Invalid Payer) status check: ${row6.status} (Expected: INVALID)`);
  console.log(`- Row 7 (Invalid Desc) status check: ${row7.status} (Expected: INVALID)`);
  console.log(`- Row 8 (Invalid Amt) status check: ${row8.status} (Expected: INVALID)`);
  console.log(`- Row 9 (Invalid Split) status check: ${row9.status} (Expected: INVALID)`);

  if (row2.status === 'DUPLICATE' &&
      row3.status === 'POSSIBLE_DUPLICATE' &&
      row4.status === 'VALID' &&
      row5.status === 'VALID' &&
      row6.status === 'INVALID' &&
      row7.status === 'INVALID' &&
      row8.status === 'INVALID' &&
      row9.status === 'INVALID') {
    console.log('\nPASS: All row status classifications are correct!');
  } else {
    console.log('\nFAIL: Classification verification failed.');
  }

} catch (error) {
  console.log('FAIL: Unexpected execution error during parsing test:', error);
}
