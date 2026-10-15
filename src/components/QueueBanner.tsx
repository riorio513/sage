import { useEffect, useState } from "react";
import { subscribeQueue, retryItem } from "../lib/sync";
import type { QueueItem } from "../lib/db";

const TYPE_LABEL: Record<string, string> = {
  memo: "メモ",
  caffeine: "カフェイン",
  mood: "気分",
  consult_later: "あとで相談",
  philosophy_answer: "今日の問い",
};

export default function QueueBanner() {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => subscribeQueue(setQueue), []);

  if (queue.length === 0) return null;

  return (
    <div className="sage-queue-banner">
      {queue.map((item) => (
        <div key={item.client_id} className={`sage-queue-row ${item.status === "failed" ? "failed" : ""}`}>
          <span>
            {TYPE_LABEL[item.type] ?? item.type} ・ {item.status === "failed" ? "送信失敗" : "送信待ち"}
          </span>
          {item.status === "failed" && (
            <button type="button" className="sage-queue-retry" onClick={() => retryItem(item.client_id)}>
              再送信
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
