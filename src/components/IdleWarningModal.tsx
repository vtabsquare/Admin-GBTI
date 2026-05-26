import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';

/**
 * IdleWarningModal — Displays a warning modal when the user
 * is about to be logged out due to inactivity.
 *
 * Shows a countdown timer and allows the user to extend their session.
 */

interface Props {
  visible: boolean;
  remainingMs: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export const IdleWarningModal = ({ visible, remainingMs, onStayLoggedIn, onLogout }: Props) => {
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(remainingMs / 1000));

  // Countdown timer
  useEffect(() => {
    if (!visible) return;
    setSecondsLeft(Math.ceil(remainingMs / 1000));

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, remainingMs]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            className="bg-surface rounded-2xl border border-border max-w-sm w-full p-6 shadow-2xl"
          >
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-amber-500" size={28} />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                Session Expiring Soon
              </h3>
              <p className="text-sm text-muted-foreground">
                You will be logged out due to inactivity.
              </p>
            </div>

            {/* Countdown */}
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 mb-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock size={16} className="text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/70">
                  Time Remaining
                </span>
              </div>
              <div className="font-display text-3xl font-bold text-foreground tabular-nums">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onLogout}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
              >
                Log Out Now
              </button>
              <button
                onClick={onStayLoggedIn}
                className="flex-1 px-4 py-2.5 rounded-xl bg-clay text-white text-sm font-medium hover:brightness-110 transition-all"
              >
                Stay Logged In
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
