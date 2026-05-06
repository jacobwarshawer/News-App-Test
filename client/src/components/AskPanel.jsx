import { useState, useEffect } from "react";

function AskPanel({ open, story, seed, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!open) return;
    if (seed) {
      setMessages([
        { role: "user", text: seed },
        { role: "ai", text: "Based on the article, here's what I found. The reporting draws on multiple sources and I've highlighted the key details relevant to your question. Would you like me to dig deeper into any specific aspect?" },
      ]);
    } else {
      setMessages([
        { role: "ai", text: "I've read this story. Ask me anything about it — I'll cite the sections I'm drawing from." },
      ]);
    }
    setInput("");
  }, [open, seed, story]);

  const send = (e) => {
    e?.preventDefault?.();
    const q = input.trim();
    if (!q) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: q },
      { role: "ai", text: "Based on the available reporting, this is what the sources indicate. The article cites verified information from multiple outlets covering this story. Want me to explore a different angle?" },
    ]);
    setInput("");
  };

  return (
    <>
      <div
        className={`wr-ask-panel__scrim ${open ? "is-open" : ""}`}
        onClick={onClose}
      />
      <aside className={`wr-ask-panel ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <header className="wr-ask-panel__head">
          <h3>Brief AI</h3>
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
          {messages.map((m, i) => (
            <div key={i} className={`wr-msg ${m.role === "user" ? "is-user" : ""}`}>
              <div className="wr-msg__av" />
              <div className="wr-msg__body">
                <div className="wr-msg__lbl">{m.role === "user" ? "You" : "Brief AI"}</div>
                <div className="wr-msg__txt">{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="wr-ask-panel__compose">
          <form onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up…"
            />
            <button type="submit">Ask</button>
          </form>
        </div>
      </aside>
    </>
  );
}

export default AskPanel;
