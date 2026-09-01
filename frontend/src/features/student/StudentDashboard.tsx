import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  Trophy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { quizService } from '../../services/quizzes';
import { categoryService } from '../../services/categories';
import { attemptService } from '../../services/attempts';
import type { Quiz, Category, QuizDifficulty } from '../../types';

export const StudentDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuizDifficulty | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startingQuizId, setStartingQuizId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      const data = await categoryService.listCategories();
      setCategories(data);
    } catch {
      // Non-critical
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await quizService.listQuizzes({
        page,
        page_size: 9,
        search: search || undefined,
        category_id: selectedCategory,
        difficulty: selectedDifficulty,
        is_published: true,
      });
      setQuizzes(res.items);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [page, search, selectedCategory, selectedDifficulty]);

  const handleStartAttempt = async (quizId: number) => {
    try {
      setStartingQuizId(quizId);
      const attempt = await attemptService.startAttempt(quizId);
      navigate(`/attempts/${attempt.id}/play`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start quiz attempt.');
    } finally {
      setStartingQuizId(null);
    }
  };

  const difficultyColor = (diff: QuizDifficulty) => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40';
      case 'medium':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/40';
      case 'hard':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-8 h-8 text-purple-400" /> Browse & Take Quizzes
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Select a quiz below to test your knowledge with real-time scoring and instant feedback.
            </p>
          </div>

          <button
            onClick={() => navigate('/my-attempts')}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-colors flex items-center gap-2 w-fit"
          >
            <Trophy className="w-4 h-4 text-amber-400" /> View My Attempt History
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search quiz title..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedDifficulty || ''}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value ? (e.target.value as QuizDifficulty) : undefined);
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Quizzes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-56 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse p-6" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-center">
            {error}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-2xl bg-slate-900/40 border border-slate-800">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No Published Quizzes Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${difficultyColor(
                        quiz.difficulty
                      )}`}
                    >
                      {quiz.difficulty}
                    </span>
                    {quiz.category && (
                      <span className="text-[10px] text-purple-400 font-mono bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/40 truncate max-w-[120px]">
                        {quiz.category.name}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {quiz.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> {quiz.time_limit_minutes}m
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-400" /> {quiz.question_count} Qs
                    </span>
                  </div>

                  <button
                    onClick={() => handleStartAttempt(quiz.id)}
                    disabled={startingQuizId === quiz.id}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {startingQuizId === quiz.id ? (
                      'Starting...'
                    ) : (
                      <>
                        Start <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-3 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-850"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>

            <span className="text-xs text-slate-400 font-mono">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-850"
            >
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
