import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

export interface PomodoroSettings {
  focusTimeMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  isFlipEnabled?: boolean;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusTimeMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  isFlipEnabled: true,
};

// Robust helper functions that bypass AsyncStorage on Web and handle native failures gracefully
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

// Global in-memory reactive state for Flip to Focus switch
let globalIsFlipEnabled = true;
export const flipListeners = new Set<(val: boolean) => void>();

export const getGlobalIsFlipEnabled = () => globalIsFlipEnabled;
export const setGlobalIsFlipEnabled = (val: boolean) => {
  globalIsFlipEnabled = val;
  flipListeners.forEach(l => l(val));
};

export const useSettings = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const getStorageKey = useCallback(() => {
    return user ? `@settings_${user.uid}` : null;
  }, [user]);

  const loadSettings = useCallback(async () => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    const key = getStorageKey();
    if (!key) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const stored = await getStorageItem(key);
      if (stored) {
        setSettings(JSON.parse(stored));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading settings from storage', error);
    } finally {
      setIsLoading(false);
    }
  }, [getStorageKey, isAuthLoading]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (newSettings: PomodoroSettings) => {
    const key = getStorageKey();
    if (!key) return;
    
    try {
      await setStorageItem(key, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings to storage', error);
      throw error;
    }
  };

  return {
    settings,
    saveSettings,
    isLoading,
    loadSettings
  };
};
