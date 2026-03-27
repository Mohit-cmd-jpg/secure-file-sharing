const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const File = require('../models/File');
const auth = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Input validation helper
const validateEmail = (email) => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

const validateWalletAddress = (address) => {
    if (!address) return true; // Wallet is optional
    return /^(0x)?[0-9a-f]{40}$/i.test(address);
};

// POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, walletAddress } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        if (walletAddress && !validateWalletAddress(walletAddress)) {
            return res.status(400).json({ error: 'Invalid Ethereum wallet address' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            email: email.toLowerCase(),
            password,
            walletAddress: walletAddress ? walletAddress.toLowerCase() : null
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '2h' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                walletAddress: user.walletAddress,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.message.includes('email already exists')) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Find user and explicitly select password field
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '2h' });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                walletAddress: user.walletAddress,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// DELETE /auth/account
router.delete('/account', auth, async (req, res) => {
    try {
        // 1. Delete all files owned by the user
        await File.deleteMany({ owner: req.userId });

        // 2. Delete the user
        const user = await User.findByIdAndDelete(req.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Account and associated data deleted successfully' });
    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
