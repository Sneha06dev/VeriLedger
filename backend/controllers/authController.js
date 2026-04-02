// backend/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Replace with your own secret
const JWT_SECRET = process.env.JWT_SECRET || "verileger_secret_key";

exports.signup = async (req, res) => {
    try {
        const { fullName, email, password, watchlist } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            watchlist: watchlist || []
        });

        // Create JWT
        const token = jwt.sign({ id: user._id, fullName: user.fullName }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, watchlist: user.watchlist } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Create JWT
        const token = jwt.sign({ id: user._id, fullName: user.fullName }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, watchlist: user.watchlist } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};