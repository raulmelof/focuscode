import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

export interface PomodoroSettings {
  focusTimeMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusTimeMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
};

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const getStorageKey = useCallback(() => {
    return user ? `@settings_${user.uid}` : null;
  }, [user]);

  const loadSettings = useCallback(async () => {
    const key = getStorageKey();
    if (!key) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }
    
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setSettings(JSON.parse(stored));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading settings from AsyncStorage', error);
    } finally {
      setIsLoading(false);
    }
  }, [getStorageKey]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (newSettings: PomodoroSettings) => {
    const key = getStorageKey();
    if (!key) return;
    
    try {
      await AsyncStorage.setItem(key, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings to AsyncStorage', error);
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
