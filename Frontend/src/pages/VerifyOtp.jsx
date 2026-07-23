import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Key, Loader2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(60);

  const navigate = useNavigate();
  const location = useLocation();

  // Grab the email and password passed from the Login/Register screen
  const email = location.state?.email;
  const password = location.state?.password;

  // Protect the route: If someone opens /verify-otp directly without signing up first, kick them back to login
  useEffect(() => {
    if (!email || !password) {
      navigate('/login');
    }
  }, [email, password, navigate]);

  // Countdown timer for the "Resend OTP" button
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('https://instantpoll-backend.onrender.com/api/auth/signup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, otp })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid verification code.');

      // Success! Save token and navigate into the app
      localStorage.setItem('token', data.token);
      navigate('/create');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('https://instantpoll-backend.onrender.com/api/auth/signup/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend code.');

      setMessage('A new code has been sent to your email.');
      setTimer(60); // Reset 60 second timer
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="w-full max-w-md mx-auto mt-16 animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl p-6 sm:p-8">
        
        <button
          onClick={() => navigate('/login')}
          className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-2 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Registration
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Key className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">Check Your Inbox</h2>
          <p className="text-zinc-400 text-sm mt-1">
            We sent a 6-digit verification code to <br />
            <span className="font-semibold text-amber-500">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg text-center">
            <p>{message}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="000000"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg py-3 px-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-center tracking-[0.5em] text-2xl font-mono font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-zinc-800 pt-4">
          <p className="text-sm text-zinc-500">
            Didn't receive a code?{' '}
            {timer > 0 ? (
              <span className="text-zinc-400 font-medium">Resend in {timer}s</span>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={resending}
                className="text-amber-500 hover:underline font-semibold inline-flex items-center gap-1"
              >
                {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
                Resend Code
              </button>
            )}
          </p>
        </div>

      </div>
    </div>
  );
}