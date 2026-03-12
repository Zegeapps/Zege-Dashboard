const MONGO_URI = 'mongodb+srv://zege_dash_user:zege-dash-pass34@cluster0.3vogxb2.mongodb.net/';
import mongoose from 'mongoose';
import Activity from '../models/Activity.js';
import User from '../models/User.js';

async function forceResetActivity() {
    try {
        await mongoose.connect(MONGO_URI);
        const todayStr = '2026-03-13';
        const startOfMonth = '2026-03-01';

        const users = await User.find({});
        console.log('Users:', users.map(u => u.username));

        for (const user of users) {
            // 1. Delete all March activities before today
            const delRes = await Activity.deleteMany({
                user: user._id,
                date: { $gte: startOfMonth, $lt: todayStr }
            });
            console.log(`User ${user.username}: Deleted ${delRes.deletedCount} old records.`);

            // 2. Ensure today is Worked (Green)
            await Activity.findOneAndUpdate(
                { user: user._id, date: todayStr },
                { $set: { manual: true, count: 0 } },
                { upsert: true, new: true }
            );
            console.log(`User ${user.username}: Forced ${todayStr} to Worked.`);
        }

        console.log('Force reset complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error force resetting:', error);
        process.exit(1);
    }
}

forceResetActivity();
