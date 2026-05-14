import { Platform } from 'react-native';

const mockOpenDatabaseAsync = jest.fn();
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: (...args: any[]) => mockOpenDatabaseAsync(...args)
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' }
}));

describe('Database', () => {
  let mockDb: any;
  let databaseModule: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null)
    };
    
    mockOpenDatabaseAsync.mockResolvedValue(mockDb);
    databaseModule = jest.requireActual('../database');
  });

  it('deve inicializar o banco de dados e habilitar foreign keys', async () => {
    Platform.OS = 'ios';
    await databaseModule.initDB();
    
    expect(mockOpenDatabaseAsync).toHaveBeenCalledWith('focuscode.db');
    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS tags'));
    expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS tasks'));
  });

  it('deve funcionar na web usando o singleton', async () => {
    Platform.OS = 'web';
    // Mock resolve para simular suporte a OPFS
    mockOpenDatabaseAsync.mockResolvedValue(mockDb);
    
    const db1 = await databaseModule.getDBConnection();
    const db2 = await databaseModule.getDBConnection();
    
    expect(db1).toBe(db2);
    expect(mockOpenDatabaseAsync).toHaveBeenCalled();
  });
});
