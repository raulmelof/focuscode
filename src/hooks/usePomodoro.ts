import { useState, useEffect, useCallback } from 'react';


interface UsePomodoroProps {
  initialTimeInSeconds: number;
  onFocusEnd?: () => void; 
}

export const usePomodoro = ({ initialTimeInSeconds, onFocusEnd }: UsePomodoroProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      
      if (onFocusEnd) {
        onFocusEnd();
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, onFocusEnd]);

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