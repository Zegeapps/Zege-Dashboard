const mongoose = require("mongoose");

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
            default: "Todo",
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
                type: String,
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

module.exports = mongoose.model("Task", TaskSchema);