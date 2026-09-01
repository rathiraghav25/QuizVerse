import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { History, Trophy, Clock, ChevronRight } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { attemptService } from '../../services/attempts';
import type { AttemptSummaryResponse } from '../../types';

export const AttemptHistoryPage: React.FC = () => {
  const [attempts, setAttempts] = useState<AttemptSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const data = await attemptService.getMyAttempts();
      setAttempts(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load attempt history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <History className="w-8 h-8 text-indigo-400" /> My Quiz Attempt History
            </h1>
            <p className="text-sm text-slate-400 mt-1">Review past scores, accuracy, and test performances</p>
          </div>

          <button
            onClick={() => navigate('/quizzes')}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold rounded-xl"
          >
            Take New Quiz
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-center">
            {error}
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-2xl bg-slate-900/40 border border-slate-800">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No Attempts Found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">You haven't completed any quizzes yet.</p>
            <Link
              to="/quizzes"
              className="px-5 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-lg"
            >
              Explore Quizzes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((att) => (
              <motion.div
                key={att.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{att.quiz_title}</h3>
                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> {formatSeconds(att.time_taken_seconds)}
                    </span>
                    <span>•</span>
                    <span>Started: {new Date(att.started_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-purple-400 block">{att.percentage}%</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {att.correct_answers} / {att.total_questions} Correct
                    </span>
                  </div>

                  <Link
                    to={`/attempts/${att.id}/result`}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-purple-400 hover:border-purple-500/40 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
