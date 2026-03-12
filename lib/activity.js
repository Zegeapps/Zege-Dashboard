import connectDB from './mongodb.js';
import Activity from '../models/Activity.js';

/**
 * Logs activity for a list of users on a specific date.
 * @param {string[]} userIds - Array of user IDs
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {number} increment - How much to increment the count (default: 1)
 */
export async function logActivity(userIds, date, increment = 1) {
    if (!userIds || userIds.length === 0) return;

    await connectDB();

    const operations = userIds.map(userId => ({
        updateOne: {
            filter: { user: userId, date: date },
            update: { $inc: { count: increment } },
            upsert: true
        }
    }));

    await Activity.bulkWrite(operations);
}

/**
 * Toggles manual work status for a user today.
 * @param {string} userId - User ID
 * @param {string} date - Date string in YYYY-MM-DD format
 */
export async function toggleManualWork(userId, date) {
    await connectDB();

    const existing = await Activity.findOne({ user: userId, date: date });

    if (existing) {
        existing.manual = !existing.manual;
        await existing.save();
        return existing;
    } else {
        const newActivity = new Activity({
            user: userId,
            date: date,
            manual: true,
            count: 0
        });
        await newActivity.save();
        return newActivity;
    }
}
