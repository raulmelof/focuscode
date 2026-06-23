import { getDBConnection } from '../database/database';
import { Task } from '../../types/Task';
import { Platform } from 'react-native';

export class TaskModel {
  static async insertTask(userId: string, title: string, description?: string, tagId?: number, focusTimeMinutes: number = 25): Promise<number> {
    const db = await getDBConnection();
    const result = await db.runAsync(
      'INSERT INTO tasks (title, description, isCompleted, tagId, userId, focusTimeMinutes) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description ?? null, 0, tagId ?? null, userId, focusTimeMinutes]
    );
    return result.lastInsertRowId;
  }

  static async getTasks(userId: string): Promise<Task[]> {
    const db = await getDBConnection();
    // Apenas busca tarefas do usuário logado que não estão marcadas como deletadas
    const allRows = await db.getAllAsync<{ id: number; title: string; description: string | null; isCompleted: number; tagId: number | null; summaryImageUri: string | null; focusTimeMinutes: number | null }>('SELECT * FROM tasks WHERE isDeleted = 0 AND userId = ?', [userId]);
    
    return allRows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      isCompleted: row.isCompleted === 1,
      tagId: row.tagId ?? undefined,
      summaryImageUri: row.summaryImageUri ?? undefined,
      focusTimeMinutes: row.focusTimeMinutes ?? 25
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

  static async updateTaskFocusTime(userId: string, id: number, focusTimeMinutes: number): Promise<void> {
    const db = await getDBConnection();
    const now = Date.now();
    await db.runAsync(
      'UPDATE tasks SET focusTimeMinutes = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      [focusTimeMinutes, now, Number(id), userId ?? null]
    );
  }

  static async getCompletedTasksCount(userId: string): Promise<number> {
    const db = await getDBConnection();
    const result = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM tasks WHERE isCompleted = 1 AND isDeleted = 0 AND userId = ?',
      [userId]
    );
    return result[0]?.count ?? 0;
  }

  static async getCompletedTasks(userId: string): Promise<Task[]> {
    const db = await getDBConnection();
    const allRows = await db.getAllAsync<{
      id: number;
      title: string;
      description: string | null;
      isCompleted: number;
      tagId: number | null;
      summaryImageUri: string | null;
      focusTimeMinutes: number | null;
    }>(
      'SELECT * FROM tasks WHERE isCompleted = 1 AND isDeleted = 0 AND userId = ?',
      [userId]
    );

    return allRows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      isCompleted: row.isCompleted === 1,
      tagId: row.tagId ?? undefined,
      summaryImageUri: row.summaryImageUri ?? undefined,
      focusTimeMinutes: row.focusTimeMinutes ?? 25
    }));
  }

  static async getCompletedTasksByTag(userId: string): Promise<{ tagId: number | null, count: number }[]> {
    const db = await getDBConnection();
    
    if (Platform.OS === 'web') {
      const allRows = await db.getAllAsync<any>("SELECT * FROM tasks WHERE isCompleted = 1 AND isDeleted = 0 AND userId = ?", [userId]);
      const grouped: Record<string, number> = {};
      allRows.forEach(row => {
        const key = row.tagId ? String(row.tagId) : 'null';
        grouped[key] = (grouped[key] || 0) + 1;
      });
      return Object.entries(grouped).map(([key, count]) => ({
        tagId: key === 'null' ? null : Number(key),
        count
      }));
    }

    const result = await db.getAllAsync<{ tagId: number | null, count: number }>(
      'SELECT tagId, COUNT(*) as count FROM tasks WHERE isCompleted = 1 AND isDeleted = 0 AND userId = ? GROUP BY tagId',
      [userId]
    );
    return result;
  }

  static async getFocusTimeByDate(userId: string): Promise<{ date: string, totalMinutes: number }[]> {
    const db = await getDBConnection();

    if (Platform.OS === 'web') {
      const allRows = await db.getAllAsync<any>("SELECT * FROM tasks WHERE isCompleted = 1 AND isDeleted = 0 AND userId = ?", [userId]);
      const grouped: Record<string, number> = {};
      allRows.forEach(row => {
        if (row.updatedAt) {
          const dateObj = new Date(row.updatedAt);
          const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
          grouped[dateStr] = (grouped[dateStr] || 0) + (row.focusTimeMinutes || 0);
        }
      });
      return Object.entries(grouped)
        .map(([date, totalMinutes]) => ({ date, totalMinutes }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7);
    }

    const result = await db.getAllAsync<{ date: string, totalMinutes: number }>(
      "SELECT strftime('%Y-%m-%d', updatedAt / 1000, 'unixepoch') as date, SUM(focusTimeMinutes) as totalMinutes FROM tasks WHERE isCompleted = 1 AND isDeleted = 0 AND userId = ? AND updatedAt IS NOT NULL GROUP BY date ORDER BY date ASC LIMIT 7",
      [userId]
    );
    return result;
  }

  static async getCompletedDates(userId: string): Promise<string[]> {
    const db = await getDBConnection();

    if (Platform.OS === 'web') {
      const allRows = await db.getAllAsync<any>("SELECT * FROM tasks WHERE isCompleted = 1 AND isDeleted = 0 AND userId = ?", [userId]);
      const dates = new Set<string>();
      allRows.forEach(row => {
        if (row.updatedAt) {
          const dateObj = new Date(row.updatedAt);
          const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
          dates.add(dateStr);
        }
      });
      return Array.from(dates);
    }

    const result = await db.getAllAsync<{ date: string }>(
      "SELECT DISTINCT strftime('%Y-%m-%d', updatedAt / 1000, 'unixepoch', 'localtime') as date FROM tasks WHERE isCompleted = 1 AND isDeleted = 0 AND userId = ? AND updatedAt IS NOT NULL",
      [userId]
    );
    return result.map(r => r.date);
  }
}
