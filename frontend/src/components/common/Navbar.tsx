import React from 'react';
import { Sparkles, Trophy, BookOpen, User, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-lg shadow-purple-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
              QuizVerse
            </span>
            <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">
              Interactive Quiz Platform
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" /> Features
          </a>
          <a href="#quizzes" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-400" /> Quizzes
          </a>
          <a href="#roles" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> User Roles
          </a>
        </div>

        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Log In
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 flex items-center gap-2">
            <User className="w-4 h-4" /> Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};
