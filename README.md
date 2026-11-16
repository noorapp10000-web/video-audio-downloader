# video-audio-downloader

موقع بسيط لتحميل الفيديو والصوت من كل منصات السوشيال ميديا (يوتيوب، تيك توك، إنستجرام، فيسبوك، تويتر وغيرهم).

## طريقة العمل
- الواجهة (هذا الريبو): مبنية بـ React + TanStack Start + Tailwind.
- سيرفر التحميل: yt-dlp شغال على Railway — الكود في ريبو [ytdlp-server](https://github.com/noorapp10000-web/ytdlp-server).
- رابط السيرفر المباشر: https://api-production-8154f637.up.railway.app

## التشغيل محليًا
```bash
bun install
bun dev
```

لو رابط السيرفر اتغيّر، عدّله في `src/routes/index.tsx`.
