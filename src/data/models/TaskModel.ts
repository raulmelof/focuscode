import { getDBConnection } from '../database/database';
import { Task } from '../../types/Task';

export class TaskModel {
  static async insertTask(userId: string, title: string, description?: string, tagId?: number): Promise<number> {
    const db = await getDBConnection();
    const result = await db.runAsync(
      'INSERT INTO tasks (title, description, isCompleted, tagId, userId) VALUES (?, ?, ?, ?, ?)',
      [title, description ?? null, 0, tagId ?? null, userId]
    );
    return result.lastInsertRowId;
  }

  static async getTasks(userId: string): Promise<Task[]> {
    const db = await getDBConnection();
    // Apenas busca tarefas do usuário logado que não estão marcadas como deletadas
    const allRows = await db.getAllAsync<{ id: number; title: string; description: string | null; isCompleted: number; tagId: number | null; summaryImageUri: string | null }>('SELECT * FROM tasks WHERE isDeleted = 0 AND userId = ?', [userId]);
    
    return allRows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      isCompleted: row.isCompleted === 1,
      tagId: row.tagId ?? undefined,
      summaryImageUri: row.summaryImageUri ?? undefined
    }));
  }

  static async updateTaskSummary(userId: string, id: number, summaryImageUri: string): Promise<void> {
    const db = await getDBConnection();
    const now = Date.now();
    await db.runAsync(
      'UPDATE tasks SET summaryImageUri = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      [summaryImageUri ?? null, now, Number(id), userId ?? null]
    );
  }

  static async updateTaskStatus(userId: string, id: number, isCompleted: boolean): Promise<void> {
    const db = await getDBConnection();
    const now = Date.now();
    await db.runAsync(
      'UPDATE tasks SET isCompleted = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      [isCompleted ? 1 : 0, now, Number(id), userId ?? null]
    );
  }

  static async deleteTask(userId: string, id: number): Promise<void> {
    const db = await getDBConnection();
    const now = Date.now();
    // Soft delete: marca como deletado para o SyncService apagar no Firebase depois
    await db.runAsync(
      'UPDATE tasks SET isDeleted = 1, updatedAt = ? WHERE id = ? AND userId = ?',
      [now, Number(id), userId ?? null]
    );
  }
}
