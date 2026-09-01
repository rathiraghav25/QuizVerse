import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  BookOpen, 
  HelpCircle, 
  BarChart2, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  FolderPlus, 
  Clock
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { quizService } from '../../services/quizzes';
import { categoryService } from '../../services/categories';
import type { Quiz, Category } from '../../types';

export const TeacherDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catCreating, setCatCreating] = useState(false);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [quizData, catData] = await Promise.all([
        quizService.listQuizzes({ page: 1, page_size: 100 }),
        categoryService.listCategories(),
      ]);
      setQuizzes(quizData.items);
      setCategories(catData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load teacher portal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTogglePublish = async (quiz: Quiz) => {
    try {
      const updated = await quizService.togglePublish(quiz.id, !quiz.is_published);
      setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? updated : q)));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update publish status.');
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await quizService.deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete quiz.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setCatCreating(true);
      const created = await categoryService.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
      });
      setCategories((prev) => [...prev, created]);
      setNewCatName('');
      setNewCatDesc('');
      setShowCategoryModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create category.');
    } finally {
      setCatCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-8 h-8 text-emerald-400" /> Teacher Portal & Quiz Manager
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Create, customize, publish quizzes, manage question banks ({categories.length} Categories), and monitor student analytics.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-xs font-semibold rounded-xl text-slate-200 flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4 text-purple-400" /> Add Category
            </button>

            <button
              onClick={() => navigate('/teacher/quizzes/new')}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create New Quiz
            </button>
          </div>
        </div>

        {/* Quizzes List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-center">
            {error}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-2xl bg-slate-900/40 border border-slate-800">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No Quizzes Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">Click below to create your first interactive quiz.</p>
            <button
              onClick={() => navigate('/teacher/quizzes/new')}
              className="px-5 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-lg"
            >
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        quiz.is_published
                          ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-400'
                          : 'bg-amber-950/60 border border-amber-800/60 text-amber-400'
                      }`}
                    >
                      {quiz.is_published ? 'Published' : 'Draft'}
                    </span>

                    {quiz.category && (
                      <span className="text-[10px] text-purple-400 font-mono bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/40">
                        {quiz.category.name}
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 capitalize font-mono">
                      {quiz.difficulty}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{quiz.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{quiz.description || 'No description'}</p>

                  <div className="flex items-center space-x-4 text-xs text-slate-500 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> {quiz.time_limit_minutes}m
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-400" /> {quiz.question_count} Questions
                    </span>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}/questions`)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-purple-300 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-purple-400" /> Questions ({quiz.question_count})
                  </button>

                  <button
                    onClick={() => navigate(`/teacher/quizzes/${quiz.id}/edit`)}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl"
                    title="Edit Details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleTogglePublish(quiz)}
                    className={`p-2 border rounded-xl transition-colors ${
                      quiz.is_published
                        ? 'bg-amber-950/40 border-amber-800/40 text-amber-400 hover:bg-amber-900/40'
                        : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/40'
                    }`}
                    title={quiz.is_published ? 'Unpublish Quiz' : 'Publish Quiz'}
                  >
                    {quiz.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <Link
                    to={`/teacher/quizzes/${quiz.id}/analytics`}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-indigo-400 rounded-xl"
                    title="View Analytics"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-rose-400 rounded-xl"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add New Category</h3>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Science, Mathematics, History"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief summary of category topics..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catCreating}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-xl shadow-lg"
                >
                  {catCreating ? 'Creating...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
