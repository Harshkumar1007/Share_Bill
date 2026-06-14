import prisma from './prisma.service.js';

/**
 * Scan a list of parsed expenses and identify potential anomalies or warnings.
 * Queries the database for membership conflicts and duplicate entries.
 * @param {Array} expenses List of parsed expense objects.
 * @returns {Array} List of anomalies with severity and explanation.
 */
export const scanForAnomalies = async (expenses) => {
  const anomalies = [];
  const duplicateWindowMs = 24 * 60 * 60 * 1000; // 24 hours window for duplicates

  // Extract unique group IDs referenced in the batch
  const groupIds = [...new Set(expenses.map(e => e.groupId).filter(Boolean))];

  // 1. Fetch referenced groups along with active members (where leftAt is null)
  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    include: {
      members: {
        where: { leftAt: null }
      }
    }
  });

  const groupsMap = new Map(groups.map(g => [g.id, g]));

  // 2. Fetch existing expenses in database for these groups (e.g. from the last 7 days)
  const existingExpenses = await prisma.expense.findMany({
    where: {
      groupId: { in: groupIds },
      date: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });

  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    const { description, amount, date, groupId, paidById, currency } = expense;

    // A. Negative or Invalid Amount
    if (amount === null || isNaN(amount)) {
      anomalies.push({
        expenseIndex: i,
        description,
        type: 'INVALID_AMOUNT',
        severity: 'HIGH',
        message: `Amount is missing or non-numeric: "${expense.rawAmount || ''}".`
      });
    } else if (amount <= 0) {
      anomalies.push({
        expenseIndex: i,
        description,
        type: 'NEGATIVE_AMOUNT',
        severity: 'HIGH',
        message: `Amount must be greater than zero: $${amount.toFixed(2)}.`
      });
    }

    // B. Invalid Date
    if (!date || isNaN(new Date(date).getTime())) {
      anomalies.push({
        expenseIndex: i,
        description,
        type: 'INVALID_DATE',
        severity: 'HIGH',
        message: `Date is invalid or missing: "${expense.rawDate || ''}".`
      });
    }

    // C. Missing Payer
    if (!paidById || paidById.trim() === '') {
      anomalies.push({
        expenseIndex: i,
        description,
        type: 'MISSING_PAYER',
        severity: 'HIGH',
        message: 'No payer specified.'
      });
    }

    // D. Missing Currency
    if (!currency || currency.trim() === '') {
      anomalies.push({
        expenseIndex: i,
        description,
        type: 'MISSING_CURRENCY',
        severity: 'MEDIUM',
        message: 'No currency specified. Will default to USD.'
      });
    }

    // E. Membership & Group Conflicts
    if (!groupId || groupId.trim() === '') {
      anomalies.push({
        expenseIndex: i,
        description,
        type: 'INVALID_GROUP',
        severity: 'HIGH',
        message: 'No group specified.'
      });
    } else {
      const group = groupsMap.get(groupId);
      if (!group) {
        anomalies.push({
          expenseIndex: i,
          description,
          type: 'INVALID_GROUP',
          severity: 'HIGH',
          message: `Group with ID "${groupId}" does not exist.`
        });
      } else if (paidById && paidById.trim() !== '') {
        const isMember = group.members.some(m => m.userId === paidById);
        if (!isMember) {
          anomalies.push({
            expenseIndex: i,
            description,
            type: 'MEMBERSHIP_CONFLICT',
            severity: 'HIGH',
            message: `Payer "${paidById}" is not an active member of group "${group.name}".`
          });
        }
      }
    }

    // F. Duplicate Expenses (within CSV batch)
    for (let j = i + 1; j < expenses.length; j++) {
      const other = expenses[j];
      if (!description || !other.description) continue;
      const isSameDesc = description.toLowerCase().trim() === other.description.toLowerCase().trim();
      const isSameAmount = amount !== null && other.amount !== null && Math.abs(amount - other.amount) < 0.01;
      const isSameGroup = groupId === other.groupId;

      let timeDiff = Infinity;
      if (date && other.date) {
        timeDiff = Math.abs(new Date(date).getTime() - new Date(other.date).getTime());
      }

      if (isSameDesc && isSameAmount && isSameGroup && timeDiff <= duplicateWindowMs) {
        anomalies.push({
          expenseIndex: i,
          description,
          type: 'DUPLICATE_EXPENSE',
          severity: 'MEDIUM',
          message: `Duplicate expense with row ${j + 1} ("${other.description}" - $${other.amount}) in the same group within 24 hours.`
        });
      }
    }

    // G. Duplicate Expenses (against existing Database records)
    if (groupId && amount !== null && date) {
      const dbDuplicates = existingExpenses.filter(e => {
        const isSameDesc = description.toLowerCase().trim() === e.description.toLowerCase().trim();
        const isSameAmount = Math.abs(amount - e.amount) < 0.01;
        const isSameGroup = groupId === e.groupId;
        const timeDiff = Math.abs(new Date(date).getTime() - new Date(e.date).getTime());
        return isSameDesc && isSameAmount && isSameGroup && timeDiff <= duplicateWindowMs;
      });

      if (dbDuplicates.length > 0) {
        anomalies.push({
          expenseIndex: i,
          description,
          type: 'DUPLICATE_EXPENSE',
          severity: 'MEDIUM',
          message: `Already exists in the database: "${description}" ($${amount.toFixed(2)}) on ${new Date(dbDuplicates[0].date).toLocaleDateString()}.`
        });
      }
    }
  }

  return anomalies;
};

export default {
  scanForAnomalies
};
