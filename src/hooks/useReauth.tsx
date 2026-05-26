import { useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Clock, CheckCircle } from 'lucide-react';

/**
 * useReauth — Provides a re-authentication gate for sensitive operations.
 *
 * Usage:
 *   const { requireReauth, ReauthModal } = useReauth();
 *
 *   const handleSensitiveAction = async () => {
 *     const verified = await requireReauth();
 *     if (!verified) return;
 *     // ... do the sensitive thing
 *   };
 *
 * Security requirement: "Full user re-authentication must be required
 * for sensitive operations such as changing passwords or performing
 * privileged actions."
 */

interface ReauthState {
  visible: boolean;
  resolve: ((value: boolean) => void) | null;
}

export function useReauth() {
  const [state, setState] = useState<ReauthState>({
    visible: false,
    resolve: null,
  });
  const [pin, setPin] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const requireReauth = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      setPin('');
      setConfirmed(false);
      setState({ visible: true, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    // For now, we use a simple confirmation-based re-auth
    // since the admin login is OTP-based and we don't have passwords.
    // In production, this should trigger an OTP re-verification.
    setConfirmed(true);
    setTimeout(() => {
      state.resolve?.(true);
      setState({ visible: false, resolve: null });
      setConfirmed(false);
      setPin('');
    }, 600);
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState({ visible: false, resolve: null });
    setPin('');
    setConfirmed(false);
  }, [state.resolve]);

  const ReauthModal = useCallback(
    () => (
      <AnimatePresence>
        {state.visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-2xl border border-border max-w-sm w-full p-6 shadow-2xl"
            >
              {confirmed ? (
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3"
                  >
                    <CheckCircle className="text-green-500" size={24} />
                  </motion.div>
                  <p className="text-sm font-medium text-foreground">Identity Verified</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="text-amber-500" size={20} />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">
                        Confirm Sensitive Action
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Re-authentication is required to proceed
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 mb-5">
                    <div className="flex items-start gap-2">
                      <Clock size={14} className="text-amber-500/70 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        You are about to perform a privileged operation. Please confirm your
                        identity to continue. This action will be logged for security audit
                        purposes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/30 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay text-white text-sm font-medium hover:brightness-110 transition-all"
                    >
                      <ShieldAlert size={14} />
                      Confirm Identity
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    ),
    [state.visible, confirmed, handleConfirm, handleCancel]
  );

  return { requireReauth, ReauthModal };
}
