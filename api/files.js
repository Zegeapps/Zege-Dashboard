import connectDB from '../lib/mongodb.js';
import File from '../models/File.js';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    await connectDB();

    try {
        if (req.method === 'GET') {
            const { path = '/' } = req.query;
            const files = await File.find({ path }).sort({ isFolder: -1, showcaseName: 1 });
            return res.status(200).json(files);
        }

        if (req.method === 'POST') {
            const { type, isFolder } = req.body;

            // Basic folders/file creation logic
            // Note: Actual file binary upload should be handled by a storage provider (like Vercel Blob)
            // For now, this endpoint handles metadata creation.

            if (isFolder) {
                const newFolder = new File({
                    ...req.body,
                    type: 'folder',
                    isFolder: true
                });
                const saved = await newFolder.save();
                return res.status(201).json(saved);
            }

            // If it's a file, we expect URL and other metadata to be pre-signed or already uploaded
            const newFile = new File(req.body);
            const saved = await newFile.save();
            return res.status(201).json(saved);
        }

        if (req.method === 'PUT') {
            const { id } = req.query;
            const { showcaseName } = req.body;

            if (!id) return res.status(400).json({ message: 'ID is required' });

            const updated = await File.findByIdAndUpdate(
                id,
                { showcaseName },
                { new: true }
            );
            return res.status(200).json(updated);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ message: 'ID is required' });

            const item = await File.findById(id);
            if (!item) return res.status(404).json({ message: 'Not found' });

            if (item.isFolder) {
                // Force delete: Delete the folder and everything under its path
                const subPathPattern = new RegExp(`^${item.path}${item.showcaseName}/`);
                await File.deleteMany({ path: { $regex: subPathPattern } });
            }

            await File.findByIdAndDelete(id);
            return res.status(200).json({ message: 'Deleted successfully' });
        }

        res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
