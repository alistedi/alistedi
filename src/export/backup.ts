import type { SQLiteDatabase } from 'expo-sqlite';
import type { Conversation, Message } from '../db/sessions';

export async function createBackupJson(db: SQLiteDatabase): Promise<string> {
  const conversations = await db.getAllAsync<Conversation>('SELECT * FROM conversations ORDER BY created_at ASC');
  const messages = await db.getAllAsync<Message>('SELECT * FROM messages ORDER BY conversation_id, created_at, rowid');
  const settings = await db.getAllAsync<{ key: string; value: string; updated_at: string }>(
    'SELECT key,value,updated_at FROM app_settings ORDER BY key',
  );
  return JSON.stringify({
    format: 'alistedi-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    note: 'API anahtarları güvenlik için yedek dosyasına dahil edilmez.',
    conversations,
    messages,
    settings,
  }, null, 2);
}
