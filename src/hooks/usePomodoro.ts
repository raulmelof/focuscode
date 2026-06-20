import { useState, useEffect, useCallback } from 'react';


interface UsePomodoroProps {
  initialTimeInSeconds: number;
  onFocusEnd?: () => void; 
}

export const usePomodoro = ({ initialTimeInSeconds, onFocusEnd }: UsePomodoroProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTimeLeft(initialTimeInSeconds);
  }, [initialTimeInSeconds]);

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