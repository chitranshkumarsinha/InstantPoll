import express from 'express';
import { Loginuser, Signupuser } from '../controllers/auth_controller.js';

const router = express.Router();

// Register a new user
router.post('/register',Signupuser);

// Login user
router.post('/login',Loginuser);

export default router;