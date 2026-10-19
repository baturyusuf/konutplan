# KonutPlan — Konut Finansmanı ve Birikim Simülatörü

**KonutPlan**, farklı gelire, birikime ve borçlanma koşullarına sahip kişilerin konut alımını planlamasına yardımcı olan ücretsiz, açık kaynaklı, Türkçe, responsive, statik bir web uygulamasıdır.

## Özellikler

- Maaş, gider, birikim, altın oranı; net ek gelir ve belirsizlik katsayısı
- Konut fiyatı, ekspertiz oranı, kredi uygunluğu ve konut kredisi tutarı
- 5–10 yıl vadeli konut kredisi, değiştirilebilir aylık faiz, taksit/maaş ve kredi/değer limitleri
- Faizsiz özel borç, geri ödeme süresi, kiraya verme ve kullanılabilir kira oranı
- Konut, maaş, gider ve altın için yıllık değişim varsayımları
- Satın almadan önceki birikim süresi, banka kredi limit kontrolü ve alım bütçesi
- Satın alma sonrası nakit akışı, kiracısız/ek gelirsiz stres testi, erken kredi kapama
- 3 planı karşılaştırma, SVG grafik, isteğe bağlı yalnızca tarayıcıda kayıt, JSON dışa aktarma
- Harici hesap makinesi API'si, sunucu, hesap açma veya veritabanı **yoktur**

> **Gizlilik:** Depoda gerçek kişilere ait maaş, varlık, borç, meslek veya önceki hesaplama verisi bulunmaz. Formlar herkese yönelik örnek değerlerle açılır. Hesaplamalar tarayıcıda yapılır. Veriler, sadece “Cihaza kaydet” düğmesine basılırsa `localStorage` içerisinde tutulur; JSON dışa aktarma yalnızca kullanıcı tarafından tetiklenir. Üçüncü taraf font, izleme, analiz, cookie veya API entegrasyonu yoktur; site çevrimdışı önbelleğe alınmadıysa kaynak yüklemesi için yalnızca yayımlandığı GitHub Pages sunucusuyla iletişim kurar.

## Hızlı çalıştırma

Bu proje **npm kurulumu veya build gerektirmez**.

```bash
python -m http.server 8000
```

Tarayıcıdan `http://localhost:8000` adresini açın. ES module kullandığı için doğrudan `file://` ile açmak yerine yerel sunucu kullanın.

Testler için Node.js 20+:

```bash
node --test tests/*.test.mjs
```

## GitHub Pages'de yayımlama

1. GitHub'da örneğin `konutplan` adında **Public** bir depo oluşturun.
2. Bu klasörün *içindekilerini* deponun `main` dalının köküne yükleyin (`index.html` kökte kalmalı).
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch** seçin.
4. Branch `main`, folder `/(root)` ayarlayıp **Save** deyin.
5. Site URL'si `https://<kullanici>.github.io/konutplan/` olur. Yayına geçiş biraz gecikebilir.

GitHub Pages resmî dokümanı: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

`.nojekyll` dosyası statik dosyaların doğrudan servis edilmesini sağlar. `index.html` tüm kaynakları göreli yollarla yükler; kullanıcı adı veya depo adı kod içine yazılmaz.

## Hesaplama mantığı ve sınırlamalar

- Bankanın yaklaşık limit hesabı **yalnızca maaş**, taksit/gelir yüzdesi ve ekspertiz/kredi-değer yüzdesinden üretilir. Ek iş geliri ve satın alma sonrası kira bu limite **katılmaz**.
- Ev alımında toplam özkaynak ihtiyacı = ev fiyatı + tahmini masraflar + korunacak rezerv − konut kredisi − özel borç. Krediye uygun olmayan evde konut kredisi sıfırdır. Borçlar alım anında kullanılır.
- Birikim döngüsü ayda bir hesaplanır. Mevcut altın payı yıllık değer değişimine göre güncellenir; aylık yeni tasarruflar nakitte tutulur. Ev fiyatı, maaş ve giderler yıllık varsayımlarla değişebilir.
- Kira yalnızca satın alma sonrasında nakit akışına eklenir. Gireceğiniz kira indirimi ile doluluk oranı **ayrı ayrı çarpılır**; çifte ihtiyat payı bırakmak istemiyorsanız birini %100 yapın.
- Aylık ödemeler sabit nominal taksittir. Faiz oranının gelecekteki tahmini, bankanın yazılı teklifi anlamına gelmez.
- Erken ödeme stratejisi fazla nakdi değerlendiren basitleştirilmiş simülasyondur. Vergi, kredi masrafı, sigorta, erken kapama ücreti, hukuki tapu/iskan riski, kira gecikmesi, evin değer kaybı gibi gerçek hayat farklılıklarını **tam** içermez.
- UI'daki USD/EUR seçenekleri hesap tutarlarını otomatik olarak başka para birimine dönüştürmez. Girilen tüm tutarlar seçilen para biriminde yorumlanır.
- Bir simülasyon, bankadan ön onay ya da hukuki/finansal danışmanlık yerine geçmez.

## Dosyalar

| Dosya | İşlev |
|---|---|
| `index.html` | Erişilebilir sayfa yapısı |
| `styles.css` | Responsive stil |
| `app.mjs` | Form, grafik, karşılaştırma ve yerel kayıt |
| `engine.mjs` | Saf finansal hesaplama fonksiyonları |
| `tests/engine.test.mjs` | Finansal birim testleri |
| `assets/favicon.svg` | Logo |
| `.nojekyll` | GitHub Pages uyumluluğu |

## Lisans

MIT — `LICENSE` dosyasına bakın.
