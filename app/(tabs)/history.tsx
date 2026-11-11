import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { deleteConversation, listConversations, updateConversation, type Conversation } from '../../src/db/sessions';
import { palette } from '../../src/ui/colors';

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [archived, setArchived] = useState(false);
  const [items, setItems] = useState<Conversation[]>([]);
  const [editing, setEditing] = useState<Conversation | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const refresh = useCallback(async () => setItems(await listConversations(db, { archived, query })), [db, archived, query]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const confirmDelete = (item: Conversation) => Alert.alert('Tartışmayı sil?', `“${item.title}” ve tüm mesajları kalıcı olarak silinecek.`, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Sil', style: 'destructive', onPress: () => { void deleteConversation(db, item.id).then(refresh); } },
  ]);
  const beginRename = (item: Conversation) => { setEditing(item); setNewTitle(item.title); };
  const saveRename = async () => {
    if (!editing || !newTitle.trim()) return;
    await updateConversation(db, editing.id, { title: newTitle.trim() });
    setEditing(null); await refresh();
  };

  return (
    <>
      <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>KİŞİSEL ARŞİV</Text>
        <Text style={styles.heading}>Tartışma geçmişi</Text>
        <Text style={styles.lead}>Her oturum ayrı saklanır. Açmak tartışmayı kendiliğinden devam ettirmez.</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder="Başlık veya mesajlarda ara" placeholderTextColor="#89928F" style={styles.search} />
        <View style={styles.switchRow}>
          <Pressable onPress={() => setArchived(false)} style={[styles.pill, !archived && styles.pillActive]}><Text style={[styles.pillText, !archived && styles.pillTextActive]}>Aktif</Text></Pressable>
          <Pressable onPress={() => setArchived(true)} style={[styles.pill, archived && styles.pillActive]}><Text style={[styles.pillText, archived && styles.pillTextActive]}>Arşiv</Text></Pressable>
        </View>
        {items.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Henüz tartışma yok</Text><Text style={styles.emptyText}>{query ? 'Bu aramayla eşleşen bir oturum bulunamadı.' : 'Yeni bir tartışma oluşturduğunda burada görünecek.'}</Text></View> : items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Pressable style={{ flex: 1 }} onPress={() => router.push(`/conversation/${item.id}`)}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.topic} numberOfLines={2}>{item.topic}</Text>
              <Text style={styles.meta}>{statusLabel(item.status)} · {item.turn_limit} tur · {new Date(item.updated_at).toLocaleDateString('tr-TR')}</Text>
            </Pressable>
            <View style={styles.actions}>
              <Pressable onPress={() => beginRename(item)} hitSlop={8}><Text style={styles.action}>Başlık</Text></Pressable>
              <Pressable onPress={() => void updateConversation(db, item.id, { archived_at: item.archived_at ? null : new Date().toISOString() }).then(refresh)} hitSlop={8}><Text style={styles.action}>{item.archived_at ? 'Geri al' : 'Arşivle'}</Text></Pressable>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8}><Text style={[styles.action, { color: palette.danger }]}>Sil</Text></Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={styles.modalShade}><View style={styles.modalCard}><Text style={styles.modalTitle}>Başlığı değiştir</Text><TextInput value={newTitle} onChangeText={setNewTitle} style={styles.modalInput} autoFocus maxLength={120} selectTextOnFocus /><View style={styles.modalActions}><Pressable onPress={() => setEditing(null)}><Text style={styles.action}>Vazgeç</Text></Pressable><Pressable onPress={() => void saveRename()}><Text style={styles.action}>Kaydet</Text></Pressable></View></View></View>
      </Modal>
    </>
  );
}

function statusLabel(status: Conversation['status']): string {
  return ({ draft: 'Taslak', running: 'Devam ediyor', paused: 'Duraklatıldı', completed: 'Tamamlandı', cancelled: 'İptal edildi' })[status];
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas }, content: { padding: 20, paddingBottom: 34 }, eyebrow: { color: palette.teal, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 10 }, heading: { color: palette.ink, fontSize: 28, fontWeight: '800', marginTop: 7 }, lead: { color: palette.muted, fontSize: 14, lineHeight: 20, marginTop: 7, marginBottom: 18 }, search: { backgroundColor: palette.paper, height: 48, borderWidth: 1, borderColor: palette.line, borderRadius: 13, paddingHorizontal: 14, color: palette.ink }, switchRow: { flexDirection: 'row', gap: 8, marginVertical: 15 }, pill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E8E9E5' }, pillActive: { backgroundColor: palette.teal }, pillText: { fontSize: 13, fontWeight: '700', color: palette.muted }, pillTextActive: { color: '#fff' }, card: { backgroundColor: palette.paper, borderColor: palette.line, borderWidth: 1, borderRadius: 15, padding: 14, marginBottom: 10 }, title: { color: palette.ink, fontSize: 15, fontWeight: '800' }, topic: { color: palette.muted, fontSize: 13, marginTop: 4, lineHeight: 18 }, meta: { color: palette.muted, fontSize: 11, marginTop: 8 }, actions: { flexDirection: 'row', gap: 17, paddingTop: 12, marginTop: 10, borderTopWidth: 1, borderTopColor: palette.line }, action: { color: palette.teal, fontSize: 12, fontWeight: '700' }, empty: { alignItems: 'center', backgroundColor: palette.paper, padding: 28, borderRadius: 15, borderWidth: 1, borderColor: palette.line, marginTop: 20 }, emptyTitle: { fontSize: 15, color: palette.ink, fontWeight: '800' }, emptyText: { color: palette.muted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  modalShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.36)', justifyContent: 'center', padding: 26 }, modalCard: { backgroundColor: palette.paper, borderRadius: 17, padding: 17 }, modalTitle: { color: palette.ink, fontWeight: '800', fontSize: 17, marginBottom: 12 }, modalInput: { height: 46, borderWidth: 1, borderColor: palette.line, borderRadius: 11, paddingHorizontal: 11, color: palette.ink }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 22, marginTop: 17 },
});
