import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { API_URL } from '../config.js';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`https://instantpoll-backend.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please try again.');
      }

      localStorage.setItem('token', data.token);
      navigate('/create');
      
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
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              isLogin ? 'bg-zinc-900 text-amber-500 border-b-2 border-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
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
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              {isLogin ? 'Enter your credentials to manage your polls.' : 'Sign up to start creating custom live polls.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Register')}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}