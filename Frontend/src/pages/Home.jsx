import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (code.trim()) {
      navigate(`/poll/${code.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-16 flex flex-col items-center animate-fade-in">
      
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3 tracking-tight">
          Join a Live Poll
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base">
          Enter the 6-character secret code to cast your vote anonymously.
        </p>
      </div>

      {/* Code Input Form */}
      <form 
        onSubmit={handleJoin}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 flex items-center shadow-xl focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all"
      >
        <input
          type="text"
          placeholder="e.g. MERN99"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="flex-1 bg-transparent border-none outline-none px-4 text-zinc-100 placeholder-zinc-600 font-mono text-lg tracking-widest uppercase"
          required
        />
        <button
          type="submit"
          disabled={code.length < 2}
          className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Join</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Active Polls Shortcut */}
      <div className="mt-12 pt-8 border-t border-zinc-800/50 w-full text-center">
        <button className="text-zinc-500 hover:text-amber-500 transition-colors flex items-center justify-center gap-2 mx-auto text-sm">

          {/* <Activity className="w-4 h-4" /> */}
          {/* <span>Browse public active polls</span> */}
          <Link to="/public" className="flex items-center gap-2 text-zinc-500 hover:text-amber-500 text-sm transition-colors mt-6 mx-auto w-fit">
              <Activity className="w-4 h-4" />
              Browse public active polls
          </Link>
        </button>
      </div>
      
    </div>
  );
}