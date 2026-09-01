import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Shield, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setSuccessMsg(null);
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const updated = await authService.updateMe({
        full_name: fullName.trim(),
        email: email.trim(),
      });
      updateUser(updated);
      setSuccessMsg('Profile information updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        <div className="border-b border-slate-800 pb-6 mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <UserIcon className="w-8 h-8 text-purple-400" /> Profile & Account Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage your personal details and account configuration</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-8"
        >
          {/* User Header Summary */}
          <div className="flex items-center space-x-4 border-b border-slate-800/80 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg shadow-purple-600/30">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[10px] font-semibold tracking-wider uppercase mt-2">
                <Shield className="w-3 h-3 text-purple-400" /> {user.role} Role
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Account Role (Non-Editable)</label>
              <input
                type="text"
                disabled
                value={user.role.toUpperCase()}
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-500 font-mono cursor-not-allowed uppercase"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Roles are managed by QuizVerse system administration.
              </span>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {submitting ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};
