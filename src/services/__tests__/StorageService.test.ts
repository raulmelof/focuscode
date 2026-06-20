import { StorageService } from '../StorageService';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn((uri) => Promise.resolve({ uri })),
  SaveFormat: { JPEG: 'jpeg' }
}));

jest.mock('../firebase', () => ({
  auth: {
    currentUser: { uid: 'user123' }
  }
}));

// Mock do FileReader global para ambiente Jest/Node
class MockFileReader {
  onloadend: () => void = () => {};
  onerror: () => void = () => {};
  result: string = '';
  readAsDataURL(blob: Blob) {
    this.result = 'data:image/jpeg;base64,mockbase64data';
    setTimeout(() => this.onloadend(), 0);
  }
}

describe('StorageService', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    globalThis.fetch = mockFetch;
    globalThis.FileReader = MockFileReader as any;
  });

  it('deve converter uma imagem local (URI) em Base64 Data URL com sucesso', async () => {
    // Arrange
    const mockUri = 'file://path/to/image.jpg';
    const mockTaskId = 123;
    const mockBlob = new Blob(['mock-data'], { type: 'image/jpeg' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    // Act
    const resultUrl = await StorageService.uploadTaskImage(mockUri, mockTaskId);

    // Assert
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(mockUri);
    expect(resultUrl).toBe('data:image/jpeg;base64,mockbase64data');
  });

  it('deve retornar a própria URI se já for remota ou Base64', async () => {
    const httpUri = 'https://firebasestorage.com/image.jpg';
    const base64Uri = 'data:image/jpeg;base64,existingdata';

    const res1 = await StorageService.uploadTaskImage(httpUri, 123);
    const res2 = await StorageService.uploadTaskImage(base64Uri, 123);

    expect(res1).toBe(httpUri);
    expect(res2).toBe(base64Uri);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('deve lançar erro se a conversão do FileReader falhar', async () => {
    class FailingFileReader {
      onloadend: () => void = () => {};
      onerror: () => void = () => {};
      error = new Error('Read error');
      readAsDataURL(blob: Blob) {
        setTimeout(() => this.onerror(), 0);
      }
    }
    globalThis.FileReader = FailingFileReader as any;

    const mockUri = 'file://path/to/image.jpg';
    const mockBlob = new Blob(['mock-data'], { type: 'image/jpeg' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(StorageService.uploadTaskImage(mockUri, 123)).rejects.toThrow(
      'Read error'
    );

    consoleSpy.mockRestore();
  });

  it('deve retornar string vazia se falhar a compressão e Base64 for muito grande', async () => {
    // Make manipulateAsync throw an error
    const { manipulateAsync } = require('expo-image-manipulator');
    manipulateAsync.mockRejectedValueOnce(new Error('Manipulator error'));
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Create a large base64 string
    const largeBase64 = 'data:image/jpeg;base64,' + 'a'.repeat(900001);

    const resultUrl = await StorageService.uploadTaskImage(largeBase64, 123);
    
    expect(resultUrl).toBe('');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[StorageService] Imagem Base64 muito grande e falhou ao comprimir. Ignorando imagem para permitir sincronismo da tarefa.'
    );
    
    consoleWarnSpy.mockRestore();
  });

  it('deve continuar o fluxo se falhar a compressão mas não for um Base64 gigante', async () => {
    const { manipulateAsync } = require('expo-image-manipulator');
    manipulateAsync.mockRejectedValueOnce(new Error('Manipulator error'));
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const mockUri = 'file://path/to/normal/image.jpg';
    const mockBlob = new Blob(['mock-data'], { type: 'image/jpeg' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    const resultUrl = await StorageService.uploadTaskImage(mockUri, 123);
    
    expect(resultUrl).toBe('data:image/jpeg;base64,mockbase64data');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[StorageService] Falha ao comprimir imagem local/Base64:',
      expect.any(Error)
    );
    
    consoleWarnSpy.mockRestore();
  });

  it('deve lançar erro se o resultado do FileReader não for string', async () => {
    class InvalidResultFileReader {
      onloadend: () => void = () => {};
      onerror: () => void = () => {};
      result: ArrayBuffer = new ArrayBuffer(8); // Not a string
      readAsDataURL(blob: Blob) {
        setTimeout(() => this.onloadend(), 0);
      }
    }
    globalThis.FileReader = InvalidResultFileReader as any;

    const mockUri = 'file://path/to/image.jpg';
    const mockBlob = new Blob(['mock-data'], { type: 'image/jpeg' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(StorageService.uploadTaskImage(mockUri, 123)).rejects.toThrow(
      'Falha ao converter imagem para string Base64'
    );

    consoleSpy.mockRestore();
  });

  it('deve lançar erro genérico se a conversão do FileReader falhar sem reader.error', async () => {
    class FailingFileReaderNoMsg {
      onloadend: () => void = () => {};
      onerror: () => void = () => {};
      error = null;
      readAsDataURL(blob: Blob) {
        setTimeout(() => this.onerror(), 0);
      }
    }
    globalThis.FileReader = FailingFileReaderNoMsg as any;

    const mockUri = 'file://path/to/image.jpg';
    const mockBlob = new Blob(['mock-data'], { type: 'image/jpeg' });
    mockFetch.mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(mockBlob) });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(StorageService.uploadTaskImage(mockUri, 123)).rejects.toThrow('Erro ao ler arquivo da imagem');
    consoleSpy.mockRestore();
  });

  it('deve lançar erro se usuário não estiver autenticado', async () => {
    require('../firebase').auth.currentUser = null;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    await expect(StorageService.uploadTaskImage('file://path/to/image.jpg', 123)).rejects.toThrow('Usuário não autenticado');
    
    consoleSpy.mockRestore();
    require('../firebase').auth.currentUser = { uid: 'user123' }; // restore
  });
});
