import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';


interface UsePomodoroProps {
  initialTimeInSeconds: number;
  onFocusEnd?: () => void; 
}

export const usePomodoro = ({ initialTimeInSeconds, onFocusEnd }: UsePomodoroProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const backgroundTimeRef = useRef<number>(0);

  useEffect(() => {
    setTimeLeft(initialTimeInSeconds);
  }, [initialTimeInSeconds]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isRunning && backgroundTimeRef.current > 0) {
        const elapsed = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
        setTimeLeft(prev => Math.max(0, prev - elapsed));
        backgroundTimeRef.current = 0;
      } else if (nextAppState.match(/inactive|background/) && isRunning) {
        backgroundTimeRef.current = Date.now();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let timeout: ReturnType<typeof setTimeout>;

    if (isRunning) {
      if (timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft((prev) => prev - 1);
        }, 1000);
      } else {
        timeout = setTimeout(() => {
          setIsRunning(false);
          if (onFocusEnd) {
            onFocusEnd();
          }
          setTimeLeft(initialTimeInSeconds);
        }, 1000);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isRunning, timeLeft, onFocusEnd, initialTimeInSeconds]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const stop = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(initialTimeInSeconds);
  }, [initialTimeInSeconds]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(initialTimeInSeconds);
  }, [initialTimeInSeconds]);

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    stop,
    resetTimer,
  };
};