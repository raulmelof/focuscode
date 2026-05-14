import { collection, doc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { db as firestoreDb, auth } from './firebase';
import { getDBConnection } from '../data/database/database';

export class SyncService {
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
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  private static async pushLocalChanges(userId: string) {
    const db = await getDBConnection();
    const batch = writeBatch(firestoreDb);

    const localTasks = await db.getAllAsync<any>('SELECT * FROM tasks');
    
    for (const task of localTasks) {
      let docRef;
      if (!task.firebaseId) {
        docRef = doc(collection(firestoreDb, 'tasks'));
        await db.runAsync('UPDATE tasks SET firebaseId = ? WHERE id = ?', [docRef.id, task.id]);
      } else {
        docRef = doc(firestoreDb, 'tasks', task.firebaseId);
      }

      if (task.isDeleted === 1) {
        batch.delete(docRef);
        await db.runAsync('DELETE FROM tasks WHERE id = ?', [task.id]);
      } else {
        batch.set(docRef, {
          userId,
          title: task.title,
          description: task.description,
          isCompleted: task.isCompleted === 1,
          tagId: task.tagId ? task.tagId.toString() : null,
          updatedAt: task.updatedAt
        }, { merge: true });
      }
    }

    const localTags = await db.getAllAsync<any>('SELECT * FROM tags');
    
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
          userId,
          name: tag.name,
          color: tag.color,
          updatedAt: tag.updatedAt
        }, { merge: true });
      }
    }

    await batch.commit();
  }

  private static async pullRemoteChanges(userId: string) {
    const db = await getDBConnection();

    const tagsSnapshot = await getDocs(query(collection(firestoreDb, 'tags'), where('userId', '==', userId)));

    for (const docSnap of tagsSnapshot.docs) {
      const data = docSnap.data();
      const firebaseId = docSnap.id;
      const existingTag = await db.getFirstAsync<any>('SELECT id, updatedAt FROM tags WHERE firebaseId = ?', [firebaseId]);

      if (!existingTag) {
        await db.runAsync(
          'INSERT INTO tags (name, color, firebaseId, updatedAt) VALUES (?, ?, ?, ?)',
          [data.name, data.color, firebaseId, data.updatedAt || Date.now()]
        );
      } else if (data.updatedAt && data.updatedAt > existingTag.updatedAt) {
        await db.runAsync(
          'UPDATE tags SET name = ?, color = ?, updatedAt = ? WHERE id = ?',
          [data.name, data.color, data.updatedAt, existingTag.id]
        );
      }
    }

    const tasksSnapshot = await getDocs(query(collection(firestoreDb, 'tasks'), where('userId', '==', userId)));

    for (const docSnap of tasksSnapshot.docs) {
      const data = docSnap.data();
      const firebaseId = docSnap.id;
      const existingTask = await db.getFirstAsync<any>('SELECT id, updatedAt FROM tasks WHERE firebaseId = ?', [firebaseId]);

      let localTagId = null;
      if (data.tagId) {
        const tag = await db.getFirstAsync<any>('SELECT id FROM tags WHERE firebaseId = ?', [data.tagId]);
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
