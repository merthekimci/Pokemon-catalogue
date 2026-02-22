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

## Özellikler

- 37 tekil Pokémon kart (80+ toplam kopya dahil)
- Arama, filtreleme (tür, nadirlik), sıralama
- ⚔️ 4'e kadar kart karşılaştırma
- ➕ Yeni kart ekleme
- Pokémon görselleri (PokeAPI sprites)
- Türkçe / Korece / İngilizce kart bilgileri
