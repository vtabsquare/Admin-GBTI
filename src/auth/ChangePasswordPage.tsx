import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

const ChangePasswordPage = () => {
  const { user, updateUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('change_admin_password', {
        p_user_id: user.id,
        p_new_password: newPassword,
      });

      if (error) {
        toast.error('Failed to change password: ' + error.message);
        setLoading(false);
        return;
      }

      if (data) {
        updateUser({ must_change_password: false });
        toast.success('Password changed successfully!');
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-clay/5 blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[10%] w-[50%] h-[50%] rounded-full bg-clay/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-clay to-clay/80 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-clay/20"
          >
            <ShieldCheck size={28} className="text-white" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            Create New Password
          </h1>
          <p className="text-white/40 text-sm mt-1">
            You must change your temporary password before continuing
          </p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-surface/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2 block">
                New Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder:text-white/20 outline-none focus:border-clay/50 focus:bg-white/[0.08] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder:text-white/20 outline-none focus:border-clay/50 focus:bg-white/[0.08] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">Password Requirements</p>
              <div className="space-y-1">
                <p className={`text-xs ${newPassword.length >= 8 ? 'text-green-400' : 'text-white/30'}`}>
                  {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                </p>
                <p className={`text-xs ${newPassword && newPassword === confirmPassword ? 'text-green-400' : 'text-white/30'}`}>
                  {newPassword && newPassword === confirmPassword ? '✓' : '○'} Passwords match
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              id="change-password-submit"
              type="submit"
              disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-clay to-clay/90 text-white text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-clay/20"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
                  className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                />
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Set New Password
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ChangePasswordPage;
