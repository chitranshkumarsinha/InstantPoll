import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

export const Signupuser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user already exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password and insert user
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, bcryptPassword]
        );

        // Generate JWT Token
        const token = jwt.sign({ user: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ 
            token, 
            user: newUser.rows[0] 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const Loginuser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        const token = jwt.sign({ user: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ 
            token, 
            user: { id: user.rows[0].id, email: user.rows[0].email } 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}