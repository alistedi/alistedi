import type { SQLiteDatabase } from 'expo-sqlite';

export type ConversationStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
export type MessageKind = 'moderator' | 'moderator-note' | 'participant' | 'report';

export interface ParticipantConfig {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
}

export interface Conversation {
  id: string;
  title: string;
  topic: string;
  instructions: string;
  turn_limit: number;
  status: ConversationStatus;
  participant_config_json: string;
  reference_session_id: string | null;
  reference_context: string;
  report: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  kind: MessageKind;
  speaker_id: string;
  speaker_name: string;
  body: string;
  model: string | null;
  turn_number: number;
  reply_to_message_id: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  created_at: string;
}

export const DEFAULT_PARTICIPANTS: ParticipantConfig[] = [
  { id: 'moderator', name: 'Moderatör', provider: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: '' },
  { id: 'speaker-a', name: 'Tartışmacı A', provider: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: '' },
  { id: 'speaker-b', name: 'Tartışmacı B', provider: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: '' },
  { id: 'speaker-c', name: 'Tartışmacı C', provider: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: '' },
];

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function createConversation(
  db: SQLiteDatabase,
  input: { topic: string; instructions: string; turnLimit: number; participants: ParticipantConfig[]; referenceSessionId?: string | null },
): Promise<string> {
  const id = makeId();
  const now = new Date().toISOString();
  const title = input.topic.trim().split(/\s+/).slice(0, 7).join(' ') || 'Yeni Tartışma';
  let referenceContext = '';
  let referenceId: string | null = null;

  if (input.referenceSessionId) {
    const source = await getConversation(db, input.referenceSessionId);
    if (source) {
      const sourceMessages = await getMessages(db, source.id);
      const pieces = [`Önceki oturum başlığı: ${source.title}`, `Önceki konu: ${source.topic}`];
      if (source.report) pieces.push(`Önceki moderatör raporu:\n${source.report}`);
      pieces.push(...sourceMessages.map((message) => `${message.speaker_name}: ${message.body}`));
      const fullContext = pieces.join('\n\n');
      const maxChars = 30_000;
      referenceContext = fullContext.length <= maxChars ? fullContext : `[Eski içerik kısaltıldı]\n${fullContext.slice(-maxChars)}`;
      referenceId = source.id;
    }
  }

  await db.runAsync(
    `INSERT INTO conversations (id,title,topic,instructions,turn_limit,status,participant_config_json,reference_session_id,reference_context,created_at,updated_at)
     VALUES (?,?,?,?,?,'draft',?,?,?,?,?)`,
    id, title, input.topic.trim(), input.instructions.trim(), input.turnLimit,
    JSON.stringify(input.participants), referenceId, referenceContext, now, now,
  );
  return id;
}

export async function getConversation(db: SQLiteDatabase, id: string): Promise<Conversation | null> {
  return db.getFirstAsync<Conversation>('SELECT * FROM conversations WHERE id = ?', id);
}

export async function listConversations(db: SQLiteDatabase, options: { archived?: boolean; query?: string } = {}): Promise<Conversation[]> {
  const archived = options.archived ? 1 : 0;
  const query = options.query?.trim() ?? '';
  const wildcard = `%${query}%`;
  return db.getAllAsync<Conversation>(
    `SELECT DISTINCT c.* FROM conversations c
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE (CASE WHEN c.archived_at IS NULL THEN 0 ELSE 1 END) = ?
       AND (? = '' OR c.title LIKE ? COLLATE NOCASE OR c.topic LIKE ? COLLATE NOCASE OR m.body LIKE ? COLLATE NOCASE)
     ORDER BY c.updated_at DESC`,
    archived, query, wildcard, wildcard, wildcard,
  );
}

export async function getMessages(db: SQLiteDatabase, conversationId: string): Promise<Message[]> {
  return db.getAllAsync<Message>(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, rowid ASC',
    conversationId,
  );
}

export async function addMessage(
  db: SQLiteDatabase,
  input: Omit<Message, 'created_at'>,
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO messages
     (id,conversation_id,kind,speaker_id,speaker_name,body,model,turn_number,reply_to_message_id,input_tokens,output_tokens,cost_usd,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    input.id, input.conversation_id, input.kind, input.speaker_id, input.speaker_name,
    input.body, input.model, input.turn_number, input.reply_to_message_id,
    input.input_tokens, input.output_tokens, input.cost_usd, now,
  );
  await db.runAsync('UPDATE conversations SET updated_at = ? WHERE id = ?', now, input.conversation_id);
}

export async function updateConversation(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Pick<Conversation, 'title' | 'status' | 'report' | 'archived_at'>>,
): Promise<void> {
  const fields: string[] = [];
  const values: (string | null)[] = [];
  for (const key of ['title', 'status', 'report', 'archived_at'] as const) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      fields.push(`${key} = ?`);
      values.push(updates[key] ?? null);
    }
  }
  if (!fields.length) return;
  fields.push('updated_at = ?');
  values.push(new Date().toISOString(), id);
  await db.runAsync(`UPDATE conversations SET ${fields.join(', ')} WHERE id = ?`, ...values);
}

export async function deleteConversation(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM conversations WHERE id = ?', id);
}
