import { Platform } from 'react-native';
import { getDBConnection } from '../data/database/database';

export const SettingsService = {
  getSetting: async (key: string, defaultValue: string): Promise<string> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(`setting_${key}`) || defaultValue;
      } catch (e) {
        console.error('[SettingsService] Erro ao ler setting no localStorage:', e);
        return defaultValue;
      }
    }

    try {
      const db = await getDBConnection();
      const result = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?;',
        [key]
      );
      return result ? result.value : defaultValue;
    } catch (e) {
      console.error('[SettingsService] Erro ao ler setting no SQLite:', e);
      return defaultValue;
    }
  },

  setSetting: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(`setting_${key}`, value);
        return;
      } catch (e) {
        console.error('[SettingsService] Erro ao salvar setting no localStorage:', e);
        return;
      }
    }

    try {
      const db = await getDBConnection();
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);',
        [key, value]
      );
    } catch (e) {
      console.error('[SettingsService] Erro ao salvar setting no SQLite:', e);
    }
  }
};
