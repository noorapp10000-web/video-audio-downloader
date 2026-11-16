import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

const API = "https://api-production-8154f637.up.railway.app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "حمّل — تحميل فيديو وصوت من كل المنصات" },
      { name: "description", content: "حط اللينك واختار جودة الفيديو أو الصوت وحمّل من يوتيوب وتيك توك وإنستجرام وفيسبوك وغيرهم." },
      { property: "og:title", content: "حمّل — تحميل فيديو وصوت" },
      { property: "og:description", content: "تحميل فيديو وصوت من كل المنصات بالجودة اللي تختارها." },
    ],
  }),
  component: Index,
});

type Info = {
  title: string; thumbnail?: string; duration?: number; uploader?: string; platform?: string;
  video_heights: number[]; audio_bitrates: number[];
};

function Index() {
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [mode, setMode] = useState<"video" | "audio">("video");
  const [height, setHeight] = useState(0);
  const [abr, setAbr] = useState(192);

  async function fetchInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setErr(""); setInfo(null);
    try {
      const r = await fetch(`${API}/info?url=${encodeURIComponent(url.trim())}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "حصلت مشكلة");
      setInfo(d); setHeight(d.video_heights[0] ?? 0);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "حصلت مشكلة");
    } finally { setLoading(false); }
  }

  const link = info
    ? `${API}/download?url=${encodeURIComponent(url.trim())}&kind=${mode}&height=${height}&abr=${abr}`
    : "#";
  const tab = (m: "video" | "audio", t: string) => (
    <button type="button" onClick={() => setMode(m)}
      className={`flex-1 rounded-lg py-2 font-bold transition ${mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{t}</button>
  );

  return (
    <main dir="rtl" className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-xl">
        <h1 className="text-center text-5xl font-black tracking-tight">حمّل<span className="text-primary">.</span></h1>
        <p className="mt-3 text-center text-muted-foreground">يوتيوب، تيك توك، إنستجرام، فيسبوك، X وأكتر — حط اللينك وبس</p>

        <form onSubmit={fetchInfo} className="mt-8 flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} dir="ltr" placeholder="https://..."
            className="flex-1 rounded-xl border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
          <button disabled={loading} className="rounded-xl bg-primary px-6 font-bold text-primary-foreground disabled:opacity-60">
            {loading ? "جاري..." : "عرض"}
          </button>
        </form>
        {err && <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" dir="ltr">{err}</p>}

        {info && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            {info.thumbnail && <img src={info.thumbnail} alt={info.title} className="aspect-video w-full object-cover" referrerPolicy="no-referrer" />}
            <div className="space-y-4 p-5">
              <div>
                <h2 className="text-lg font-bold">{info.title}</h2>
                <p className="text-sm text-muted-foreground">{[info.platform, info.uploader].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex gap-2">{tab("video", "فيديو")}{tab("audio", "صوت فقط")}</div>
              <div className="flex flex-wrap gap-2">
                {mode === "video"
                  ? (info.video_heights.length ? info.video_heights : [0]).map((h) => (
                      <button key={h} type="button" onClick={() => setHeight(h)}
                        className={`rounded-lg border px-3 py-1.5 text-sm ${height === h ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                        {h ? `${h}p` : "أفضل جودة"}</button>))
                  : [320, 256, 192, 128, 64].map((b) => (
                      <button key={b} type="button" onClick={() => setAbr(b)}
                        className={`rounded-lg border px-3 py-1.5 text-sm ${abr === b ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                        MP3 {b}kbps</button>))}
              </div>
              <a href={link} className="block rounded-xl bg-primary py-3 text-center font-bold text-primary-foreground">
                تحميل {mode === "video" ? (height ? `${height}p` : "") : `MP3 ${abr}kbps`}
              </a>
              <p className="text-center text-xs text-muted-foreground">التحميل بيبدأ بعد ما السيرفر يجهّز الملف، ممكن ياخد ثواني.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
