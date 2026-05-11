import { getDBConnection } from '../database/database';
import { Task } from '../../types/Task';

export class TaskModel {
  static async insertTask(title: string, description?: string, tagId?: number): Promise<number> {
    const db = await getDBConnection();
    const result = await db.runAsync(
      'INSERT INTO tasks (title, description, isCompleted, tagId) VALUES (?, ?, ?, ?)',
      [title, description || null, 0, tagId || null]
    );
    return result.lastInsertRowId;
  }

  static async getTasks(): Promise<Task[]> {
    const db = await getDBConnection();
    const allRows = await db.getAllAsync<{ id: number; title: string; description: string | null; isCompleted: number; tagId: number | null }>('SELECT * FROM tasks');
    
    return allRows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      isCompleted: row.isCompleted === 1,
      tagId: row.tagId || undefined
    }));
  }

  static async updateTaskStatus(id: number, isCompleted: boolean): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('UPDATE tasks SET isCompleted = ? WHERE id = ?', [isCompleted ? 1 : 0, id]);
  }

  static async deleteTask(id: number): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
  }
}
