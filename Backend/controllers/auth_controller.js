// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
// import pool from '../db.js';

// export const Signupuser = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // Check if user already exists
//         const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
//         if (userCheck.rows.length > 0) {
//             return res.status(400).json({ error: 'User already exists' });
//         }

//         // Hash password and insert user
//         const salt = await bcrypt.genSalt(10);
//         const bcryptPassword = await bcrypt.hash(password, salt);

//         const newUser = await pool.query(
//             'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
//             [email, bcryptPassword]
//         );

//         // Generate JWT Token
//         const token = jwt.sign({ user: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });

//         res.json({ 
//             token, 
//             user: newUser.rows[0] 
//         });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// };

// export const Loginuser = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
//         if (user.rows.length === 0) {
//             return res.status(401).json({ error: 'Invalid Credentials' });
//         }

//         const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        
//         if (!validPassword) {
//             return res.status(401).json({ error: 'Invalid Credentials' });
//         }

//         const token = jwt.sign({ user: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });

//         res.json({ 
//             token, 
//             user: { id: user.rows[0].id, email: user.rows[0].email } 
//         });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// }

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sql from '../db.js';
import redis from '../redis.js'
import nodemailer from 'nodemailer'

// export const Signupuser = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const userCheck = await sql`SELECT * FROM users WHERE email = ${email}`;
//         if (userCheck.length > 0) {
//             return res.status(400).json({ error: 'User already exists' });
//         }

//         const salt = await bcrypt.genSalt(10);
//         const bcryptPassword = await bcrypt.hash(password, salt);

//         const newUser = await sql`
//             INSERT INTO users (email, password_hash) 
//             VALUES (${email}, ${bcryptPassword}) 
//             RETURNING id, email
//         `;

//         const token = jwt.sign({ user: newUser[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });

//         res.json({ 
//             token, 
//             user: newUser[0] 
//         });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// };

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_APP_PASSWORD 
    }
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


// --- STEP 1: REQUEST OTP ---
export const RequestSignupOTP = async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Check if user already exists
        const userCheck = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (userCheck.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // 2. Generate OTP and store it in Redis for 5 minutes (300 seconds)
        const otp = generateOTP();
        await redis.setex(`signup_otp:${email}`, 300, otp);

        // 3. Email the OTP to the user
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Poll App Verification Code',
            text: `Your verification code is ${otp}. It will expire in 5 minutes.`
        });

        res.json({ message: 'OTP sent successfully to your email.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};

// --- STEP 2: VERIFY OTP & CREATE ACCOUNT ---
export const VerifyOTPAndSignup = async (req, res) => {
    const { email, password, otp } = req.body;

    try {
        // 1. Fetch the stored OTP from Redis
        const storedOtp = await redis.get(`signup_otp:${email}`);

        if (!storedOtp) {
            return res.status(400).json({ error: 'OTP has expired or was not requested.' });
        }

        // Force string comparison in case the frontend sends the OTP as a number
        if (String(storedOtp) !== String(otp)) {
            return res.status(400).json({ error: 'Invalid OTP.' });
        }

        // 2. OTP is valid! Hash the password and create the user in PostgreSQL
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        const newUser = await sql`
            INSERT INTO users (email, password_hash) 
            VALUES (${email}, ${bcryptPassword}) 
            RETURNING id, email
        `;

        // 3. Delete the OTP from Redis so it cannot be reused
        await redis.del(`signup_otp:${email}`);

        // 4. Generate JWT Token
        const token = jwt.sign({ user: newUser[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ 
            token, 
            user: newUser[0] 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
};

export const Loginuser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await sql`SELECT * FROM users WHERE email = ${email}`;
        
        if (user.length === 0) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        const validPassword = await bcrypt.compare(password, user[0].password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        const token = jwt.sign({ user: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ 
            token, 
            user: { id: user[0].id, email: user[0].email } 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}