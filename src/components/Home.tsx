export type Mode = "memo" | "caffeine" | "mood" | "consult_later" | "philosophy";

interface Props {
  onSelect: (mode: Mode) => void;
}

export default function Home({ onSelect }: Props) {
  return (
    <div className="sage-home-grid">
      <button type="button" className="sage-tile sage-tile-wide" onClick={() => onSelect("memo")}>
        <span className="sage-tile-emoji">📝</span>
        メモ
      </button>
      <button type="button" className="sage-tile" onClick={() => onSelect("caffeine")}>
        <span className="sage-tile-emoji">☕</span>
        カフェイン
      </button>
      <button type="button" className="sage-tile" onClick={() => onSelect("mood")}>
        <span className="sage-tile-emoji">🙂</span>
        気分
      </button>
      <button type="button" className="sage-tile" onClick={() => onSelect("consult_later")}>
        <span className="sage-tile-emoji">💬</span>
        あとで相談
      </button>
      <button type="button" className="sage-tile" onClick={() => onSelect("philosophy")}>
        <span className="sage-tile-emoji">🌱</span>
        今日の問い
      </button>
    </div>
  );
}
