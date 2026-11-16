import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

const API = "https://api-production-8154f637.up.railway.app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "حمّل — بحث وتحميل فيديو وصوت من يوتيوب وكل المنصات" },
      { name: "description", content: "ابحث بالكلمات في يوتيوب أو حط الرابط المباشر وحمّل فيديو وصوت بأعلى جودة." },
      { property: "og:title", content: "حمّل — بحث وتحميل فيديو وصوت" },
      { property: "og:description", content: "بحث وتحميل من يوتيوب وتيك توك وإنستجرام وفيسبوك والمزيد." },
    ],
  }),
  component: Index,
});

type SearchResult = {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  views?: number;
};

type Info = {
  title: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  platform?: string;
  video_heights: number[];
  audio_bitrates: number[];
};

function formatDuration(sec?: number) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function formatViews(n?: number) {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} مليون مشاهدة`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} ألف مشاهدة`;
  return `${n} مشاهدة`;
}

function Index() {
  const [activeTab, setActiveTab] = useState<"search" | "url">("search");
  
  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");

  // URL & download state
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<Info | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [downloadErr, setDownloadErr] = useState("");
  const [mode, setMode] = useState<"video" | "audio">("video");
  const [height, setHeight] = useState(0);
  const [abr, setAbr] = useState(192);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchErr("");
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&n=12`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "تعذر جلب نتائج البحث");
      setSearchResults(data.results || []);
      if (!data.results || data.results.length === 0) {
        setSearchErr("لم نجد نتائج مطابقة، جرب كلمات أخرى");
      }
    } catch (err) {
      setSearchErr(err instanceof Error ? err.message : "حدث خطأ أثناء البحث");
    } finally {
      setSearching(false);
    }
  }

  async function loadVideoInfo(videoUrl: string) {
    setUrl(videoUrl);
    setLoadingInfo(true);
    setDownloadErr("");
    setInfo(null);
    try {
      const res = await fetch(`${API}/info?url=${encodeURIComponent(videoUrl)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "تعذر قراءة بيانات الفيديو");
      setInfo(data);
      setHeight(data.video_heights?.[0] ?? 0);
    } catch (err) {
      setDownloadErr(err instanceof Error ? err.message : "حدث خطأ أثناء تجهيز الفيديو");
    } finally {
      setLoadingInfo(false);
    }
  }

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    await loadVideoInfo(url.trim());
  }

  const downloadLink = info
    ? `${API}/download?url=${encodeURIComponent(url.trim())}&kind=${mode}&height=${height}&abr=${abr}`
    : "#";

  return (
    <main dir="rtl" className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight">
            حمّل<span className="text-primary">.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            ابحث بالكلمات في يوتيوب أو حمّل من كل منصات السوشيال برابط مباشر
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-8 flex rounded-2xl bg-muted p-1">
          <button
            type="button"
            onClick={() => { setActiveTab("search"); setDownloadErr(""); }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
              activeTab === "search" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🔍 بحث بالكلمات على يوتيوب
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("url"); setSearchErr(""); }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
              activeTab === "url" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🔗 تحميل برابط مباشر
          </button>
        </div>

        {/* Tab 1: YouTube Keyword Search */}
        {activeTab === "search" && (
          <div className="mt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اكتب اسم الأغنية، البودكاست، أو الفيديو..."
                className="flex-1 rounded-xl border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={searching}
                className="rounded-xl bg-primary px-6 font-bold text-primary-foreground disabled:opacity-60"
              >
                {searching ? "جاري البحث..." : "بحث"}
              </button>
            </form>

            {searchErr && (
              <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                {searchErr}
              </p>
            )}

            {/* Results Grid */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {searchResults.map((item) => (
                <div
                  key={item.id || item.url}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50"
                >
                  <div className="relative aspect-video w-full bg-muted">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        لا توجد صورة
                      </div>
                    )}
                    {item.duration ? (
                      <span className="absolute bottom-2 left-2 rounded-md bg-black/80 px-2 py-0.5 text-xs text-white">
                        {formatDuration(item.duration)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-3.5">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-bold leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[item.uploader, formatViews(item.views)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadVideoInfo(item.url)}
                      className="mt-3 w-full rounded-lg bg-secondary py-2 text-xs font-bold text-secondary-foreground transition hover:bg-primary hover:text-primary-foreground"
                    >
                      تجهيز للتحميل ⬇
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Direct URL Download */}
        {activeTab === "url" && (
          <form onSubmit={handleUrlSubmit} className="mt-6 flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              dir="ltr"
              placeholder="https://www.youtube.com/watch?v=... أو تيك توك، إنستجرام"
              className="flex-1 rounded-xl border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={loadingInfo}
              className="rounded-xl bg-primary px-6 font-bold text-primary-foreground disabled:opacity-60"
            >
              {loadingInfo ? "جاري..." : "عرض"}
            </button>
          </form>
        )}

        {/* Loading Indicator */}
        {loadingInfo && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">
            جاري قراءة وتجهيز جودات الفيديو...
          </div>
        )}

        {/* Error Message */}
        {downloadErr && (
          <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive" dir="ltr">
            {downloadErr}
          </p>
        )}

        {/* Selected Video & Download Controls */}
        {info && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {info.thumbnail && (
              <img
                src={info.thumbnail}
                alt={info.title}
                className="aspect-video w-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="space-y-4 p-5">
              <div>
                <h2 className="text-lg font-bold">{info.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {[info.platform, info.uploader].filter(Boolean).join(" · ")}
                </p>
              </div>

              {/* Format selection */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("video")}
                  className={`flex-1 rounded-lg py-2 font-bold transition ${
                    mode === "video" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  فيديو
                </button>
                <button
                  type="button"
                  onClick={() => setMode("audio")}
                  className={`flex-1 rounded-lg py-2 font-bold transition ${
                    mode === "audio" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  صوت فقط (MP3)
                </button>
              </div>

              {/* Quality options */}
              <div className="flex flex-wrap gap-2">
                {mode === "video"
                  ? (info.video_heights?.length ? info.video_heights : [0]).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHeight(h)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                          height === h
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {h ? `${h}p` : "أفضل جودة"}
                      </button>
                    ))
                  : [320, 256, 192, 128, 64].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setAbr(b)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                          abr === b
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        MP3 {b}kbps
                      </button>
                    ))}
              </div>

              {/* Download link button */}
              <a
                href={downloadLink}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl bg-primary py-3 text-center font-bold text-primary-foreground transition hover:opacity-90"
              >
                تحميل {mode === "video" ? (height ? `${height}p` : "بأعلى جودة") : `MP3 ${abr}kbps`}
              </a>
              <p className="text-center text-xs text-muted-foreground">
                التحميل يبدأ بعد أن يجهز السيرفر الملف، وقد يستغرق بضع ثوانٍ حسب الحجم.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
