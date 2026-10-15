import { useState } from "react";
import { captureAndSend } from "../lib/sync";
import Toast from "./Toast";

export default function MoodForm() {
  // No default: an unselected score must never be saved as 0 or assumed.
  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<"sent" | "queued" | null>(null);

  async function handleSubmit() {
    if (score === null || sending) return;
    setSending(true);
    try {
      const result = await captureAndSend({
        type: "mood",
        content: note.trim() || null,
        metadata: { score },
      });
      setScore(null);
      setNote("");
      setToast(result);
      setTimeout(() => setToast(null), 2200);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sage-form">
      <h2>気分</h2>
      <div className="sage-mood-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`sage-mood-btn ${score === n ? "selected" : ""}`}
            onClick={() => setScore(n)}
            aria-pressed={score === n}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="sage-field">
        <label htmlFor="mood-note">メモ(任意)</label>
        <textarea
          id="mood-note"
          className="sage-textarea"
          style={{ minHeight: 90 }}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <button type="button" className="sage-submit" disabled={score === null || sending} onClick={handleSubmit}>
        記録する
      </button>
      {toast && <Toast kind={toast} />}
    </div>
  );
}
