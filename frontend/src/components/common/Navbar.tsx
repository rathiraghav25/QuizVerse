import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  BookOpen, 
  LayoutDashboard, 
  History, 
  User as UserIcon, 
  LogOut, 
  Sparkles, 
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
              QuizVerse
            </span>
            <span className="text-[9px] text-purple-400 font-semibold tracking-wider uppercase">
              Interactive Quiz Platform
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
          <Link
            to="/quizzes"
            className={`flex items-center gap-1.5 transition-colors ${
              isActive('/quizzes') ? 'text-purple-400 font-semibold' : 'hover:text-purple-400'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" /> Browse Quizzes
          </Link>

          {user && (
            <>
              {user.role === 'student' && (
                <Link
                  to="/my-attempts"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isActive('/my-attempts') ? 'text-purple-400 font-semibold' : 'hover:text-purple-400'
                  }`}
                >
                  <History className="w-4 h-4 text-indigo-400" /> My History
                </Link>
              )}

              {(user.role === 'teacher' || user.role === 'admin') && (
                <Link
                  to="/teacher/dashboard"
                  className={`flex items-center gap-1.5 transition-colors ${
                    isActive('/teacher/dashboard') ? 'text-purple-400 font-semibold' : 'hover:text-purple-400'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" /> Teacher Portal
                </Link>
              )}
            </>
          )}
        </div>

        {/* Auth Buttons / User Profile */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left hidden sm:flex">
                  <span className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] text-purple-400 font-mono capitalize">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-purple-400" /> Profile Settings
                  </Link>

                  {user.role === 'student' && (
                    <Link
                      to="/my-attempts"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-400" /> Attempt History
                    </Link>
                  )}

                  {(user.role === 'teacher' || user.role === 'admin') && (
                    <Link
                      to="/teacher/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" /> Teacher Portal
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors mt-1 border-t border-slate-800/80"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
