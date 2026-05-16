import { StorageService } from '../StorageService';

jest.mock('../firebase', () => ({
  auth: {
    currentUser: { uid: 'user123' }
  }
}));

describe('StorageService', () => {
  const originalEnv = process.env;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

    mockFetch = jest.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('deve fazer upload da imagem para o Supabase Storage via REST e retornar a URL pública', async () => {
    // Arrange
    const mockUri = 'file://path/to/image.jpg';
    const mockTaskId = 123;
    const mockBlob = new Blob(['mock-data'], { type: 'image/jpeg' });

    // 1º fetch: lê a URI local
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    // 2º fetch: envia a imagem para o Supabase
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('Upload Success'),
    });

    // Act
    const resultUrl = await StorageService.uploadTaskImage(mockUri, mockTaskId);

    // Assert
    expect(mockFetch).toHaveBeenCalledTimes(2);
    
    // Verifica a primeira chamada (lendo a URI)
    expect(mockFetch).toHaveBeenNthCalledWith(1, mockUri);

    // Verifica a segunda chamada (enviando para o Supabase)
    expect(mockFetch).toHaveBeenNthCalledWith(2, 
      expect.stringContaining('https://xyz.supabase.co/storage/v1/object/study_attachments/user123/123/'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-anon-key',
          'apikey': 'mock-anon-key',
          'Content-Type': 'image/jpeg',
        },
        body: mockBlob,
      })
    );

    // Verifica a URL pública gerada
    expect(resultUrl).toContain('https://xyz.supabase.co/storage/v1/object/public/study_attachments/user123/123/');
  });

  it('deve lançar erro se o upload para o Supabase falhar', async () => {
    // Arrange
    const mockUri = 'file://path/to/image.jpg';
    const mockTaskId = 123;
    const mockBlob = new Blob(['mock-data'], { type: 'image/jpeg' });

    // 1º fetch: lê a URI local
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    // 2º fetch: responde com erro
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve('Internal Server Error'),
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act & Assert
    await expect(StorageService.uploadTaskImage(mockUri, mockTaskId)).rejects.toThrow(
      'Erro ao enviar para o Supabase Storage: Internal Server Error'
    );

    consoleSpy.mockRestore();
  });

  it('deve lançar erro se as credenciais do Supabase não estiverem configuradas', async () => {
    // Arrange
    process.env.EXPO_PUBLIC_SUPABASE_URL = '';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = '';

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act & Assert
    await expect(StorageService.uploadTaskImage('file://img.jpg', 123)).rejects.toThrow(
      'As credenciais do Supabase (EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY) não estão configuradas no arquivo .env'
    );

    consoleSpy.mockRestore();
  });
});
