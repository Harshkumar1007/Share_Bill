// Group Controller

// @desc    Create a new expense group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res, next) => {
  try {
    const { name, description, memberEmails } = req.body;

    res.status(201).json({
      success: true,
      message: 'Group created successfully (Boilerplate)',
      data: {
        id: 'group-uuid-placeholder',
        name,
        description,
        creatorId: req.user?.id || 'creator-uuid',
        members: [
          { userId: req.user?.id || 'creator-uuid', name: req.user?.name || 'Creator' }
        ]
      }
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
    res.status(200).json({
      success: true,
      message: 'Groups retrieved successfully (Boilerplate)',
      data: [
        {
          id: 'group-1',
          name: 'Flatmates',
          description: 'Shared house expenses',
          creatorId: 'creator-uuid',
          memberCount: 3
        },
        {
          id: 'group-2',
          name: 'Trip to Paris',
          description: 'Travel expenses',
          creatorId: req.user?.id || 'creator-uuid',
          memberCount: 4
        }
      ]
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

    res.status(200).json({
      success: true,
      message: `Group details for ID ${id} retrieved (Boilerplate)`,
      data: {
        id,
        name: 'Trip to Paris',
        description: 'Travel expenses',
        creatorId: 'creator-uuid',
        members: [
          { id: 'user-1', name: 'Alice Smith', email: 'alice@example.com' },
          { id: 'user-2', name: 'Bob Jones', email: 'bob@example.com' },
          { id: 'creator-uuid', name: 'Current User', email: 'user@example.com' }
        ],
        expenses: []
      }
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

    res.status(200).json({
      success: true,
      message: `Member ${email} added to group ${id} (Boilerplate)`,
      data: {
        groupId: id,
        member: {
          id: 'new-member-uuid',
          name: 'New Member',
          email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    res.status(200).json({
      success: true,
      message: `Member ${userId} removed from group ${id} (Boilerplate)`
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

    res.status(200).json({
      success: true,
      message: `Balances calculated for group ${id} (Boilerplate)`,
      data: {
        debts: [
          { from: 'user-1', to: 'creator-uuid', amount: 45.00 },
          { from: 'user-2', to: 'creator-uuid', amount: 15.50 }
        ],
        netBalances: {
          'creator-uuid': 60.50,
          'user-1': -45.00,
          'user-2': -15.50
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
