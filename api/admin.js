import connectDB from '../lib/mongodb.js';
import User from '../models/User.js';

export default async function handler(req, res) {
    await connectDB();
    const { id } = req.query;

    try {
        if (req.method === 'GET') {
            const users = await User.find();
            return res.status(200).json(users);
        }

        if (req.method === 'POST') {
            const newUser = new User(req.body);
            const savedUser = await newUser.save();
            const { password, ...safe } = savedUser.toObject();
            return res.status(201).json(safe);
        }

        if (req.method === 'PUT') {
            if (!id) return res.status(400).json({ message: 'User ID is required' });
            const updates = { ...req.body };
            if (!updates.password) delete updates.password;
            const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
            return res.status(200).json(updatedUser);
        }

        if (req.method === 'DELETE') {
            if (!id) return res.status(400).json({ message: 'User ID is required' });
            await User.findByIdAndDelete(id);
            return res.status(200).json({ message: 'User deleted' });
        }

        res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
