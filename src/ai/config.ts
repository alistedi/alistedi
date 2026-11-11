import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_PARTICIPANTS, type ParticipantConfig } from '../db/sessions';

const SETTINGS_KEY = 'participant-config-v1';

function secretKey(config: ParticipantConfig): string {
  const source = config.baseUrl.trim().toLowerCase() || config.provider.trim().toLowerCase();
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  return `alistedi-api-${(hash >>> 0).toString(16)}`;
}

export async function loadParticipantConfig(db: SQLiteDatabase): Promise<ParticipantConfig[]> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', SETTINGS_KEY);
  if (!row) return DEFAULT_PARTICIPANTS;
  try {
    const parsed = JSON.parse(row.value) as ParticipantConfig[];
    return DEFAULT_PARTICIPANTS.map((defaultItem) => parsed.find((item) => item.id === defaultItem.id) ?? defaultItem);
  } catch {
    return DEFAULT_PARTICIPANTS;
  }
}

export async function saveParticipantConfig(db: SQLiteDatabase, config: ParticipantConfig[]): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (key,value,updated_at) VALUES (?,?,?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
    SETTINGS_KEY, JSON.stringify(config), new Date().toISOString(),
  );
}

export async function saveApiKey(config: ParticipantConfig, value: string): Promise<void> {
  const key = secretKey(config);
  if (value.trim()) await SecureStore.setItemAsync(key, value.trim());
  else await SecureStore.deleteItemAsync(key);
}

export async function getApiKey(config: ParticipantConfig): Promise<string | null> {
  return SecureStore.getItemAsync(secretKey(config));
}
