import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Mail, Lock, User, GraduationCap, Users, AlertCircle, Sparkles } from 'lucide-react';
import { authService } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import type { UserRole } from '../../types';

export const SignupPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // 1. Create account
      await authService.signup(email, password, fullName, role);

      // 2. Auto-login
      const loginData = await authService.login(email, password);
      login(loginData.access_token, loginData.user);

      if (role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/quizzes');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative z-10"
        >
          <div className="text-center mb-8">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 w-fit mx-auto mb-4 shadow-lg shadow-purple-500/20">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Join QuizVerse</h2>
            <p className="text-xs text-slate-400 mt-1">Create an account to start taking or creating quizzes</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Account Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                    role === 'student'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-md shadow-purple-950/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                    role === 'teacher'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-md shadow-purple-950/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 text-purple-400" />
                  <span>Teacher / Creator</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alice Smith"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@quizverse.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {submitting ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 font-semibold hover:underline">
              Sign in instead
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
