// Slide-in chat panel for asking questions about the current article
import { useState, useEffect, useRef } from "react";
import { AI_NAME, CHAT_GREETING, API_PATHS } from "../constants";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function AskPanel({ open, story, seed, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const msgsEndRef = useRef(null);

  // Scroll to bottom whenever a new message is added or a streaming chunk arrives.
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    setInput("");
    if (seed && story) {
      const initial = [{ role: "user", text: seed }];
      setMessages([...initial, { role: "ai", text: "" }]);
      streamChat(initial, story.id);
    } else {
      setMessages([]);
    }
  }, [open, seed, story]);

  const streamChat = async (msgs, articleId) => {
    setStreaming(true);
    try {
      const res = await fetch(API_PATHS.ARTICLE_CHAT(articleId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });
      if (!res.ok) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const { text: chunk } = JSON.parse(payload);
            if (chunk) {
              aiText += chunk;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "ai", text: aiText };
                return updated;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "ai", text: "Sorry, I couldn't get a response. Please try again." };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const send = (e) => {
    e?.preventDefault?.();
    const q = input.trim();
    if (!q || streaming || !story) return;

    const newMessages = [...messages, { role: "user", text: q }];
    setMessages([...newMessages, { role: "ai", text: "" }]);
    setInput("");
    streamChat(newMessages, story.id);
  };

  return (
    <>
      <div
        className={`wr-ask-panel__scrim ${open ? "is-open" : ""}`}
        onClick={onClose}
      />
      <aside className={`wr-ask-panel ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <header className="wr-ask-panel__head">
          <h3>{AI_NAME}</h3>
          <button className="wr-ask-panel__close" onClick={onClose} aria-label="Close panel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {story && (
          <div className="wr-ask-panel__source">
            <div className="lbl">Asking about</div>
            <div className="ttl">{story.title}</div>
          </div>
        )}

        <div className="wr-ask-panel__msgs">
          {messages.length === 0 && (
            <div className="wr-msg">
              <div className="wr-msg__av" />
              <div className="wr-msg__body">
                <div className="wr-msg__lbl">{AI_NAME}</div>
                <div className="wr-msg__txt">{CHAT_GREETING}</div>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`wr-msg ${m.role === "user" ? "is-user" : ""}`}>
              <div className="wr-msg__av" />
              <div className="wr-msg__body">
                <div className="wr-msg__lbl">{m.role === "user" ? "You" : AI_NAME}</div>
                <div className="wr-msg__txt">
                  {m.role === "ai" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.text || (streaming && i === messages.length - 1 ? "…" : "")}
                    </ReactMarkdown>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={msgsEndRef} />
        </div>

        <div className="wr-ask-panel__compose">
          <form onSubmit={send}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
              placeholder="Ask a follow-up…"
              disabled={streaming}
              rows={1}
            />
            <button type="submit" disabled={streaming}>Ask</button>
          </form>
        </div>
      </aside>
    </>
  );
}

export default AskPanel;
