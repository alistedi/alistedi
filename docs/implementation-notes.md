# Uygulama geliştirme notları

## Expo SDK 58

`SQLiteProvider` migration callback'i ve `useSQLiteContext()` ile kullanılıyor; şema sürümü `PRAGMA user_version` üzerinden tutuluyor. `expo-secure-store` Android'de anahtarları şifreli yerel depoda saklıyor; uygulama kaldırıldığında bu sırların geri yüklenmeyeceği varsayılıyor. Dosya paylaşımı `expo-file-system` ve `expo-sharing` üzerinden, 1024×1024 PNG launcher ikonu ise Expo app config üzerinden yapılandırılıyor. İlgili kaynaklar: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [SQLite](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/), [SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/), [FileSystem](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/), [Sharing](https://docs.expo.dev/versions/v58.0.0/sdk/sharing/), [app config](https://docs.expo.dev/versions/v58.0.0/config/app/).

## GitHub Actions ile Android APK

Expo Prebuild, uygulama yapılandırması ve bağımlılıklardan `android/` native projesini üretebilir; proje bu üretilen dizini Git'te tutmaz ve CI'da `npx expo prebuild --platform android --no-install` çalıştırır. Ardından Gradle `assembleRelease` APK üretir. Bu akış EAS hesabı gerektirmez. Kaynak: [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/).

Workflow `ubuntu-24.04` runner'ına sabitlenmiştir; GitHub runner kataloğu `ubuntu-latest` etiketinin 2026 Kasımında Ubuntu 26.04'e geçeceğini duyurmuştur. APK, workflow artifact'i olarak 30 gün tutulur. Kaynaklar: [Ubuntu 24.04 runner image](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md), [GitHub Actions artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data).

Release APK kişisel sideload kullanımı içindir. Aynı imzalama anahtarının gelecekteki güncellemelerde kullanılabilmesi için anahtar yalnızca GitHub repository Actions secret'ında saklanır; kaynak koda veya Git geçmişine eklenmez. Geçici GitHub CLI oturumu ayrı config klasöründe tutulur ve build tamamlanınca kaldırılır. Kaynak: [GitHub CLI authentication](https://cli.github.com/manual/gh_auth_login).

## Bağımlılık audit notu

2026-11-11 tarihli `npm audit --omit=dev` kontrolü, Expo 58.0.24 → `@expo/fingerprint` 0.21.10 → `minimatch` 10.2.6 zincirinde orta önem düzeyinde bir DoS advisoriesi bildirdi. Güncel npm registry metadata'sında Expo 58'in son sürümü 58.0.24 ve fingerprint'in 0.21 serisindeki son sürümü 0.21.10 olarak göründü; npm'in önerdiği otomatik düzeltme Expo 52.0.49'a major downgrade gerektiriyor. SDK 58 uyumluluğunu bozacak zorunlu düşürme veya desteklenmeyen transitive override yapılmadı; yeni uyumlu Expo patch'i yayımlandığında yeniden kontrol edilmelidir. Kaynaklar: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), [Expo npm registry metadata](https://registry.npmjs.org/expo), [Expo fingerprint npm registry metadata](https://registry.npmjs.org/@expo/fingerprint).
