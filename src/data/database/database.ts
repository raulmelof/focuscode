import * as SQLite from 'expo-sqlite';

export const getDBConnection = async () => {
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
