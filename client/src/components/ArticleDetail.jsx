import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const FOLLOW_UPS = [
  "Summarize in one paragraph",
  "What's the background?",
  "Who are the key players?",
  "Read in 1 minute",
  "How does this connect to other issues?",
  "What questions should I be asking?",
  "Further reading",
];

const READING_LEVELS = ["Low", "Medium", "High"];
const PERSPECTIVE_OPTIONS = ["Left", "Center", "Right"];

function ArticleDetail({ openAsk }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [variantLoading, setVariantLoading] = useState(false);
  const [error, setError] = useState(null);
  // Article-local settings, independent from the home page
  const [reading, setReading] = useState("Medium");
  const [perspective, setPerspective] = useState("Center");

  // Inline chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const msgsEndRef = useRef(null);
  const mainRef = useRef(null);
  const prevIdRef = useRef(null);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const isNewArticle = prevIdRef.current !== id;
    prevIdRef.current = id;

    if (isNewArticle) {
      setLoading(true);
      setChatMessages([]);
    } else {
      setVariantLoading(true);
    }

    console.log(`Fetching: /api/articles/${id}?depth=${reading}&perspective=${perspective}`);
    fetch(`/api/articles/${id}?depth=${reading}&perspective=${perspective}`)
      .then((res) => {
        if (!res.ok) throw new Error("Article not found");
        return res.json();
      })
      .then((data) => {
        setArticle(data);
        setLoading(false);
        setVariantLoading(false);
        if (isNewArticle) mainRef.current?.scrollTo(0, 0);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        setVariantLoading(false);
      });
  }, [id, reading, perspective]);

  if (loading) return <div className="loading-state"><div className="spinner" />Loading article…</div>;
  if (error || !article) return (
    <div className="error-state">
      <p>{error || "Article not found."}</p>
      <button className="wr-article__back" onClick={() => navigate("/")} style={{ margin: "16px auto" }}>
        ← Back to today
      </button>
    </div>
  );

  const paragraphs = article.content.split("\n\n").map((p) => p.trim()).filter(Boolean);

  const sendChat = (text) => {
    const q = (text !== undefined ? text : chatInput).trim();
    if (!q) return;
    setChatMessages((msgs) => [
      ...msgs,
      { role: "user", text: q },
      { role: "ai", text: "Based on the available reporting, this is what the sources indicate. The article cites verified information from multiple outlets covering this story. Want me to explore a different angle?" },
    ]);
    setChatInput("");
  };

  return (
    <article className="wr-article">
      <button className="wr-article__back" onClick={() => navigate("/")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to today
      </button>

      <div className="wr-article__layout">
        <div className="wr-article__main" ref={mainRef} style={{ opacity: variantLoading ? 0.45 : 1, transition: "opacity 0.15s ease" }}>
          <span className={`wr-tag wr-tag--${article.category.toLowerCase()}`}>
            {article.category}
          </span>
          <h1 className="wr-article__head">{article.title}</h1>
          <p className="wr-article__lede">{article.description}</p>

          <div className="wr-article__byline">
            {variantLoading
              ? <span className="label label--generating">Generating {reading} · {perspective}…</span>
              : <span className="label">Brief AI</span>
            }
            <span>· Depth: <strong>{reading}</strong> · Perspective: <strong>{perspective}</strong></span>
            <span className="meta">{article.date} · {article.readTime}</span>
          </div>

          {paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className="wr-article__sidebar">
          {/* Article Characteristics */}
          <div className="wr-inline-ask">
            <h4>Article Characteristics</h4>
            <div className="wr-inline-controls">
              <div className="wr-inline-controls__row">
                <span className="wr-inline-controls__label">Depth</span>
                <div className="wr-seg">
                  {READING_LEVELS.map((level) => (
                    <button
                      key={level}
                      className={reading === level ? "is-active" : ""}
                      onClick={() => setReading(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wr-inline-controls__row">
                <span className="wr-inline-controls__label">Perspective</span>
                <div className="wr-seg">
                  {PERSPECTIVE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      className={perspective === opt ? "is-active" : ""}
                      onClick={() => setPerspective(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Article Chat */}
          <div className="wr-inline-ask wr-inline-ask--chat">
            <h4>Article Chat</h4>

            {chatMessages.length === 0 ? (
              <div className="wr-chat-empty">
                <div className="wr-chip-row">
                  {FOLLOW_UPS.map((q) => (
                    <button key={q} className="wr-chip" onClick={() => sendChat(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="wr-chat-msgs">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`wr-msg ${m.role === "user" ? "is-user" : ""}`}>
                    <div className="wr-msg__av" />
                    <div className="wr-msg__body">
                      <div className="wr-msg__lbl">{m.role === "user" ? "You" : "Brief AI"}</div>
                      <div className="wr-msg__txt">{m.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={msgsEndRef} />
              </div>
            )}

            <div className="wr-chat-compose">
              <div className="wr-composer">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Ask about this story…"
                />
                <button onClick={() => sendChat()}>Ask</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ArticleDetail;
