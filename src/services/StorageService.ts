import { auth } from './firebase';

export class StorageService {
  /**
   * Faz o upload de uma imagem (URI local) para o Supabase Storage via REST API (100% gratuito)
   * @param uri URI da imagem local (file:// ou blob:)
   * @param taskId ID da tarefa para organizar na pasta correta
   * @returns URL pública da imagem na nuvem Supabase
   */
  static async uploadTaskImage(uri: string, taskId: number): Promise<string> {
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('As credenciais do Supabase (EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY) não estão configuradas no arquivo .env');
      }

      // 1. Converter a URI para Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // 2. Definir o caminho de armazenamento seguro do usuário (RLS no Supabase)
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Usuário não autenticado no Firebase');

      const bucketName = 'study_attachments';
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${uid}/${taskId}/${fileName}`;

      // 3. Fazer o upload usando a REST API direta do Supabase (evitando pacotes pesados)
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Content-Type': blob.type || 'image/jpeg',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Erro ao enviar para o Supabase Storage: ${errorText}`);
      }

      // 4. Retornar a URL pública do Supabase
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
      return publicUrl;
      
    } catch (error) {
      console.error('Erro ao fazer upload da imagem no StorageService:', error);
      throw error;
    }
  }
}
