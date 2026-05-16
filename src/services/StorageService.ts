import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './firebase';

export class StorageService {
  /**
   * Faz o upload de uma imagem (URI local) para o Firebase Storage
   * @param uri URI da imagem local (file:// ou blob:)
   * @param taskId ID da tarefa para organizar na pasta correta
   * @returns URL pública da imagem na nuvem
   */
  static async uploadTaskImage(uri: string, taskId: number): Promise<string> {
    try {
      // 1. Converter a URI para Blob (compatível com Fetch/Web/Mobile)
      const response = await fetch(uri);
      const blob = await response.blob();

      // 2. Criar a referência (caminho) no Storage
      // Ex: {uid}/task_images/123/16848291.jpg
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Usuário não autenticado');

      const fileName = `${Date.now()}.jpg`;
      const storageRef = ref(storage, `${uid}/task_images/${taskId}/${fileName}`);

      // 3. Iniciar o upload
      const uploadTask = await uploadBytesResumable(storageRef, blob);

      // 4. Obter e retornar a URL de Download pública
      const downloadURL = await getDownloadURL(uploadTask.ref);
      return downloadURL;
      
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  }
}
