const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Email setup
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Submit contact form
router.post('/', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, service, message } = req.body;
        
        // Send email to lawyer
        await transporter.sendMail({
            from: `"ZYA Law Firm" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO || process.env.EMAIL_USER,
            subject: `New Consultation: ${firstName} ${lastName}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                <p><strong>Service:</strong> ${service}</p>
                <p><strong>Message:</strong> ${message}</p>
            `
        });

        // Send auto-reply to client
        await transporter.sendMail({
            from: `"ZYA Law Firm" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Thank You for Contacting ZYA Law Firm',
            html: `
                <h2>Thank You, ${firstName}!</h2>
                <p>We received your request for ${service}.</p>
                <p>Our attorney will contact you within 24 hours.</p>
                <p>If urgent, call: +1 (226) 505-2867</p>
            `
        });

        res.json({ success: true, message: 'Thank you! We will contact you soon.' });
        
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ success: false, message: 'Error sending message.' });
    }
});

module.exports = router;