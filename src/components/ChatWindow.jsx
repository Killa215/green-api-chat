import { useState, useEffect, useRef } from "react";
import { sendMessage } from "../api/greenApi";

export default function ChatWindow({ credentials, chatId, messages, loading, onSent }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!text.trim() || !chatId || sending) return;

    const messageText = text;
    setText("");
    setSending(true);

    try {
      await sendMessage({
        ...credentials,
        chatId,
        message: messageText,
      });
      onSent?.(chatId, messageText);
    } catch (e) {
      alert("Ошибка отправки: " + e.message);
      setText(messageText);
    } finally {
      setSending(false);
    }
  };

  if (!chatId) return <main className="chat-window empty">Выберите чат</main>;

  return (
    <main className="chat-window">
      <header>
        <div className="avatar">{chatId.replace(/@.*/, "").slice(-2)}</div>
        <span>{chatId.replace(/@.*/, "")}</span>
      </header>

      <div className="messages">
        {loading && <div className="loading">Загрузка истории…</div>}

        {!loading && messages.length === 0 && (
          <div className="loading">Сообщений пока нет</div>
        )}

        {messages.map((m) => (
          <div key={m.idMessage} className={`bubble ${m.type}`}>
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="input-row">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Введите сообщение"
          disabled={sending}
        />
        <button onClick={handleSend} disabled={sending}>
          {sending ? "…" : "Отправить"}
        </button>
      </div>
    </main>
  );
}