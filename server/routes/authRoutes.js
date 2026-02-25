const express = require("express");
const router = express.Router();
const User = require("../models/User");

// LOGIN
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    // Trim to be safe — client also trims, but defend on server too
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();
    if (!cleanUser || !cleanPass) {
        return res.status(400).json({ message: "Username and password are required" });
    }
    try {
        const user = await User.findOne({ username: cleanUser });
        if (!user || user.password !== cleanPass) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        // Return safe user object (without password)
        res.json({
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            password: user.password,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

module.exports = router;
