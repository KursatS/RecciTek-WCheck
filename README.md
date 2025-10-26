# 🚀 RecciTek WCheck

[![Version](https://img.shields.io/badge/version-1.2.1-blue.svg)](https://github.com/KursatS/reccitek-wcheck)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/electron-22.3.27-purple.svg)](https://electronjs.org)

RecciTek WCheck - Garanti Takip Sistemi. Clipboard'dan seri numarası kopyalayın, garanti durumunu otomatik sorgular ve popup ile gösterir.

## ✨ Özellikler

- 🔍 **Otomatik Garanti Sorgu**: RECCI ve KVK sistemlerinden garanti bilgisi çeker.
- 📋 **Clipboard İzleme**: Seri numarası kopyaladığınızda otomatik popup gösterir.
- 💾 **Cache Sistemi**: Önceki sorguları kaydeder, hızlı erişim sağlar.
- 🎨 **Modern UI**: Kart tabanlı tasarım, durum etiketleri.
- 🔔 **Popup Bildirimler**: Renk kodlu popup'lar (yeşil RECCI, mavi KVK, kırmızı süresi dolmuş).

## 🛠️ Kurulum

### Gereksinimler
- Node.js 16+
- npm

### Adımlar
```bash
# Projeyi klonlayın
git clone https://github.com/KursatS/reccitek-wcheck.git
cd reccitek-wcheck

# Bağımlılıkları yükleyin
npm install

# Projeyi derleyin
npm run build

# Uygulamayı çalıştırın
npm start
```

## 🎯 Kullanım

1. **Seri Numarası Kopyalayın**: R ile başlayan 14 karakterli seri numarasını kopyalayın (örneğin: R1234567890ABC).
2. **Popup Bekleyin**: Uygulama otomatik olarak garanti durumunu sorgular ve popup gösterir.
3. **Ana Menü**: Tray ikonundan ana menüye erişin, geçmiş sorguları yönetin.

### Klavye Kısayolları
- Seri numarası kopyalayın ve popup bekleyin.

## 📁 Proje Yapısı

```
reccitek-wcheck/
├── src/                    # Kaynak kodları
│   ├── main.ts            # Ana Electron süreci
│   ├── warrantyChecker.ts # Garanti sorgu mantığı
│   ├── cacheManager.ts    # Cache yönetimi
│   ├── index.html         # Ana pencere
│   ├── popup.html         # Popup penceresi
│   └── splash.html        # Başlangıç ekranı
├── dist/                  # Derlenmiş dosyalar (Git'e eklenmez)
├── package.json           # Proje konfigürasyonu
└── README.md              # Bu dosya
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

**Kürşat Sinan**
- GitHub: [@KursatS](https://github.com/KursatS)
- Email: kursat0sinan@gmail.com

---

⭐ Eğer bu proje hoşunuza gittiyse, yıldız verin!

---

⭐ Eğer bu proje hoşunuza gittiyse, yıldız verin!