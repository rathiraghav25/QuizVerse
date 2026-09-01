import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  HelpCircle, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  ArrowUp, 
  ArrowDown
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { quizService } from '../../services/quizzes';
import { questionService } from '../../services/questions';
import type { Quiz, Question } from '../../types';

export const QuestionManagerPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Question Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [qText, setQText] = useState('');
  const [qImageUrl, setQImageUrl] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [options, setOptions] = useState<{ option_text: string; is_correct: boolean }[]>([
    { option_text: '', is_correct: true },
    { option_text: '', is_correct: false },
  ]);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const fetchQuizAndQuestions = async () => {
    if (!quizId) return;
    try {
      setLoading(true);
      const [quizData, qData] = await Promise.all([
        quizService.getQuiz(Number(quizId)),
        questionService.getQuizQuestions(Number(quizId)),
      ]);
      setQuiz(quizData);
      setQuestions(qData);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to load question manager.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizAndQuestions();
  }, [quizId]);

  const openAddModal = () => {
    setEditingQuestion(null);
    setQText('');
    setQImageUrl('');
    setQExplanation('');
    setOptions([
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
    ]);
    setShowModal(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setQText(q.text);
    setQImageUrl(q.image_url || '');
    setQExplanation(q.explanation || '');
    setOptions(
      q.options.map((opt) => ({
        option_text: opt.option_text,
        is_correct: Boolean(opt.is_correct),
      }))
    );
    setShowModal(true);
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const next = [...options];
    next[index].option_text = text;
    setOptions(next);
  };

  const handleSetCorrectOption = (index: number) => {
    const next = options.map((opt, i) => ({
      ...opt,
      is_correct: i === index,
    }));
    setOptions(next);
  };

  const handleAddOptionField = () => {
    setOptions([...options, { option_text: '', is_correct: false }]);
  };

  const handleRemoveOptionField = (index: number) => {
    if (options.length <= 2) {
      alert('A question must have at least 2 options.');
      return;
    }
    const isRemovingCorrect = options[index].is_correct;
    const next = options.filter((_, i) => i !== index);
    if (isRemovingCorrect && next.length > 0) {
      next[0].is_correct = true;
    }
    setOptions(next);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizId || !qText.trim()) return;

    // Validate options
    const validOptions = options.filter((opt) => opt.option_text.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please fill out at least 2 options.');
      return;
    }

    const correctCount = validOptions.filter((opt) => opt.is_correct).length;
    if (correctCount !== 1) {
      alert('Please select exactly 1 correct option.');
      return;
    }

    try {
      setSavingQuestion(true);
      const payload = {
        text: qText.trim(),
        image_url: qImageUrl.trim() || undefined,
        explanation: qExplanation.trim() || undefined,
        order: editingQuestion ? editingQuestion.order : questions.length + 1,
        options: validOptions.map((opt) => ({
          option_text: opt.option_text.trim(),
          is_correct: opt.is_correct,
        })),
      };

      if (editingQuestion) {
        await questionService.updateQuestion(editingQuestion.id, payload);
      } else {
        await questionService.addQuestion(Number(quizId), payload);
      }

      setShowModal(false);
      fetchQuizAndQuestions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save question.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await questionService.deleteQuestion(questionId);
      fetchQuizAndQuestions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete question.');
    }
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const reordered = [...questions];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const ordersPayload = reordered.map((q, idx) => ({
      question_id: q.id,
      order: idx + 1,
    }));

    try {
      const updated = await questionService.reorderQuestions(Number(quizId), ordersPayload);
      setQuestions(updated);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reorder questions.');
    }
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <button
          onClick={() => navigate('/teacher/dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <span className="text-xs text-purple-400 font-mono">Quiz #{quiz.id} Question Bank</span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{quiz.title}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Total Questions: {questions.length} • {quiz.is_published ? 'Published' : 'Draft'}
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-2xl bg-slate-900/40 border border-slate-800">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No Questions Added Yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">Add at least one question before publishing this quiz.</p>
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-lg"
            >
              Add First Question
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-400 text-xs font-bold font-mono flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-white">{q.text}</h3>
                  </div>

                  {/* Move Up/Down & Action Buttons */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-20 hover:border-slate-700"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      disabled={idx === questions.length - 1}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-20 hover:border-slate-700"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                    <button
                      onClick={() => openEditModal(q)}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 ml-2"
                      title="Edit Question"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-rose-400"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {q.image_url && (
                  <img
                    src={q.image_url}
                    alt="Question visual media"
                    className="max-h-40 rounded-xl border border-slate-800 object-contain"
                  />
                )}

                {/* Options Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {q.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        opt.is_correct
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-semibold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>{opt.option_text}</span>
                      {opt.is_correct && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <p className="text-xs text-purple-300 bg-purple-950/20 p-3 rounded-xl border border-purple-900/30 font-mono">
                    Explanation: {q.explanation}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Question Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingQuestion ? 'Edit Question' : 'Add New MCQ Question'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Question Text *</label>
                <textarea
                  rows={3}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. What is the time complexity of QuickSort in worst case?"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={qImageUrl}
                  onChange={(e) => setQImageUrl(e.target.value)}
                  placeholder="https://example.com/diagram.png"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* MCQ Options List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    MCQ Options (Select the 1 Correct Radio) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="text-[11px] font-semibold text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Option Field
                  </button>
                </div>

                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={opt.is_correct}
                        onChange={() => handleSetCorrectOption(idx)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-800"
                        title="Mark as correct option"
                      />
                      <input
                        type="text"
                        required
                        value={opt.option_text}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Explanation (Optional)</label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Explain why the selected option is correct..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-xl shadow-lg"
                >
                  {savingQuestion ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
