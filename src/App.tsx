import { useEffect, useState } from "react";
import Home, { type Mode } from "./components/Home";
import TextCaptureForm from "./components/TextCaptureForm";
import CaffeineForm from "./components/CaffeineForm";
import MoodForm from "./components/MoodForm";
import PhilosophyCard from "./components/PhilosophyCard";
import QueueBanner from "./components/QueueBanner";
import { hasToken, getSource } from "./lib/token";
import { startBackgroundSync } from "./lib/sync";

export default function App() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [registered, setRegistered] = useState(hasToken());

  useEffect(() => {
    if (registered) startBackgroundSync();
  }, [registered]);

  // The setup fragment is consumed in main.tsx before first render, but a
  // user who force-reloads mid-navigation could land here once more.
  useEffect(() => {
    setRegistered(hasToken());
  }, []);

  if (!registered) {
    return (
      <div className="sage-app">
        <div className="sage-unregistered">
          <p>この端末はまだ登録されていません。</p>
          <p>Sageの登録用リンクをもう一度開いてください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sage-app">
      <header className="sage-header">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <rect width="100" height="100" rx="20" fill="#eef3ea" />
          <path
            d="M50 18 C68 22 78 36 76 54 C74 70 60 80 50 82 C40 80 26 70 24 54 C22 36 32 22 50 18 Z"
            fill="#4b6b4f"
          />
        </svg>
        <h1>Sage</h1>
      </header>

      {getSource() === "work" && (
        <p className="sage-notice">会社・顧客の機密情報は入力しないでください。</p>
      )}

      {mode && (
        <button type="button" className="sage-back" onClick={() => setMode(null)}>
          ← ホーム
        </button>
      )}

      {mode === null && <Home onSelect={setMode} />}
      {mode === "memo" && <TextCaptureForm type="memo" title="メモ" placeholder="思ったこと・学び・気づきをそのまま" />}
      {mode === "caffeine" && <CaffeineForm />}
      {mode === "mood" && <MoodForm />}
      {mode === "consult_later" && (
        <TextCaptureForm type="consult_later" title="あとで相談" placeholder="帰宅後に相談したいこと" />
      )}
      {mode === "philosophy" && <PhilosophyCard />}

      <QueueBanner />
    </div>
  );
}
