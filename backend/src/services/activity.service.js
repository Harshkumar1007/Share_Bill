import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store activities in a JSON file inside a "data" directory
const dataDir = path.join(__dirname, '..', 'data');
const activitiesFile = path.join(dataDir, 'activities.json');

// Ensure directory and file exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(activitiesFile)) {
  fs.writeFileSync(activitiesFile, JSON.stringify([], null, 2), 'utf-8');
}

/**
 * Log a user action activity into the local JSON database.
 */
export const logActivity = async ({ type, userId, userName, groupId, groupName, message, details = {} }) => {
  try {
    const activitiesRaw = fs.readFileSync(activitiesFile, 'utf-8');
    const activities = JSON.parse(activitiesRaw);

    const newActivity = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      userId,
      userName: userName || 'System User',
      groupId: groupId || null,
      groupName: groupName || null,
      message,
      timestamp: new Date().toISOString(),
      details
    };

    activities.unshift(newActivity); // Add to the beginning of the list

    // Keep log size bounded to the last 200 actions
    const truncated = activities.slice(0, 200);

    fs.writeFileSync(activitiesFile, JSON.stringify(truncated, null, 2), 'utf-8');
    return newActivity;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

/**
 * Get all logged activities.
 */
export const getActivities = async () => {
  try {
    const activitiesRaw = fs.readFileSync(activitiesFile, 'utf-8');
    return JSON.parse(activitiesRaw);
  } catch (error) {
    console.error('Error reading activities:', error);
    return [];
  }
};

export default {
  logActivity,
  getActivities
};
