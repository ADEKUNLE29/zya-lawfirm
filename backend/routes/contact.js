const express = require('express');
const router = express.Router();
const db = require('../database');
const nodemailer = require('nodemailer');

// Email setup
let transporter = null;
try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        console.log('✅ Email ready');
    }
} catch (err) {
    console.log('⚠️ Email not configured');
}

// Submit form
router.post('/', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, service, message } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !service || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please fill all required fields'
            });
        }

        // Save to database (don't wait)
        db.runAsync(
            `INSERT INTO contacts (firstName, lastName, email, phone, service, message, created_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
            [firstName, lastName, email, phone || '', service, message]
        ).then(() => console.log('✅ Saved to database'))
         .catch(err => console.error('❌ DB error:', err.message));

        // Send emails (don't wait)
        if (transporter) {
            // To lawyer
            transporter.sendMail({
                from: `"ZYA Law Firm" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_TO || process.env.EMAIL_USER,
                subject: `New Consultation: ${firstName} ${lastName}`,
                html: `<h2>New Contact</h2>
                       <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                       <p><strong>Email:</strong> ${email}</p>
                       <p><strong>Service:</strong> ${service}</p>
                       <p><strong>Message:</strong> ${message}</p>`
            }).catch(() => {});

            // To client
            transporter.sendMail({
                from: `"ZYA Law Firm" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Thank You for Contacting ZYA Law Firm',
                html: `<h2>Thank You, ${firstName}!</h2>
                       <p>We received your request for ${service}.</p>
                       <p>Our attorney will contact you within 24 hours.</p>
                       <p>If urgent, call: +1 (226) 505-2867</p>`
            }).catch(() => {});
        }

        // Return success immediately
        res.json({
            success: true,
            message: 'Thank you! We will contact you soon.'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error' });
    }
});

// Get all contacts
router.get('/', async (req, res) => {
    try {
        const contacts = await db.allAsync('SELECT * FROM contacts ORDER BY created_at DESC');
        res.json({ success: true, contacts });
    } catch (error) {
        res.json({ success: true, contacts: [] });
    }
});

module.exports = router;