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
});
