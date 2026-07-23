import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, LogIn, UserPlus, Key } from 'lucide-react';
// import { API_URL } from '../config.js'; // Ensure you use this if you want to avoid hardcoding!

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // --- NEW STATE FOR OTP ---
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // Helper to reset everything when switching tabs
  const handleTabSwitch = (loginMode) => {
    setIsLogin(loginMode);
    setError('');
    setOtpStep(false);
    setOtp('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const baseUrl = 'https://instantpoll-backend.onrender.com';

      if (isLogin) {
        // --- 1. LOGIN FLOW ---
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed.');
        
        localStorage.setItem('token', data.token);
        navigate('/create');

      } else if (!otpStep) {
        // --- 2. REGISTRATION: REQUEST OTP ---
        const res = await fetch(`${baseUrl}/api/auth/signup/request-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }) // Password is not sent yet!
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');
        
        setOtpStep(true); // Move to the next UI step

      } else {
        // --- 3. REGISTRATION: VERIFY OTP ---
        const res = await fetch(`${baseUrl}/api/auth/signup/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, otp }) // Send all 3 to finalize
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid OTP.');
        
        localStorage.setItem('token', data.token);
        navigate('/create');
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-16 animate-fade-in">
      
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => handleTabSwitch(true)}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              isLogin ? 'bg-zinc-900 text-amber-500 border-b-2 border-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            onClick={() => handleTabSwitch(false)}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              !isLogin ? 'bg-zinc-900 text-amber-500 border-b-2 border-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Register
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-zinc-100">
              {isLogin ? 'Welcome Back' : (otpStep ? 'Verify Your Email' : 'Create an Account')}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              {isLogin ? 'Enter your credentials to manage your polls.' : 
               (otpStep ? `We sent a 6-digit code to ${email}` : 'Sign up to start creating custom live polls.')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Show Email & Password fields if Logging in OR in Step 1 of Signup */}
            {(!otpStep || isLogin) && (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="Email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </>
            )}

            {/* Show OTP Field ONLY if in Step 2 of Signup */}
            {!isLogin && otpStep && (
              <div className="relative animate-fade-in">
                <Key className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-center tracking-widest text-lg font-bold"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
               (isLogin ? 'Sign In' : (otpStep ? 'Verify & Register' : 'Request OTP'))}
            </button>
            
            {/* Allow user to go back if they made a typo in their email */}
            {!isLogin && otpStep && !loading && (
              <button
                type="button"
                onClick={() => setOtpStep(false)}
                className="text-sm text-zinc-400 hover:text-amber-500 mt-2 transition-colors"
              >
                Change email address
              </button>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}