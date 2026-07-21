const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow everything
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Email setup (if credentials exist)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        console.log('✅ Email configured');
    } catch (e) {
        console.log('⚠️ Email config failed:', e.message);
    }
} else {
    console.log('⚠️ No email credentials set');
}

// In-memory storage (no database needed)
const contacts = [];

// ===== CONTACT FORM =====
app.post('/api/contact', (req, res) => {
    const { firstName, lastName, email, phone, service, message } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !service || !message) {
        return res.status(400).json({
            success: false,
            message: 'Please fill all required fields'
        });
    }

    // Save to memory
    const contact = {
        id: contacts.length + 1,
        firstName,
        lastName,
        email,
        phone: phone || '',
        service,
        message,
        created_at: new Date().toISOString()
    };
    contacts.push(contact);
    console.log('✅ New contact saved:', contact.id);

    // Send emails in background (don't wait, don't crash)
    if (transporter) {
        // To lawyer
        transporter.sendMail({
            from: `"ZYA Law Firm" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO || process.env.EMAIL_USER,
            subject: `New Consultation: ${firstName} ${lastName}`,
            html: `<h2>New Contact</h2>
                   <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                   <p><strong>Service:</strong> ${service}</p>
                   <p><strong>Message:</strong> ${message}</p>`
        }).then(() => console.log('📧 Lawyer email sent'))
          .catch(err => console.log('❌ Lawyer email failed:', err.message));

        // To client
        transporter.sendMail({
            from: `"ZYA Law Firm" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Thank You for Contacting ZYA Law Firm',
            html: `<h2>Thank You, ${firstName}!</h2>
                   <p>We received your request for ${service}.</p>
                   <p>Our attorney will contact you within 24 hours.</p>
                   <p>If urgent, call: +1 (226) 505-2867</p>`
        }).then(() => console.log('📧 Client email sent'))
          .catch(err => console.log('❌ Client email failed:', err.message));
    }

    // Return success IMMEDIATELY
    res.status(201).json({
        success: true,
        message: 'Thank you! We will contact you soon.',
        contactId: contact.id
    });
});

// ===== GET ALL CONTACTS (for admin) =====
app.get('/api/contact', (req, res) => {
    res.json({ success: true, contacts });
});

// ===== ADMIN LOGIN =====
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    const adminUser = process.env.ADMIN_USERNAME || 'zainab';
    const adminPass = process.env.ADMIN_PASSWORD || 'zyalaw2026';

    if (username === adminUser && password === adminPass) {
        res.json({
            success: true,
            token: 'admin-token-' + Date.now(),
            user: { username: adminUser }
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// ===== SERVE FRONTEND =====
app.use(express.static(path.join(__dirname, '..')));

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', time: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

app.listen(PORT, () => {
    console.log(`✅ ZYA Law Firm Server running on port ${PORT}`);
    console.log(`📧 Email: ${transporter ? 'ON' : 'OFF'}`);
    console.log(`💾 Storage: In-memory (${contacts.length} contacts)`);
});