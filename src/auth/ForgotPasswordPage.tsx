import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, KeyRound, Lock, Eye, EyeOff, Send } from 'lucide-react';

const INFOBIP_API_KEY = import.meta.env.VITE_INFOBIP_API_KEY;
const INFOBIP_BASE_URL = import.meta.env.VITE_INFOBIP_BASE_URL;
const INFOBIP_SENDER_EMAIL = import.meta.env.VITE_INFOBIP_SENDER_EMAIL;
const INFOBIP_SENDER_NAME = import.meta.env.VITE_INFOBIP_SENDER_NAME || 'GBTI Architectural Team';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

const ForgotPasswordPage = ({ onBack }: ForgotPasswordPageProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('admin-api', {
        body: { action: 'set_admin_reset_code', payload: { email: email.trim() } },
      });

      if (error || result?.error) {
        toast.error('Failed to send reset code: ' + (result?.error || error?.message));
        setLoading(false);
        return;
      }

      const data = result?.data;

      if (!data) {
        // Don't reveal if email exists or not for security
        toast.success('If an account exists with this email, a reset code has been sent.');
        setStep(2);
        setLoading(false);
        return;
      }

      // Send email via Infobip
      if (INFOBIP_API_KEY && INFOBIP_BASE_URL && INFOBIP_SENDER_EMAIL) {
        try {
          const form = new FormData();
          form.append('from', `${INFOBIP_SENDER_NAME} <${INFOBIP_SENDER_EMAIL}>`);
          form.append('to', email.trim());
          form.append('subject', 'GBTI Admin — Password Reset Code');
          form.append('html', `
            <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;max-width:560px;margin:0 auto;padding:32px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#b8956a,#a07850);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:20px;">G</div>
              </div>
              <h2 style="text-align:center;margin:0 0 8px;color:#111;font-size:20px;">Password Reset Code</h2>
              <p style="text-align:center;color:#6b7280;margin:0 0 24px;font-size:14px;">Use the code below to reset your GBTI Admin password</p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111;">${data}</span>
              </div>
              <p style="text-align:center;color:#9ca3af;font-size:12px;margin:0;">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;"/>
              <p style="text-align:center;font-size:11px;color:#9ca3af;">GBTI Architectural Team</p>
            </div>
          `);
          form.append('text', `Your GBTI Admin password reset code is: ${data}\n\nThis code expires in 15 minutes.\nIf you did not request this, please ignore this email.\n\n-- GBTI Architectural Team`);
          await fetch(`${INFOBIP_BASE_URL}/email/3/send`, {
            method: 'POST',
            headers: { Authorization: `App ${INFOBIP_API_KEY}` },
            body: form,
          });
        } catch {
          // Email send failed but code is set — user can still try
          console.error('Infobip email send failed');
        }
      }

      toast.success('Reset code sent! Check your email.');
      setStep(2);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const verifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter the reset code');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('admin-api', {
        body: {
          action: 'verify_admin_reset_code',
          payload: { email: email.trim(), code: code.trim(), new_password: newPassword },
        },
      });

      if (error || result?.error) {
        toast.error('Reset failed: ' + (result?.error || error?.message));
        setLoading(false);
        return;
      }

      const data = result?.data;
      if (data) {
        toast.success('Password reset successfully! Please sign in.');
        onBack();
      } else {
        toast.error('Invalid or expired reset code. Please try again.');
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
            <KeyRound size={28} className="text-white" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {step === 1
              ? 'Enter your email to receive a reset code'
              : 'Enter the code sent to your email'}
          </p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-surface/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
        >
          {step === 1 ? (
            <form onSubmit={sendResetCode} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder:text-white/20 outline-none focus:border-clay/50 focus:bg-white/[0.08] transition-all duration-300"
                  />
                </div>
              </div>

              <button
                id="send-reset-code"
                type="submit"
                disabled={loading || !email.trim()}
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
                    <Send size={16} />
                    Send Reset Code
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyAndReset} className="space-y-5">
              {/* Reset Code */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2 block">
                  6-Digit Code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full text-center text-2xl font-display font-bold tracking-[0.5em] px-4 py-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/15 outline-none focus:border-clay/50 focus:bg-white/[0.08] transition-all duration-300"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2 block">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    id="reset-new-password"
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
                    id="reset-confirm-password"
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

              <button
                id="reset-password-submit"
                type="submit"
                disabled={loading || code.length !== 6 || newPassword.length < 8 || newPassword !== confirmPassword}
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
                    <KeyRound size={16} />
                    Reset Password
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setCode(''); setNewPassword(''); setConfirmPassword(''); }}
                className="w-full text-xs text-white/30 hover:text-white/50 transition-colors text-center py-1"
              >
                Didn't receive the code? Go back to resend
              </button>
            </form>
          )}

          {/* Back to login */}
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Sign In
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
