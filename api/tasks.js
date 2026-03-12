import connectDB from '../lib/mongodb.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { sendTaskNotification } from '../lib/email.js';
import { logActivity } from '../lib/activity.js';

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

            // Notify via email
            await sendTaskNotification({
                taskName: savedTask.title,
                status: savedTask.status,
                action: 'created'
            });

            const populated = await savedTask.populate('assignedTo', 'username avatar');
            return res.status(201).json(populated);
        }

        if (req.method === 'PUT') {
            if (!id) return res.status(400).json({ message: 'Task ID is required' });

            // Check if task is being completed
            const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true })
                .populate('assignedTo', 'username avatar');

            if (req.body.status === 'Done') {
                await sendTaskNotification({
                    taskName: updatedTask.title,
                    status: updatedTask.status,
                    action: 'completed'
                });

                // Log activity for assigned users
                if (updatedTask.assignedTo && updatedTask.assignedTo.length > 0) {
                    const userIds = updatedTask.assignedTo.map(u => u._id || u);
                    const today = new Date().toISOString().split('T')[0];
                    await logActivity(userIds, today);
                }
            }

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
