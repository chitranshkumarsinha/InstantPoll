import express from 'express';
// import { Loginuser, Signupuser } from '../controllers/auth_controller.js';
import { RequestSignupOTP,VerifyOTPAndSignup } from '../controllers/auth_controller.js';

const router = express.Router();

// Register a new user
// router.post('/register',Signupuser);

//NEW ROUTE
router.post('/signup/request-otp', RequestSignupOTP);
router.post('/signup/verify', VerifyOTPAndSignup);

// Login user
router.post('/login',Loginuser);

export default router;