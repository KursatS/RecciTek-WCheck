# 🚀 RecciTek WCheck

[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](https://github.com/KursatS/reccitek-wcheck)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/electron-22.0.0-purple.svg)](https://electronjs.org)

RecciTek WCheck - Gelişmiş Garanti Takip Sistemi. Clipboard'dan seri numarası kopyalayın, garanti durumunu anlık olarak sorgulayın ve modern popup bildirimleri ile takip edin.

## ✨ Yeni Nesil Özellikler (v1.4.0)

- 🎨 **Premium Glassmorphic UI**: Tüm uygulama modern "Glassmorphism" tasarımı ve "Inter" font ailesi ile baştan aşağı yenilendi.
- 📡 **Canlı Sunucu Durumu**: Ana sayfa üzerinden Recci garanti sunucularının aktiflik durumunu ve ms cinsinden gecikme süresini anlık takip edin.
- 🔄 **Anlık Yenileme (Instant Refresh)**: Bir popup açıkken yeni bir seri kopyaladığınızda beklemeden anında yeni cihaz bilgileriyle güncellenir.
- 🔍 **Akıllı Takip Mantığı**: Aynı seri numarasının üst üste kopyalanması durumunda gereksiz popup oluşumu engellenir.
- 🏗️ **Güçlü Mimari**: Merkezi pencere yönetimi (`WindowManager`) ve ayar yönetimi (`SettingsManager`) ile daha stabil bir deneyim.
- 📉 **Düşük Sunucu Yükü**: Gelişmiş durum izleme mekanizması, sunucuya minimum yük bindirecek şekilde jitter (rastgele gecikme) ile çalışır.

## 🛠️ Kurulum & Derleme

### Gereksinimler
- Node.js 16+
- npm

### Geliştirici Adımları
```bash
# Bağımlılıkları yükleyin
npm install

# Projeyi derleyin
npm run build

# Uygulamayı başlatın
npm start
```

### Setup / Kurulum Dosyası Oluşturma
Uygulamanın Windows (.exe) kurulum dosyasını oluşturmak için:
```bash
npm run dist
```
Dosya `release` klasörü altında oluşturulacaktır.

## 🎯 Kullanım

1. **Seri Numarası Kopyalayın**: R ile başlayan seri numarasını kopyalayın.
2. **Popup'ı İnceleyin**: Modern, renk kodlu (Yeşil: RECCI, Mavi: KVK, Kırmızı: Hata/Yok) popup ile garanti durumunu görün.
3. **Geçmişi Yönetin**: Ana ekran üzerinden tüm sorgu geçmişinizi, model bilgilerini ve tarihleri inceleyin.

## 📁 Dosya Yapısı

```
reccitek-wcheck/
├── src/                    # Kaynak kodları (TypeScript)
│   ├── main.ts            # Merkezi Electron süreci
│   ├── windowManager.ts   # Pencere & Popup Yönetimi
│   ├── settingsManager.ts # Ayar & Dosya Yönetimi
│   ├── warrantyChecker.ts # Garanti API Entegrasyonları
│   ├── cacheManager.ts    # SQLite Veri Yönetimi
│   └── *.html             # Modern UI Dosyaları
├── release/               # Kurulum dosyalarının oluşturulduğu dizin
├── package.json           # Proje bileşenleri ve versiyon
└── README.md              # Kullanım Klavuzu
```

## 👨‍💻 Geliştirici

**Kürşat Sinan**
- GitHub: [@KursatS](https://github.com/KursatS)
- Proje: [RecciTek-WCheck](https://github.com/KursatS/RecciTek-WCheck)

---

⭐ Eğer bu proje işinizi kolaylaştırdıysa, GitHub üzerinden yıldız vermeyi unutmayın!
