// ===== CLIENT ROUTE - Client portal login and dashboard data =====

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { ensureSchema } = require('../config/schema');

const jwtSecret = () => process.env.JWT_SECRET || 'zyalaw_secret_key_2026_secure';

function clientAuth(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided.' });
        }

        const decoded = jwt.verify(token, jwtSecret());

        if (decoded.role !== 'client') {
            return res.status(403).json({ success: false, message: 'Client access required.' });
        }

        req.client = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
}

router.post('/login', async (req, res) => {
    try {
        await ensureSchema();

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password.'
            });
        }

        const [clients] = await db.query('SELECT * FROM clients WHERE email = ?', [email]);

        if (clients.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const client = clients[0];
        const isMatch = await bcrypt.compare(password, client.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: client.id, email: client.email, role: 'client' },
            jwtSecret(),
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            client: {
                id: client.id,
                firstName: client.first_name,
                lastName: client.last_name,
                email: client.email,
                phone: client.phone,
                isTempPassword: Boolean(client.is_temp_password)
            }
        });
    } catch (error) {
        console.error('Client login error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

router.get('/case', clientAuth, async (req, res) => {
    try {
        await ensureSchema();

        const [cases] = await db.query(
            `SELECT c.*, cl.first_name, cl.last_name, cl.email
             FROM cases c
             JOIN clients cl ON cl.id = c.client_id
             WHERE c.client_id = ?
             ORDER BY c.updated_at DESC`,
            [req.client.id]
        );

        if (cases.length === 0) {
            return res.json({
                success: true,
                case: null,
                updates: [],
                messages: []
            });
        }

        const activeCase = cases[0];
        const caseIds = cases.map((item) => item.id);
        const placeholders = caseIds.map(() => '?').join(', ');

        const [updates] = await db.query(
            `SELECT * FROM case_updates WHERE case_id IN (${placeholders}) ORDER BY created_at DESC`,
            caseIds
        );
        const [messages] = await db.query(
            `SELECT * FROM case_messages WHERE case_id IN (${placeholders}) ORDER BY created_at ASC`,
            caseIds
        );

        await db.query(
            `UPDATE case_messages SET is_read = 1 WHERE case_id IN (${placeholders}) AND sender_type = 'admin'`,
            caseIds
        );

        res.json({
            success: true,
            case: activeCase,
            cases,
            updates,
            messages
        });
    } catch (error) {
        console.error('Client case fetch error:', error);
        res.status(500).json({ success: false, message: 'Failed to load case details.' });
    }
});

router.post('/message', clientAuth, async (req, res) => {
    try {
        await ensureSchema();

        const { caseId, content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ success: false, message: 'Message is required.' });
        }

        const [cases] = await db.query(
            'SELECT id FROM cases WHERE id = ? AND client_id = ?',
            [caseId, req.client.id]
        );

        if (cases.length === 0) {
            return res.status(404).json({ success: false, message: 'Case not found.' });
        }

        await db.query(
            "INSERT INTO case_messages (case_id, sender_type, content) VALUES (?, 'client', ?)",
            [caseId, content.trim()]
        );

        await db.query('UPDATE cases SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [caseId]);

        res.status(201).json({ success: true, message: 'Message sent.' });
    } catch (error) {
        console.error('Client message error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message.' });
    }
});

module.exports = router;
