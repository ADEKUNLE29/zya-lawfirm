const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { ensureSchema } = require('../config/schema');
const nodemailer = require('nodemailer');

// Email setup
let transporter = null;
try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            tls: { rejectUnauthorized: false }
        });
        console.log('Email transporter ready');
    }
} catch (err) { console.error('Email setup failed:', err.message); }

// ===== EMAIL TEMPLATES =====

function getClientAutoReplyTemplate(firstName, service) {
    const services = {
        'work-visa': 'Work Visa / Permit',
        'study-permit': 'Study Permit',
        'family-sponsorship': 'Family Sponsorship',
        'express-entry': 'Express Entry / Permanent Residency',
        'citizenship': 'Citizenship Application',
        'deportation': 'Deportation Defense',
        'other': 'Immigration Consultation'
    };

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <tr>
        <td style="background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); padding:50px 40px 40px; text-align:center;">
            <div style="width:80px; height:80px; background:linear-gradient(135deg, #c9a227, #d4af37); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:20px;">
                <span style="font-size:36px; font-weight:700; color:#ffffff;">Z</span>
            </div>
            <h1 style="margin:0; font-size:28px; color:#ffffff; letter-spacing:1px;">ZYA <span style="color:#c9a227;">LAW FIRM</span></h1>
            <p style="margin:8px 0 0; font-size:12px; color:rgba(255,255,255,0.6); letter-spacing:3px; text-transform:uppercase;">Canadian Immigration Law</p>
        </td>
    </tr>
    <tr><td style="height:4px; background:linear-gradient(90deg, #c9a227, #d4af37, #c9a227);"></td></tr>
    <tr>
        <td style="padding:50px 40px;">
            <h2 style="margin:0 0 20px; font-size:26px; color:#0a1628;">Dear ${firstName},</h2>
            <p style="margin:0 0 20px; font-size:16px; line-height:1.8; color:#4a5568;">
                Thank you for reaching out to <strong style="color:#0a1628;">ZYA Law Firm</strong>. We have successfully received your consultation request regarding <strong style="color:#c9a227;">${services[service] || 'Immigration Consultation'}</strong>.
            </p>
            <div style="background:linear-gradient(135deg, #f7fafc, #edf2f7); border-left:4px solid #c9a227; padding:25px 30px; margin:30px 0; border-radius:0 16px 16px 0;">
                <h3 style="margin:0 0 15px; font-size:17px; color:#0a1628; font-weight:600;">What Happens Next?</h3>
                <ul style="margin:0; padding-left:20px; color:#4a5568; font-size:15px; line-height:2;">
                    <li>Our lead attorney, <strong>Aderibigbe Zainab Yetunde</strong>, will personally review your case details within <strong style="color:#c9a227;">24 hours</strong>.</li>
                    <li>You will receive a follow-up email or phone call to schedule your consultation at a time that works for you.</li>
                    <li>During your consultation, we will assess your eligibility, explain your options, and outline a clear roadmap tailored to your immigration goals.</li>
                    <li>We will provide transparent information about timelines, requirements, and fees — no surprises, no hidden costs.</li>
                </ul>
            </div>
            <p style="margin:0 0 20px; font-size:16px; line-height:1.8; color:#4a5568;">
                At ZYA Law Firm, we understand that every immigration journey is deeply personal. Whether you are seeking to work, study, reunite with family, or build a new life in Canada, we are committed to guiding you every step of the way with <strong>integrity, compassion, and unwavering dedication</strong>.
            </p>
            <p style="margin:0 0 20px; font-size:16px; line-height:1.8; color:#4a5568;">
                While you wait, we encourage you to explore our website to learn more about our services and read resources that may help you understand the Canadian immigration landscape.
            </p>
            <div style="text-align:center; margin:35px 0;">
                <a href="https://zyalawfirm.com" style="display:inline-block; background:linear-gradient(135deg, #c9a227, #d4af37); color:#0a1628; text-decoration:none; padding:16px 40px; border-radius:50px; font-size:15px; font-weight:600;">Visit Our Website</a>
            </div>
            <div style="background:#fffbeb; border:1px solid #fcd34d; border-radius:16px; padding:22px; margin:30px 0;">
                <p style="margin:0; font-size:14px; color:#92400e; line-height:1.7;">
                    <strong style="color:#b45309;">Urgent Matter?</strong><br>
                    If you are facing deportation, detention, or any immigration emergency, please call us immediately at <strong style="color:#0a1628;">+1 (226) 505-2867</strong>. Your case will be treated with the highest priority.
                </p>
            </div>
            <p style="margin:30px 0 0; font-size:15px; line-height:1.7; color:#4a5568;">
                We look forward to speaking with you and helping you achieve your Canadian dream.<br><br>
                Warm regards,<br>
                <strong style="color:#0a1628;">The ZYA Law Firm Team</strong>
            </p>
        </td>
    </tr>
    <tr>
        <td style="background:#0a1628; padding:35px 40px; text-align:center;">
            <p style="margin:0 0 10px; font-size:14px; color:rgba(255,255,255,0.8);"><strong style="color:#c9a227;">ZYA Law Firm</strong> | Canadian Immigration Law</p>
            <p style="margin:0 0 20px; font-size:13px; color:rgba(255,255,255,0.5);">Toronto, Ontario, Canada | info@zyalawfirm.com | +1 (226) 505-2867</p>
            <p style="margin:25px 0 0; font-size:11px; color:rgba(255,255,255,0.3); border-top:1px solid rgba(255,255,255,0.1); padding-top:20px;">
                &copy; 2026 ZYA Law Firm. All rights reserved.<br>This is an automated confirmation email.
            </p>
        </td>
    </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function getLawyerNotificationTemplate(data) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <tr>
        <td style="background: linear-gradient(135deg, #0a1628 0%, #1a365d 100%); padding:35px 40px; text-align:center;">
            <div style="width:60px; height:60px; background:linear-gradient(135deg, #c9a227, #d4af37); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:15px;">
                <span style="font-size:28px; font-weight:700; color:#ffffff;">Z</span>
            </div>
            <h1 style="margin:0; font-size:24px; color:#ffffff;">ZYA <span style="color:#c9a227;">LAW FIRM</span></h1>
            <p style="margin:5px 0 0; font-size:11px; color:rgba(255,255,255,0.6); letter-spacing:2px; text-transform:uppercase;">New Consultation Request</p>
        </td>
    </tr>
    <tr><td style="height:4px; background:linear-gradient(90deg, #c9a227, #d4af37, #c9a227);"></td></tr>
    <tr>
        <td style="padding:40px;">
            <h2 style="margin:0 0 8px; color:#0a1628; font-size:22px;">New Consultation Request</h2>
            <p style="margin:0 0 25px; color:#4a5568; font-size:13px;">Received on ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafc; border-radius:16px; overflow:hidden;">
                <tr><td style="padding:18px 24px; border-bottom:1px solid #e2e8f0;"><strong style="color:#0a1628; display:inline-block; width:140px; font-size:14px;">Full Name:</strong> <span style="color:#4a5568; font-size:15px;">${data.firstName} ${data.lastName}</span></td></tr>
                <tr><td style="padding:18px 24px; border-bottom:1px solid #e2e8f0;"><strong style="color:#0a1628; display:inline-block; width:140px; font-size:14px;">Email:</strong> <a href="mailto:${data.email}" style="color:#c9a227; text-decoration:none; font-size:15px;">${data.email}</a></td></tr>
                <tr><td style="padding:18px 24px; border-bottom:1px solid #e2e8f0;"><strong style="color:#0a1628; display:inline-block; width:140px; font-size:14px;">Phone:</strong> <span style="color:#4a5568; font-size:15px;">${data.phone}</span></td></tr>
                <tr><td style="padding:18px 24px; border-bottom:1px solid #e2e8f0;"><strong style="color:#0a1628; display:inline-block; width:140px; font-size:14px;">Service:</strong> <span style="color:#4a5568; font-size:15px;">${data.service}</span></td></tr>
                <tr><td style="padding:18px 24px; border-bottom:1px solid #e2e8f0;"><strong style="color:#0a1628; display:inline-block; width:140px; font-size:14px;">Language:</strong> <span style="color:#4a5568; font-size:15px;">${data.language || 'English'}</span></td></tr>
                <tr><td style="padding:18px 24px; border-bottom:1px solid #e2e8f0;"><strong style="color:#0a1628; display:inline-block; width:140px; font-size:14px;">Status:</strong> <span style="color:#4a5568; font-size:15px;">${data.status || 'Not specified'}</span></td></tr>
                <tr><td style="padding:18px 24px;"><strong style="color:#0a1628; display:inline-block; width:140px; font-size:14px; vertical-align:top;">Message:</strong> <span style="color:#4a5568; font-size:15px; line-height:1.6; white-space:pre-wrap;">${data.message}</span></td></tr>
            </table>
            <div style="text-align:center; margin-top:30px;">
                <a href="http://localhost:5000/admin" style="display:inline-block; background:linear-gradient(135deg, #c9a227, #d4af37); color:#0a1628; text-decoration:none; padding:16px 40px; border-radius:50px; font-size:15px; font-weight:600;">View in Admin Dashboard</a>
            </div>
        </td>
    </tr>
    <tr>
        <td style="background:#0a1628; padding:20px 40px; text-align:center;">
            <p style="margin:0; font-size:12px; color:rgba(255,255,255,0.4);">&copy; 2026 ZYA Law Firm | Automated Case Management System</p>
        </td>
    </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ===== ROUTES =====

router.post('/', async (req, res) => {
    try {
        await ensureSchema();
        const { firstName, lastName, email, phone, language, service, status, message } = req.body;

        if (!firstName || !lastName || !email || !phone || !service || !message) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
        }

        // Save contact
        const contactResult = await db.runAsync(
            `INSERT INTO contacts (firstName, lastName, email, phone, language, service, status, message) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, email, phone, language || 'english', service, status || 'other', message]
        );

        const contactId = contactResult.id;

        // Check existing client
        const existingClient = await db.getAsync('SELECT * FROM clients WHERE email = ?', [email]);
        let clientId;

        if (existingClient) {
            clientId = existingClient.id;
        } else {
            const bcrypt = require('bcryptjs');
            const hash = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
            const clientResult = await db.runAsync(
                `INSERT INTO clients (contact_id, email, password, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)`,
                [contactId, email, hash, firstName, lastName, phone]
            );
            clientId = clientResult.id;
        }

        // Create case
        const caseResult = await db.runAsync(
            `INSERT INTO cases (client_id, contact_id, service_type) VALUES (?, ?, ?)`,
            [clientId, contactId, service]
        );

        // Create case update
        await db.runAsync(
            `INSERT INTO case_updates (case_id, new_status, note) VALUES (?, 'submitted', ?)`,
            [caseResult.id, 'Consultation request received. We will review and contact within 24 hours.']
        );

        // Send response IMMEDIATELY
        res.status(201).json({
            success: true,
            message: 'Consultation request submitted successfully.',
            data: { contactId, clientId, caseId: caseResult.id }
        });

        // Send emails IN BACKGROUND (after response)
        if (transporter) {
            const contactData = { firstName, lastName, email, phone, language, service, status, message };

            // Email to lawyer
            transporter.sendMail({
                from: `"ZYA Law Firm" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_TO || process.env.EMAIL_USER,
                subject: `New Consultation: ${firstName} ${lastName} - ${service}`,
                html: getLawyerNotificationTemplate(contactData)
            }).then(() => console.log('Lawyer email sent'))
              .catch(err => console.error('Lawyer email failed:', err.message));

            // Email to client
            transporter.sendMail({
                from: `"ZYA Law Firm" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Thank You for Contacting ZYA Law Firm',
                html: getClientAutoReplyTemplate(firstName, service)
            }).then(() => console.log('Client email sent'))
              .catch(err => console.error('Client email failed:', err.message));
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit. Please try again.' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        await ensureSchema();
        const contacts = await db.allAsync('SELECT * FROM contacts ORDER BY created_at DESC');
        res.json({ success: true, count: contacts.length, contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch contacts.' });
    }
});

module.exports = router;