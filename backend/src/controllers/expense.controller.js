// Expense Controller

// @desc    Create a new expense with splits
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const { description, amount, groupId, paidById, splits } = req.body;

    res.status(201).json({
      success: true,
      message: 'Expense created successfully (Boilerplate)',
      data: {
        id: 'expense-uuid-placeholder',
        description,
        amount,
        groupId,
        paidById,
        date: new Date(),
        splits: splits || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all expenses for a group
// @route   GET /api/expenses
// @access  Private
export const getExpensesByGroup = async (req, res, next) => {
  try {
    const { groupId } = req.query;

    res.status(200).json({
      success: true,
      message: `Expenses retrieved for group ${groupId} (Boilerplate)`,
      data: [
        {
          id: 'exp-1',
          description: 'Groceries',
          amount: 90.00,
          date: new Date(),
          paidById: 'creator-uuid',
          splits: [
            { userId: 'creator-uuid', amount: 30.00 },
            { userId: 'user-1', amount: 30.00 },
            { userId: 'user-2', amount: 30.00 }
          ]
        },
        {
          id: 'exp-2',
          description: 'Uber ride',
          amount: 45.00,
          date: new Date(),
          paidById: 'user-1',
          splits: [
            { userId: 'creator-uuid', amount: 15.00 },
            { userId: 'user-1', amount: 15.00 },
            { userId: 'user-2', amount: 15.00 }
          ]
        }
      ]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: `Expense ${id} deleted successfully (Boilerplate)`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Settle up debt between two users
// @route   POST /api/expenses/settle
// @access  Private
export const settleUp = async (req, res, next) => {
  try {
    const { fromUserId, toUserId, amount, groupId } = req.body;

    res.status(200).json({
      success: true,
      message: 'Settlement payment recorded successfully (Boilerplate)',
      data: {
        id: 'settlement-uuid-placeholder',
        description: 'Settle Up Payment',
        amount,
        groupId,
        paidById: fromUserId,
        isSettlement: true,
        splits: [
          { userId: toUserId, amount: -amount }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};
