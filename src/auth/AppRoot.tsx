import { useState } from 'react';
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import ChangePasswordPage from './ChangePasswordPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import AdminDashboard from '@/AdminDashboard';
import { motion } from 'framer-motion';

const AppRoot = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'forgot-password'>('login');

  // Loading spinner while restoring session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
          className="w-8 h-8 border-2 border-clay/20 border-t-clay rounded-full"
        />
      </div>
    );
  }

  // Not authenticated → show login or forgot password
  if (!user) {
    if (authView === 'forgot-password') {
      return <ForgotPasswordPage onBack={() => setAuthView('login')} />;
    }
    return <LoginPage onForgotPassword={() => setAuthView('forgot-password')} />;
  }

  // Authenticated but must change password
  if (user.must_change_password) {
    return <ChangePasswordPage />;
  }

  // Fully authenticated → show dashboard
  return <AdminDashboard />;
};

export default AppRoot;
