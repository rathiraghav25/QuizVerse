import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart3, Users, CheckCircle2, Award, Clock, ArrowLeft } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Navbar } from '../../components/common/Navbar';
import { analyticsService } from '../../services/analytics';
import type { QuizAnalyticsResponse } from '../../types';

export const QuizAnalyticsPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<QuizAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!quizId) return;
    try {
      setLoading(true);
      const data = await analyticsService.getAnalytics(Number(quizId));
      setAnalytics(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load quiz analytics dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [quizId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="p-8 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-center max-w-md">
            <h3 className="text-lg font-bold text-rose-300">Analytics Error</h3>
            <p className="text-xs text-rose-400/80 mt-2 mb-6">{error}</p>
            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-xs font-semibold rounded-xl"
            >
              Back to Teacher Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.round(sec % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const chartData = analytics.question_analytics.map((q) => ({
    name: `Q${q.order}`,
    accuracy: q.accuracy_percentage,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <button
          onClick={() => navigate('/teacher/dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header Bar */}
        <div className="border-b border-slate-800 pb-6 mb-8">
          <span className="text-xs text-purple-400 font-mono">Quiz Analytics & Class Performance</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{analytics.quiz_title}</h1>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center space-x-2 text-purple-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Attempts</span>
            </div>
            <span className="text-2xl font-extrabold text-white">{analytics.total_attempts}</span>
            <span className="text-[10px] text-slate-500 block mt-1">
              {analytics.completed_attempts} completed ({analytics.completion_rate}%)
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-400 mb-2">
              <Award className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-400 uppercase">Average Score</span>
            </div>
            <span className="text-2xl font-extrabold text-white">{analytics.average_score}%</span>
            <span className="text-[10px] text-slate-500 block mt-1">Class mean accuracy</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-400 mb-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-400 uppercase">Score Range</span>
            </div>
            <span className="text-2xl font-extrabold text-white">
              {analytics.highest_score}% <span className="text-xs text-slate-500 font-normal">high</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Lowest: {analytics.lowest_score}%</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center space-x-2 text-amber-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-400 uppercase">Avg Time Taken</span>
            </div>
            <span className="text-2xl font-extrabold text-white">
              {formatSeconds(analytics.average_time_taken_seconds)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Average duration</span>
          </div>
        </div>

        {/* Recharts Accuracy Graph */}
        {chartData.length > 0 && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 mb-8">
            <h3 className="text-sm font-bold text-white mb-6">Question Accuracy Graph (%)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.accuracy >= 70 ? '#10b981' : entry.accuracy >= 40 ? '#f59e0b' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Detailed Question Analytics Breakdown */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
            Question-by-Question Accuracy Metrics
          </h3>

          {analytics.question_analytics.map((q) => (
            <div key={q.question_id} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-purple-400 font-bold">Question {q.order}</span>
                  <h4 className="text-sm font-bold text-white mt-1">{q.question_text}</h4>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-emerald-400 block">
                    {q.accuracy_percentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {q.correct_answers} / {q.total_answers} correct
                  </span>
                </div>
              </div>

              {/* Option Selections Breakdown */}
              <div className="space-y-2 pt-2">
                {q.options.map((opt) => (
                  <div
                    key={opt.option_id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      opt.is_correct
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{opt.option_text}</span>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-slate-300">
                        {opt.selection_count} picks ({opt.selection_percentage}%)
                      </span>
                      {opt.is_correct && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
