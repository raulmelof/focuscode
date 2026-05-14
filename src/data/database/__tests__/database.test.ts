import * as SQLite from 'expo-sqlite';
import { getDBConnection, initDB } from '../database';

const mockExecAsync = jest.fn();
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => ({
    execAsync: mockExecAsync,
  })),
}));

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reseta o initPromise singleton entre testes para garantir isolamento
    jest.resetModules();
  });

  it('should call openDatabaseAsync to get connection', async () => {
    await getDBConnection();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('focuscode.db');
  });

  it('should initialize database and execute table creation only once', async () => {
    await initDB();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('focuscode.db');
    // 1x PRAGMA + 1x CREATE TABLE + 8x ALTER TABLE (6 originais + 2 novos userId)
    expect(mockExecAsync).toHaveBeenCalledTimes(10);

    const query = mockExecAsync.mock.calls[1][0];
    expect(query).toContain('CREATE TABLE IF NOT EXISTS tags');
    expect(query).toContain('CREATE TABLE IF NOT EXISTS tasks');

    // Verifica que os ALTER TABLE de userId estão presentes
    const allCalls = mockExecAsync.mock.calls.map((c: any[]) => c[0] as string);
    expect(allCalls.some(q => q.includes('ADD COLUMN userId'))).toBe(true);

    // Chamada duplicada não deve disparar novos execAsync (singleton)
    await initDB();
    expect(mockExecAsync).toHaveBeenCalledTimes(10);
  });
});
