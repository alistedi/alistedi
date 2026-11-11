# Uygulama geliştirme notları

Bu dosya Expo SDK 58 API seçimleri için doğrulanmış kısa notları içerir.

- Expo SDK 58 belgeleri `SQLiteProvider` bileşenini `onInit` migration callback'iyle kullanmayı; ekranlarda veritabanına `useSQLiteContext()` ile erişmeyi destekliyor. Şema sürümü `PRAGMA user_version` ile takip edilebilir.
- `expo-secure-store` Android'de değerleri SharedPreferences'ta saklar ve Android Keystore ile şifreler. Uygulama kaldırıldığında bu anahtarlar/secret verileri geri yüklenmez; bu nedenle API anahtarlarını normal uygulama yedeğine dahil etmiyoruz.
- SDK 58 dosya sistemi metin kaydı için `File` ve `Paths.cache` API'lerini sunuyor. `expo-sharing` Android'de yerel dosya URI paylaşımını destekliyor.
- Expo app-config rehberi uygulama ikonu için 1024x1024 PNG öneriyor.

Kaynaklar:

- [Expo SDK 58 overview](https://docs.expo.dev/versions/v58.0.0/)
- [Expo SQLite SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/)
- [Expo SecureStore SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/)
- [Expo FileSystem SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/)
- [Expo Sharing SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/sharing/)
- [Expo app config SDK 58](https://docs.expo.dev/versions/v58.0.0/config/app/)
