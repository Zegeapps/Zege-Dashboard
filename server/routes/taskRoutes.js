const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// CREATE TASK
router.post("/", async (req, res) => {
    try {
        const newTask = new Task(req.body);
        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    } catch (error) {
        res.status(500).json({ message: "Error creating task", error });
    }
});

// GET ALL TASKS
router.get("/", async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tasks", error });
    }
});

// UPDATE TASK
router.put("/:id", async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: "Error updating task", error });
    }
});

// DELETE TASK
router.delete("/:id", async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Task deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting task", error });
    }
});

module.exports = router;