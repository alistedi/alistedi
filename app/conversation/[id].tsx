import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { runDiscussion } from '../../src/discussion/engine';
import { exportConversationMarkdown } from '../../src/export/markdown';
import { getConversation, getMessages, updateConversation, type Conversation, type Message } from '../../src/db/sessions';
import { palette } from '../../src/ui/colors';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView> | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    const [session, items] = await Promise.all([getConversation(db, id), getMessages(db, id)]);
    setConversation(session); setMessages(items);
    if (session) navigation.setOptions({ title: session.title });
  }, [db, id, navigation]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { scroll.current?.scrollToEnd({ animated: true }); }, [messages.length, conversation?.report]);

  const run = async () => {
    if (!conversation || working) return;
    setWorking(true); setError('');
    const abortController = new AbortController(); controller.current = abortController;
    try { await runDiscussion(db, conversation, abortController.signal, () => { void refresh(); }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Tartışma sırasında beklenmeyen bir hata oluştu.'); }
    finally { controller.current = null; setWorking(false); await refresh(); }
  };

  const pause = async () => {
    controller.current?.abort();
    if (conversation) await updateConversation(db, conversation.id, { status: 'paused' });
    setWorking(false); await refresh();
  };
  const cancel = () => Alert.alert('Tartışmayı iptal et?', 'Kaydedilmiş mesajlar korunur. Bu oturum yeniden devam ettirilemez.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'İptal et', style: 'destructive', onPress: () => { controller.current?.abort(); if (conversation) void updateConversation(db, conversation.id, { status: 'cancelled' }).then(refresh); } },
  ]);

  const exportFile = async () => {
    if (!conversation) return;
    try {
      const text = exportConversationMarkdown(conversation, messages);
      const safeName = conversation.title.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').slice(0, 48) || 'alistedi-tartisma';
      const file = new File(Paths.cache, `${safeName}.md`);
      if (file.exists) file.delete();
      file.create(); await file.write(text);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'text/markdown', dialogTitle: 'Tartışmayı dışa aktar' });
      else Alert.alert('Paylaşım kullanılamıyor', 'Bu cihazda dışa aktarma paylaşım menüsü kullanılamıyor.');
    } catch (cause) { Alert.alert('Dışa aktarılamadı', cause instanceof Error ? cause.message : 'Dosya oluşturulamadı.'); }
  };

  if (!conversation) return <View style={styles.center}><ActivityIndicator color={palette.teal} /><Text style={styles.loading}>Oturum açılıyor…</Text></View>;
  const speakerCount = messages.filter((message) => message.kind === 'participant').length;
  const tokenCount = messages.reduce((total, message) => total + (message.input_tokens ?? 0) + (message.output_tokens ?? 0), 0);
  const status = ({ draft: 'Taslak', running: 'Devam ediyor', paused: 'Duraklatıldı', completed: 'Tamamlandı', cancelled: 'İptal edildi' } as const)[conversation.status];

  return (
    <View style={styles.page}>
      <View style={styles.summary}>
        <Text style={styles.title}>{conversation.title}</Text>
        <Text style={styles.topic}>{conversation.topic}</Text>
        {conversation.reference_session_id ? <Text style={styles.referenceNotice}>Bu yeni oturum, seçtiğin eski tartışmayı bağlam olarak içerir. Eski oturum değiştirilmez.</Text> : null}
        <View style={styles.progressRow}><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, (speakerCount / (conversation.turn_limit * 3)) * 100)}%` }]} /></View><Text style={styles.progressText}>{Math.floor(speakerCount / 3)}/{conversation.turn_limit} tur</Text></View>
        <View style={styles.statusRow}><View style={[styles.statusDot, { backgroundColor: conversation.status === 'completed' ? palette.teal : conversation.status === 'running' ? palette.amber : palette.muted }]} /><Text style={styles.statusText}>{working ? 'Yanıtlar hazırlanıyor…' : status}</Text><Text style={styles.total}>{speakerCount}/{conversation.turn_limit * 3} yanıt{tokenCount ? ` · ${tokenCount.toLocaleString('tr-TR')} token` : ''}</Text></View>
      </View>
      <ScrollView ref={scroll} style={styles.feed} contentContainerStyle={styles.feedContent}>
        {messages.length === 0 && <View style={styles.empty}><Text style={styles.emptyTitle}>Tartışma hazır</Text><Text style={styles.emptyText}>Başlattığında önce moderatör konuyu çerçeveleyecek. Ardından üç katılımcı eşit ve dönüşümlü sırayla konuşacak.</Text></View>}
        {messages.map((message) => <MessageCard key={message.id} message={message} />)}
        {conversation.report && <View style={styles.report}><Text style={styles.reportEyebrow}>SON RAPOR</Text><Text style={styles.reportBody}>{conversation.report}</Text></View>}
        {error ? <View style={styles.errorBox}><Text style={styles.errorTitle}>Yanıt alınamadı</Text><Text style={styles.errorText}>{error}</Text><Text style={styles.errorHint}>Önceki başarılı mesajlar kaydedildi. Ayarları kontrol edip kaldığın yerden devam edebilirsin.</Text></View> : null}
      </ScrollView>
      <View style={styles.controls}>
        {working ? <><Pressable style={styles.secondary} onPress={() => void pause()}><Text style={styles.secondaryText}>Duraklat</Text></Pressable><Pressable style={styles.cancel} onPress={cancel}><Text style={styles.cancelText}>İptal</Text></Pressable></> : conversation.status === 'completed' || conversation.status === 'cancelled' ? <Pressable style={[styles.secondary, { flex: 1 }]} onPress={() => void exportFile()}><Text style={styles.secondaryText}>Markdown dışa aktar</Text></Pressable> : <Pressable style={[styles.primary, { flex: 1 }]} onPress={() => void run()}><Text style={styles.primaryText}>{conversation.status === 'paused' || conversation.status === 'running' ? 'Tartışmaya devam et' : 'Tartışmayı başlat'}</Text></Pressable>}
        {!working && <Pressable style={styles.secondary} onPress={() => router.push({ pathname: '/', params: { referenceId: conversation.id } })}><Text style={styles.secondaryText}>Yeniye referans ver</Text></Pressable>}
      </View>
    </View>
  );
}

function MessageCard({ message }: { message: Message }) {
  const speakerColor = message.speaker_id === 'speaker-a' ? palette.speakerA : message.speaker_id === 'speaker-b' ? palette.speakerB : message.speaker_id === 'speaker-c' ? palette.speakerC : palette.teal;
  const isModerator = message.kind === 'moderator' || message.kind === 'moderator-note';
  return <View style={[styles.message, isModerator && styles.moderatorMessage]}>
    <View style={styles.messageHead}><View style={[styles.speakerDot, { backgroundColor: speakerColor }]} /><Text style={[styles.speaker, { color: speakerColor }]}>{message.speaker_name}</Text>{message.turn_number > 0 && <Text style={styles.turnBadge}>Tur {message.turn_number}</Text>}</View>
    <Text style={styles.body}>{message.body}</Text>
    {message.input_tokens || message.output_tokens ? <Text style={styles.tokenMeta}>{(message.input_tokens ?? 0) + (message.output_tokens ?? 0)} token</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.canvas }, loading: { color: palette.muted, marginTop: 8 },
  summary: { padding: 16, backgroundColor: palette.paper, borderBottomColor: palette.line, borderBottomWidth: 1 }, title: { color: palette.ink, fontWeight: '800', fontSize: 19 }, topic: { color: palette.muted, fontSize: 13, marginTop: 5, lineHeight: 18 }, referenceNotice: { color: palette.teal, fontSize: 11, lineHeight: 16, marginTop: 7 }, progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }, progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#E4E8E4', overflow: 'hidden' }, progressFill: { height: 6, borderRadius: 3, backgroundColor: palette.teal }, progressText: { color: palette.ink, fontSize: 12, fontWeight: '700' }, statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 }, statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 }, statusText: { fontSize: 12, color: palette.muted, fontWeight: '600' }, total: { marginLeft: 'auto', color: palette.muted, fontSize: 11 },
  feed: { flex: 1 }, feedContent: { padding: 15, paddingBottom: 22 }, empty: { padding: 20, backgroundColor: palette.paper, borderRadius: 16, borderWidth: 1, borderColor: palette.line, marginTop: 10 }, emptyTitle: { color: palette.ink, fontSize: 15, fontWeight: '800' }, emptyText: { color: palette.muted, fontSize: 13, lineHeight: 20, marginTop: 7 }, message: { backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.line, borderRadius: 15, padding: 14, marginBottom: 10 }, moderatorMessage: { backgroundColor: '#EAF2EF', borderColor: '#D5E5DF' }, messageHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }, speakerDot: { width: 8, height: 8, borderRadius: 4 }, speaker: { fontSize: 12, fontWeight: '800', flex: 1 }, turnBadge: { color: palette.muted, fontSize: 10, fontWeight: '700', backgroundColor: '#EFF1ED', borderRadius: 10, overflow: 'hidden', paddingVertical: 3, paddingHorizontal: 7 }, body: { color: palette.ink, fontSize: 14, lineHeight: 21 }, tokenMeta: { color: palette.muted, fontSize: 10, marginTop: 9, textAlign: 'right' }, report: { backgroundColor: '#183C39', padding: 17, borderRadius: 16, marginTop: 8, marginBottom: 8 }, reportEyebrow: { color: '#A9D9CB', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 9 }, reportBody: { color: '#F5F8F5', fontSize: 14, lineHeight: 21 }, errorBox: { backgroundColor: '#FFF0ED', borderColor: '#EEC9C2', borderWidth: 1, borderRadius: 14, padding: 14 }, errorTitle: { color: palette.danger, fontWeight: '800', fontSize: 14 }, errorText: { color: palette.ink, fontSize: 13, lineHeight: 19, marginTop: 5 }, errorHint: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 7 },
  controls: { flexDirection: 'row', padding: 13, gap: 9, backgroundColor: palette.paper, borderTopWidth: 1, borderTopColor: palette.line }, primary: { minHeight: 48, borderRadius: 13, backgroundColor: palette.teal, justifyContent: 'center', alignItems: 'center' }, primaryText: { color: '#fff', fontWeight: '800', fontSize: 14 }, secondary: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 11, justifyContent: 'center', alignItems: 'center' }, secondaryText: { color: palette.teal, fontWeight: '800', fontSize: 12 }, cancel: { minHeight: 48, borderRadius: 13, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF0ED' }, cancelText: { color: palette.danger, fontWeight: '800', fontSize: 13 },
});
