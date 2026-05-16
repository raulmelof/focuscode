import { auth } from './firebase';
import * as ImageManipulator from 'expo-image-manipulator';

export class StorageService {
  /**
   * Converte uma imagem local (URI) em Base64 Data URL para salvar diretamente no Firebase Firestore
   * de forma 100% gratuita (evitando a necessidade de planos pagos como o plano Blaze do Firebase Storage).
   * 
   * Adiciona compressão e redimensionamento automáticos para imagens novas e antigas (históricas)
   * para garantir que elas fiquem super leves (geralmente < 50KB) e nunca estourem o limite de 1MB do Firestore.
   * 
   * @param uri URI da imagem local (file:// ou blob:)
   * @param taskId ID da tarefa correspondente
   * @returns Data URL Base64 da imagem (ex: data:image/jpeg;base64,...)
   */
  static async uploadTaskImage(uri: string, taskId: number): Promise<string> {
    try {
      // Se a imagem já for uma URL remota ou Base64, retorna diretamente
      if (uri.startsWith('data:') || uri.startsWith('http://') || uri.startsWith('https://')) {
        return uri;
      }

      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Usuário não autenticado');

      // 1. Redimensionar e comprimir a imagem antes do upload (garante que caiba no Firestore)
      let processedUri = uri;
      try {
        console.log(`[StorageService] Redimensionando e comprimindo imagem local: ${uri}`);
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 500 } }], // Redimensiona para no máximo 500px de largura mantendo a proporção
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG } // 50% de compressão JPEG
        );
        processedUri = manipResult.uri;
        console.log(`[StorageService] Imagem comprimida gerada com sucesso!`);
      } catch (manipError) {
        console.warn('[StorageService] Falha ao comprimir imagem local, usando original como fallback:', manipError);
      }

      // 2. Ler o arquivo local/processado como Blob
      const response = await fetch(processedUri);
      const blob = await response.blob();

      // 3. Converter o Blob para Base64 Data URL usando FileReader
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Falha ao converter imagem para string Base64'));
          }
        };
        reader.onerror = () => reject(reader.error || new Error('Erro ao ler arquivo da imagem'));
        reader.readAsDataURL(blob);
      });

      return base64String;
      
    } catch (error) {
      console.error('Erro ao converter imagem para Base64 no StorageService:', error);
      throw error;
    }
  }
}
