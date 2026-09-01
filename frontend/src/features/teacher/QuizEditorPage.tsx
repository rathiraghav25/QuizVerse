import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { quizService } from '../../services/quizzes';
import { categoryService } from '../../services/categories';
import type { Category, QuizDifficulty } from '../../types';

export const QuizEditorPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const isEditing = Boolean(quizId);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoriesAndQuiz = async () => {
    try {
      setLoading(true);
      const catData = await categoryService.listCategories();
      setCategories(catData);

      if (isEditing && quizId) {
        const quiz = await quizService.getQuiz(Number(quizId));
        setTitle(quiz.title);
        setDescription(quiz.description || '');
        setCategoryId(quiz.category_id);
        setDifficulty(quiz.difficulty);
        setTimeLimitMinutes(quiz.time_limit_minutes);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load quiz details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndQuiz();
  }, [quizId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      if (isEditing && quizId) {
        await quizService.updateQuiz(Number(quizId), {
          title: title.trim(),
          description: description.trim() || undefined,
          category_id: categoryId,
          difficulty,
          time_limit_minutes: Number(timeLimitMinutes),
        });
        navigate('/teacher/dashboard');
      } else {
        const created = await quizService.createQuiz({
          title: title.trim(),
          description: description.trim() || undefined,
          category_id: categoryId,
          difficulty,
          time_limit_minutes: Number(timeLimitMinutes),
        });
        navigate(`/teacher/quizzes/${created.id}/questions`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error saving quiz details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        <button
          onClick={() => navigate('/teacher/dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl"
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            {isEditing ? 'Edit Quiz Details' : 'Create New Quiz'}
          </h2>
          <p className="text-xs text-slate-400 mb-6">Set up title, category, difficulty rank, and time limits</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quiz Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Data Structures & Algorithms Exam"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of quiz coverage, rules, or prerequisites..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500 placeholder:text-slate-600 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                >
                  <option value="">No Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuizDifficulty)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Time Limit (Minutes)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => navigate('/teacher/dashboard')}
                className="px-4 py-2.5 bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Next: Add Questions'}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};
