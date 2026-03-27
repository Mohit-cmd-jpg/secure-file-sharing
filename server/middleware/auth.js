const jwt = require('jsonwebtoken');

let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET environment variable is not set. The application cannot start without it.');
    } else {
        console.warn('WARNING: JWT_SECRET is not set. Using fallback value only in non-production environment.');
        JWT_SECRET = 'your-secret-key';
    }
}

const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const token = authHeader.slice(7); // Extract token after 'Bearer '
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = auth;
