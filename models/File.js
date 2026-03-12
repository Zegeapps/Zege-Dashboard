import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
    showcaseName: {
        type: String,
        required: true,
        trim: true
    },
    originalName: {
        type: String,
        default: ''
    },
    url: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['image', 'pdf', 'folder'],
        required: true
    },
    size: {
        type: Number, // size in bytes
        default: 0
    },
    path: {
        type: String,
        default: '/',
        index: true
    },
    isFolder: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// For folders, we might want to ensure names are unique within the same path
FileSchema.index({ path: 1, showcaseName: 1 }, { unique: true });

export default mongoose.models.File || mongoose.model('File', FileSchema);
