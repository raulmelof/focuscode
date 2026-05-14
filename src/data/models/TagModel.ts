import { getDBConnection } from '../database/database';
import { Tag } from '../../types/Tag';

export class TagModel {
  static async insertTag(userId: string, name: string, color: string): Promise<number> {
    const db = await getDBConnection();
    const result = await db.runAsync(
      'INSERT INTO tags (name, color, userId) VALUES (?, ?, ?)',
      [name, color, userId]
    );
    return result.lastInsertRowId;
  }

  static async getTags(userId: string): Promise<Tag[]> {
    const db = await getDBConnection();
    // Apenas busca tags do usuário logado que não estão marcadas como deletadas
    const allRows = await db.getAllAsync<Tag>('SELECT * FROM tags WHERE isDeleted = 0 AND userId = ?', [userId]);
    return allRows;
  }

  static async deleteTag(userId: string, id: number): Promise<void> {
    const db = await getDBConnection();
    const now = Date.now();
    // Soft delete para sincronização futura
    await db.runAsync('UPDATE tags SET isDeleted = 1, updatedAt = ? WHERE id = ? AND userId = ?', [now, id, userId]);
  }

  static async updateTag(userId: string, id: number, name: string, color: string): Promise<void> {
    const db = await getDBConnection();
    const now = Date.now();
    await db.runAsync(
      'UPDATE tags SET name = ?, color = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      [name, color, now, id, userId]
    );
  }
}
