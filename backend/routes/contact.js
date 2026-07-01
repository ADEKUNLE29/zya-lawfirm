// ===== CONTACT ROUTE - Handles Form Submissions =====
// Saves contact requests, creates client accounts/cases, and sends notifications.

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { ensureSchema } = require('../config/schema');
const authMiddleware = require('../middleware/auth');

async function setupContactTables() {
    try {
        await ensureSchema();
        console.log('Contact and client portal tables ready.');
    } catch (error) {
        console.error('Error creating contact/client tables:', error.message);
    }
}

setupContactTables();

// ===== SUBMIT CONTACT FORM (POST /api/contact) =====
router.post('/', async (req, res) => {
    try {
        await ensureSchema();

        const { firstName, lastName, email, phone, language, service, status, message } = req.body;

        if (!firstName || !lastName || !email || !phone || !service) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields.'
            });
        }

        const [contactResult] = await db.query(
            'INSERT INTO contacts (firstName, lastName, email, phone, language, service, status, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [firstName, lastName, email, phone, language || 'english', service, status || 'other', message || '']
        );

        let clientId = null;
        let tempPassword = null;

        const [existingClients] = await db.query('SELECT id FROM clients WHERE email = ?', [email]);

        if (existingClients.length === 0) {
            tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const [clientResult] = await db.query(
                'INSERT INTO clients (contact_id, email, password, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
                [contactResult.insertId, email, hashedPassword, firstName, lastName, phone || null]
            );

            clientId = clientResult.insertId;

            const [caseResult] = await db.query(
                'INSERT INTO cases (client_id, contact_id, service_type, status) VALUES (?, ?, ?, ?)',
                [clientId, contactResult.insertId, service, 'submitted']
            );

            await db.query(
                'INSERT INTO case_updates (case_id, new_status, note) VALUES (?, ?, ?)',
                [
                    caseResult.insertId,
                    'submitted',
                    'Your consultation request has been received. We will review your case and contact you within 24 hours.'
                ]
            );
        } else {
            clientId = existingClients[0].id;

            const [caseResult] = await db.query(
                'INSERT INTO cases (client_id, contact_id, service_type, status) VALUES (?, ?, ?, ?)',
                [clientId, contactResult.insertId, service, 'submitted']
            );

            await db.query(
                'INSERT INTO case_updates (case_id, new_status, note) VALUES (?, ?, ?)',
                [
                    caseResult.insertId,
                    'submitted',
                    'Your new consultation request has been received. We will review it and contact you within 24 hours.'
                ]
            );
        }

        await sendEmailNotification({
            firstName,
            lastName,
            email,
            phone,
            language,
            service,
            status,
            message,
            clientId,
            tempPassword
        });

        res.status(201).json({
            success: true,
            message: tempPassword
                ? 'Thank you! We will contact you within 24 hours. A client portal account has been created for you to track your case progress.'
                : 'Thank you! We will contact you within 24 hours. You can use your existing client portal account to track your case progress.',
            contactId: contactResult.insertId,
            clientId,
            tempPassword,
            loginUrl: '/client-login.html'
        });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.'
        });
    }
});

// ===== GET ALL CONTACTS (for admin dashboard) =====
router.get('/', authMiddleware, async (req, res) => {
    try {
        await ensureSchema();

        const [contacts] = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');

        res.json({
            success: true,
            count: contacts.length,
            contacts
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contacts.'
        });
    }
});

async function sendEmailNotification(data) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email credentials are not configured; skipping email notification.');
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.EMAIL_PORT || 587),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5000').replace(/\/$/, '');
        const clientPortalInfo = data.tempPassword
            ? `
                <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #c9a227; border-radius: 8px;">
                    <h4 style="color: #1a365d; margin-bottom: 10px;">Client Portal Created</h4>
                    <p style="margin: 5px 0; color: #4a5568;">A client portal account has been automatically created for this contact.</p>
                    <p style="margin: 5px 0; color: #4a5568;"><strong>Login URL:</strong> <a href="${frontendUrl}/client-login.html">Client Login</a></p>
                    <p style="margin: 5px 0; color: #4a5568;"><strong>Email:</strong> ${data.email}</p>
                    <p style="margin: 5px 0; color: #4a5568;"><strong>Temporary Password:</strong> ${data.tempPassword}</p>
                    <p style="margin: 5px 0; color: #718096; font-size: 12px;">Client should change this password after logging in.</p>
                </div>
            `
            : '';

        await transporter.sendMail({
            from: `"ZYA Law Website" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO || 'aderibigbeyetunde@gmail.com',
            subject: `New Consultation Request - ${data.firstName} ${data.lastName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #1a365d; border-bottom: 2px solid #c9a227; padding-bottom: 10px;">New Consultation Request</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr><td style="padding: 10px; background: #f7fafc; font-weight: bold;">Name:</td><td style="padding: 10px;">${data.firstName} ${data.lastName}</td></tr>
                        <tr><td style="padding: 10px; background: #f7fafc; font-weight: bold;">Email:</td><td style="padding: 10px;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
                        <tr><td style="padding: 10px; background: #f7fafc; font-weight: bold;">Phone:</td><td style="padding: 10px;"><a href="tel:${data.phone}">${data.phone}</a></td></tr>
                        <tr><td style="padding: 10px; background: #f7fafc; font-weight: bold;">Language:</td><td style="padding: 10px;">${data.language || 'English'}</td></tr>
                        <tr><td style="padding: 10px; background: #f7fafc; font-weight: bold;">Service:</td><td style="padding: 10px; color: #c9a227; font-weight: 600;">${data.service}</td></tr>
                        <tr><td style="padding: 10px; background: #f7fafc; font-weight: bold;">Status:</td><td style="padding: 10px;">${data.status || 'Not specified'}</td></tr>
                        <tr><td style="padding: 10px; background: #f7fafc; font-weight: bold; vertical-align: top;">Message:</td><td style="padding: 10px;">${data.message || 'No message provided.'}</td></tr>
                    </table>
                    ${clientPortalInfo}
                    <p style="margin-top: 20px; font-size: 12px; color: #718096; text-align: center;">
                        Sent from ZYA Law Firm Website | ${new Date().toLocaleString()}
                    </p>
                </div>
            `
        });
    } catch (error) {
        console.error('Email failed to send:', error.message);
    }
}

module.exports = router;
