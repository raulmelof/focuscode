import { StorageService } from '../StorageService';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Mocking the firebase storage functions
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('../firebase', () => ({
  storage: {},
  auth: {
    currentUser: { uid: 'user123' }
  }
}));

// Mocking the global fetch API
globalThis.fetch = jest.fn(() =>
  Promise.resolve({
    blob: () => Promise.resolve(new Blob()),
  })
) as jest.Mock;

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve fazer upload da imagem e retornar a URL de download', async () => {
    // Arrange
    const mockUri = 'file://path/to/image.jpg';
    const mockTaskId = 123;
    const mockDownloadUrl = 'https://firebasestorage.googleapis.com/v0/b/test/task_images/123/image.jpg';
    
    (uploadBytesResumable as jest.Mock).mockResolvedValue({ ref: 'mockRef' });
    (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadUrl);

    // Act
    const resultUrl = await StorageService.uploadTaskImage(mockUri, mockTaskId);

    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith(mockUri);
    expect(ref).toHaveBeenCalled();
    expect(uploadBytesResumable).toHaveBeenCalled();
    expect(getDownloadURL).toHaveBeenCalled();
    expect(resultUrl).toBe(mockDownloadUrl);
  });

  it('deve lançar erro se o upload falhar', async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockUri = 'file://path/to/image.jpg';
    const mockTaskId = 123;
    const mockError = new Error('Falha no upload');
    
    (uploadBytesResumable as jest.Mock).mockRejectedValue(mockError);

    // Act & Assert
    await expect(StorageService.uploadTaskImage(mockUri, mockTaskId)).rejects.toThrow('Falha no upload');
    
    consoleSpy.mockRestore();
  });
});
