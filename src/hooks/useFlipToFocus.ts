import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
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
    if (Platform.OS === 'web') return;

    if (!isActive) {
      Accelerometer.removeAllListeners();
      return;
    }

    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;

    Accelerometer.setUpdateInterval(500);

    subscription = Accelerometer.addListener(({ x, y, z }) => {
      const isZFaceDown = Platform.OS === 'ios' ? z > 0.8 : z < -0.8;
      const isFaceDown = Math.abs(x) < 0.3 && Math.abs(y) < 0.3 && isZFaceDown;

      if (!isRunning) {
        if (isFaceDown && lastActionRef.current !== 'start') {
          lastActionRef.current = 'start';
          onStart();
        }
      } else {
        if (!isFaceDown) {
          if (runningSince && Date.now() - runningSince > 5000) { //tempo de 5 segundos para posicionar o celular
            if (lastActionRef.current !== 'pause') {
              lastActionRef.current = 'pause';
              onPause();
            }
          }
        }
      }
    });

    return () => {
      if (Platform.OS === 'web') return;
      if (subscription) {
        subscription.remove();
      }
      Accelerometer.removeAllListeners();
    };
  }, [isActive, isRunning, runningSince, onStart, onPause]);
};
