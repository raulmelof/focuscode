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
    const allRows = await db.getAllAsync<Tag>('SELECT * FROM tags');
    return allRows;
  }

  static async deleteTag(id: number): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
  }
}
