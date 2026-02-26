import connectDB from '../lib/mongodb.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

export default async function handler(req, res) {
    await connectDB();
    const { id } = req.query;

    try {
        if (req.method === 'GET') {
            const tasks = await Task.find()
                .populate('assignedTo', 'username avatar')
                .sort({ createdAt: -1 });
            return res.status(200).json(tasks);
        }

        if (req.method === 'POST') {
            const newTask = new Task(req.body);
            const savedTask = await newTask.save();
            const populated = await savedTask.populate('assignedTo', 'username avatar');
            return res.status(201).json(populated);
        }

        if (req.method === 'PUT') {
            if (!id) return res.status(400).json({ message: 'Task ID is required' });
            const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true })
                .populate('assignedTo', 'username avatar');
            return res.status(200).json(updatedTask);
        }

        if (req.method === 'DELETE') {
            if (!id) return res.status(400).json({ message: 'Task ID is required' });
            await Task.findByIdAndDelete(id);
            return res.status(200).json({ message: 'Task deleted' });
        }

        res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
