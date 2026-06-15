import prisma from './prisma.service.js';
import { getActivities } from './activity.service.js';

/**
 * Fetch group profile.
 * @param {string} groupId 
 * @returns {Promise<Object>}
 */
export const getGroup = async (groupId) => {
  return await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true, description: true, creatorId: true, createdAt: true }
  });
};

/**
 * Fetch names and emails of active members.
 * @param {string} groupId 
 * @returns {Promise<Array>}
 */
export const getMembers = async (groupId) => {
  const members = await prisma.groupMember.findMany({
    where: { groupId, leftAt: null },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
  return members.map(m => m.user);
};

/**
 * Fetch expenses list with splits and payer details.
 * @param {string} groupId 
 * @returns {Promise<Array>}
 */
export const getExpenses = async (groupId) => {
  return await prisma.expense.findMany({
    where: { groupId },
    include: {
      paidBy: {
        select: { id: true, name: true, email: true }
      },
      splits: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    },
    orderBy: { date: 'asc' }
  });
};

/**
 * Fetch split weights.
 * @param {string} groupId 
 * @returns {Promise<Array>}
 */
export const getSplits = async (groupId) => {
  return await prisma.expenseSplit.findMany({
    where: {
      expense: { groupId }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
};

/**
 * Fetch settlement payment records.
 * @param {string} groupId 
 * @returns {Promise<Array>}
 */
export const getSettlements = async (groupId) => {
  return await prisma.settlement.findMany({
    where: { groupId },
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } }
    },
    orderBy: { date: 'asc' }
  });
};

/**
 * Fetch net standings and simplified optimized cash transfers.
 * @param {string} groupId 
 * @returns {Promise<Object>}
 */
export const getBalances = async (groupId) => {
  const members = await getMembers(groupId);
  const expenses = await getExpenses(groupId);
  const settlements = await prisma.settlement.findMany({
    where: { groupId }
  });

  const currencies = new Set(expenses.map(e => e.currency));
  if (currencies.size === 0) currencies.add('USD');

  const firstExpense = expenses[0];
  const defaultCurrency = firstExpense ? firstExpense.currency : 'USD';

  const result = {};

  for (const cur of currencies) {
    const balanceMap = {};
    const memberNames = {};

    members.forEach(m => {
      balanceMap[m.id] = 0;
      memberNames[m.id] = m.name;
    });

    expenses.forEach(exp => {
      if (exp.currency !== cur) return;
      if (balanceMap[exp.paidById] !== undefined) {
        balanceMap[exp.paidById] += exp.amount;
      }
      exp.splits.forEach(split => {
        if (balanceMap[split.userId] !== undefined) {
          balanceMap[split.userId] -= split.amount;
        }
      });
    });

    if (cur === defaultCurrency) {
      settlements.forEach(set => {
        if (balanceMap[set.fromUserId] !== undefined) {
          balanceMap[set.fromUserId] += set.amount;
        }
        if (balanceMap[set.toUserId] !== undefined) {
          balanceMap[set.toUserId] -= set.amount;
        }
      });
    }

    const debtors = [];
    const creditors = [];

    Object.keys(balanceMap).forEach(uid => {
      const bal = balanceMap[uid];
      const name = memberNames[uid] || 'Unknown';
      if (bal < -0.01) {
        debtors.push({ userId: uid, name, balance: bal });
      } else if (bal > 0.01) {
        creditors.push({ userId: uid, name, balance: bal });
      }
    });

    debtors.sort((a, b) => a.balance - b.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const debts = [];
    let dIdx = 0;
    let cIdx = 0;

    const tempDebtors = debtors.map(d => ({ ...d }));
    const tempCreditors = creditors.map(c => ({ ...c }));

    while (dIdx < tempDebtors.length && cIdx < tempCreditors.length) {
      const debtor = tempDebtors[dIdx];
      const creditor = tempCreditors[cIdx];

      const amountToPay = Math.min(Math.abs(debtor.balance), creditor.balance);
      const roundedAmount = Math.round(amountToPay * 100) / 100;

      if (roundedAmount > 0) {
        debts.push({
          fromUserId: debtor.userId,
          from: debtor.name,
          toUserId: creditor.userId,
          to: creditor.name,
          amount: roundedAmount
        });
      }

      debtor.balance += amountToPay;
      creditor.balance -= amountToPay;

      if (Math.abs(debtor.balance) < 0.01) dIdx++;
      if (Math.abs(creditor.balance) < 0.01) cIdx++;
    }

    result[cur] = {
      totalSpending: expenses.filter(e => e.currency === cur).reduce((sum, e) => sum + e.amount, 0),
      netBalances: balanceMap,
      debts
    };
  }

  return {
    defaultCurrency,
    currencies: Array.from(currencies),
    balancesByCurrency: result
  };
};

/**
 * Compile a trip details summary.
 * @param {string} groupId 
 * @returns {Promise<Object>}
 */
export const getTripSummary = async (groupId) => {
  const group = await getGroup(groupId);
  const members = await getMembers(groupId);
  const expenses = await getExpenses(groupId);
  
  const totalExpensesByCurrency = {};
  const categoryTotals = {};
  const dailyBreakdown = {};
  const spenderTotals = {};
  
  expenses.forEach(exp => {
    const cur = exp.currency;
    const amt = exp.amount;
    
    const descLower = exp.description.toLowerCase();
    let cat = 'General';
    if (descLower.includes('food') || descLower.includes('dinner') || descLower.includes('lunch') || descLower.includes('breakfast') || descLower.includes('meal') || descLower.includes('restaurant')) {
      cat = 'Food & Dining';
    } else if (descLower.includes('hotel') || descLower.includes('stay') || descLower.includes('airbnb') || descLower.includes('room') || descLower.includes('hostel')) {
      cat = 'Accommodation';
    } else if (descLower.includes('taxi') || descLower.includes('cab') || descLower.includes('uber') || descLower.includes('flight') || descLower.includes('train') || descLower.includes('bus') || descLower.includes('travel') || descLower.includes('fuel')) {
      cat = 'Transportation';
    } else if (descLower.includes('ticket') || descLower.includes('movie') || descLower.includes('show') || descLower.includes('museum') || descLower.includes('entry') || descLower.includes('event')) {
      cat = 'Entertainment';
    }
    
    totalExpensesByCurrency[cur] = (totalExpensesByCurrency[cur] || 0) + amt;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    
    const dateStr = exp.date ? new Date(exp.date).toISOString().split('T')[0] : 'Unknown';
    dailyBreakdown[dateStr] = (dailyBreakdown[dateStr] || 0) + amt;
    
    const payerName = exp.paidBy?.name || 'Unknown';
    spenderTotals[payerName] = (spenderTotals[payerName] || 0) + amt;
  });

  const largestExpense = expenses.length > 0 
    ? expenses.reduce((max, exp) => exp.amount > max.amount ? exp : max, expenses[0])
    : null;

  return {
    groupName: group?.name || 'Unknown Trip',
    description: group?.description || '',
    participantsCount: members.length,
    participants: members.map(m => m.name),
    totalExpensesByCurrency,
    largestExpense: largestExpense ? {
      description: largestExpense.description,
      amount: largestExpense.amount,
      currency: largestExpense.currency,
      paidBy: largestExpense.paidBy?.name,
      date: largestExpense.date ? new Date(largestExpense.date).toISOString().split('T')[0] : 'Unknown'
    } : null,
    topSpenders: Object.entries(spenderTotals).sort((a, b) => b[1] - a[1]).map(e => ({ name: e[0], total: e[1] })),
    categories: categoryTotals,
    dailyBreakdown
  };
};

/**
 * Fetch category distribution.
 * @param {string} groupId 
 * @returns {Promise<Object>}
 */
export const getCategoryStats = async (groupId) => {
  const expenses = await getExpenses(groupId);
  const stats = {};
  
  expenses.forEach(exp => {
    const descLower = exp.description.toLowerCase();
    let category = 'General';
    if (descLower.includes('food') || descLower.includes('dinner') || descLower.includes('lunch') || descLower.includes('breakfast') || descLower.includes('meal') || descLower.includes('restaurant')) {
      category = 'Food & Dining';
    } else if (descLower.includes('hotel') || descLower.includes('stay') || descLower.includes('airbnb') || descLower.includes('room') || descLower.includes('hostel')) {
      category = 'Accommodation';
    } else if (descLower.includes('taxi') || descLower.includes('cab') || descLower.includes('uber') || descLower.includes('flight') || descLower.includes('train') || descLower.includes('bus') || descLower.includes('travel') || descLower.includes('fuel')) {
      category = 'Transportation';
    } else if (descLower.includes('ticket') || descLower.includes('movie') || descLower.includes('show') || descLower.includes('museum') || descLower.includes('entry') || descLower.includes('event')) {
      category = 'Entertainment';
    }
    
    if (!stats[category]) {
      stats[category] = { total: 0, count: 0, currency: exp.currency };
    }
    stats[category].total += exp.amount;
    stats[category].count += 1;
  });
  
  return stats;
};

/**
 * Fetch action activity logs for a group.
 * @param {string} groupId 
 * @returns {Promise<Array>}
 */
export const getActivityLogs = async (groupId) => {
  const logs = await getActivities();
  return logs.filter(log => log.groupId === groupId);
};

/**
 * Fetch CSV imports logged in activities.
 * @param {string} groupId 
 * @returns {Promise<Array>}
 */
export const getCSVImports = async (groupId) => {
  const activities = await getActivityLogs(groupId);
  return activities.filter(a => a.type === 'CSV_IMPORTED' || a.type === 'CSV_PREVIEWED');
};

/**
 * Fetch scanned anomalies.
 * @param {string} groupId 
 * @returns {Promise<Array>}
 */
export const getAnomalies = async (groupId) => {
  return await prisma.importAnomaly.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export default {
  getGroup,
  getMembers,
  getExpenses,
  getSplits,
  getBalances,
  getSettlements,
  getTripSummary,
  getCategoryStats,
  getActivityLogs,
  getCSVImports,
  getAnomalies
};
