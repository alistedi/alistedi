import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { createConversation, DEFAULT_PARTICIPANTS, getConversation, listConversations, type Conversation, type ParticipantConfig } from '../../src/db/sessions';
import { loadParticipantConfig } from '../../src/ai/config';
import { palette } from '../../src/ui/colors';

export default function NewDiscussionScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams<{ referenceId?: string }>();
  const referenceId = typeof params.referenceId === 'string' ? params.referenceId : null;
  const [reference, setReference] = useState<Conversation | null>(null);
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [turns, setTurns] = useState('10');
  const [participants, setParticipants] = useState<ParticipantConfig[]>(DEFAULT_PARTICIPANTS);
  const [recent, setRecent] = useState<Conversation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const [configs, sessions, source] = await Promise.all([
      loadParticipantConfig(db), listConversations(db), referenceId ? getConversation(db, referenceId) : Promise.resolve(null),
    ]);
    setParticipants(configs); setRecent(sessions.slice(0, 3)); setReference(source);
  }, [db, referenceId]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const start = async () => {
    if (!topic.trim()) { setError('Önce tartışma konusunu yaz.'); return; }
    const turnLimit = Math.max(1, Math.min(20, Number.parseInt(turns, 10) || 10));
    setBusy(true); setError('');
    try {
      const id = await createConversation(db, { topic, instructions, turnLimit, participants, referenceSessionId: reference?.id });
      router.push(`/conversation/${id}`);
      setTopic(''); setInstructions(''); setTurns('10');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tartışma kaydedilemedi.');
    } finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.markText}>A</Text></View><Text style={styles.brand}>Alistedi</Text></View>
      <Text style={styles.eyebrow}>YENİ OTURUM</Text>
      <Text style={styles.heading}>Bir konuyu birlikte tartışın.</Text>
      <Text style={styles.lead}>Bir moderatör, üç farklı bakış açısı. Bu oturum kendi geçmişinde saklanır.</Text>

      {reference ? <View style={styles.referenceCard}><View style={{ flex: 1 }}><Text style={styles.referenceLabel}>ÖNCEKİ TARTIŞMA REFERANSI</Text><Text style={styles.referenceTitle} numberOfLines={2}>{reference.title}</Text><Text style={styles.referenceText}>Yalnızca bu açık seçimle eski tartışmanın bağlamı yeni, bağımsız oturuma eklenecek. Eski kayıt değişmeyecek.</Text></View><Pressable onPress={() => router.replace('/')} hitSlop={8}><Text style={styles.removeReference}>Kaldır</Text></Pressable></View> : null}

      <View style={styles.formCard}>
        <Text style={styles.label}>Tartışma konusu</Text>
        <TextInput value={topic} onChangeText={setTopic} placeholder="Örn. Uzaktan çalışma verimliliği artırır mı?" placeholderTextColor="#89928F" style={styles.input} multiline />
        <Text style={styles.label}>Moderatöre ek talimat <Text style={styles.optional}>(isteğe bağlı)</Text></Text>
        <TextInput value={instructions} onChangeText={setInstructions} placeholder="Tartışmanın sınırlarını veya özellikle ele alınmasını istediğin noktaları yaz." placeholderTextColor="#89928F" style={[styles.input, styles.instructions]} multiline />
        <View style={styles.turnRow}>
          <View style={{ flex: 1 }}><Text style={styles.label}>Tur sayısı</Text><Text style={styles.helper}>Bir turda her katılımcı bir kez konuşur.</Text></View>
          <TextInput value={turns} onChangeText={setTurns} keyboardType="number-pad" style={styles.turnInput} maxLength={2} />
        </View>
        <View style={styles.roster}>
          {participants.map((person, index) => <View key={person.id} style={styles.personRow}><View style={[styles.dot, { backgroundColor: [palette.teal, palette.speakerA, palette.speakerB, palette.speakerC][index] }]} /><Text style={styles.personName}>{person.name}</Text><Text style={styles.modelName}>{person.model || 'Model seçilmedi'}</Text></View>)}
        </View>
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }, busy && { opacity: 0.6 }]} onPress={start} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Tartışmayı oluştur</Text>}
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.footnote}>AI kullanımı, seçtiğin sağlayıcının API ücretlerine tabi olabilir.</Text>
      </View>

      {recent.length > 0 && <View style={styles.recentBlock}><View style={styles.sectionRow}><Text style={styles.sectionTitle}>Son tartışmalar</Text><Pressable onPress={() => router.push('/history')}><Text style={styles.link}>Tümünü gör</Text></Pressable></View>{recent.map((item) => <Pressable key={item.id} style={styles.recentItem} onPress={() => router.push(`/conversation/${item.id}`)}><View style={{ flex: 1 }}><Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.recentMeta}>{item.status === 'completed' ? 'Rapor hazır' : `${item.turn_limit} tur · ${new Date(item.updated_at).toLocaleDateString('tr-TR')}`}</Text></View><Text style={styles.arrow}>›</Text></Pressable>)}</View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas }, content: { padding: 20, paddingBottom: 36 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 26, gap: 10 }, brandMark: { width: 36, height: 36, borderRadius: 12, backgroundColor: palette.teal, alignItems: 'center', justifyContent: 'center' }, markText: { color: '#fff', fontWeight: '800', fontSize: 20 }, brand: { color: palette.ink, fontWeight: '800', fontSize: 20, letterSpacing: -0.5 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: palette.teal, letterSpacing: 1.4, marginBottom: 8 }, heading: { color: palette.ink, fontSize: 29, lineHeight: 35, letterSpacing: -0.8, fontWeight: '800', maxWidth: 340 }, lead: { color: palette.muted, fontSize: 15, lineHeight: 22, marginTop: 9, marginBottom: 20, maxWidth: 400 },
  referenceCard: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: palette.tealSoft, borderColor: '#BBDAD1', borderWidth: 1, borderRadius: 15, padding: 13, marginBottom: 13 }, referenceLabel: { color: palette.teal, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 }, referenceTitle: { color: palette.ink, fontWeight: '800', fontSize: 14, marginTop: 4 }, referenceText: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }, removeReference: { color: palette.danger, fontWeight: '700', fontSize: 12 },
  formCard: { backgroundColor: palette.paper, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: palette.line }, label: { color: palette.ink, fontSize: 14, fontWeight: '700', marginBottom: 8 }, optional: { fontWeight: '400', color: palette.muted }, input: { minHeight: 56, borderWidth: 1, borderColor: palette.line, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, color: palette.ink, fontSize: 15, marginBottom: 17, textAlignVertical: 'top' }, instructions: { minHeight: 86 },
  turnRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 17 }, helper: { color: palette.muted, fontSize: 12, marginTop: -3 }, turnInput: { width: 62, height: 44, borderWidth: 1, borderColor: palette.line, borderRadius: 12, textAlign: 'center', color: palette.ink, fontSize: 18, fontWeight: '700' }, roster: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 13, marginBottom: 16, gap: 12 }, personRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, dot: { width: 8, height: 8, borderRadius: 4 }, personName: { color: palette.ink, fontSize: 13, fontWeight: '600', flex: 1 }, modelName: { color: palette.muted, fontSize: 11 },
  primaryButton: { minHeight: 50, backgroundColor: palette.teal, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' }, error: { color: palette.danger, marginTop: 9, fontSize: 13 }, footnote: { color: palette.muted, fontSize: 11, textAlign: 'center', marginTop: 12 },
  recentBlock: { marginTop: 26 }, sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, sectionTitle: { color: palette.ink, fontWeight: '800', fontSize: 17 }, link: { color: palette.teal, fontWeight: '700', fontSize: 13 }, recentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.paper, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: palette.line }, recentTitle: { color: palette.ink, fontWeight: '700', fontSize: 14 }, recentMeta: { color: palette.muted, fontSize: 12, marginTop: 4 }, arrow: { color: palette.teal, fontSize: 25, marginLeft: 12 },
});
