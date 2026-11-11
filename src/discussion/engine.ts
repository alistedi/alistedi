import type { SQLiteDatabase } from 'expo-sqlite';
import { completeChat, type ChatTurn } from '../ai/client';
import { addMessage, getMessages, makeId, updateConversation, type Conversation, type Message, type ParticipantConfig } from '../db/sessions';

function orderedSpeakers(participants: ParticipantConfig[], turnIndex: number): ParticipantConfig[] {
  const speakers = participants.filter((item) => item.id !== 'moderator');
  if (speakers.length !== 3) throw new Error('Tartışmada tam olarak üç katılımcı bulunmalı.');
  const rotation = turnIndex % speakers.length;
  return [...speakers.slice(rotation), ...speakers.slice(0, rotation)];
}

function asHistory(topic: string, instructions: string, messages: Message[], referenceContext = ''): ChatTurn[] {
  const context = referenceContext
    ? `\n\nKullanıcı bu yeni tartışma için açıkça bir önceki oturumu referans olarak seçti. Yalnızca aşağıda işaretlenen metin bağlam olarak kullanılabilir; eski oturumu değiştirme veya onun devamıymış gibi davranma.\n\nAçıkça eklenen önceki oturum bağlamı:\n${referenceContext}`
    : '';
  const history: ChatTurn[] = [{ role: 'system', content: `Tartışma konusu: ${topic}\nEk talimatlar: ${instructions || 'Yok'}\n\nYalnızca bu oturumun mesajları bağlamdır.${context}` }];
  for (const item of messages) {
    history.push({ role: item.kind === 'participant' ? 'assistant' : 'user', content: `${item.speaker_name}: ${item.body}` });
  }
  return history;
}

async function saveAIMessage(
  db: SQLiteDatabase,
  conversationId: string,
  config: ParticipantConfig,
  kind: Message['kind'],
  body: string,
  turn: number,
  usage: { inputTokens: number | null; outputTokens: number | null },
  replyTo: string | null = null,
): Promise<Message> {
  const message: Message = {
    id: makeId(), conversation_id: conversationId, kind, speaker_id: config.id,
    speaker_name: config.name, body, model: config.model, turn_number: turn,
    reply_to_message_id: replyTo, input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens, cost_usd: null, created_at: new Date().toISOString(),
  };
  await addMessage(db, message);
  return message;
}

async function moderateAfter(
  db: SQLiteDatabase,
  conversation: Conversation,
  moderator: ParticipantConfig,
  target: Message,
  signal: AbortSignal,
): Promise<void> {
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM messages WHERE kind='moderator-note' AND reply_to_message_id=?`, target.id,
  );
  if (existing) return;
  const messages = await getMessages(db, conversation.id);
  const speakers = JSON.parse(conversation.participant_config_json) as ParticipantConfig[];
  const participantCount = messages.filter((item) => item.kind === 'participant').length;
  const turnIndex = Math.floor((participantCount - 1) / 3);
  const currentTurnCount = (participantCount - 1) % 3;
  const nextSpeaker = orderedSpeakers(speakers, turnIndex)[currentTurnCount + 1];
  const nextInstruction = nextSpeaker
    ? `Sıradaki konuşmacı ${nextSpeaker.name}. Ona önceki yanıtı somut biçimde değerlendirmesi için kısa, tarafsız bir yönlendirme ver.`
    : 'Bu turdaki son yanıt tamamlandı. Bir sonraki turda sıradaki katılımcı önceki turun argümanlarına cevap vermeli.';
  const prompt = asHistory(conversation.topic, conversation.instructions, messages, conversation.reference_context);
  prompt[0] = { ...prompt[0], content: `${prompt[0].content}\n\nModeratör rolü: tarafsız ve adil biçimde sırayı yönet; iddiaları otomatik olarak doğru kabul etme. Gerekirse dayanaksız varsayımları, eksik gerekçeleri veya çelişkileri nazik sorularla görünür kıl. Tartışmacıların yerine argüman üretme, kaynak uydurma, hiçbir görüşe ayrıcalık verme ve eşit söz hakkını koru.` };
  prompt.push({ role: 'user', content: `Tek cümlelik kısa bir akış notu yaz. ${nextInstruction} Uzlaşı veya karşı görüş yönünde baskı kurma.` });
  const result = await completeChat(moderator, prompt, signal);
  await saveAIMessage(db, conversation.id, moderator, 'moderator-note', result.text, target.turn_number, result, target.id);
}

export async function runDiscussion(
  db: SQLiteDatabase,
  initial: Conversation,
  signal: AbortSignal,
  onChanged: () => void,
): Promise<void> {
  const participants = JSON.parse(initial.participant_config_json) as ParticipantConfig[];
  const moderator = participants.find((item) => item.id === 'moderator');
  if (!moderator) throw new Error('Moderatör modeli ayarlanmamış.');
  let conversation = await db.getFirstAsync<Conversation>('SELECT * FROM conversations WHERE id=?', initial.id);
  if (!conversation) throw new Error('Tartışma bulunamadı.');

  await updateConversation(db, conversation.id, { status: 'running' });
  onChanged();

  try {
    let messages = await getMessages(db, conversation.id);
    if (!messages.some((item) => item.kind === 'moderator')) {
      const opening = await completeChat(moderator, [
        { role: 'system', content: 'Sen dengeli bir tartışmanın moderatörüsün. Tartışmacıların yerine görüş üretme. Konuyu ve sınırları 2-3 kısa cümlede tarafsız biçimde çerçevele; her görüşe eşit alan bırak.' },
        { role: 'user', content: `Konu: ${conversation.topic}\nEk talimatlar: ${conversation.instructions || 'Yok'}${conversation.reference_context ? `\nKullanıcının açıkça eklediği önceki oturum bağlamı:\n${conversation.reference_context}` : ''}` },
      ], signal);
      await saveAIMessage(db, conversation.id, moderator, 'moderator', opening.text, 0, opening);
      onChanged();
    }

    while (!signal.aborted) {
      conversation = (await db.getFirstAsync<Conversation>('SELECT * FROM conversations WHERE id=?', initial.id))!;
      messages = await getMessages(db, conversation.id);
      const participantCount = messages.filter((item) => item.kind === 'participant').length;

      if (participantCount >= conversation.turn_limit * 3) {
        if (!conversation.report) {
          const report = await completeChat(moderator, [
            ...asHistory(conversation.topic, conversation.instructions, messages, conversation.reference_context),
            { role: 'user', content: 'Yukarıdaki tartışmanın içeriğine bağlı kalarak Türkçe nihai rapor hazırla. Başlıklar: Kısa özet; Katılımcıların temel görüşleri; En güçlü argümanlar ve önemli itirazlar; Ortak noktalar; Görüş ayrılıkları; Eksik bilgi/doğrulanması gereken varsayımlar; Dengeli değerlendirme; Sonuç ve açık kalan sorular. Konuşmada olmayan bilgi veya kaynak uydurma.' },
          ], signal);
          await updateConversation(db, conversation.id, { report: report.text, status: 'completed' });
          onChanged();
        }
        return;
      }

      const lastParticipant = [...messages].reverse().find((item) => item.kind === 'participant');
      if (lastParticipant) {
        const note = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM messages WHERE kind='moderator-note' AND reply_to_message_id=?`, lastParticipant.id,
        );
        if (!note) {
          await moderateAfter(db, conversation, moderator, lastParticipant, signal);
          onChanged();
          continue;
        }
      }

      const turnIndex = Math.floor(participantCount / 3);
      const position = participantCount % 3;
      const speaker = orderedSpeakers(participants, turnIndex)[position];
      if (!speaker) throw new Error('Sıradaki konuşmacı belirlenemedi.');
      const nextTurn = turnIndex + 1;
      const history = asHistory(conversation.topic, conversation.instructions, messages, conversation.reference_context);
      history.push({ role: 'user', content: `${speaker.name} olarak konuş. Önceki argümanlara doğrudan yanıt ver. Kendi görüşünü ve gerekçelerini açıkla; belirsizliği belirt; saygılı ve konuya bağlı kal. Bu konuşma ${nextTurn}. turun ${position + 1}. söz hakkıdır.` });
      const reply = await completeChat(speaker, history, signal);
      const saved = await saveAIMessage(db, conversation.id, speaker, 'participant', reply.text, nextTurn, reply);
      onChanged();
      await moderateAfter(db, conversation, moderator, saved, signal);
      onChanged();
    }
  } catch (error) {
    if (signal.aborted || (error instanceof Error && error.name === 'AbortError')) return;
    await updateConversation(db, initial.id, { status: 'paused' });
    throw error;
  }
  if (signal.aborted) await updateConversation(db, initial.id, { status: 'paused' });
  onChanged();
}
