import { useEffect, useState } from "react";
import { fetchDailyQuestion, type DailyQuestion } from "../lib/api";
import { captureAndSend } from "../lib/sync";
import Toast from "./Toast";

export default function PhilosophyCard() {
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<"sent" | "queued" | null>(null);
  const [justAnswered, setJustAnswered] = useState(false);

  useEffect(() => {
    fetchDailyQuestion()
      .then(setQuestion)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    if (!question || !answer.trim() || sending) return;
    setSending(true);
    try {
      const result = await captureAndSend({
        type: "philosophy_answer",
        content: answer.trim(),
        metadata: {
          question_id: question.question.id,
          question_date: question.date,
          question_text: question.question.text,
        },
      });
      setToast(result);
      setJustAnswered(true);
      setTimeout(() => setToast(null), 2200);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="sage-form">
        <h2>今日の問い</h2>
        <p>読み込み中…</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="sage-form">
        <h2>今日の問い</h2>
        <p>通信状態が悪く、今日の質問を取得できませんでした。通信が回復したら開き直してください。</p>
      </div>
    );
  }

  const alreadyAnswered = question.answered || justAnswered;

  return (
    <div className="sage-form">
      <h2>今日の問い</h2>
      <p className="sage-philosophy-text">{question.question.text}</p>
      {alreadyAnswered ? (
        <div className="sage-philosophy-answered">
          回答済みです。
          {(justAnswered ? answer : question.answer) && (
            <>
              <br />
              <br />
              {justAnswered ? answer : question.answer}
            </>
          )}
        </div>
      ) : (
        <>
          <textarea
            className="sage-textarea"
            placeholder="今の考えをそのまま書いてください"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            autoFocus
          />
          <button type="button" className="sage-submit" disabled={!answer.trim() || sending} onClick={handleSubmit}>
            送信
          </button>
        </>
      )}
      {toast && <Toast kind={toast} />}
    </div>
  );
}
