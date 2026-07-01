require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const contactRoutes = require('./routes/contact');
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/client');
const caseRoutes = require('./routes/case');
const messageRoutes = require('./routes/message');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== FIXED CORS — ALLOW ALL LOCALHOST PORTS =====
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== API ROUTES =====
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/case', caseRoutes);
app.use('/api/message', messageRoutes);

// ===== SERVE STATIC FILES (Frontend) =====
app.use(express.static(path.join(__dirname, '../')));

// ===== ADMIN DASHBOARD ROUTE =====
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../css/admin.html'));
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'ZYA Law Backend is running!',
        timestamp: new Date().toISOString()
    });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong. Please try again.' 
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║     ZYA LAW FIRM BACKEND SERVER        ║');
    console.log('║     Canadian Immigration Law           ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Server running on port ${PORT}               ║`);
    console.log(`║  API: http://localhost:${PORT}/api            ║`);
    console.log('║  CORS: All localhost ports allowed       ║');
    console.log('║  Status: READY 🔥                      ║');
    console.log('╚══════════════════════════════════════════╝');
});

module.exports = app;
