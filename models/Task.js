import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            default: "",
        },

        image: {
            type: String,
            default: "", // one of 6 predefined image names
        },

        status: {
            type: String,
            enum: ["Not Started", "In Progress", "Done"],
            default: "Not Started",
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Low",
        },

        startDate: {
            type: Date,
        },

        dueDate: {
            type: Date,
        },

        estimatedEffort: {
            type: Number,
        },

        createdBy: {
            type: String,
            default: "",
        },

        assignedTo: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        tags: [
            {
                type: String,
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);