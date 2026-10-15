interface Props {
  kind: "sent" | "queued";
}

export default function Toast({ kind }: Props) {
  return (
    <div className={`sage-toast ${kind === "queued" ? "queued" : ""}`} role="status">
      {kind === "sent" ? "保存しました" : "端末に保存済み。通信回復後に送信します"}
    </div>
  );
}
