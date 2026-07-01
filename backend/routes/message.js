// ===== MESSAGE ROUTE - Case-based client/admin messaging =====

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { ensureSchema } = require('../config/schema');

router.get('/admin/:caseId', authMiddleware, async (req, res) => {
    try {
        await ensureSchema();

        const { caseId } = req.params;

        const [messages] = await db.query(
            'SELECT * FROM case_messages WHERE case_id = ? ORDER BY created_at ASC',
            [caseId]
        );

        await db.query(
            "UPDATE case_messages SET is_read = 1 WHERE case_id = ? AND sender_type = 'client'",
            [caseId]
        );

        res.json({
            success: true,
            count: messages.length,
            messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
    }
});

router.post('/admin/send', authMiddleware, async (req, res) => {
    try {
        await ensureSchema();

        const { caseId, content } = req.body;

        if (!caseId || !content || content.trim() === '') {
            return res.status(400).json({ success: false, message: 'Case and message are required.' });
        }

        const [cases] = await db.query('SELECT id FROM cases WHERE id = ?', [caseId]);

        if (cases.length === 0) {
            return res.status(404).json({ success: false, message: 'Case not found.' });
        }

        await db.query(
            "INSERT INTO case_messages (case_id, sender_type, content) VALUES (?, 'admin', ?)",
            [caseId, content.trim()]
        );

        await db.query('UPDATE cases SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [caseId]);

        res.status(201).json({ success: true, message: 'Reply sent.' });
    } catch (error) {
        console.error('Error sending admin reply:', error);
        res.status(500).json({ success: false, message: 'Failed to send reply.' });
    }
});

module.exports = router;
