import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const memoryDB = {
  tasks: [] as any[],
  tags: [] as any[]
};

export const getDBConnection = async () => {
  if (Platform.OS === 'web') {
    return {
      execAsync: async () => {},
      getAllAsync: async (query: string) => {
        if (query.includes('tasks')) return memoryDB.tasks.filter(t => !t.isDeleted);
        if (query.includes('tags')) return memoryDB.tags.filter(t => !t.isDeleted);
        return [];
      },
      runAsync: async (query: string, args: any[] = []) => {
        const id = Math.floor(Math.random() * 100000);
        if (query.includes('INSERT INTO tasks')) {
          memoryDB.tasks.push({ id, title: args[0], description: args[1], isCompleted: args[2], tagId: args[3], isDeleted: 0 });
        } else if (query.includes('INSERT INTO tags')) {
          memoryDB.tags.push({ id, name: args[0], color: args[1], isDeleted: 0 });
        } else if (query.includes('UPDATE tasks SET isCompleted')) {
          const task = memoryDB.tasks.find(t => t.id === args[2]);
          if (task) task.isCompleted = args[0];
        } else if (query.includes('UPDATE tasks SET isDeleted')) {
          const task = memoryDB.tasks.find(t => t.id === args[1]);
          if (task) task.isDeleted = 1;
        } else if (query.includes('UPDATE tags SET name')) {
          const tag = memoryDB.tags.find(t => t.id === args[3]);
          if (tag) { tag.name = args[0]; tag.color = args[1]; }
        } else if (query.includes('UPDATE tags SET isDeleted')) {
          const tag = memoryDB.tags.find(t => t.id === args[1]);
          if (tag) tag.isDeleted = 1;
        }
        return { lastInsertRowId: id };
      },
    } as any;
  }
  return await SQLite.openDatabaseAsync('focuscode.db');
};

let initPromise: Promise<void> | null = null;

export const initDB = async () => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await getDBConnection();

      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          firebaseId TEXT,
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
          updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
          isDeleted INTEGER DEFAULT 0,
          FOREIGN KEY (tagId) REFERENCES tags (id)
        );
      `);

      // Tenta adicionar as colunas se as tabelas já existirem (migração leve)
      const alterTables = [
        "ALTER TABLE tags ADD COLUMN firebaseId TEXT;",
        "ALTER TABLE tags ADD COLUMN updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000);",
        "ALTER TABLE tags ADD COLUMN isDeleted INTEGER DEFAULT 0;",
        "ALTER TABLE tasks ADD COLUMN firebaseId TEXT;",
        "ALTER TABLE tasks ADD COLUMN updatedAt INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000);",
        "ALTER TABLE tasks ADD COLUMN isDeleted INTEGER DEFAULT 0;"
      ];

      for (const query of alterTables) {
        try {
          await db.execAsync(query);
        } catch {
          // A coluna já existe, ignora o erro
        }
      }

      console.log('Database initialized successfully: tables tags and tasks created/verified with sync columns.');
    } catch (error) {
      console.error('Error initializing database:', error);
      initPromise = null; // Permite tentar novamente em caso de erro
      throw error;
    }
  })();

  return initPromise;
};
