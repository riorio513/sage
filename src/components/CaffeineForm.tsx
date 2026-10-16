import { useState } from "react";
import { captureAndSend } from "../lib/sync";
import Toast from "./Toast";

function nowForInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// Fixed presets the user chose. Amounts are only a starting point; the fields
// stay editable. Coffee is an estimate (12 g beans / 300 ml, about 9 mg per g).
const PRESETS = [
  { label: "モンエナ 355ml", drinkName: "モンスターエナジー 355ml", amountMg: 142 },
  { label: "コーヒー 12g/300ml", drinkName: "コーヒー(豆12g・300ml)", amountMg: 110 },
] as const;

export default function CaffeineForm() {
  const [amount, setAmount] = useState("");
  const [consumedAt, setConsumedAt] = useState(nowForInput());
  const [drinkName, setDrinkName] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<"sent" | "queued" | null>(null);

  async function handleSubmit() {
    if (sending || !consumedAt) return;
    setSending(true);
    try {
      // Never guess: an empty amount stays null, not 0 or an assumed value.
      const amountMg = amount.trim() === "" ? null : Number(amount);
      const result = await captureAndSend({
        type: "caffeine",
        content: null,
        metadata: {
          amount_mg: amountMg,
          consumed_at: new Date(consumedAt).toISOString(),
          drink_name: drinkName.trim() || null,
        },
      });
      setAmount("");
      setDrinkName("");
      setConsumedAt(nowForInput());
      setToast(result);
      setTimeout(() => setToast(null), 2200);
    } finally {
      setSending(false);
    }
  }

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setAmount(String(preset.amountMg));
    setDrinkName(preset.drinkName);
    setConsumedAt(nowForInput());
  }

  return (
    <div className="sage-form">
      <h2>カフェイン</h2>
      <div className="sage-preset-row">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="sage-preset-btn" onClick={() => applyPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="sage-field">
        <label htmlFor="caffeine-amount">量 (mg) ・ 不明なら空欄のままでよい</label>
        <input
          id="caffeine-amount"
          className="sage-input"
          type="number"
          min={0}
          max={5000}
          inputMode="numeric"
          placeholder="不明"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="sage-field">
        <label htmlFor="caffeine-time">摂取時刻</label>
        <input
          id="caffeine-time"
          className="sage-input"
          type="datetime-local"
          value={consumedAt}
          onChange={(e) => setConsumedAt(e.target.value)}
        />
      </div>
      <div className="sage-field">
        <label htmlFor="caffeine-drink">飲み物名(任意)</label>
        <input
          id="caffeine-drink"
          className="sage-input"
          type="text"
          placeholder="例: コーヒー"
          value={drinkName}
          onChange={(e) => setDrinkName(e.target.value)}
        />
      </div>
      <button type="button" className="sage-submit" disabled={sending} onClick={handleSubmit}>
        記録する
      </button>
      {toast && <Toast kind={toast} />}
    </div>
  );
}
