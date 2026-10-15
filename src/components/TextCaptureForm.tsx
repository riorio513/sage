import { useState } from "react";
import { captureAndSend } from "../lib/sync";
import Toast from "./Toast";

interface Props {
  type: "memo" | "consult_later";
  title: string;
  placeholder: string;
}

export default function TextCaptureForm({ type, title, placeholder }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<"sent" | "queued" | null>(null);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const result = await captureAndSend({ type, content: trimmed, metadata: {} });
      setText("");
      setToast(result);
      setTimeout(() => setToast(null), 2200);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sage-form">
      <h2>{title}</h2>
      <textarea
        className="sage-textarea"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      <button type="button" className="sage-submit" disabled={!text.trim() || sending} onClick={handleSubmit}>
        送信
      </button>
      {toast && <Toast kind={toast} />}
    </div>
  );
}
