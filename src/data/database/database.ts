import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export interface DatabaseConnection {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, params?: any[]) => Promise<{ lastInsertRowId: number; changes?: number }>;
  getAllAsync: <T>(sql: string, params?: any[]) => Promise<T[]>;
  getFirstAsync: <T>(sql: string, params?: any[]) => Promise<T | null>;
}

const createWebDBAdapter = (): DatabaseConnection => {
  const STORAGE_KEY = 'focuscode_web_db';
  const savedData = Platform.OS === 'web' ? localStorage.getItem(STORAGE_KEY) : null;
  const tables: Record<string, any[]> = savedData ? JSON.parse(savedData) : {};
  let autoIncrementIds: Record<string, number> = {};

  Object.keys(tables).forEach(tableName => {
    const maxId = tables[tableName].reduce((max, item) => Math.max(max, item.id || 0), 0);
    autoIncrementIds[tableName] = maxId + 1;
  });

  const persist = () => {
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    }
  };

  return {
    execAsync: async (sql: string) => {
      if (sql.includes('CREATE TABLE IF NOT EXISTS')) {
        const parts = sql.split('CREATE TABLE IF NOT EXISTS');
        for (let i = 1; i < parts.length; i++) {
          const tableName = parts[i].trim().split(' ')[0].trim().split('(')[0].trim();
          if (tableName && !tables[tableName]) {
            tables[tableName] = [];
            autoIncrementIds[tableName] = 1;
          }
        }
      }
    },

    runAsync: async (sql: string, params: any[] = []) => {
      const sqlUpper = sql.toUpperCase();

      if (sqlUpper.includes('INSERT INTO')) {
        const tableNameMatch = sql.match(/INSERT INTO (\w+)/i);
        const tableName = tableNameMatch ? tableNameMatch[1] : '';
        const columnsMatch = sql.match(/\(([^)]+)\)/);
        const columns = columnsMatch ? columnsMatch[1].split(',').map(c => c.trim()) : [];

        if (tableName) {
          if (!tables[tableName]) {
            tables[tableName] = [];
            autoIncrementIds[tableName] = 1;
          }
          const id = autoIncrementIds[tableName]++;
          const row: any = { id };
          columns.forEach((col, i) => {
            row[col] = params[i];
          });
          if (row.isDeleted === undefined) row.isDeleted = 0;
          if (row.updatedAt === undefined) row.updatedAt = Date.now();
          if (row.isCompleted === undefined) row.isCompleted = 0;
          tables[tableName].push(row);
          persist();
          return { lastInsertRowId: id };
        }
      }

      if (sqlUpper.includes('UPDATE')) {
        const tableNameMatch = sql.match(/UPDATE (\w+)/i);
        const tableName = tableNameMatch ? tableNameMatch[1] : '';
        if (tableName && tables[tableName]) {
          const idParam = params[params.length - 1];
          const row = tables[tableName].find(r => r.id === Number(idParam) || r.firebaseId === idParam);
          if (row) {
            if (sql.includes('firebaseId = ?')) {
              // Encontra a posição do firebaseId nos params (geralmente o primeiro em UPDATE table SET firebaseId = ? WHERE id = ?)
              row.firebaseId = params[0];
            }
            if (sql.includes('isCompleted = ?')) row.isCompleted = params[0];
            if (sql.includes('isDeleted = ?')) row.isDeleted = params[0];
            if (sql.includes('updatedAt = ?')) {
              // Se tiver isDeleted, updatedAt costuma ser o segundo param. Se for update normal de tag, é o terceiro.
              const updatedAtIdx = sql.includes('isDeleted') ? 1 : (sql.includes('name') ? 2 : 1);
              row.updatedAt = params[updatedAtIdx] || Date.now();
            }
            persist();
          }
        }
        return { changes: 1, lastInsertRowId: 0 };
      }

      if (sqlUpper.includes('DELETE FROM')) {
        const tableNameMatch = sql.match(/DELETE FROM (\w+)/i);
        const tableName = tableNameMatch ? tableNameMatch[1] : '';
        if (tableName && tables[tableName]) {
          const idParam = params[0];
          tables[tableName] = tables[tableName].filter(r => r.id !== Number(idParam));
          persist();
        }
        return { changes: 1, lastInsertRowId: 0 };
      }

      return { lastInsertRowId: 0, changes: 0 };
    },

    getAllAsync: async <T>(sql: string, params: any[] = []): Promise<T[]> => {
      const tableNameMatch = sql.match(/FROM (\w+)/i);
      const tableName = tableNameMatch ? tableNameMatch[1] : '';
      if (!tableName || !tables[tableName]) return [];

      let results = [...tables[tableName]];
      if (sql.includes('isDeleted = 0')) {
        results = results.filter(r => r.isDeleted === 0);
      }
      if (sql.includes('isCompleted = 1')) {
        results = results.filter(r => r.isCompleted === 1 || r.isCompleted === true);
      }
      // Aplica filtro de userId se presente na query
      if (sql.includes('userId = ?')) {
        const userIdParamIndex = params.length - 1;
        const filterUserId = params[userIdParamIndex];
        results = results.filter(r => r.userId === filterUserId);
      }
      if (sql.toUpperCase().includes('COUNT(*)')) {
        return [{ count: results.length }] as unknown as T[];
      }
      return results as T[];
    },

    getFirstAsync: async <T>(sql: string, params: any[] = []): Promise<T | null> => {
      const tableNameMatch = sql.match(/FROM (\w+)/i);
      const tableName = tableNameMatch ? tableNameMatch[1] : '';
      if (!tableName || !tables[tableName]) return null;

      if (sql.includes('firebaseId = ?')) {
        const found = tables[tableName].find(r => r.firebaseId === params[0]);
        return (found as T) || null;
      }
      return (tables[tableName][0] as T) || null;
    },
  };
};

let webDB: DatabaseConnection | null = null;

let dbInstance: DatabaseConnection | null = null;

export const getDBConnection = async (): Promise<DatabaseConnection> => {
  if (Platform.OS === 'web') {
    if (!webDB) {
      try {
        const realDb = await SQLite.openDatabaseAsync('focuscode.db');
        webDB = realDb as unknown as DatabaseConnection;
      } catch {
        webDB = createWebDBAdapter();
      }
    }
    return webDB;
  }
  
  if (!dbInstance) {
    const db = await SQLite.openDatabaseAsync('focuscode.db');
    dbInstance = db as unknown as DatabaseConnection;
  }
  return dbInstance;
};

let initPromise: Promise<void> | null = null;

export const initDB = async () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = await getDBConnection();
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          firebaseId TEXT,
          userId TEXT,
          updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
          isDeleted INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          isCompleted INTEGER DEFAULT 0,
          tagId INTEGER,
          firebaseId TEXT,
          userId TEXT,
          updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
          isDeleted INTEGER DEFAULT 0,
          summaryImageUri TEXT,
          focusTimeMinutes INTEGER DEFAULT 25,
          FOREIGN KEY (tagId) REFERENCES tags (id)
        );
      `);

      const alterQueries = [
        "ALTER TABLE tags ADD COLUMN firebaseId TEXT;",
        "ALTER TABLE tags ADD COLUMN userId TEXT;",
        "ALTER TABLE tags ADD COLUMN updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000);",
        "ALTER TABLE tags ADD COLUMN isDeleted INTEGER DEFAULT 0;",
        "ALTER TABLE tasks ADD COLUMN firebaseId TEXT;",
        "ALTER TABLE tasks ADD COLUMN userId TEXT;",
        "ALTER TABLE tasks ADD COLUMN updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000);",
        "ALTER TABLE tasks ADD COLUMN isDeleted INTEGER DEFAULT 0;",
        "ALTER TABLE tasks ADD COLUMN summaryImageUri TEXT;",
        "ALTER TABLE tasks ADD COLUMN focusTimeMinutes INTEGER DEFAULT 25;"
      ];

      for (const query of alterQueries) {
        try { await db.execAsync(query); } catch { }
      }

      // Limpar imagens Base64 gigantes históricas do banco de dados local
      if (Platform.OS !== 'web') {
        try {
          await db.runAsync("UPDATE tasks SET summaryImageUri = NULL WHERE summaryImageUri LIKE 'data:%' AND length(summaryImageUri) > 150000");
          console.log('[database] Base64 gigantes históricas limpas com sucesso do banco de dados.');
        } catch (cleanError) {
          console.warn('[database] Erro ao limpar Base64 gigantes do banco local:', cleanError);
        }
      }
    } catch (error) {
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};
