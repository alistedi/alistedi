
## İlk başarılı APK build'i

GitHub Actions workflow'u run [43060388225](https://github.com/alistedi/alistedi/actions/runs/43060388225) ile başarıyla tamamlandı. TypeScript kontrolü, Expo Prebuild, Java kurulumu, imza anahtarının secret'tan geri yüklenmesi, Gradle `assembleRelease`, APK hash kontrolü ve artifact yükleme adımlarının tümü geçti. `app-release.apk` indirildi; zip bütünlüğü, Android manifest varlığı ve DEX dosyaları kontrol edildi. Paket kimliği `com.alistedi.app`; APK SHA-256: `8eced0c4076260e0a94d5ee9f1ab1eca81c94c6fae8bdac871581f70df9e8ebe`. Gerçek cihaz kurulum ve uygulama akışı testi henüz yapılmadı.
