import { getDBConnection } from '../database/database';
import { Tag } from '../../types/Tag';

export class TagModel {
  static async insertTag(name: string, color: string): Promise<number> {
    const db = await getDBConnection();
    const result = await db.runAsync(
      'INSERT INTO tags (name, color) VALUES (?, ?)',
      [name, color]
    );
    return result.lastInsertRowId;
  }

  static async getTags(): Promise<Tag[]> {
    const db = await getDBConnection();
    // Apenas busca tags que não estão marcadas como deletadas
    const allRows = await db.getAllAsync<Tag>('SELECT * FROM tags WHERE isDeleted = 0');
    return allRows;
  }

  static async deleteTag(id: number): Promise<void> {
    const db = await getDBConnection();
    const now = Date.now();
    // Soft delete para sincronização futura
    await db.runAsync('UPDATE tags SET isDeleted = 1, updatedAt = ? WHERE id = ?', [now, id]);
  }

  static async updateTag(id: number, name: string, color: string): Promise<void> {
    const db = await getDBConnection();
    const now = Date.now();
    await db.runAsync(
      'UPDATE tags SET name = ?, color = ?, updatedAt = ? WHERE id = ?',
      [name, color, now, id]
    );
  }
}
