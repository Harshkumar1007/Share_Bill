import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const aiLogsFile = path.join(dataDir, 'ai_queries.json');

// Ensure directory and file exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(aiLogsFile)) {
  fs.writeFileSync(aiLogsFile, JSON.stringify([], null, 2), 'utf-8');
}

/**
 * Log an AI query.
 * @param {Object} logParams
 */
export const logAiQuery = async ({ question, userId, userName, groupId, language, responseTime, answerSummary }) => {
  try {
    const logsRaw = fs.readFileSync(aiLogsFile, 'utf-8');
    const logs = JSON.parse(logsRaw);

    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      question,
      userId,
      userName: userName || 'System User',
      groupId: groupId || null,
      language: language || 'English',
      responseTime,
      timestamp: new Date().toISOString(),
      answerSummary: answerSummary || ''
    };

    logs.unshift(newLog);
    
    // Keep log size bounded to the last 200 items
    const truncated = logs.slice(0, 200);

    fs.writeFileSync(aiLogsFile, JSON.stringify(truncated, null, 2), 'utf-8');
    return newLog;
  } catch (error) {
    console.error('Error logging AI query:', error);
  }
};

/**
 * Fetch all AI queries log.
 * @returns {Promise<Array>}
 */
export const getAiLogs = async () => {
  try {
    const logsRaw = fs.readFileSync(aiLogsFile, 'utf-8');
    return JSON.parse(logsRaw);
  } catch (error) {
    console.error('Error reading AI logs:', error);
    return [];
  }
};

export default {
  logAiQuery,
  getAiLogs
};
