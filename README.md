# 🎴 Pokémon Kart Kataloğu

Korece baskı Pokémon kart koleksiyonu yönetim uygulaması.

## Yerel Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

## Google Cloud Run'a Deploy

### Ön Koşullar
- `gcloud` CLI kurulu ve yapılandırılmış
- Bir GCP projesi seçili

### Tek Komutla Deploy

```bash
gcloud run deploy pokemon-katalog \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080
```

Bu komut otomatik olarak:
1. Dockerfile ile container image oluşturur
2. Artifact Registry'ye push eder
3. Cloud Run'da deploy eder
4. Size bir URL verir

### Alternatif: Firebase Hosting

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting   # public directory: dist, SPA: yes
firebase deploy
```

### Alternatif: Vercel

```bash
npm install -g vercel
vercel
```

## Ortam Degiskenleri

Vercel dashboard'da asagidaki ortam degiskenini ayarlayin:

- `OPENAI_API_KEY` — OpenAI API anahtariniz (fotograf analizi icin gerekli)

Yerel gelistirme icin `.env.local` dosyasi olusturun:
```
OPENAI_API_KEY=sk-...
```

## Ozellikler

- 37 tekil Pokemon kart (80+ toplam kopya dahil)
- Arama, filtreleme (tur, nadirlik), siralama
- 4'e kadar kart karsilastirma
- Fotograftan kart ekleme (OpenAI Vision ile tek kart veya sayfa analizi)
- Egitmen (Trainer) detay sayfalari — her kartta egitmen adi, tiklandiginda biyografi, hikaye ve resim iceren detay sayfasi
- Alt navigasyon cubugu (5 tab) — Ozet, Kartlarim, Kart Ekle, Egitmenler, Ayarlar
- Kart detay sayfasi — buyuk kart gorseli, istatistik gridi, favori butonu, egitmen bilgisi, benzer kartlar
- Egitmenler listesi — trainer grid (portre, isim, bolge, kart sayisi)
- Ayarlar sayfasi — karanlik/aydinlik tema secimi, koleksiyon sahibi ismi
- Favori sistemi — kart bazinda favori toggle, katalogda favori filtresi, ozet dashboard'da favori sayaci
- Ozet dashboard — koleksiyon degeri, kart sayisi + nadirlik dagilimi, favoriler, en degerli kart, tur dagilimi
- Karanlik ve aydinlik tema destegi (localStorage ile kalici)
- Kart silme — her kartta silme butonu, onay diyalogu ile koleksiyondan cikarma
- Filtre, siralama ve kaydirma pozisyonu korunarak geri donme
- localStorage ile kalici koleksiyon verisi
- Pokemon gorselleri (PokeAPI sprites)
- Turkce / Korece / Ingilizce kart bilgileri
