import { useEffect, useState, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

export const useFlipToFocus = (
  isActive: boolean,
  isRunning: boolean,
  onStart: () => void,
  onPause: () => void
) => {
  const [runningSince, setRunningSince] = useState<number | null>(null);
  const lastActionRef = useRef<'start' | 'pause' | null>(null);

  useEffect(() => {
    lastActionRef.current = isRunning ? 'start' : 'pause';
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && isActive) {
      setRunningSince(Date.now());
    } else {
      setRunningSince(null);
    }
  }, [isRunning, isActive]);

  useEffect(() => {
    if (!isActive) return;

    let subscription: any = null;

    Accelerometer.setUpdateInterval(500);

    subscription = Accelerometer.addListener(({ x, y, z }) => {
      const isFaceDown = Math.abs(x) < 0.3 && Math.abs(y) < 0.3 && z > 0.8;

      if (!isRunning) {
        // If the timer is NOT running, and we place it face down, it starts.
        if (isFaceDown && lastActionRef.current !== 'start') {
          lastActionRef.current = 'start';
          onStart();
        }
      } else {
        // If the timer IS running
        if (!isFaceDown) {
          // It's not face down. Check if grace period expired.
          if (runningSince && Date.now() - runningSince > 10000) {
            if (lastActionRef.current !== 'pause') {
              lastActionRef.current = 'pause';
              onPause();
            }
          }
        }
      }
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isActive, isRunning, runningSince, onStart, onPause]);
};
