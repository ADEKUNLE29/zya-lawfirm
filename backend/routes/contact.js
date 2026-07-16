const express = require('express');
const router = express.Router();
const db = require('../database');
const nodemailer = require('nodemailer');

// Email transporter setup
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
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        console.log('✅ Email transporter configured');
    } else {
        console.log('⚠️ Email credentials not set - emails disabled');
    }
} catch (err) {
    console.error('❌ Email config error:', err.message);
}

// Submit contact form
router.post('/', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, service, message } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !service || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields.'
            });
        }

        // Save to database
        let contactId = null;
        try {
            const result = await db.runAsync(
                `INSERT INTO contacts (firstName, lastName, email, phone, service, message, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
                [firstName, lastName, email, phone || '', service, message]
            );
            contactId = result.lastID;
            console.log('✅ Contact saved to database, ID:', contactId);
        } catch (dbErr) {
            console.error('❌ Database error:', dbErr.message);
            // Continue even if DB fails - don't crash
        }

        // Send emails in background (don't wait, don't crash)
        if (transporter) {
            // Email to lawyer
            const lawyerMail = {
                from: `"ZYA Law Firm" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_TO || process.env.EMAIL_USER,
                subject: `New Consultation: ${firstName} ${lastName} - ${service}`,
                html: `
                    <h2>New Consultation Request</h2>
                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                    <p><strong>Service:</strong> ${service}</p>
                    <p><strong>Message:</strong> ${message}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                `
            };

            // Email to client
            const clientMail = {
                from: `"ZYA Law Firm" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Thank You for Contacting ZYA Law Firm',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #0a1628;">Thank You, ${firstName}!</h2>
                        <p>We have received your consultation request for <strong>${service}</strong>.</p>
                        <p>Our attorney will review your case and contact you within 24 hours.</p>
                        <p>If this is urgent, please call us at <strong>+1 (226) 505-2867</strong>.</p>
                        <p style="margin-top: 30px; color: #666;">Best regards,<br>ZYA Law Firm Team</p>
                    </div>
                `
            };

            // Send both emails (don't await, don't crash)
            transporter.sendMail(lawyerMail).catch(err => {
                console.error('❌ Lawyer email failed:', err.message);
            });

            transporter.sendMail(clientMail).catch(err => {
                console.error('❌ Client email failed:', err.message);
            });

            console.log('📧 Emails queued for sending');
        }

        // Always return success to frontend
        res.status(201).json({
            success: true,
            message: 'Thank you! Your consultation request has been received.',
            contactId: contactId
        });

    } catch (error) {
        console.error('❌ Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
});

// Get all contacts (admin)
router.get('/', async (req, res) => {
    try {
        const contacts = await db.allAsync(
            'SELECT * FROM contacts ORDER BY created_at DESC'
        );
        res.json({ success: true, contacts });
    } catch (error) {
        console.error('❌ Get contacts error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

module.exports = router;