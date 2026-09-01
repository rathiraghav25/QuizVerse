import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2, XCircle, ArrowLeft, BarChart2 } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { attemptService } from '../../services/attempts';
import type { AttemptResultResponse } from '../../types';

export const QuizResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<AttemptResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResult = async () => {
    if (!attemptId) return;
    try {
      setLoading(true);
      const data = await attemptService.getAttemptResult(Number(attemptId));
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load attempt results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Calculating Quiz Score...</span>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="p-8 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-center max-w-md">
            <h3 className="text-lg font-bold text-rose-300">Result Load Error</h3>
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Score Banner Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-900/40 shadow-2xl text-center relative overflow-hidden mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/40 border border-purple-700/40 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Trophy className="w-4 h-4 text-amber-400" /> Quiz Completed
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{result.quiz_title}</h1>
          <p className="text-xs text-slate-400">Detailed accuracy breakdown and answer explanations</p>

          {/* Big Percentage Dial */}
          <div className="my-8 flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-1 shadow-2xl shadow-purple-600/30 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{result.percentage}%</span>
                <span className="text-[10px] text-purple-400 font-semibold uppercase">Accuracy</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-left">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Correct</span>
              <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                {result.correct_answers} / {result.total_questions}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Time Taken</span>
              <span className="text-sm font-bold text-indigo-400 block mt-0.5">
                {formatSeconds(result.time_taken_seconds)}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Score</span>
              <span className="text-sm font-bold text-purple-400 block mt-0.5">
                {result.score} pts
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => navigate('/quizzes')}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-semibold rounded-xl text-slate-300 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Quizzes
            </button>

            <Link
              to={`/quizzes/${result.quiz_id}/leaderboard`}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
            >
              <BarChart2 className="w-4 h-4" /> View Leaderboard
            </Link>
          </div>
        </motion.div>

        {/* Detailed Question Explanations */}
        {result.answer_details && result.answer_details.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Question Review & Explanations
            </h3>

            {result.answer_details.map((detail, idx) => (
              <div
                key={detail.question_id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400">Q{idx + 1}.</span>
                    <h4 className="text-sm font-bold text-white">{detail.question_text}</h4>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold flex items-center gap-1.5 shrink-0 ${
                      detail.is_correct
                        ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400'
                        : 'bg-rose-950/60 border-rose-800/40 text-rose-400'
                    }`}
                  >
                    {detail.is_correct ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </>
                    )}
                  </span>
                </div>

                {detail.image_url && (
                  <img
                    src={detail.image_url}
                    alt="Question media"
                    className="max-h-48 rounded-xl border border-slate-800 object-contain"
                  />
                )}

                {/* Options Review */}
                <div className="space-y-2 pt-2">
                  {detail.options.map((opt) => {
                    const isUserSelected = detail.selected_option_id === opt.id;
                    const isCorrectOpt = detail.correct_option_id === opt.id;

                    let optionStyle = 'bg-slate-950/60 border-slate-800 text-slate-300';
                    if (isCorrectOpt) {
                      optionStyle = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200';
                    } else if (isUserSelected && !isCorrectOpt) {
                      optionStyle = 'bg-rose-950/40 border-rose-500/50 text-rose-200';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optionStyle}`}
                      >
                        <span>{opt.option_text}</span>

                        <div className="flex items-center space-x-2">
                          {isUserSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                              Your Choice
                            </span>
                          )}
                          {isCorrectOpt && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono font-semibold">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {detail.explanation && (
                  <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/30 text-xs text-purple-300">
                    <strong className="font-semibold block mb-1">Explanation:</strong>
                    {detail.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
