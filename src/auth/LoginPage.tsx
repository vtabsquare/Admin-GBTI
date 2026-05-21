import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onForgotPassword: () => void;
}

const LoginPage = ({ onForgotPassword }: LoginPageProps) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_admin_login', {
        p_email: email.trim(),
        p_password: password,
      });

      if (error) {
        toast.error('Login failed: ' + error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        toast.error('Invalid email or password');
        setLoading(false);
        return;
      }

      login({
        id: data.id,
        email: data.email,
        display_name: data.display_name,
        must_change_password: data.must_change_password,
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
            Sign in to your account
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-surface/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Password */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder:text-white/20 outline-none focus:border-clay/50 focus:bg-white/[0.08] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-clay/80 hover:text-clay transition-colors font-medium"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
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
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>
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
