import { getActivities } from '../services/activity.service.js';

// @desc    Get all activity logs
// @route   GET /api/activities
// @access  Private
export const getLogs = async (req, res, next) => {
  try {
    const logs = await getActivities();
    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};
