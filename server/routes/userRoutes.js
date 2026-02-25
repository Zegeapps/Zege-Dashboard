const express = require("express");
const router = express.Router();
const User = require("../models/User");

// CREATE USER
router.post("/", async (req, res) => {
    try {
        const newUser = new User(req.body);
        const savedUser = await newUser.save();
        // Don't return password
        const { password: _, ...safe } = savedUser.toObject();
        res.status(201).json(safe);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Username already exists" });
        }
        res.status(500).json({ message: "Error creating user", error });
    }
});

// GET ALL USERS (admin — includes password for pre-fill)
router.get("/", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
});

// UPDATE USER
router.put("/:id", async (req, res) => {
    try {
        const updates = { ...req.body };
        // If password is empty string, don't overwrite existing password
        if (!updates.password) delete updates.password;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        ).select("-password");
        res.json(updatedUser);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Username already exists" });
        }
        res.status(500).json({ message: "Error updating user", error });
    }
});

// DELETE USER
router.delete("/:id", async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error });
    }
});

module.exports = router;
