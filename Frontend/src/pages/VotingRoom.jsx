import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Mail, Loader2, AlertCircle, Activity, ChevronRight } from 'lucide-react';

export default function VotingRoom() {
  const { code } = useParams();
  
  const [poll, setPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Fetch initial poll data
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/polls/${code}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch poll');
        
        console.log("📊 Initial Poll Data Loaded:", data.options);
        setPoll(data.poll);
        setOptions(data.options);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [code]);

  // 2. Listen for Real-Time Votes
  useEffect(() => {
    if (!poll) return;

    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      console.log('🟢 Connected to WebSocket Server');
      socket.emit('join_poll', poll.id.toString());
    });

    socket.on('vote_cast', (data) => {
      console.log('🔥 LIVE VOTE RECEIVED!', data);
      
      setOptions((prevOptions) => 
        prevOptions.map((opt) => 
          // CRITICAL FIX: Force both IDs to strings so 5 === "5" works!
          String(opt.id) === String(data.optionId) 
            ? { ...opt, votes: (Number(opt.votes) || 0) + 1 } 
            : opt
        )
      );
    });

    return () => socket.disconnect();
  }, [poll]);

  // 3. Handle Email Submit
// 3. Handle Email Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    
    try {
      const res = await fetch(`http://localhost:5000/api/polls/${poll.id}/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      // CRITICAL FIX: If the backend throws a 400 error (like the regex failing), 
      // stop the user and show the error message.
      if (!res.ok) {
          throw new Error(data.error || 'Failed to verify email');
      }

      setStep(data.hasVoted ? 'voted' : 'voting');
    } catch (err) {
      // This will now print "Please enter a valid email address." on the screen
      setError(err.message); 
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Cast Vote
  const handleVote = async (optionId) => {
    setActionLoading(true);
    setError('');
    
    try {
      const res = await fetch(`http://localhost:5000/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, optionId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cast vote');
      
      setStep('voted');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center text-zinc-400 mt-20">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
      <p>Loading live poll...</p>
    </div>
  );

  if (error && !poll) return (
    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-xl text-center max-w-md mx-auto mt-10">
      <AlertCircle className="w-8 h-8 mx-auto mb-3" />
      <h2 className="text-xl font-bold mb-1">Oops!</h2>
      <p>{error}</p>
    </div>
  );

  // --- THE MATH FOR THE PROGRESS BARS ---
  const totalVotes = options.reduce((sum, opt) => sum + (Number(opt.votes) || 0), 0);

  return (
    <div className="w-full max-w-lg mx-auto mt-10 animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-t-xl text-center relative overflow-hidden">
        <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
          <Activity className="w-3 h-3 animate-pulse" /> Live
        </div>
        <span className="text-xs font-bold text-amber-500 tracking-widest uppercase mb-2 block">
          Poll Code: {code}
        </span>
        <h1 className="text-2xl font-bold text-zinc-100">{poll.question}</h1>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 border-t-0 p-6 rounded-b-xl shadow-xl">
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* STEP 1: ENTER EMAIL */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <p className="text-zinc-400 text-sm text-center mb-2">Verify your email to continue.</p>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                placeholder='Enter your email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg pl-10 pr-4 py-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
            <button type="submit" disabled={actionLoading} className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold py-3 rounded-lg flex justify-center">
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
            </button>
          </form>
        )}

        {/* STEP 2: CLICK TO VOTE */}
        {step === 'voting' && (
          <div className="flex flex-col gap-3">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={actionLoading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/50 text-zinc-200 p-4 rounded-lg flex justify-between group transition-all"
              >
                <span className="font-medium">{option.option_text}</span>
                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500" />
              </button>
            ))}
          </div>
        )}

        {/* STEP 3: LIVE RESULTS BARS */}
        {step === 'voted' && (
          <div className="flex flex-col gap-3 mt-2">
            <p className="text-zinc-400 text-sm text-center mb-4">Total Votes: {totalVotes}</p>
            
            {options.map(opt => {
              const percent = totalVotes > 0 ? Math.round((Number(opt.votes) / totalVotes) * 100) : 0;
              
              return (
                <div key={opt.id} className="relative bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-amber-500/20 transition-all duration-700 ease-out"
                    style={{ width: `${percent}%` }}
                  ></div>
                  
                  <div className="relative flex justify-between items-center z-10">
                    <span className="font-medium text-zinc-100">{opt.option_text}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 text-sm">{opt.votes} votes</span>
                      <span className="text-amber-500 font-bold w-12 text-right">{percent}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}