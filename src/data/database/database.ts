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
          color TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          isCompleted INTEGER DEFAULT 0,
          tagId INTEGER,
          FOREIGN KEY (tagId) REFERENCES tags (id)
        );
      `);

      console.log('Database initialized successfully: tables tags and tasks created/verified.');
    } catch (error) {
      console.error('Error initializing database:', error);
      initPromise = null; // Permite tentar novamente em caso de erro
      throw error;
    }
  })();

  return initPromise;
};
