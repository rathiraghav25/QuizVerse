import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BrainCircuit, 
  Timer, 
  BarChart3, 
  ShieldCheck, 
  CheckCircle2, 
  Server, 
  Activity, 
  ArrowRight,
  GraduationCap,
  Users
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { checkHealth, type HealthCheckResponse } from '../../services/api';

export const LandingPage: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    const verifyApiConnection = async () => {
      try {
        setLoadingHealth(true);
        const data = await checkHealth();
        setHealth(data);
        setHealthError(null);
      } catch (err: any) {
        setHealthError(err.message || 'Unable to connect to backend server');
      } finally {
        setLoadingHealth(false);
      }
    };

    verifyApiConnection();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/60 border border-purple-800/50 text-purple-300 text-xs font-semibold tracking-wide uppercase shadow-lg shadow-purple-950/40"
              >
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                Production-Ready Quiz Engine & Analytics
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight"
              >
                Next-Gen Knowledge Testing with{' '}
                <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
                  QuizVerse
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed"
              >
                Create, customize, and deliver timed quizzes with real-time analytics, automated scoring, and interactive student performance metrics.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
              >
                <button className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-3 group">
                  Explore Quizzes
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-200 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850 hover:border-slate-700 transition-colors flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Teacher Portal
                </button>
              </motion.div>
            </div>

            {/* Live Backend Connection Status Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-16 max-w-2xl mx-auto p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <Server className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Backend API Health Status</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-xs text-slate-400 font-mono">FastAPI v1</span>
                </div>
              </div>

              {loadingHealth ? (
                <div className="py-4 text-center text-slate-400 text-sm animate-pulse">
                  Connecting to QuizVerse FastAPI service...
                </div>
              ) : healthError ? (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 text-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Backend Server Offline / Unreachable</p>
                    <p className="text-xs text-amber-400/80 mt-1">{healthError}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-900/60 text-xs font-mono">
                    http://localhost:8000
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Status</span>
                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {health?.status}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Database</span>
                    <span className="text-sm font-bold text-indigo-400 mt-0.5 block truncate">
                      {health?.database}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Environment</span>
                    <span className="text-sm font-bold text-purple-400 mt-0.5 block capitalize">
                      {health?.environment}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Version</span>
                    <span className="text-sm font-mono font-semibold text-slate-300 mt-0.5 block">
                      v{health?.version}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-16 bg-slate-950/60 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl font-bold text-white">Built for Performance & Scale</h2>
              <p className="text-slate-400 mt-3 text-sm">
                Clean Architecture on backend with React & Tailwind frontend.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-colors group">
                <div className="p-3.5 rounded-xl bg-purple-950/60 text-purple-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                  <BrainCircuit className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Interactive Quiz Engine</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Support for MCQ options, randomized question orders, image attachments, and instant scoring upon submission.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-colors group">
                <div className="p-3.5 rounded-xl bg-indigo-950/60 text-indigo-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                  <Timer className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Real-Time Timed Exams</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Strict server-enforced quiz timers with auto-submit capabilities to ensure standardized assessment conditions.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-pink-500/40 transition-colors group">
                <div className="p-3.5 rounded-xl bg-pink-950/60 text-pink-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Comprehensive Analytics</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Leaderboards, score distribution curves, attempt accuracy histories, and actionable learning insights.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section id="roles" className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="p-8 rounded-2xl bg-gradient-to-b from-purple-950/30 to-slate-900 border border-purple-900/40">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-purple-600 text-white">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Admin / Teacher Role</h3>
                </div>
                <ul className="space-y-3 text-slate-300 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <span>Create, update, and publish custom quizzes with category filters.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <span>Manage question bank, upload media assets, and set difficulty ranks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <span>View class performance analytics, average scores, and student logs.</span>
                  </li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-b from-indigo-950/30 to-slate-900 border border-indigo-900/40">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 rounded-xl bg-indigo-600 text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Student Role</h3>
                </div>
                <ul className="space-y-3 text-slate-300 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <span>Browse, filter, and attempt timed quizzes across various categories.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <span>Instant score feedback, question review explanations, and accuracy stats.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <span>Track progress history and compete on global and quiz-level leaderboards.</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 QuizVerse Platform. Portfolio Engineering Project.</p>
          <div className="flex items-center space-x-4">
            <span className="text-purple-400 font-mono">FastAPI</span>
            <span>•</span>
            <span className="text-indigo-400 font-mono">React + TS</span>
            <span>•</span>
            <span className="text-pink-400 font-mono">Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
