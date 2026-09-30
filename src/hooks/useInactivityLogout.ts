import { useLocation, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { signOut } from "@/services/authService";

const STORAGE_KEY = "gogosoft_inactivity_timeout";

interface UseInactivityLogoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  enabled?: boolean;
}

function readStoredTimeoutMinutes(defaultMinutes: number) {
  if (typeof window === "undefined") return defaultMinutes;

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!storedValue) return defaultMinutes;

  const parsedValue = Number.parseInt(storedValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) return 0;

  return parsedValue;
}

export function useInactivityLogout({
  timeoutMinutes = 30,
  warningMinutes = 1,
  enabled = true,
}: UseInactivityLogoutOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthRoute = ["/auth", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe"].includes(
    location.pathname,
  );

  const configuredTimeoutMinutes = useMemo(
    () => readStoredTimeoutMinutes(timeoutMinutes),
    [location.pathname, timeoutMinutes],
  );
  const timeoutMilliseconds = configuredTimeoutMinutes > 0 ? configuredTimeoutMinutes * 60_000 : 0;
  const warningMilliseconds = warningMinutes * 60_000;

  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeoutMilliseconds);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    setShowWarning(false);
    setTimeRemaining(timeoutMilliseconds);
  }, [timeoutMilliseconds]);

  const dismissWarning = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const logoutNow = useCallback(async () => {
    setShowWarning(false);
    try {
      await signOut();
    } catch (error) {
      console.error("[useInactivityLogout] signOut failed:", error);
    }
    void navigate({ to: "/auth" });
  }, [navigate]);

  useEffect(() => {
    if (!enabled || isAuthRoute || timeoutMilliseconds <= 0) {
      setShowWarning(false);
      setTimeRemaining(0);
      return;
    }

    const handleActivity = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, { passive: true }),
    );

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
    };
  }, [enabled, isAuthRoute, timeoutMilliseconds]);

  useEffect(() => {
    if (!enabled || isAuthRoute || timeoutMilliseconds <= 0) return;

    const intervalId = window.setInterval(() => {
      const remainingMs = Math.max(0, lastActivity + timeoutMilliseconds - Date.now());
      setTimeRemaining(remainingMs);

      if (remainingMs <= warningMilliseconds && remainingMs > 0) {
        setShowWarning(true);
      }

      if (remainingMs <= 0) {
        void logoutNow();
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [enabled, isAuthRoute, lastActivity, logoutNow, timeoutMilliseconds, warningMilliseconds]);

  useEffect(() => {
    if (!enabled || isAuthRoute || timeoutMilliseconds <= 0) {
      setShowWarning(false);
      setTimeRemaining(0);
      return;
    }

    setTimeRemaining(Math.max(0, lastActivity + timeoutMilliseconds - Date.now()));
  }, [enabled, isAuthRoute, lastActivity, timeoutMilliseconds]);

  return {
    showWarning,
    dismissWarning,
    timeRemaining,
    logoutNow,
  };
}
