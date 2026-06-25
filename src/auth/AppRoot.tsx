import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import AdminDashboard from '@/AdminDashboard';
import { motion } from 'framer-motion';

const AppRoot = () => {
  const { user, loading, sessionToken } = useAuth();

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

  // Not authenticated → show OTP login
  if (!user || !sessionToken) {
    return <LoginPage />;
  }

  // Fully authenticated → show dashboard
  return <AdminDashboard />;
};

export default AppRoot;
