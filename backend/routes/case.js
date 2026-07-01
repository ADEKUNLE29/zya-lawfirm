// ===== CASE ROUTE - Admin case management =====

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { ensureSchema } = require('../config/schema');

router.get('/admin/all', authMiddleware, async (req, res) => {
    try {
        await ensureSchema();

        const [cases] = await db.query(`
            SELECT
                c.id,
                c.client_id,
                c.contact_id,
                c.service_type,
                c.status,
                c.created_at,
                c.updated_at,
                cl.first_name,
                cl.last_name,
                cl.email,
                COALESCE(SUM(CASE WHEN m.sender_type = 'client' AND m.is_read = 0 THEN 1 ELSE 0 END), 0) AS unread_messages
            FROM cases c
            JOIN clients cl ON cl.id = c.client_id
            LEFT JOIN case_messages m ON m.case_id = c.id
            GROUP BY c.id, c.client_id, c.contact_id, c.service_type, c.status, c.created_at, c.updated_at, cl.first_name, cl.last_name, cl.email
            ORDER BY c.updated_at DESC
        `);

        res.json({
            success: true,
            count: cases.length,
            cases
        });
    } catch (error) {
        console.error('Error loading cases:', error);
        res.status(500).json({ success: false, message: 'Failed to load cases.' });
    }
});

router.put('/admin/:caseId/status', authMiddleware, async (req, res) => {
    try {
        await ensureSchema();

        const { caseId } = req.params;
        const { status, note } = req.body;

        const allowedStatuses = [
            'submitted',
            'under_review',
            'documents_needed',
            'in_progress',
            'decision_made',
            'closed'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid case status.' });
        }

        const [rows] = await db.query('SELECT status FROM cases WHERE id = ?', [caseId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Case not found.' });
        }

        const oldStatus = rows[0].status;

        await db.query(
            'UPDATE cases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, caseId]
        );

        await db.query(
            'INSERT INTO case_updates (case_id, old_status, new_status, note) VALUES (?, ?, ?, ?)',
            [caseId, oldStatus, status, note || '']
        );

        res.json({
            success: true,
            message: 'Case status updated.'
        });
    } catch (error) {
        console.error('Error updating case status:', error);
        res.status(500).json({ success: false, message: 'Failed to update case status.' });
    }
});

module.exports = router;
