import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Vote, PlusCircle, LogIn, LogOut } from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import CreatePoll from './pages/CreatePoll';
import VotingRoom from './pages/VotingRoom';
import PublicPolls from './pages/PublicPolls';
import VerifyOtp from './pages/VerifyOtp';

// We extract the Navbar into its own component so it can use the 'useLocation' and 'useNavigate' hooks
function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // This forces the Navbar to re-render when the route changes
  
  // Check if user is logged in by looking for the token
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token'); // Destroy the token
    navigate('/'); // Send them back to the home page
  };

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-amber-500 hover:text-amber-400 transition">
          <Vote className="w-6 h-6" />
          <span>InstantPoll</span>
          {/* <span>VoteNow</span> */}
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4 text-sm font-medium">
          
          {isAuthenticated ? (
            <>
              {/* Show Create Poll & Logout if logged in */}
              <Link to="/create" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition px-2 py-1">
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Create Poll</span>
              </Link>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-red-900/50 hover:text-red-400 hover:border-red-500/50 text-zinc-100 transition px-3 py-1.5 rounded-md border border-zinc-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            /* Show only Login if logged out */
            <Link to="/login" className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition px-3 py-1.5 rounded-md border border-zinc-700">
              <LogIn className="w-4 h-4" />
              <span>Login / Register</span>
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans">
        
        {/* Inject our smart Navbar here */}
        <Navbar />

        {/* Main Application Content Container */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-center items-center">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create" element={<CreatePoll />} />
            <Route path="/poll/:code" element={<VotingRoom />} />
            <Route path='/public' element={<PublicPolls/>}/>
            <Route path="/verify-otp" element={<VerifyOtp />} />
            
          </Routes>
        </main>

      </div>
    </Router>
  );
}