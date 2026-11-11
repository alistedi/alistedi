import type { Conversation, Message } from '../db/sessions';

export function exportConversationMarkdown(conversation: Conversation, messages: Message[]): string {
  const lines = [
    `# ${conversation.title}`,
    '',
    `**Konu:** ${conversation.topic}`,
    `**Durum:** ${conversation.status}`,
    `**Oluşturulma:** ${new Date(conversation.created_at).toLocaleString('tr-TR')}`,
    '',
    '## Tartışma',
    '',
  ];
  for (const message of messages) {
    if (message.kind === 'report') continue;
    const turn = message.turn_number > 0 ? ` · Tur ${message.turn_number}` : '';
    lines.push(`### ${message.speaker_name}${turn}`, '', message.body, '');
  }
  if (conversation.report) lines.push('## Nihai Rapor', '', conversation.report, '');
  return `${lines.join('\n').trim()}\n`;
}
