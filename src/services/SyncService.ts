import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db as firestoreDb, auth } from './firebase';
import { getDBConnection, initDB } from '../data/database/database';
import { StorageService } from './StorageService';

interface LocalTask {
  id: number;
  title: string;
  description: string | null;
  isCompleted: number;
  tagId: number | null;
  firebaseId: string | null;
  updatedAt: number;
  isDeleted: number;
  userId: string | null;
  summaryImageUri: string | null;
}

interface LocalTag {
  id: number;
  name: string;
  color: string;
  firebaseId: string | null;
  updatedAt: number;
  isDeleted: number;
  userId: string | null;
}

export class SyncService {
  static async sync() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await initDB();
      await this.pushLocalChanges(user.uid);
      await this.pullRemoteChanges(user.uid);
    } catch (_error) {
      console.error('[SyncService] Erro crítico na sincronização:', _error);
    }
  }

  private static async pushLocalChanges(userId: string) {
    const db = await getDBConnection();

    // Sincronização de Tags (Individual para ser resiliente a erros de permissão)
    const localTags = await db.getAllAsync<LocalTag>('SELECT * FROM tags WHERE userId = ?', [userId]);
    for (const tag of localTags) {
      try {
        let docRef;
        if (!tag.firebaseId) {
          docRef = doc(collection(firestoreDb, 'tags'));
          await db.runAsync('UPDATE tags SET firebaseId = ? WHERE id = ?', [docRef.id, tag.id]);
        } else {
          docRef = doc(firestoreDb, 'tags', tag.firebaseId);
        }

        if (tag.isDeleted === 1) {
          await deleteDoc(docRef);
          await db.runAsync('UPDATE tags SET firebaseId = NULL WHERE id = ?', [tag.id]);
        } else {
          await setDoc(docRef, {
            userId,
            name: tag.name,
            color: tag.color,
            updatedAt: tag.updatedAt
          }, { merge: true });
        }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.warn(`[SyncService] Ignorando Tag ${tag.id}: Sem permissão (Dono diferente).`);
        } else {
          console.error(`[SyncService] Erro na tag ${tag.id}:`, error.message);
        }
      }
    }

    // Sincronização de Tarefas (filtradas pelo userId)
    const localTasks = await db.getAllAsync<LocalTask>('SELECT * FROM tasks WHERE userId = ?', [userId]);
    for (const task of localTasks) {
      try {
        let docRef;
        if (!task.firebaseId) {
          docRef = doc(collection(firestoreDb, 'tasks'));
          await db.runAsync('UPDATE tasks SET firebaseId = ? WHERE id = ?', [docRef.id, task.id]);
        } else {
          docRef = doc(firestoreDb, 'tasks', task.firebaseId);
        }

        if (task.isDeleted === 1) {
          await deleteDoc(docRef);
          await db.runAsync('DELETE FROM tasks WHERE id = ?', [task.id]);
        } else {
          // Se tiver imagem e for uma URI local, faz o upload para o Firebase Storage primeiro
          let finalImageUrl = task.summaryImageUri;
          if (task.summaryImageUri && (
            task.summaryImageUri.startsWith('file://') ||
            task.summaryImageUri.startsWith('content://') ||
            task.summaryImageUri.startsWith('ph://') ||
            task.summaryImageUri.startsWith('blob:')
          )) {
            try {
              console.log(`[SyncService] Fazendo upload de imagem local para tarefa ${task.id}...`);
              const uploadedUrl = await StorageService.uploadTaskImage(task.summaryImageUri, task.id);
              console.log(`[SyncService] Upload concluído! URL: ${uploadedUrl.substring(0, 80)}...`);
              
              // Atualiza localmente no SQLite
              await db.runAsync(
                'UPDATE tasks SET summaryImageUri = ? WHERE id = ?',
                [uploadedUrl, task.id]
              );
              finalImageUrl = uploadedUrl;
            } catch (uploadError) {
              console.error(`[SyncService] Erro ao fazer upload da imagem para a tarefa ${task.id}:`, uploadError);
            }
          }

          await setDoc(docRef, {
            userId,
            title: task.title,
            description: task.description,
            isCompleted: task.isCompleted === 1,
            tagId: task.tagId ? task.tagId.toString() : null,
            summaryImageUri: finalImageUrl,
            updatedAt: task.updatedAt
          }, { merge: true });
        }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.warn(`[SyncService] Ignorando Tarefa ${task.id}: Sem permissão.`);
        } else {
          console.error(`[SyncService] Erro na tarefa ${task.id}:`, error.message);
        }
      }
    }
  }

  private static async pullRemoteChanges(userId: string) {
    const db = await getDBConnection();

    try {
      // 1. Pull Tags
      const tagsSnapshot = await getDocs(query(collection(firestoreDb, 'tags'), where('userId', '==', userId)));
      for (const docSnap of tagsSnapshot.docs) {
        const data = docSnap.data();
        const firebaseId = docSnap.id;
        const existingTag = await db.getFirstAsync<LocalTag>(
          'SELECT id, updatedAt FROM tags WHERE firebaseId = ?',
          [firebaseId]
        );

        if (!existingTag) {
          await db.runAsync(
            'INSERT INTO tags (name, color, firebaseId, updatedAt, userId) VALUES (?, ?, ?, ?, ?)',
            [data.name, data.color, firebaseId, data.updatedAt || Date.now(), userId]
          );
        } else if (data.updatedAt && data.updatedAt > existingTag.updatedAt) {
          await db.runAsync(
            'UPDATE tags SET name = ?, color = ?, updatedAt = ? WHERE id = ?',
            [data.name, data.color, data.updatedAt, existingTag.id]
          );
        }
      }

      // 2. Pull Tarefas
      const tasksSnapshot = await getDocs(query(collection(firestoreDb, 'tasks'), where('userId', '==', userId)));
      for (const docSnap of tasksSnapshot.docs) {
        const data = docSnap.data();
        const firebaseId = docSnap.id;
        const existingTask = await db.getFirstAsync<LocalTask>(
          'SELECT id, updatedAt FROM tasks WHERE firebaseId = ?',
          [firebaseId]
        );

        let localTagId: number | null = null;
        if (data.tagId) {
          const tag = await db.getFirstAsync<LocalTag>('SELECT id FROM tags WHERE firebaseId = ?', [data.tagId]);
          if (tag) localTagId = tag.id;
        }

        if (!existingTask) {
          await db.runAsync(
            'INSERT INTO tasks (title, description, isCompleted, tagId, firebaseId, updatedAt, userId, summaryImageUri) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [data.title, data.description || null, data.isCompleted ? 1 : 0, localTagId, firebaseId, data.updatedAt || Date.now(), userId, data.summaryImageUri || null]
          );
        } else if (data.updatedAt && data.updatedAt > existingTask.updatedAt) {
          await db.runAsync(
            'UPDATE tasks SET title = ?, description = ?, isCompleted = ?, tagId = ?, updatedAt = ?, summaryImageUri = ? WHERE id = ?',
            [data.title, data.description || null, data.isCompleted ? 1 : 0, localTagId, data.updatedAt, data.summaryImageUri || null, existingTask.id]
          );
        }
      }
    } catch (_error) {
      console.error('[SyncService] Erro ao baixar mudanças:', _error);
    }
  }
}
