# Alistedi Android APK — Geliştirme Planı

## Amaç ve kapsam

Kişisel kullanım için, GitHub’da herkese açık kaynak koduyla geliştirilen bir Android uygulaması. Kullanıcı bir konu açar; moderatör ve üç eşit tartışmacı belirlenmiş kurallarla çok turlu tartışma yürütür. Her tartışma bağımsız ve kalıcıdır; uygulama geçmiş sohbetleri listeler, geri açar ve dışa aktarır. Teslim hedefi, Android cihaza yüklenebilir APK’dır.

## Teknik yaklaşım

- **İstemci:** Expo + React Native + TypeScript; Android öncelikli, dikey ekran ve tek elle kullanım.
- **Kalıcı tartışma verisi:** cihazda SQLite; oturum, ayarlar, mesajlar, tur/sıra bilgisi ve raporlar oturum kimlikleriyle birbirinden ayrılır.
- **API anahtarı saklama:** Android Keystore kullanan `expo-secure-store`. Anahtarlar APK’ya, GitHub’a veya sohbet veritabanına yazılmaz. Kaynak kod herkese açık olduğu için `.env`/gizli değerler commit edilmez.
- **AI sağlayıcıları:** Groq ve OpenAI-uyumlu API’lere genişletilebilir sağlayıcı/model adaptörü. Anahtar ve sağlayıcı/model seçimi uygulama ayarlarından yapılır; moderatör ve her tartışmacı için ayrı model seçimi desteklenir.
- **Akış dayanıklılığı:** her başarılı yanıt üretildiği anda SQLite’a yazılır. Hata veya uygulama kapanması tamamlanmış mesajları silmez; kaldığı yerden sürdürme güvenli adımlarla yapılır. Geçmiş oturum yalnızca görüntüleme modunda açılır.
- **Maliyet:** sağlayıcı yanıtında kullanım bilgisi varsa oturum bazında token ve yaklaşık maliyet kaydı gösterilir; sağlayıcı fiyatı/ölçümü yoksa tahmin olmadığı açıkça belirtilir.
- **APK üretimi:** Expo uyumlu Android build akışı hazırlanır; imzalı APK üretimi kullanıcıya açık adımlarla anlatılır. Gerçek APK yalnızca build aracı/kimlik bilgileriyle başarılı derleme doğrulanırsa teslim edilmiş sayılır.

## Tartışma akışı ve ürün kuralları

- Varsayılan 10 tur; her tur üç tartışmacının birer yanıtıdır, toplam 30 yanıt.
- Konuşma sırası turlar arasında döner; üç tartışmacının söz hakkı eşittir.
- Katılımcılara ilk konu ve kendi oturumunda kendisinden önce yazılan tüm tartışma mesajları bağlam olarak verilir. Başka oturumlar bağlama kendiliğinden katılmaz.
- Moderatör akışı/sırayı yönetir, gerekirse açıklama veya karşı görüş ister; katılımcıların yerine argüman üretmez ve tartışmayı tek görüşe zorlamaz.
- 10. tur tamamlanınca moderatör rapor üretir ve oturum tamamlanır; yeni tura/tartışmaya otomatik geçilmez.
- Rapor, kısa özet, katılımcı görüşleri, güçlü argümanlar/itirazlar, ortak noktalar/anlaşmazlıklar, doğrulanması gereken varsayımlar, dengeli değerlendirme ve açık soruları kapsar; konuşmada olmayan kaynak/iddia uydurmaz.

## Uygulama yapısı

```text
app/                    Expo Router ekranları (sohbet, geçmiş, ayarlar)
components/             Mesaj kartı, tur göstergesi, modal ve ortak UI
src/db/                 SQLite şeması, migrasyonlar ve oturum/mesaj depoları
src/ai/                 Sağlayıcı arayüzü, Groq/OpenAI-uyumlu istemci, prompt üretimi
src/discussion/          Tur planlayıcısı, moderasyon, devam/duraklatma ve rapor akışı
src/security/            SecureStore anahtar kasası
src/export/              Markdown/TXT üretimi ve paylaşımı
assets/                 Uygulama ikonu ve açılış görselleri
```

## Tasarım yönü

- **Olası yönler:** Sessiz editoryal masa %0.08; koyu stüdyo konsolu %0.06; sıcak not defteri %0.04.
- **Seçilen yön — Sessiz editoryal masa:** okunabilir, güven veren ve tartışmanın içeriğini öne çıkaran sade mobil arayüz.
- **Temel ilkeler:** konuşmacıların açık kimliği; tur ve ilerlemenin görünürlüğü; geçmiş oturumların ayrılığı; kritik işlemlerde anlaşılır geri bildirim.
- **Renk yaklaşımı:** açık kırık beyaz zemin, koyu mürekkep metni ve kontrollü teal vurgu; her katılımcıya düşük doygunluklu ayrı renk.
- **Yerleşim:** tek sütun mesaj akışı, açılır sohbet geçmişi, alt sabit yazma/çalıştırma alanı; rapor ayrı sekme/alan.
- **İmza öğeleri:** tur numarasını taşıyan küçük zaman çizgisi; konuşmacı rengi/etiketi; tamamlanmış rapor için editoryal özet kartı.
- **Etkileşim ve hareket:** sade geçişler; ilerleme ve bekleme durumu görünür; yıkıcı silme için onay; duraklat/iptal kontrolleri açık.
- **Tipografi:** sistem sans-serif; başlıklarda güçlü ağırlık, tartışma metninde rahat satır aralığı.
- **Marka:** Alistedi, kişisel yapay zekâ tartışma masası; dengeli, meraklı, düzenli.
- **Ses tonu:** kısa ve tarafsız. Örnek: “Yeni tartışma başlat”; “Bu oturum tamamlandı — rapor hazır.”
- **Logo/ikon:** üç konuşma izinin dengeli bir merkez etrafında buluştuğu, küçük ölçekte okunabilir geometrik işaret.
- **Marka rengi:** Alistedi’ye özgü koyu teal.

## Uygulama aşamaları

1. Expo/React Native temelini kur, ekran iskeletini ve tasarım sistemini hazırla.
2. SQLite şemasını ve oturum/mesaj geçmişi işlemlerini uygula.
3. SecureStore ve sağlayıcı/model ayarlarını ekle.
4. Bir AI sağlayıcısıyla uçtan uca moderatör + üç tartışmacı akışını çalıştır; ardından diğer sağlayıcı uyumluluğunu ekle.
5. Duraklatma/hata/devam, rapor, arama, başlık/arşiv/silme ve dışa aktarma özelliklerini tamamla.
6. Tip/derleme kontrollerini yap, Android build ayarlarını hazırla ve APK üretim yönergesini doğrula.
