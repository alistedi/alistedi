import type { ParticipantConfig } from '../db/sessions';
import { getApiKey } from './config';

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export async function completeChat(
  config: ParticipantConfig,
  turns: ChatTurn[],
  signal?: AbortSignal,
): Promise<ChatResult> {
  const apiKey = await getApiKey(config);
  if (!apiKey) throw new Error(`${config.name} için API anahtarı Ayarlar bölümünde girilmemiş.`);
  if (!config.baseUrl.trim() || !config.model.trim()) {
    throw new Error(`${config.name} için API adresi ve model adı Ayarlar bölümünde tamamlanmalı.`);
  }

  const endpoint = `${config.baseUrl.trim().replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: config.model.trim(), messages: turns, temperature: 0.7 }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`${config.provider} API hatası (${response.status}): ${details.slice(0, 300) || response.statusText}`);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = payload.choices?.[0]?.message?.content;
  const text = Array.isArray(content) ? content.map((part) => part.text ?? '').join('') : content;
  if (!text?.trim()) throw new Error(`${config.provider} boş yanıt döndürdü.`);
  return {
    text: text.trim(),
    inputTokens: payload.usage?.prompt_tokens ?? null,
    outputTokens: payload.usage?.completion_tokens ?? null,
  };
}
