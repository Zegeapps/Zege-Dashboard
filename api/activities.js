import connectDB from '../lib/mongodb.js';
import Activity from '../models/Activity.js';
import { toggleManualWork } from '../lib/activity.js';

export default async function handler(req, res) {
    await connectDB();
    const { userId } = req.query;

    try {
        if (req.method === 'GET') {
            if (!userId) return res.status(400).json({ message: 'User ID is required' });

            // Fetch activities for the last 6 months (approx 180 days)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const dateStr = sixMonthsAgo.toISOString().split('T')[0];

            const activities = await Activity.find({
                user: userId,
                date: { $gte: dateStr }
            }).sort({ date: 1 });

            return res.status(200).json(activities);
        }

        if (req.method === 'POST') {
            const { userId, date } = req.body;
            if (!userId || !date) {
                return res.status(400).json({ message: 'User ID and date are required' });
            }

            const updated = await toggleManualWork(userId, date);
            return res.status(200).json(updated);
        }

        res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
