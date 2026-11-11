# Alistedi

Kişisel kullanım için Android uygulaması: bir moderatör ve üç AI tartışmacıyla çok turlu tartışmalar oluşturur. Proje Expo, React Native, TypeScript ve SQLite kullanır.

## Geliştirme ortamında çalıştırma

1. Node.js 22 LTS ve Git kurulu olsun.
2. Depoyu klonlayıp proje klasörüne geçin:

   ```bash
   git clone https://github.com/alistedi/alistedi.git
   cd alistedi
   npm install
   ```

3. Geliştirme sunucusunu başlatın:

   ```bash
   npx expo start
   ```

Expo Go ile önizleme yapılabilir. Uygulamanın son cihaz testleri ve APK’sı için Android build alınmalıdır.

## AI sağlayıcısını ayarlama

Uygulamada **Ayarlar** sekmesini açın. Moderatör ve her tartışmacı için sağlayıcı adını, OpenAI uyumlu API adresini ve sağlayıcının beklediği model kimliğini girin. Örnek Groq adresi `https://api.groq.com/openai/v1` şeklindedir. Dört rol aynı adresi kullanıyorsa API anahtarını bir kez kaydetmeniz yeterlidir. Model kimliğini kullandığınız sağlayıcının güncel model listesinden doğrulayın.

API anahtarları `expo-secure-store` üzerinden Android’in güvenli depolamasında saklanır; kaynak koda, APK yapılandırmasına, SQLite mesajlarına veya Git geçmişine eklenmez. Alanı boş bırakmak kayıtlı anahtarı değiştirmez. Anahtarı kaldırmak için “Bu sağlayıcının kayıtlı anahtarını sil” seçeneğini işaretleyip ayarları kaydedin.

Konu ve tartışma mesajları yanıt üretmek için seçilen sağlayıcının API’sine gönderilir. Kullanım sağlayıcının fiyat ve kullanım sınırlarına tabidir. Oturum ekranında sağlayıcıdan gelen token kullanımı toplanır; sağlayıcı fiyatlarını karşılaştıran tahmini maliyet hesabı henüz yoktur. Anahtarları yalnızca güvendiğiniz cihazda kullanın.

## Android APK üretimi

APK için EAS Build kullanılır; Expo hesabı ve derleme sırasında sorulabilecek Android imzalama ayarları gerekir. İlk kez EAS kullanıyorsanız proje klasöründe giriş yapın:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

Bu depodaki `preview` profili Android APK üretmek üzere ayarlanmıştır. Derleme başarılı olduktan sonra EAS, APK’yı indirme bağlantısıyla sunar. APK henüz bu depoya eklenmiş değildir.

## Kayıtlar ve yedekleme

Tartışmalar cihazda `alistedi.db` SQLite veritabanında saklanır. API anahtarları ayrı tutulur. Bir oturumu açmak onu otomatik olarak devam ettirmez; eski oturumdaki **Yeniye referans ver** eylemi yeni oturum oluşturma ekranına açık bağlam taşır ve eski oturumu değiştirmez. Tamamlanan tartışma **Markdown dışa aktar** ile, tüm sohbet arşivi **Ayarlar → Tüm tartışmaların JSON yedeğini dışa aktar** ile paylaşılabilir. JSON yedeği API anahtarlarını içermez. Bu sürüm JSON yedeğini dışa aktarır; henüz yedekten içe aktarma/geri yükleme akışı sunmaz. Uygulamayı kaldırmak cihaz içindeki kayıtları silebilir; yedek dosyasını uygulama dışında saklayın.

## Gizli dosyalar ve GitHub

Bu depo Public olsa da hiçbir API anahtarı, `.env` dosyası, APK veya imzalama anahtarı commit edilmemelidir. `.gitignore` yerel sırları ve build çıktılarını dışlar. Güvenlik nedeniyle API anahtarını kod dosyasına veya issue/commit mesajlarına yapıştırmayın.

## Mevcut geliştirme durumu

Şu anda temel mobil ekranlar, cihaz içi SQLite oturum kayıtları, SecureStore anahtar saklama, OpenAI uyumlu sohbet istemcisi ve 10 turluk tartışma motoru iskeleti vardır. Uçtan uca cihaz testi, arama/yönetim akışlarının tamamlanması, toplu yedekleme ve APK build doğrulaması geliştirme kapsamında sürmektedir.
