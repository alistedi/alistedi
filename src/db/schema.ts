import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 2;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = versionRow?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      CREATE TABLE conversations (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        instructions TEXT NOT NULL DEFAULT '',
        turn_limit INTEGER NOT NULL DEFAULT 10,
        status TEXT NOT NULL DEFAULT 'draft',
        participant_config_json TEXT NOT NULL,
        reference_session_id TEXT,
        reference_context TEXT NOT NULL DEFAULT '',
        report TEXT,
        archived_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX conversations_updated_idx ON conversations(updated_at DESC);
      CREATE INDEX conversations_title_idx ON conversations(title COLLATE NOCASE);

      CREATE TABLE messages (
        id TEXT PRIMARY KEY NOT NULL,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        speaker_id TEXT NOT NULL,
        speaker_name TEXT NOT NULL,
        body TEXT NOT NULL,
        model TEXT,
        turn_number INTEGER NOT NULL DEFAULT 0,
        reply_to_message_id TEXT,
        input_tokens INTEGER,
        output_tokens INTEGER,
        cost_usd REAL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX messages_conversation_idx ON messages(conversation_id, created_at);
      CREATE UNIQUE INDEX moderator_reply_once_idx
        ON messages(reply_to_message_id) WHERE kind = 'moderator-note' AND reply_to_message_id IS NOT NULL;

      CREATE TABLE app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    currentVersion = DATABASE_VERSION;
  }

  if (currentVersion === 1) {
    await db.execAsync(`
      ALTER TABLE conversations ADD COLUMN reference_session_id TEXT;
      ALTER TABLE conversations ADD COLUMN reference_context TEXT NOT NULL DEFAULT '';
    `);
    currentVersion = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${currentVersion};`);
}
