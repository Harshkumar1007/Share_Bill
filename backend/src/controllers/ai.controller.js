import prisma from '../services/prisma.service.js';
import { queryAgent } from '../services/aiAgent.service.js';
import { logAiQuery } from '../services/aiLog.service.js';

/**
 * @desc    Query the Financial Intelligence Agent
 * @route   POST /api/ai/query
 * @access  Private
 */
export const queryFinancialAgent = async (req, res, next) => {
  const { groupId, question, language, history } = req.body;

  if (!groupId || !question) {
    return res.status(400).json({ success: false, error: 'Group ID and question are required.' });
  }

  // Security: Check if user belongs to the group
  try {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: req.user.id }
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Unauthorized: You are not an active member of this group.' });
    }

    const startTime = Date.now();

    // Pick picked language or default to English
    const targetLang = language || 'English';

    // Call the Agent service
    const agentResponse = await queryAgent(groupId, question, targetLang, history || []);

    const responseTime = Date.now() - startTime;

    // Retrieve user profile for logging
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true }
    });

    // Logging AI queries
    await logAiQuery({
      question,
      userId: req.user.id,
      userName: user?.name,
      groupId,
      language: targetLang,
      responseTime,
      answerSummary: agentResponse.answer ? agentResponse.answer.slice(0, 150) : ''
    });

    res.status(200).json({
      success: true,
      ...agentResponse
    });
  } catch (error) {
    next(error);
  }
};

export default {
  queryFinancialAgent
};
