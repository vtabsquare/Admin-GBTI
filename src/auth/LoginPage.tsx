import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { LogIn, Mail, Send, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const LoginPage = () => {
  const { login } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const skipDevLogin = () => {
    login({
      id: 'dev-admin-id',
      email: 'dev@gbti.com',
      display_name: 'Dev Admin',
      must_change_password: false,
    });
    toast.success('Logged in as Dev Admin!');
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const captchaToken = executeRecaptcha ? await executeRecaptcha('admin_otp') : null;
      if (!captchaToken) {
        toast.error('CAPTCHA verification failed. Please try again.');
        setLoading(false);
        return;
      }

      // Send OTP via edge function (this generates and sends the email)
      const { data, error: invokeError } = await supabase.functions.invoke('captcha-otp', {
        body: { action: 'send_admin_otp', email: email.trim(), captchaToken }
      });
      
      if (invokeError || data?.error) {
        const errorMsg = invokeError?.message || data?.error;
        if (errorMsg === 'RATE_LIMITED') {
          toast.error('Too many requests. Please try again later.');
        } else if (errorMsg === 'LOCKED') {
          toast.error('Account temporarily locked due to too many failed attempts');
        } else if (errorMsg === 'NOT_FOUND') {
          toast.error('This email is not registered as an admin');
        } else {
          toast.error(`Failed to send OTP: ${errorMsg}`);
          console.error("OTP Error Payload:", errorMsg);
        }
        setLoading(false);
        return;
      }

      toast.success('OTP sent! Check your email.');
      setStep(2);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('admin-api', {
        body: { action: 'verify_admin_login_otp', payload: { email: email.trim(), otp: otp.trim() } },
      });

      if (error || result?.error) {
        toast.error('Verification failed: ' + (result?.error || error?.message));
        setLoading(false);
        return;
      }

      const data = result?.data;

      if (!data) {
        toast.error('Invalid or expired OTP. Please try again.');
        setLoading(false);
        return;
      }

      login({
        id: data.id,
        email: data.email,
        display_name: data.display_name,
        must_change_password: false,
        sessionToken: data.session_token,
      });
      toast.success('Welcome back!');
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
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-clay to-clay/80 flex items-center justify-center text-white font-display font-bold text-2xl mx-auto mb-4 shadow-lg shadow-clay/20"
          >
            G
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="font-display text-2xl font-bold text-white tracking-tight"
          >
            GBTI Admin
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-white/40 text-sm mt-1"
          >
            {step === 1 ? 'Enter your email to receive a login OTP' : 'Enter the OTP sent to your email'}
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-surface/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
        >
          {step === 1 ? (
            <form onSubmit={sendOtp} className="space-y-5">
              {/* Email */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder:text-white/20 outline-none focus:border-clay/50 focus:bg-white/[0.08] transition-all duration-300"
                  />
                </div>
              </div>

              {/* Send OTP Button */}
              <button
                id="send-otp-submit"
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
                    Send OTP
                  </>
                )}
              </button>

              {/* Skip Dev Button */}
              <button
                type="button"
                onClick={skipDevLogin}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-white/[0.04] text-white/50 text-sm font-semibold hover:bg-white/[0.08] hover:text-white transition-all duration-300 active:scale-[0.98]"
              >
                Skip (Dev)
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-5">
              {/* Email display */}
              <div className="bg-white/[0.04] rounded-lg px-4 py-3 flex items-center gap-3">
                <Mail size={14} className="text-white/30 flex-shrink-0" />
                <span className="text-white/60 text-sm truncate">{email}</span>
              </div>

              {/* OTP Input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2 block">
                  6-Digit OTP
                </label>
                <input
                  id="login-otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full text-center text-2xl font-display font-bold tracking-[0.5em] px-4 py-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/15 outline-none focus:border-clay/50 focus:bg-white/[0.08] transition-all duration-300"
                />
              </div>

              {/* Verify Button */}
              <button
                id="verify-otp-submit"
                type="submit"
                disabled={loading || otp.length !== 6}
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
                    Verify & Sign In
                  </>
                )}
              </button>

              {/* Resend / Go back */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); }}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  <ArrowLeft size={12} />
                  Change email
                </button>
                <button
                  type="button"
                  onClick={sendOtp as any}
                  disabled={loading}
                  className="text-xs text-clay/70 hover:text-clay transition-colors disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-white/20 text-xs mt-6"
        >
          GBTI Architectural Team · Admin Panel
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
