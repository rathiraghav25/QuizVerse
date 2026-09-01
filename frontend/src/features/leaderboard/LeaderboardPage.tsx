import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Clock, Award, ArrowLeft, Users } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { analyticsService } from '../../services/analytics';
import type { QuizLeaderboardResponse } from '../../types';

export const LeaderboardPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState<QuizLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    if (!quizId) return;
    try {
      setLoading(true);
      const data = await analyticsService.getLeaderboard(Number(quizId));
      setLeaderboard(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [quizId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !leaderboard) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="p-8 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-center max-w-md">
            <h3 className="text-lg font-bold text-rose-300">Leaderboard Error</h3>
            <p className="text-xs text-rose-400/80 mt-2 mb-6">{error}</p>
            <button
              onClick={() => navigate('/quizzes')}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-xs font-semibold rounded-xl"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const rankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Award className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-xs font-mono font-bold text-slate-400">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <button
          onClick={() => navigate('/quizzes')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </button>

        {/* Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-900/40 text-center mb-8 relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 w-fit mx-auto mb-3 shadow-lg shadow-purple-500/20">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{leaderboard.quiz_title} Leaderboard</h1>
          <p className="text-xs text-slate-400 mt-1">Top student scores and completion speed rankings</p>
        </div>

        {/* Entries List */}
        {leaderboard.entries.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-2xl bg-slate-900/40 border border-slate-800">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No Completed Attempts Yet</h3>
            <p className="text-xs text-slate-500 mt-1">Be the first to complete this quiz and claim rank #1!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.entries.map((entry) => (
              <motion.div
                key={entry.attempt_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4 transition-colors ${
                  entry.rank === 1
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/30'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    {rankBadge(entry.rank)}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{entry.user_name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Completed: {new Date(entry.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-purple-400 block">{entry.percentage}%</span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" /> {formatSeconds(entry.time_taken_seconds)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
