import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { API_URL } from '../config.js';


export default function CreatePoll() {
  const navigate = useNavigate();
  
  // Form State
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // Start with 2 empty options
  const [hours, setHours] = useState(24);
  const [isPublic, setIsPublic] = useState(false);
  
  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Security Check: Kick user out if not logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Dynamic Options Handlers
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Clean up empty options before sending
    const validOptions = options.filter(opt => opt.trim() !== '');
    
    if (validOptions.length < 2) {
      setError('You must provide at least two valid options.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://instantpoll-backend.onrender.com/api/polls/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send the JWT!
        },
        body: JSON.stringify({
          question,
          options: validOptions,
          isPublic,
          hoursUntilExpire: hours
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create poll');

      // Show success screen with the code
      setSuccessData(data.poll);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(successData.secret_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // SUCCESS UI
  if (successData) {
    return (
      <div className="w-full max-w-md mx-auto mt-16 text-center animate-fade-in">
        <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Poll Created!</h2>
          <p className="text-zinc-400 text-sm mb-6">Share this secret code with your audience.</p>
          
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-6 flex flex-col items-center justify-center relative group">
            <span className="text-4xl font-mono font-bold text-amber-500 tracking-widest uppercase">
              {successData.secret_code}
            </span>
            <button 
              onClick={copyToClipboard}
              className="absolute top-2 right-2 p-2 text-zinc-500 hover:text-amber-500 transition"
              title="Copy Code"
            >
              {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <button 
            onClick={() => navigate(`/poll/${successData.secret_code}`)}
            className="w-full bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold py-3 rounded-lg transition-colors"
          >
            Go to Voting Room
          </button>
        </div>
      </div>
    );
  }

  // CREATION FORM UI
  return (
    <div className="w-full max-w-xl mx-auto mt-8 animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
          <h1 className="text-2xl font-bold text-zinc-100">Create a New Poll</h1>
          <p className="text-zinc-400 text-sm mt-1">Set up your question and options below.</p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Question Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Poll Question</label>
              <input
                type="text"
                required
                placeholder="e.g. Which framework is best for a startup?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            {/* Options List */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Options</label>
              <div className="flex flex-col gap-3">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      required={index < 2} // First two are strictly required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
              )}
            </div>

            {/* Settings (Time & Visibility) */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              
              <div className="flex flex-col justify-center pt-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${isPublic ? 'bg-amber-500' : 'bg-zinc-800'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isPublic ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                    Make Public
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Poll'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}