import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, Save, Send } from 'lucide-react';
import { attemptService } from '../../services/attempts';
import type { AttemptStartResponse, SaveAnswerItem } from '../../types';

export const QuizPlayerPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<AttemptStartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timerRef = useRef<any>(null);

  const fetchAttempt = async () => {
    if (!attemptId) return;
    try {
      setLoading(true);
      // We can fetch via startAttempt or get attempt details
      const data = await attemptService.startAttempt(Number(attemptId));
      if (data.is_completed) {
        navigate(`/attempts/${attemptId}/result`);
        return;
      }
      setAttempt(data);
      setAnswers(data.current_answers || {});

      // Calculate time remaining
      const startedAtMs = new Date(data.started_at).getTime();
      const limitMs = data.time_limit_minutes * 60 * 1000;
      const expiresAtMs = startedAtMs + limitMs;
      const nowMs = Date.now();
      const remainingSec = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
      setTimeLeftSeconds(remainingSec);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to load attempt.');
      navigate('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeftSeconds <= 0 || !attempt || attempt.is_completed) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeftSeconds, attempt]);

  const handleSelectOption = (questionId: number, optionId: number) => {
    const updated = { ...answers, [questionId]: optionId };
    setAnswers(updated);
    triggerAutosave(updated);
  };

  const triggerAutosave = async (currentAnswersMap: Record<number, number | null>) => {
    if (!attemptId) return;
    try {
      setSaving(true);
      const items: SaveAnswerItem[] = Object.entries(currentAnswersMap).map(([qId, optId]) => ({
        question_id: Number(qId),
        selected_option_id: optId,
      }));
      await attemptService.saveAnswers(Number(attemptId), items);
    } catch {
      // Background autosave retry silently
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting || !attemptId) return;
    setSubmitting(true);
    try {
      const items: SaveAnswerItem[] = Object.entries(answers).map(([qId, optId]) => ({
        question_id: Number(qId),
        selected_option_id: optId,
      }));
      const res = await attemptService.submitAttempt(Number(attemptId), items);
      navigate(`/attempts/${res.id}/result`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error submitting quiz.');
    }
  };

  const handleSubmitConfirmed = async () => {
    setShowConfirmModal(false);
    await handleAutoSubmit();
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !attempt) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Preparing Quiz Player...</span>
        </div>
      </div>
    );
  }

  const currentQuestion = attempt.questions[currentIndex];
  const answeredCount = Object.values(answers).filter((v) => v !== null).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Test Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white line-clamp-1">{attempt.quiz_title}</h2>
          <span className="text-[11px] text-slate-400">
            Question {currentIndex + 1} of {attempt.questions.length} • {answeredCount} Answered
          </span>
        </div>

        <div className="flex items-center space-x-6">
          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              timeLeftSeconds < 180
                ? 'bg-rose-950/60 border-rose-800/60 text-rose-400 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-purple-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Submit Exam
          </button>
        </div>
      </header>

      {/* Main Question Display */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col justify-between">
        <div>
          {/* Question Navigator Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-8 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
            {attempt.questions.map((q, idx) => {
              const isSelected = idx === currentIndex;
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 ring-2 ring-purple-400/50'
                      : isAnswered
                      ? 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-400'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <h3 className="text-xl font-bold text-white leading-relaxed">{currentQuestion.text}</h3>
              {saving && (
                <span className="text-[10px] text-purple-400 font-mono flex items-center gap-1 shrink-0 animate-pulse">
                  <Save className="w-3 h-3" /> Autosaving...
                </span>
              )}
            </div>

            {currentQuestion.image_url && (
              <img
                src={currentQuestion.image_url}
                alt="Question media"
                className="max-h-64 rounded-xl border border-slate-800 mb-6 object-contain"
              />
            )}

            {/* Options List */}
            <div className="space-y-3.5 mt-6">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between text-sm transition-all ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-950/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <span>{opt.option_text}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-purple-400 bg-purple-600' : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Question Footer Controls */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-900">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-30 hover:bg-slate-850 flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Question
          </button>

          <button
            onClick={() => setCurrentIndex((i) => Math.min(attempt.questions.length - 1, i + 1))}
            disabled={currentIndex === attempt.questions.length - 1}
            className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-30 hover:bg-slate-850 flex items-center gap-1.5"
          >
            Next Question <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Submission Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Submit Quiz Attempt?</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              You have answered {answeredCount} out of {attempt.questions.length} questions. Are you sure you want to finish now?
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl"
              >
                Continue Test
              </button>
              <button
                onClick={handleSubmitConfirmed}
                disabled={submitting}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-purple-600/30"
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
