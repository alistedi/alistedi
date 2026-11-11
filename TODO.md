# Alistedi Android APK — TODO

## 1. Dengeli çok turlu tartışma ve moderatör raporu
- [ ] Varsayılan tartışma uzunluğu 10 turdur. Bir tur, üç tartışmacının da birer kez konuşması demektir; varsayılan oturumda toplam 30 tartışmacı yanıtı oluşur.
- [ ] Üç tartışmacının söz hakkı eşittir; konuşma sırası turlar arasında değişerek katılımcılar arasında dengeli dağıtılır.
- [ ] Her AI, yalnızca ilk soruyu değil, o tartışma oturumunda kendisinden önce yazılmış tüm mesajları ve diğer AI yanıtlarını bağlam olarak görür.
- [ ] Moderatör tartışmanın akışını, sırasını ve kurallarını yönetir; gerektiğinde katılımcılardan gerekçe, açıklama veya karşı görüş ister. Moderatör tartışmacıların yerine görüş üretmez veya onların söz hakkını azaltmaz.
- [ ] Moderatör konuyu ve sınırları netleştirir, katılımcıların birbirlerinin argümanlarına yanıt vermesini sağlar, çelişkileri ve dayanaksız iddiaları görünür kılar, tartışmayı tek bir görüşe zorlamaz ve her görüşü otomatik olarak doğru kabul etmez.
- [ ] Tartışma 10. tur tamamlandığında durur. Moderatör; ortak noktaları, temel anlaşmazlıkları, güçlü gerekçeleri, zayıf varsayımları ve açık kalan soruları içeren nihai raporu hazırlar.
- [ ] Nihai rapor kısa özet, katılımcıların temel görüşleri, en güçlü argümanlar, önemli itirazlar, ortaklaşılan noktalar, görüş ayrılıkları, eksik bilgi/doğrulanması gereken varsayımlar, dengeli değerlendirme, sonuç ve açık kalan soruları kapsar.
- [ ] Rapor tartışmanın gerçek içeriğine dayanır; konuşmalarda bulunmayan iddiaları veya kaynakları uydurmaz. Raporun ardından oturum tamamlanır; uygulama otomatik olarak yeni tura veya yeni tartışmaya geçmez.
- [ ] Tur sayısı ileride kullanıcı tarafından ayarlanabilir tasarlanır; varsayılan değer 10 olmalıdır.
- [ ] Kullanıcı konu ve varsa ek talimatları girebilir; çalışan tartışmayı kontrollü biçimde duraklatabilir veya iptal edebilir.

## 2. Bağımsız oturumlar, sohbet geçmişi ve güvenilir kayıt
- [ ] Birbirinden bağımsız birden fazla tartışma oturumu açılabilir; her oturumun benzersiz kimliği, başlığı, oluşturulma ve son güncellenme tarihi vardır.
- [ ] Her oturum kendi konu metnini, ek talimatlarını, katılımcı/model ayarlarını, tüm mesajlarını ve nihai raporunu saklar; diğer oturumlardan tamamen ayrı tutulur.
- [ ] Arayüzde belirgin “Yeni Tartışma” seçeneği ve geçmiş tartışmaların listelendiği sohbet geçmişi/menüsü bulunur; kullanıcı geçmişteki herhangi bir tartışmayı açabilir.
- [ ] Eski oturum açıldığında tüm mesajlar, konuşmacı adları, tur bilgileri ve nihai rapor eksiksiz görüntülenir; eski oturumun açılması tartışmayı otomatik devam ettirmez.
- [ ] Tamamlanmış veya duraklatılmış eski oturum varsayılan olarak görüntüleme modunda açılır.
- [ ] Kullanıcı eski tartışmayı referans alarak yeni tartışma başlatabilir. Bu yeni ve bağımsız oturum oluşturur; eski oturumu değiştirmez. Kullanıcı açıkça eski oturumu bağlamadıkça yeni tartışma yalnızca kendi konusu ve mesajlarını bağlam olarak kullanır.
- [ ] Başlık değiştirilebilir; oturum arşivlenip arşivden geri alınabilir; silme işleminden önce onay istenir.
- [ ] Geçmiş başlığa göre aranabilir; mümkünse mesaj içeriklerinde de arama yapılır. Liste son etkinliğe göre sıralanır; arşivlenmiş oturumlar normal listeden ayrı gösterilir.
- [ ] Her başarılı AI yanıtı ve her önemli oturum değişikliği kalıcı olarak kaydedilir. Sayfa/uygulama yenilendiğinde veya kapatılıp açıldığında geçmiş kaybolmaz; beklenmedik kapanmada tamamlanmış mesajlar korunur.
- [ ] Bir API hatasında başarısız yanıt başarılıymış gibi kaydedilmez ve önceki başarılı mesajlar kaybolmaz; mümkünse oturum kaldığı yerden güvenli biçimde devam edebilir.
- [ ] Kayıt sistemi yalnızca tarayıcı belleğine bağlı geçici yapı değildir; kalıcı veri saklama kullanılır.

## 3. Sağlayıcı/model ayarları, gizlilik ve maliyet görünürlüğü
- [ ] Sistem tek bir yapay zekâ sağlayıcısına bağımlı değildir; Groq gibi ücretsiz veya düşük maliyetli API sağlayıcıları öncelikli değerlendirilir.
- [ ] Kullanıcı kendi API anahtarlarını uygulamaya girebilir; sağlayıcı ve model seçimi ayarlardan değiştirilebilir olur.
- [ ] Moderatör ve üç katılımcı için farklı sağlayıcı/modeller atanabilir; aynı model birden fazla katılımcıya atanabilir.
- [ ] API anahtarları güvenli saklanır ve arayüzde açık biçimde gösterilmez; normal sohbet kayıtlarından ayrıdır ve herkese açık depoya asla commit edilmez.
- [ ] Kullanım miktarı ve tahmini maliyet mümkünse oturum bazında gösterilir.
- [ ] API hataları kullanıcıya anlaşılır biçimde bildirilir; başarısız yanıtlar başarılıymış gibi kaydedilmez.
- [ ] Yerel veri şeması oturumları, mesajları, katılımcı/model ayarlarını ve raporları birbirine karıştırmadan ilişkilendirir.
- [ ] Kullanıcı kendi tartışma geçmişine erişebilir; sohbet geçmişi dışa aktarılabilir ve yedeklenebilir.

## 4. Mobil arayüz, dışa aktarma ve APK teslimi
- [ ] Arayüz sade, anlaşılır ve mobil cihazlarda rahat kullanılabilir; gereksiz buton/karmaşık ekran eklenmez.
- [ ] Ana ekranda sohbet geçmişi/menüsü, “Yeni Tartışma”, aktif tartışmanın mesaj akışı, mesajlarda konuşmacı/model adı ve tur numarası, tur ilerleme bilgisi ve oturum ayarları/nihai rapor alanı bulunur.
- [ ] Kullanıcı konu girebilir, moderatöre ek talimat verebilir, tartışmayı başlatabilir, çalışan tartışmayı duraklatabilir veya iptal edebilir, tamamlanan raporu okuyup dışa aktarabilir ve yeni tartışmaya geçerken eski oturumu kaybetmez.
- [ ] Kullanıcı tartışmanın tam metnini ve nihai raporunu TXT veya Markdown olarak dışa aktarabilir.
- [ ] Test edilen temel kullanım akışı: yeni tartışma oluşturma, üç tartışmacıyla 10 tur eşit konuşma, bağlam aktarımı, final raporu ve otomatik devam etmeme, geçmişe kalıcı kayıt, kapatıp açınca geçmişi geri yükleme, oturumların mesajlarını karıştırmama, eski oturumu görüntüleme modunda açma, eski tartışmayı referans alan yeni bağımsız oturum, başlık/arşiv/geri alma/onaylı silme, başlığa göre arama, dışa aktarma, API hatasında başarılı mesajları koruma ve mobil ekranı kullanma.
- [ ] Teslimde çalışan kaynak kodu, eksiksiz ve anlaşılır kurulum/çalıştırma adımları, API anahtarı ayarı açıklaması, veritabanı kurulum/şema adımları, yedekleme yönergesi ve hata durumlarında yapılacaklar bulunur.
- [x] Android APK build yapılandırması hazırlandı; başarılı build sonrası APK artifact'i üretildi ve SHA-256 değeri kaydedildi.

## 5. GitHub Actions APK build durumu
- [x] Expo EAS hesabı gerektirmeyen GitHub Actions workflow'u, 30 günlük artifact ve repository secret tabanlı imzalama yapılandırıldı.
- [x] İlk uzak GitHub Actions APK build'i başarılı oldu; APK artifact'i indirildi ve zip yapısı kontrol edildi (run #43060388225).
- [ ] APK'yı gerçek Android cihaza kurup temel tartışma akışını test et.
