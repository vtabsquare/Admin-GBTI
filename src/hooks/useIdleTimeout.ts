import { useEffect, useRef, useCallback } from 'react';

/**
 * useIdleTimeout — Tracks user inactivity and triggers a callback
 * after the specified timeout period (default: 30 minutes).
 *
 * Monitors: mousemove, mousedown, keydown, touchstart, scroll, click
 *
 * Security requirement: "Active sessions must be automatically
 * invalidated after a maximum of 30 minutes of user inactivity."
 */

const IDLE_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
];

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Show warning 2 minutes before logout

interface UseIdleTimeoutOptions {
  /** Timeout in milliseconds before logout (default: 30 min) */
  timeoutMs?: number;
  /** Warning callback fired 2 minutes before logout */
  onWarning?: (remainingMs: number) => void;
  /** Logout callback fired when idle timeout is reached */
  onIdle: () => void;
  /** Whether the hook is active (e.g. only when user is logged in) */
  enabled?: boolean;
}

export function useIdleTimeout({
  timeoutMs = THIRTY_MINUTES_MS,
  onWarning,
  onIdle,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();
    clearTimers();

    // Set warning timer (fires 2 min before logout)
    const warningDelay = timeoutMs - WARNING_BEFORE_MS;
    if (warningDelay > 0 && onWarning) {
      warningTimerRef.current = setTimeout(() => {
        onWarning(WARNING_BEFORE_MS);
      }, warningDelay);
    }

    // Set idle (logout) timer
    idleTimerRef.current = setTimeout(() => {
      onIdle();
    }, timeoutMs);
  }, [enabled, timeoutMs, onWarning, onIdle, clearTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    // Start the timer
    resetTimer();

    // Attach activity listeners
    const handler = () => resetTimer();
    IDLE_EVENTS.forEach((event) => {
      window.addEventListener(event, handler, { passive: true });
    });

    // Also reset on visibility change (tab becomes visible)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Check if we exceeded the timeout while tab was hidden
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= timeoutMs) {
          onIdle();
        } else {
          resetTimer();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimers();
      IDLE_EVENTS.forEach((event) => {
        window.removeEventListener(event, handler);
      });
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, resetTimer, clearTimers, timeoutMs, onIdle]);

  return { resetTimer };
}
