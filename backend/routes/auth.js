// ===== AUTH ROUTE - Admin Login System =====
// JWT Authentication for dashboard access

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ===== CREATE USERS TABLE + DEFAULT ADMIN =====
const setupAdmin = async () => {
    try {
        // Create table
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if admin exists
        const [existing] = await db.query('SELECT * FROM users WHERE username = ?', [process.env.ADMIN_USERNAME || 'zainab']);

        if (existing.length === 0) {
            // Hash password and create admin
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'zyalaw2026', 10);
            
            await db.query(
                'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                [process.env.ADMIN_USERNAME || 'zainab', hashedPassword, 'admin']
            );
            
            console.log('✅ Default admin created!');
        } else {
            console.log('✅ Admin account already exists.');
        }

    } catch (err) {
        console.error('❌ Error setting up admin:', err.message);
    }
};

setupAdmin();

// ===== LOGIN (POST /api/auth/login) =====
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username and password.'
            });
        }

        // Find user
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'zyalaw_secret_key_2026_secure',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful!',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// ===== VERIFY TOKEN (GET /api/auth/me) =====
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zyalaw_secret_key_2026_secure');

        res.json({
            success: true,
            user: {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
});

module.exports = router;