import prisma from '../services/prisma.service.js';
import { logActivity } from '../services/activity.service.js';

// @desc    Create a new expense with splits
// @route   POST /api/groups/:groupId/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    const { description, amount, currency, paidById, splitType, date, splits } = req.body;

    if (!groupId) {
      return res.status(400).json({ success: false, error: 'Group ID is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
    }

    if (!paidById) {
      return res.status(400).json({ success: false, error: 'Payer is required' });
    }

    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one participant is required' });
    }

    const validSplitTypes = ['EQUAL', 'PERCENTAGE', 'EXACT', 'SHARE'];
    if (!splitType || !validSplitTypes.includes(splitType)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing split type' });
    }

    // Split calculations
    let computedSplits = [];
    const N = splits.length;

    if (splitType === 'EQUAL') {
      const baseSplit = Math.floor((parsedAmount / N) * 100) / 100;
      let remaining = Math.round((parsedAmount - baseSplit * N) * 100) / 100;
      computedSplits = splits.map((s, idx) => {
        let splitAmt = baseSplit;
        if (idx < Math.round(remaining * 100)) {
          splitAmt += 0.01;
        }
        return {
          userId: s.userId,
          amount: splitAmt
        };
      });
    } else if (splitType === 'PERCENTAGE') {
      let totalPercent = 0;
      splits.forEach(s => {
        totalPercent += parseFloat(s.percentage) || 0;
      });
      if (Math.abs(totalPercent - 100) > 0.05) {
        return res.status(400).json({ success: false, error: `Percentages must sum to 100%. Got ${totalPercent}%` });
      }
      let sumSplitAmounts = 0;
      computedSplits = splits.map(s => {
        const pct = parseFloat(s.percentage) || 0;
        const splitAmt = Math.round(((parsedAmount * pct) / 100) * 100) / 100;
        sumSplitAmounts += splitAmt;
        return {
          userId: s.userId,
          amount: splitAmt,
          percentage: pct
        };
      });
      // Adjust rounding differences on the last split to ensure sum equals total amount
      const diff = Math.round((parsedAmount - sumSplitAmounts) * 100) / 100;
      if (diff !== 0 && computedSplits.length > 0) {
        computedSplits[computedSplits.length - 1].amount = Math.round((computedSplits[computedSplits.length - 1].amount + diff) * 100) / 100;
      }
    } else if (splitType === 'EXACT') {
      let totalExactAmount = 0;
      splits.forEach(s => {
        totalExactAmount += parseFloat(s.amount) || 0;
      });
      if (Math.abs(totalExactAmount - parsedAmount) > 0.05) {
        return res.status(400).json({ success: false, error: `Exact split amounts (${totalExactAmount}) must sum to the total expense amount (${parsedAmount})` });
      }
      computedSplits = splits.map(s => ({
        userId: s.userId,
        amount: Math.round((parseFloat(s.amount) || 0) * 100) / 100
      }));
    } else if (splitType === 'SHARE') {
      let totalShares = 0;
      splits.forEach(s => {
        totalShares += parseFloat(s.shares) || 0;
      });
      if (totalShares <= 0) {
        return res.status(400).json({ success: false, error: 'Total shares must be greater than 0' });
      }
      let sumSplitAmounts = 0;
      computedSplits = splits.map(s => {
        const sh = parseFloat(s.shares) || 0;
        const splitAmt = Math.round(((parsedAmount * sh) / totalShares) * 100) / 100;
        sumSplitAmounts += splitAmt;
        return {
          userId: s.userId,
          amount: splitAmt,
          shares: sh
        };
      });
      const diff = Math.round((parsedAmount - sumSplitAmounts) * 100) / 100;
      if (diff !== 0 && computedSplits.length > 0) {
        computedSplits[computedSplits.length - 1].amount = Math.round((computedSplits[computedSplits.length - 1].amount + diff) * 100) / 100;
      }
    }

    // Prisma transactional insert
    const expense = await prisma.$transaction(async (tx) => {
      // 1. Verify group exists
      const group = await tx.group.findUnique({
        where: { id: groupId }
      });
      if (!group) {
        throw new Error('Group not found');
      }

      // 2. Create the expense
      const createdExpense = await tx.expense.create({
        data: {
          description: description.trim(),
          amount: parsedAmount,
          currency: currency || 'USD',
          date: date ? new Date(date) : new Date(),
          groupId,
          paidById,
          splitType
        }
      });

      // 3. Create the expense splits
      const splitData = computedSplits.map(s => ({
        expenseId: createdExpense.id,
        userId: s.userId,
        amount: s.amount,
        percentage: s.percentage !== undefined ? parseFloat(s.percentage) : null,
        shares: s.shares !== undefined ? parseFloat(s.shares) : null
      }));

      await tx.expenseSplit.createMany({
        data: splitData
      });

      return tx.expense.findUnique({
        where: { id: createdExpense.id },
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
        }
      });
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense
    });

    try {
      const group = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } });
      await logActivity({
        type: 'EXPENSE_CREATED',
        userId: req.user.id,
        userName: expense.paidBy?.name,
        groupId,
        groupName: group?.name,
        message: `${expense.paidBy?.name || 'Someone'} created expense "${description.trim()}" of ${currency || 'USD'} ${parsedAmount.toFixed(2)} in group "${group?.name || groupId}"`,
        details: { description: description.trim(), amount: parsedAmount, currency: currency || 'USD' }
      });
    } catch (logError) {
      console.error('Failed to log expense creation activity:', logError);
    }
  } catch (error) {
    if (error.message === 'Group not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Get all expenses for a group
// @route   GET /api/groups/:groupId/expenses
// @access  Private
export const getExpensesByGroup = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.query.groupId;

    if (!groupId) {
      return res.status(400).json({ success: false, error: 'Group ID is required' });
    }

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/groups/:groupId/expenses/:id
// @access  Private
export const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        group: { select: { name: true } }
      }
    });

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true }
    });

    await prisma.expense.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });

    try {
      await logActivity({
        type: 'EXPENSE_DELETED',
        userId: req.user.id,
        userName: user?.name,
        groupId: expense.groupId,
        groupName: expense.group?.name,
        message: `${user?.name || 'Someone'} deleted expense "${expense.description}" of ${expense.currency || 'USD'} ${expense.amount.toFixed(2)} in group "${expense.group?.name || expense.groupId}"`,
        details: { description: expense.description, amount: expense.amount, currency: expense.currency || 'USD' }
      });
    } catch (logError) {
      console.error('Failed to log expense deletion activity:', logError);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Settle up debt between two users
// @route   POST /api/groups/:groupId/expenses/settle
// @access  Private
export const settleUp = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    const { fromUserId, toUserId, amount, date } = req.body;

    if (!groupId || !fromUserId || !toUserId || !amount) {
      return res.status(400).json({ success: false, error: 'Please enter all required settlement fields' });
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        fromUserId,
        toUserId,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date()
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Settlement payment recorded successfully',
      data: settlement
    });

    try {
      const group = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } });
      await logActivity({
        type: 'SETTLEMENT_ADDED',
        userId: req.user.id,
        userName: settlement.fromUser?.name,
        groupId,
        groupName: group?.name,
        message: `${settlement.fromUser?.name || 'Someone'} paid $${settlement.amount.toFixed(2)} to ${settlement.toUser?.name || 'someone else'} in group "${group?.name || groupId}"`,
        details: { amount: settlement.amount, fromUserName: settlement.fromUser?.name, toUserName: settlement.toUser?.name }
      });
    } catch (logError) {
      console.error('Failed to log settlement creation activity:', logError);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all expenses across all groups the user belongs to
// @route   GET /api/expenses
// @access  Private
export const getAllUserExpenses = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Find all group IDs where this user is a member
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true }
    });

    const groupIds = memberships.map(m => m.groupId);

    if (groupIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // 2. Fetch all expenses for those groups
    const expenses = await prisma.expense.findMany({
      where: {
        groupId: { in: groupIds }
      },
      include: {
        group: {
          select: { id: true, name: true }
        },
        paidBy: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        splits: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a recorded settlement
// @route   DELETE /api/groups/:groupId/expenses/settlements/:id
// @access  Private
export const deleteSettlement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const settlement = await prisma.settlement.findUnique({
      where: { id },
      include: {
        fromUser: { select: { name: true } },
        toUser: { select: { name: true } },
        group: { select: { name: true } }
      }
    });

    if (!settlement) {
      return res.status(404).json({ success: false, error: 'Settlement record not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true }
    });

    await prisma.settlement.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Settlement payment deleted successfully'
    });

    try {
      await logActivity({
        type: 'SETTLEMENT_DELETED',
        userId: req.user.id,
        userName: user?.name,
        groupId: settlement.groupId,
        groupName: settlement.group?.name,
        message: `${user?.name || 'Someone'} deleted settlement of $${settlement.amount.toFixed(2)} from ${settlement.fromUser?.name || 'someone'} to ${settlement.toUser?.name || 'someone else'} in group "${settlement.group?.name || settlement.groupId}"`,
        details: { amount: settlement.amount, fromUserName: settlement.fromUser?.name, toUserName: settlement.toUser?.name }
      });
    } catch (logError) {
      console.error('Failed to log settlement deletion activity:', logError);
    }
  } catch (error) {
    next(error);
  }
};
