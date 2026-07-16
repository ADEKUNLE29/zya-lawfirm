const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// Setup admin
const setupAdmin = async () => {
    try {
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const existing = await db.getAsync('SELECT * FROM users WHERE username = ?', 
            [process.env.ADMIN_USERNAME || 'zainab']);

        if (!existing) {
            const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'zyalaw2026', 10);
            await db.runAsync(
                'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                [process.env.ADMIN_USERNAME || 'zainab', hashed, 'admin']
            );
            console.log('✅ Admin created');
        }
    } catch (err) {
        console.error('❌ Admin setup error:', err.message);
    }
};

setupAdmin();

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Fill all fields' });
        }

        const user = await db.getAsync('SELECT * FROM users WHERE username = ?', [username]);

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'zyalaw_secret_key_2026_secure',
            { expiresIn: '24h' }
        );

        res.json({ success: true, token, user: { username: user.username } });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;