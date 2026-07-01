// ===== AUTH MIDDLEWARE - Protects Admin Routes =====
// Checks JWT token before allowing access

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zyalaw_secret_key_2026_secure');

        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required.'
            });
        }

        // Add user info to request
        req.user = decoded;
        next();

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.'
        });
    }
};

module.exports = authMiddleware;
