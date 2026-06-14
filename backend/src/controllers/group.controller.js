import prisma from '../services/prisma.service.js';

// @desc    Create a new expense group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res, next) => {
  try {
    const { name, description, memberEmails } = req.body;
    const creatorId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          creatorId
        }
      });

      // Add creator as member
      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          userId: creatorId
        }
      });

      // Add other members if emails are provided
      if (memberEmails && Array.isArray(memberEmails)) {
        for (const email of memberEmails) {
          if (email && email.trim()) {
            const cleanEmail = email.trim().toLowerCase();
            const user = await tx.user.findUnique({
              where: { email: cleanEmail }
            });
            if (user && user.id !== creatorId) {
              const exists = await tx.groupMember.findUnique({
                where: {
                  groupId_userId: {
                    groupId: newGroup.id,
                    userId: user.id
                  }
                }
              });
              if (!exists) {
                await tx.groupMember.create({
                  data: {
                    groupId: newGroup.id,
                    userId: user.id
                  }
                });
              }
            }
          }
        }
      }

      return tx.group.findUnique({
        where: { id: newGroup.id },
        include: {
          members: {
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
      message: 'Group created successfully',
      data: group
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all groups for logged-in user
// @route   GET /api/groups
// @access  Private
export const getGroups = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: true,
            expenses: {
              select: { amount: true }
            }
          }
        }
      }
    });

    const formattedGroups = groupMemberships.map(gm => {
      const group = gm.group;
      const totalExpenses = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        creatorId: group.creatorId,
        createdAt: group.createdAt,
        memberCount: group.members.length,
        totalExpenses
      };
    });

    res.status(200).json({
      success: true,
      data: formattedGroups
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get details of a specific group
// @route   GET /api/groups/:id
// @access  Private
export const getGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        expenses: {
          include: {
            paidBy: { select: { id: true, name: true } },
            splits: { include: { user: { select: { id: true, name: true } } } }
          },
          orderBy: { date: 'desc' }
        },
        settlements: {
          include: {
            fromUser: { select: { id: true, name: true } },
            toUser: { select: { id: true, name: true } }
          },
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const formattedMembers = group.members.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      joinedAt: m.joinedAt,
      leftAt: m.leftAt
    }));

    res.status(200).json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        description: group.description,
        creatorId: group.creatorId,
        creator: group.creator,
        createdAt: group.createdAt,
        members: formattedMembers,
        expenses: group.expenses,
        settlements: group.settlements
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a specific group's metadata
// @route   PUT /api/groups/:id
// @access  Private
export const updateGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    const group = await prisma.group.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      data: group
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private
export const deleteGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify group exists
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    await prisma.group.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to group
// @route   POST /api/groups/:id/members
// @access  Private
export const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Member email is required' });
    }

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User email not registered. Invite them first.' });
    }

    // Check existing link
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId: user.id }
      }
    });

    if (membership) {
      if (membership.leftAt) {
        // Rejoin
        const updated = await prisma.groupMember.update({
          where: { id: membership.id },
          data: { leftAt: null, joinedAt: new Date() }
        });
        return res.status(200).json({
          success: true,
          message: 'Member re-joined group successfully',
          data: {
            groupId: id,
            member: { id: user.id, name: user.name, email: user.email, joinedAt: updated.joinedAt, leftAt: null }
          }
        });
      }
      return res.status(400).json({ success: false, error: 'User is already a member of this group' });
    }

    // Create new membership link
    const newMembership = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId: user.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Member added to group successfully',
      data: {
        groupId: id,
        member: {
          id: user.id,
          name: user.name,
          email: user.email,
          joinedAt: newMembership.joinedAt,
          leftAt: null
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from group (Soft Leave Timeline)
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId }
      }
    });

    if (!membership) {
      return res.status(404).json({ success: false, error: 'Member association not found' });
    }

    // Soft delete by updating leftAt
    await prisma.groupMember.update({
      where: { id: membership.id },
      data: { leftAt: new Date() }
    });

    res.status(200).json({
      success: true,
      message: 'Member soft-removed from group successfully (membership timeline updated)'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get group balances and who owes whom
// @route   GET /api/groups/:id/balances
// @access  Private
export const getGroupBalances = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Fetch group details, members, expenses, splits, and settlements
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const expenses = await prisma.expense.findMany({
      where: { groupId: id },
      include: {
        splits: true
      }
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId: id }
    });

    // 2. Identify all unique currencies
    const currencies = new Set();
    expenses.forEach(e => currencies.add(e.currency));
    if (currencies.size === 0) {
      currencies.add('USD');
    }

    const firstExpense = expenses[0];
    const defaultCurrency = firstExpense ? firstExpense.currency : 'USD';

    // 3. Compute balances partitioned by currency
    const result = {};

    for (const cur of currencies) {
      const balanceMap = {};
      const memberNames = {};

      group.members.forEach(m => {
        balanceMap[m.user.id] = 0;
        memberNames[m.user.id] = m.user.name;
      });

      // Add expense amounts & subtract splits
      expenses.forEach(exp => {
        if (exp.currency !== cur) return;

        // Payer spent the money (balance increases)
        if (balanceMap[exp.paidById] !== undefined) {
          balanceMap[exp.paidById] += exp.amount;
        }

        // Split participants owe the money (balance decreases)
        exp.splits.forEach(split => {
          if (balanceMap[split.userId] !== undefined) {
            balanceMap[split.userId] -= split.amount;
          }
        });
      });

      // Apply settlements for the default currency
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

      // Partition into debtors and creditors
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

      // Sort: debtors ascending (most negative first), creditors descending (most positive first)
      debtors.sort((a, b) => a.balance - b.balance);
      creditors.sort((a, b) => b.balance - a.balance);

      const debts = [];
      let dIdx = 0;
      let cIdx = 0;

      // Copy for greedy optimization
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

    res.status(200).json({
      success: true,
      data: {
        defaultCurrency,
        currencies: Array.from(currencies),
        balancesByCurrency: result
      }
    });
  } catch (error) {
    next(error);
  }
};
