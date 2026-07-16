require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/contact', contactRoutes);
app.use(express.static(path.join(__dirname, '../')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../admin.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));