import connectDB from '../lib/mongodb.js';
import User from '../models/User.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectDB();
        const { username, password } = req.body;

        const cleanUser = (username || '').trim();
        const cleanPass = (password || '').trim();

        if (!cleanUser || !cleanPass) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({ username: cleanUser });
        if (!user || user.password !== cleanPass) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Return safe user object (including password for the profile view as requested previously)
        res.status(200).json({
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            password: user.password
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
