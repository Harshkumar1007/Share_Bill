// Anomaly Service

/**
 * Scan a list of parsed expenses and identify potential anomalies or warnings.
 * @param {Array} expenses List of parsed expense objects.
 * @returns {Array} List of anomalies with severity and explanation.
 */
export const scanForAnomalies = (expenses) => {
  const anomalies = [];
  const duplicateWindowMs = 24 * 60 * 60 * 1000; // 24 hours window for duplicates

  expenses.forEach((expense, index) => {
    // 1. Amount Outlier Detection (e.g., abnormally high expense, say > $1000)
    if (expense.amount > 1000) {
      anomalies.push({
        expenseIndex: index,
        description: expense.description,
        type: 'OUTLIER',
        severity: 'HIGH',
        message: `High amount detected ($${expense.amount.toFixed(2)}). Please verify details.`
      });
    } else if (expense.amount > 500) {
      anomalies.push({
        expenseIndex: index,
        description: expense.description,
        type: 'OUTLIER',
        severity: 'MEDIUM',
        message: `Relatively high amount detected ($${expense.amount.toFixed(2)}).`
      });
    }

    // 2. Split verification check
    if (expense.splits && expense.splits.length > 0) {
      const sumSplits = expense.splits.reduce((sum, s) => sum + (s.amount || 0), 0);
      const difference = Math.abs(sumSplits - expense.amount);
      if (difference > 0.01) {
        anomalies.push({
          expenseIndex: index,
          description: expense.description,
          type: 'SPLIT_MISMATCH',
          severity: 'HIGH',
          message: `Split sums ($${sumSplits.toFixed(2)}) do not match total expense amount ($${expense.amount.toFixed(2)}).`
        });
      }
    }

    // 3. Duplicate checks within window
    for (let j = index + 1; j < expenses.length; j++) {
      const other = expenses[j];
      
      const isSameDesc = expense.description.toLowerCase().trim() === other.description.toLowerCase().trim();
      const isSameAmount = Math.abs(expense.amount - other.amount) < 0.01;
      const isSameGroup = expense.groupId === other.groupId;
      
      // Calculate date difference
      const date1 = new Date(expense.date);
      const date2 = new Date(other.date);
      const timeDiff = Math.abs(date1.getTime() - date2.getTime());

      if (isSameDesc && isSameAmount && isSameGroup && timeDiff <= duplicateWindowMs) {
        anomalies.push({
          expenseIndex: index,
          description: expense.description,
          type: 'POTENTIAL_DUPLICATE',
          severity: 'MEDIUM',
          message: `Potential duplicate found with expense at index ${j} ("${other.description}" - $${other.amount}) in the same group within 24 hours.`
        });
      }
    }
  });

  return anomalies;
};

export default {
  scanForAnomalies
};
