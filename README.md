# Alistedi

Kişisel kullanım için Android uygulaması: bir moderatör ve üç AI tartışmacıyla çok turlu tartışmalar oluşturur. Proje Expo, React Native, TypeScript ve cihaz içi SQLite kullanır.

## Geliştirme ortamında çalıştırma

1. Node.js 22 LTS ve Git kurulu olsun.
2. Depoyu klonlayıp proje klasörüne geçin:

   ```bash
   git clone https://github.com/alistedi/alistedi.git
   cd alistedi
   npm ci
   ```

3. Expo geliştirme sunucusunu başlatın:

   ```bash
   npx expo start
   ```

Expo Go ile arayüz önizlenebilir. Tam yerel Android build için ayrıca Android SDK kurulu olmalıdır.

## AI sağlayıcısını ayarlama

Uygulamada **Ayarlar** sekmesini açın. Moderatör ve her tartışmacı için sağlayıcı adını, OpenAI uyumlu API adresini ve sağlayıcının beklediği model kimliğini girin. Örnek Groq adresi `https://api.groq.com/openai/v1` şeklindedir. Dört rol aynı adresi kullanıyorsa API anahtarını bir kez kaydetmeniz yeterlidir. Model kimliğini kullandığınız sağlayıcının güncel model listesinden doğrulayın.

API anahtarları `expo-secure-store` üzerinden Android’in güvenli depolamasında saklanır; kaynak koda, APK yapılandırmasına, SQLite mesajlarına veya Git geçmişine eklenmez. Alanı boş bırakmak kayıtlı anahtarı değiştirmez. Anahtarı kaldırmak için “Bu sağlayıcının kayıtlı anahtarını sil” seçeneğini işaretleyip ayarları kaydedin.

Konu ve tartışma mesajları yanıt üretmek için seçilen sağlayıcının API’sine gönderilir. Kullanım sağlayıcının fiyat ve kullanım sınırlarına tabidir. Oturum ekranında sağlayıcıdan gelen token kullanımı toplanır; sağlayıcı fiyatlarını karşılaştıran tahmini maliyet hesabı henüz yoktur. Anahtarları yalnızca güvendiğiniz cihazda kullanın.

## GitHub Actions ile APK üretme

Expo bu projede uygulama altyapısıdır; EAS bulut build’i zorunlu değildir. GitHub Actions `npx expo prebuild` ile Android projesini üretir ve Gradle ile imzalı APK’yı derler. Bunun için Expo hesabı veya yerel Android SDK gerekmez.

Her `main` dalı push’unda **Android APK** workflow’u otomatik çalışır. Elle başlatmak için GitHub deposunda **Actions → Android APK → Run workflow** yolunu izleyin. Başarılı çalışmanın `Summary`/`Artifacts` bölümünden **alistedi-android-apk** artifact’ini indirin. Artifact 30 gün saklanır. İlk başarılı build: [GitHub Actions run #43060388225](https://github.com/alistedi/alistedi/actions/runs/43060388225). APK `com.alistedi.app` kimliğiyle üretildi; indirdiğim APK’nın SHA-256 değeri `8eced0c4076260e0a94d5ee9f1ab1eca81c94c6fae8bdac871581f70df9e8ebe`.

Workflow APK’yı kişisel cihazda sideload etmek için üretir; Play Store yayını için tasarlanmamıştır. Android release varyantı sabit bir imzalama anahtarıyla imzalanır. Bu anahtar GitHub depo ayarlarında `ALISTEDI_DEBUG_KEYSTORE_B64` adlı Actions secret’ında tutulur; kaynak koda veya Git geçmişine eklenmemelidir. Aynı anahtarı korumak, sonraki APK’ları mevcut uygulamanın üzerine kurup cihazdaki sohbet verilerini saklayabilmek için önemlidir. Secret’ı silmeyin veya değiştirmeyin.

## Kayıtlar ve yedekleme

Tartışmalar cihazda `alistedi.db` SQLite veritabanında saklanır. API anahtarları ayrı tutulur. Bir oturumu açmak onu otomatik olarak devam ettirmez; eski oturumdaki **Yeniye referans ver** eylemi yeni oturum oluşturma ekranına açık bağlam taşır ve eski oturumu değiştirmez. Tamamlanan tartışma **Markdown dışa aktar** ile, tüm sohbet arşivi **Ayarlar → Tüm tartışmaların JSON yedeğini dışa aktar** ile paylaşılabilir. JSON yedeği API anahtarlarını içermez. Bu sürüm JSON yedeğini dışa aktarır; henüz yedekten içe aktarma/geri yükleme akışı sunmaz. Uygulamayı kaldırmak cihaz içindeki kayıtları silebilir; yedek dosyasını uygulama dışında saklayın.

## Güvenlik ve mevcut durum

Bu depo Public olsa da hiçbir API anahtarı, `.env` dosyası, APK veya imzalama anahtarı commit edilmemelidir. `.gitignore` yerel sırları ve build çıktılarını dışlar. TypeScript kontrolü, Android bundle export’u ve GitHub Actions release APK derlemesi başarıyla tamamlandı. Gerçek Android cihaza kurulum ve temel akış testi henüz yapılmadı.
