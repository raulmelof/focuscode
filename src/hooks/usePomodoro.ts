import { useState, useEffect } from 'react';

export const usePomodoro = (initialTimeInSeconds: number = 25 * 60) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const stop = () => {
    setIsRunning(false);
    setTimeLeft(initialTimeInSeconds);
  };

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    stop,
  };
};
