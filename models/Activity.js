import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    count: { type: Number, default: 0 },    // Number of completed tasks
    manual: { type: Boolean, default: false }, // Manually marked as worked
}, { timestamps: true });

// Index for efficient lookups and uniqueness
ActivitySchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
