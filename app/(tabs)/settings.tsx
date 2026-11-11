import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { loadParticipantConfig, saveApiKey, saveParticipantConfig } from '../../src/ai/config';
import { DEFAULT_PARTICIPANTS, type ParticipantConfig } from '../../src/db/sessions';
import { createBackupJson } from '../../src/export/backup';
import { palette } from '../../src/ui/colors';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [config, setConfig] = useState<ParticipantConfig[]>(DEFAULT_PARTICIPANTS);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [clear, setClear] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const refresh = useCallback(async () => {
    setConfig(await loadParticipantConfig(db));
    setSecrets({}); setClear({}); setSaved(false);
  }, [db]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const patch = (id: string, field: keyof ParticipantConfig, value: string) => {
    setConfig((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
    setSaved(false);
  };
  const keyGroups = Array.from(new Map(config.map((item) => [item.baseUrl.trim(), item])).values());

  const save = async () => {
    setBusy(true); setSaved(false);
    try {
      await saveParticipantConfig(db, config);
      for (const item of keyGroups) {
        if (clear[item.baseUrl]) await saveApiKey(item, '');
        else if (secrets[item.baseUrl]?.trim()) await saveApiKey(item, secrets[item.baseUrl]);
      }
      setSecrets({}); setClear({}); setSaved(true);
    } catch (cause) {
      Alert.alert('Kaydedilemedi', cause instanceof Error ? cause.message : 'Ayarlar saklanamadı.');
    } finally { setBusy(false); }
  };

  const exportBackup = async () => {
    setBusy(true);
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File(Paths.cache, `alistedi-yedek-${stamp}.json`);
      if (file.exists) file.delete();
      file.create();
      await file.write(await createBackupJson(db));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Alistedi yedeğini paylaş' });
      else Alert.alert('Paylaşım kullanılamıyor', 'Bu cihazda dosya paylaşımı kullanılamıyor.');
    } catch (cause) {
      Alert.alert('Yedek oluşturulamadı', cause instanceof Error ? cause.message : 'Dosya hazırlanamadı.');
    } finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>KİŞİSEL AYARLAR</Text>
      <Text style={styles.heading}>AI modelleri</Text>
      <Text style={styles.lead}>OpenAI uyumlu API adresleri kullanılabilir. Anahtarlar Android’in güvenli cihaz deposunda saklanır; GitHub’a veya sohbet veritabanına yazılmaz.</Text>
      {config.map((item, index) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHead}><View style={[styles.dot, { backgroundColor: [palette.teal, palette.speakerA, palette.speakerB, palette.speakerC][index] }]} /><Text style={styles.cardTitle}>{item.name}</Text></View>
          <Text style={styles.label}>Sağlayıcı adı</Text>
          <TextInput value={item.provider} onChangeText={(value) => patch(item.id, 'provider', value)} style={styles.input} placeholder="Groq" placeholderTextColor="#89928F" />
          <Text style={styles.label}>API adresi</Text>
          <TextInput value={item.baseUrl} onChangeText={(value) => patch(item.id, 'baseUrl', value)} style={styles.input} autoCapitalize="none" keyboardType="url" placeholder="https://api.groq.com/openai/v1" placeholderTextColor="#89928F" />
          <Text style={styles.label}>Model adı</Text>
          <TextInput value={item.model} onChangeText={(value) => patch(item.id, 'model', value)} style={styles.input} autoCapitalize="none" placeholder="Sağlayıcıdaki model kimliği" placeholderTextColor="#89928F" />
        </View>
      ))}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>API anahtarları</Text>
        <Text style={styles.help}>Aynı API adresini kullanan roller aynı anahtarı paylaşır. Kaydedilmiş anahtar ekranda tekrar gösterilmez. Değiştirmeyeceksen alanı boş bırak.</Text>
        {keyGroups.map((item) => (
          <View key={item.baseUrl} style={{ marginTop: 14 }}>
            <Text style={styles.label}>{item.provider || 'Sağlayıcı'} · {item.baseUrl || 'API adresi girilmedi'}</Text>
            <TextInput value={secrets[item.baseUrl] ?? ''} onChangeText={(value) => { setSecrets((current) => ({ ...current, [item.baseUrl]: value })); setClear((current) => ({ ...current, [item.baseUrl]: false })); }} style={styles.input} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Yeni API anahtarı" placeholderTextColor="#89928F" />
            <Pressable onPress={() => setClear((current) => ({ ...current, [item.baseUrl]: !current[item.baseUrl] }))}><Text style={[styles.link, clear[item.baseUrl] && { color: palette.danger }]}>{clear[item.baseUrl] ? 'Anahtar kaydı silinecek' : 'Bu sağlayıcının kayıtlı anahtarını sil'}</Text></Pressable>
          </View>
        ))}
      </View>
      <Pressable style={({ pressed }) => [styles.save, pressed && { opacity: 0.85 }, busy && { opacity: 0.6 }]} onPress={() => void save()} disabled={busy}><Text style={styles.saveText}>{busy ? 'Kaydediliyor…' : saved ? 'Kaydedildi' : 'Ayarları kaydet'}</Text></Pressable>
      <Pressable style={styles.backupButton} onPress={() => void exportBackup()} disabled={busy}><Text style={styles.backupText}>{busy ? 'İşlem sürüyor…' : 'Tüm tartışmaların JSON yedeğini dışa aktar'}</Text></Pressable>
      <Text style={styles.warning}>Yedek; tartışmaları ve uygulama ayarlarını içerir, API anahtarlarını içermez. AI sağlayıcılarına gönderilen konu ve tartışma mesajları, o sağlayıcının gizlilik ve saklama koşullarına tabidir.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas }, content: { padding: 20, paddingBottom: 36 }, eyebrow: { color: palette.teal, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 10 }, heading: { color: palette.ink, fontSize: 28, fontWeight: '800', marginTop: 7 }, lead: { color: palette.muted, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 17 }, card: { backgroundColor: palette.paper, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 15, marginBottom: 11 }, cardHead: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 15 }, dot: { width: 9, height: 9, borderRadius: 5 }, cardTitle: { color: palette.ink, fontWeight: '800', fontSize: 15 }, label: { color: palette.ink, fontSize: 12, fontWeight: '700', marginBottom: 6 }, input: { minHeight: 44, borderWidth: 1, borderColor: palette.line, borderRadius: 11, paddingHorizontal: 11, color: palette.ink, fontSize: 13, marginBottom: 12 }, help: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 7 }, link: { color: palette.teal, fontSize: 12, fontWeight: '700', marginTop: -5, marginBottom: 5 }, save: { minHeight: 50, backgroundColor: palette.teal, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 }, saveText: { color: '#fff', fontSize: 15, fontWeight: '800' }, backupButton: { minHeight: 47, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: palette.line, borderRadius: 13, marginTop: 12, paddingHorizontal: 10 }, backupText: { color: palette.teal, fontSize: 13, fontWeight: '700', textAlign: 'center' }, warning: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 13, textAlign: 'center' },
});
