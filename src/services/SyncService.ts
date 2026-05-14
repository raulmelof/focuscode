import { collection, doc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { db as firestoreDb, auth, signInAnonymouslyToFirebase } from './firebase';
import { getDBConnection } from '../data/database/database';

export class SyncService {
  /**
   * Executa o processo de sincronização completo (Push e depois Pull)
   */
  static async sync() {
    try {
      console.log('Iniciando sincronização...');
      
      // Só sincroniza se houver um usuário autenticado (e-mail ou anônimo)
      const user = auth.currentUser;
      if (!user) {
        console.log('Sincronização ignorada: nenhum usuário autenticado.');
        return;
      }

      await this.pushLocalChanges(user.uid);
      await this.pullRemoteChanges(user.uid);
      
      console.log('Sincronização concluída com sucesso!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  }

  /**
   * PUSH: Envia dados não sincronizados ou atualizados do SQLite para o Firestore
   */
  private static async pushLocalChanges(userId: string) {
    const db = await getDBConnection();
    const batch = writeBatch(firestoreDb);

    // 1. Sincronizar Tasks
    const localTasks = await db.getAllAsync<{ id: number; title: string; description: string | null; isCompleted: number; tagId: number | null; firebaseId: string | null; updatedAt: number; isDeleted: number }>('SELECT * FROM tasks');
    
    for (const task of localTasks) {
      let docRef;
      
      if (!task.firebaseId) {
        // Novo registro local: cria um ID no Firestore e salva no SQLite
        docRef = doc(collection(firestoreDb, 'tasks'));
        await db.runAsync('UPDATE tasks SET firebaseId = ? WHERE id = ?', [docRef.id, task.id]);
      } else {
        docRef = doc(firestoreDb, 'tasks', task.firebaseId);
      }

      if (task.isDeleted === 1) {
        // Soft Delete local: deleta no Firestore e limpa localmente
        batch.delete(docRef);
        await db.runAsync('DELETE FROM tasks WHERE id = ?', [task.id]);
      } else {
        // Envia/Atualiza os dados no Firestore (incluindo o userId para as regras de segurança)
        batch.set(docRef, {
          userId: userId,
          title: task.title,
          description: task.description,
          isCompleted: task.isCompleted === 1,
          tagId: task.tagId ? task.tagId.toString() : null, // Idealmente o tagId seria o firebaseId da tag
          updatedAt: task.updatedAt
        }, { merge: true });
      }
    }

    // 2. Sincronizar Tags
    const localTags = await db.getAllAsync<{ id: number; name: string; color: string; firebaseId: string | null; updatedAt: number; isDeleted: number }>('SELECT * FROM tags');
    
    for (const tag of localTags) {
      let docRef;
      
      if (!tag.firebaseId) {
        docRef = doc(collection(firestoreDb, 'tags'));
        await db.runAsync('UPDATE tags SET firebaseId = ? WHERE id = ?', [docRef.id, tag.id]);
      } else {
        docRef = doc(firestoreDb, 'tags', tag.firebaseId);
      }

      if (tag.isDeleted === 1) {
        batch.delete(docRef);
        await db.runAsync('DELETE FROM tags WHERE id = ?', [tag.id]);
      } else {
        batch.set(docRef, {
          userId: userId,
          name: tag.name,
          color: tag.color,
          updatedAt: tag.updatedAt
        }, { merge: true });
      }
    }

    await batch.commit();
  }

  /**
   * PULL: Puxa dados do Firestore e mescla no SQLite (Local First = remoto não deve sobrescrever se local for mais novo)
   */
  private static async pullRemoteChanges(userId: string) {
    const db = await getDBConnection();

    // 1. Pull Tags
    const tagsQuery = query(collection(firestoreDb, 'tags'), where('userId', '==', userId));
    const tagsSnapshot = await getDocs(tagsQuery);

    for (const docSnap of tagsSnapshot.docs) {
      const data = docSnap.data();
      const firebaseId = docSnap.id;

      // Verifica se a tag já existe no SQLite
      const existingTag = await db.getFirstAsync<{ id: number, updatedAt: number }>('SELECT id, updatedAt FROM tags WHERE firebaseId = ?', [firebaseId]);

      if (!existingTag) {
        // Não existe localmente: Insere
        await db.runAsync(
          'INSERT INTO tags (name, color, firebaseId, updatedAt) VALUES (?, ?, ?, ?)',
          [data.name, data.color, firebaseId, data.updatedAt || Date.now()]
        );
      } else if (data.updatedAt && data.updatedAt > existingTag.updatedAt) {
        // Remoto é mais novo: Atualiza localmente
        await db.runAsync(
          'UPDATE tags SET name = ?, color = ?, updatedAt = ? WHERE id = ?',
          [data.name, data.color, data.updatedAt, existingTag.id]
        );
      }
    }

    // 2. Pull Tasks
    const tasksQuery = query(collection(firestoreDb, 'tasks'), where('userId', '==', userId));
    const tasksSnapshot = await getDocs(tasksQuery);

    for (const docSnap of tasksSnapshot.docs) {
      const data = docSnap.data();
      const firebaseId = docSnap.id;

      const existingTask = await db.getFirstAsync<{ id: number, updatedAt: number }>('SELECT id, updatedAt FROM tasks WHERE firebaseId = ?', [firebaseId]);

      // Tenta achar o ID local da Tag se houver relacionamento
      let localTagId = null;
      if (data.tagId) { // Assumindo que data.tagId é o firebaseId da tag
        const tag = await db.getFirstAsync<{ id: number }>('SELECT id FROM tags WHERE firebaseId = ?', [data.tagId]);
        if (tag) localTagId = tag.id;
      }

      if (!existingTask) {
        await db.runAsync(
          'INSERT INTO tasks (title, description, isCompleted, tagId, firebaseId, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
          [data.title, data.description || null, data.isCompleted ? 1 : 0, localTagId, firebaseId, data.updatedAt || Date.now()]
        );
      } else if (data.updatedAt && data.updatedAt > existingTask.updatedAt) {
        await db.runAsync(
          'UPDATE tasks SET title = ?, description = ?, isCompleted = ?, tagId = ?, updatedAt = ? WHERE id = ?',
          [data.title, data.description || null, data.isCompleted ? 1 : 0, localTagId, data.updatedAt, existingTask.id]
        );
      }
    }
  }
}
