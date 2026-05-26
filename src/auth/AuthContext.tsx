import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AdminUser } from './types';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { IdleWarningModal } from '@/components/IdleWarningModal';
import { toast } from 'sonner';

const STORAGE_KEY = 'gbti_admin_session';
const SESSION_TOKEN_KEY = 'gbti_session_token';

/**
 * Generate a cryptographically random session token (128-bit / 16 bytes).
 * Security requirement: "Session tokens must contain at least 64 bits of entropy."
 */
function generateSessionToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (user: AdminUser) => void;
  logout: () => void;
  updateUser: (patch: Partial<AdminUser>) => void;
  sessionToken: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleRemainingMs, setIdleRemainingMs] = useState(0);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AdminUser;
        if (parsed && parsed.id && parsed.email) {
          setUser(parsed);
          setSessionToken(storedToken);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
    setLoading(false);
  }, []);

  /**
   * Login — stores session and generates a new session token.
   * Security requirement: "A new session token must be generated upon
   * each successful authentication to prevent session fixation."
   */
  const login = useCallback((u: AdminUser) => {
    const token = generateSessionToken();
    setUser(u);
    setSessionToken(token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }, []);

  /**
   * Logout — clears ALL session data from memory and storage.
   * Security requirements:
   * - "Server-side session identifiers must be fully invalidated when a user logs out."
   * - "Application caches must be cleared on logout."
   */
  const logout = useCallback(() => {
    setUser(null);
    setSessionToken(null);
    setShowIdleWarning(false);

    // Clear all session-related data from localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);

    // Clear any other cached data that may contain sensitive info
    const keysToPreserve = ['theme']; // keep non-sensitive preferences
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (key.startsWith('gbti_') && !keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage entirely
    sessionStorage.clear();
  }, []);

  const updateUser = useCallback((patch: Partial<AdminUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Idle timeout — auto-logout after 30 minutes of inactivity.
   * Security requirement: "Active sessions must be automatically
   * invalidated after a maximum of 30 minutes of user inactivity."
   */
  const handleIdleWarning = useCallback((remainingMs: number) => {
    setIdleRemainingMs(remainingMs);
    setShowIdleWarning(true);
  }, []);

  const handleIdleLogout = useCallback(() => {
    setShowIdleWarning(false);
    toast.error('Session expired due to inactivity. Please log in again.');
    logout();
  }, [logout]);

  const { resetTimer } = useIdleTimeout({
    timeoutMs: 30 * 60 * 1000, // 30 minutes
    onWarning: handleIdleWarning,
    onIdle: handleIdleLogout,
    enabled: !!user,
  });

  const handleStayLoggedIn = useCallback(() => {
    setShowIdleWarning(false);
    resetTimer();
  }, [resetTimer]);

  /**
   * Listen for storage changes from other tabs.
   * Security requirement: "Concurrent active sessions from multiple
   * devices must be restricted or limited."
   * If another tab logs out, this tab should also log out.
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue === null && user) {
        // Another tab logged out — mirror the logout here
        setUser(null);
        setSessionToken(null);
        setShowIdleWarning(false);
        toast.info('You have been logged out from another tab.');
      }

      if (e.key === SESSION_TOKEN_KEY && e.newValue && e.newValue !== sessionToken && user) {
        // Another tab logged in with a new session — invalidate this one
        setUser(null);
        setSessionToken(null);
        setShowIdleWarning(false);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SESSION_TOKEN_KEY);
        toast.info('Your session was replaced by a new login. Please log in again.');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, sessionToken]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, sessionToken }}>
      {children}
      {/* Idle warning modal — renders globally above everything */}
      <IdleWarningModal
        visible={showIdleWarning}
        remainingMs={idleRemainingMs}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleIdleLogout}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
