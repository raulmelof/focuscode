import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from './useSettings';

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }
};

let globalCycleCount = 0;
export const cycleListeners = new Set<(val: number) => void>();

export const getGlobalCycleCount = () => globalCycleCount;
export const setGlobalCycleCount = (val: number) => {
  globalCycleCount = val;
  cycleListeners.forEach(l => l(val));
};

let globalAutoStartFocus = false;
export const getGlobalAutoStartFocus = () => globalAutoStartFocus;
export const setGlobalAutoStartFocus = (val: boolean) => {
  globalAutoStartFocus = val;
};

let hasLoadedCycleForKey: string | null = null;

export const usePomodoroCycle = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { settings } = useSettings();
  const [cycleCount, setCycleCountState] = useState(globalCycleCount);
  const [isLoading, setIsLoading] = useState(true);

  const getStorageKey = useCallback(() => {
    return user ? `@pomodoroCycle_${user.uid}` : '@pomodoroCycle_guest';
  }, [user]);

  useEffect(() => {
    const listener = (newCount: number) => {
      setCycleCountState(newCount);
    };
    cycleListeners.add(listener);
    return () => {
      cycleListeners.delete(listener);
    };
  }, []);

  const loadCycleCount = useCallback(async (force = false) => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    const key = getStorageKey();
    if (!key) {
      setGlobalCycleCount(0);
      setIsLoading(false);
      return;
    }

    if (!force && hasLoadedCycleForKey === key) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const stored = await getStorageItem(key);
      if (stored) {
        setGlobalCycleCount(parseInt(stored, 10));
      } else {
        setGlobalCycleCount(0);
      }
      hasLoadedCycleForKey = key;
    } catch (error) {
      console.error('Error loading cycle count', error);
    } finally {
      setIsLoading(false);
    }
  }, [getStorageKey, isAuthLoading]);

  useEffect(() => {
    loadCycleCount();
  }, [loadCycleCount]);

  const saveCycleCount = async (newCount: number) => {
    const key = getStorageKey();
    if (!key) return;
    
    try {
      setGlobalCycleCount(newCount);
      await setStorageItem(key, newCount.toString());
    } catch (error) {
      console.error('Error saving cycle count', error);
    }
  };

  const incrementCycle = async () => {
    await saveCycleCount(globalCycleCount + 1);
  };

  const resetCycle = async () => {
    await saveCycleCount(0);
  };

  return {
    cycleCount,
    incrementCycle,
    resetCycle,
    isLoading,
    isLongBreak: cycleCount > 0 && cycleCount % settings.cyclesBeforeLongBreak === 0,
  };
};
