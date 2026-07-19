import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowRight, BarChart3 } from 'lucide-react';
import { API_URL } from '../config.js';

export default function PublicPolls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublicPolls = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/polls/public/active');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load public polls');
        setPolls(data.polls);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicPolls();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center text-zinc-400 mt-20">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
      <p>Loading active public polls...</p>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 px-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-amber-500" />
        <h1 className="text-2xl font-bold text-zinc-100">Active Public Polls</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {polls.length === 0 ? (
        <div className="text-center p-10 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-500">
          <p>No public polls are active right now. Go create one and make it public!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {polls.map((poll) => (
            <Link
              key={poll.id}
              to={`/poll/${poll.secret_code}`}
              className="bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/30 p-5 rounded-xl flex justify-between items-center group transition-all duration-200 shadow-md"
            >
              <div>
                <span className="text-xs font-mono text-amber-500 font-bold tracking-wider uppercase block mb-1">
                  CODE: {poll.secret_code}
                </span>
                <h2 className="text-lg font-semibold text-zinc-200 group-hover:text-zinc-100 transition-colors">
                  {poll.question}
                </h2>
                <p className="text-xs text-zinc-500 mt-2">
                  Expires: {new Date(poll.expires_at).toLocaleTimeString([], {
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 group-hover:border-amber-500/40 text-zinc-400 group-hover:text-amber-500 transition-all shrink-0 ml-4">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}