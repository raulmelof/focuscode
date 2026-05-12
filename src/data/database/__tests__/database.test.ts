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
  });

  it('should call openDatabaseAsync to get connection', async () => {
    await getDBConnection();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('focuscode.db');
  });

  it('should initialize database and execute table creation only once', async () => {
    await initDB();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('focuscode.db');
    expect(mockExecAsync).toHaveBeenCalledTimes(7);
    
    const query = mockExecAsync.mock.calls[0][0];
    expect(query).toContain('CREATE TABLE IF NOT EXISTS tags');
    expect(query).toContain('CREATE TABLE IF NOT EXISTS tasks');

    // Calling it again should return the cached promise and not call execAsync twice
    await initDB();
    expect(mockExecAsync).toHaveBeenCalledTimes(7);
  });
});
