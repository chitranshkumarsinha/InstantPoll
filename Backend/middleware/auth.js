import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export default function (req, res, next) {
    // Get token from header (Format: "Bearer ")
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        const token = authHeader.split(' ')[1] || authHeader;
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // The payload we created in auth.js was { user: id }
        req.user = decoded.user; 
        next(); // Move on to the actual route handler
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
}