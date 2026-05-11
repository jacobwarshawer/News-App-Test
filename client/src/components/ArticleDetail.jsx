import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { READING_LEVELS, PERSPECTIVE_OPTIONS, FOLLOW_UPS, AI_NAME, DEFAULTS, API_PATHS, EXPLAIN_PROMPT } from "../constants";
import Dropdown from "./Dropdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DepthIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M1 3h11M1 6.5h8M1 10h5" />
  </svg>
);

const PerspectiveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 6.5h11M4 3L1 6.5l3 3.5M9 3l3 3.5-3 3.5" />
  </svg>
);

const SuggestIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 1.5L7.8 5.2L11.5 6.5L7.8 7.8L6.5 11.5L5.2 7.8L1.5 6.5L5.2 5.2Z" />
  </svg>
);


function ArticleDetail({ openAsk }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [variantLoading, setVariantLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reading, setReading] = useState(DEFAULTS.READING);
  const [perspective, setPerspective] = useState(DEFAULTS.PERSPECTIVE);

  // Inline chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const msgsEndRef = useRef(null);
  const mainRef = useRef(null);
  const prevIdRef = useRef(null);

  // Highlight-to-explain state
  const [explainPos, setExplainPos] = useState(null);
  const [explainText, setExplainText] = useState("");

  const [generating, setGenerating] = useState(false);
  const articleBodyRef = useRef(null);

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
    fetch(`${API_PATHS.ARTICLE(id)}?depth=${reading}&perspective=${perspective}`)
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

  useEffect(() => {
    function onMouseDown(e) {
      if (!e.target.closest(".wr-explain-btn")) setExplainPos(null);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

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

  const sendChat = async (text) => {
    const q = (text !== undefined ? text : chatInput).trim();
    if (!q || chatStreaming) return;

    const newMessages = [...chatMessages, { role: "user", text: q }];
    setChatMessages([...newMessages, { role: "ai", text: "" }]);
    setChatInput("");
    setChatStreaming(true);

    try {
      const res = await fetch(API_PATHS.ARTICLE_CHAT(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
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
              setChatMessages((msgs) => {
                const updated = [...msgs];
                updated[updated.length - 1] = { role: "ai", text: aiText };
                return updated;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setChatMessages((msgs) => {
        const updated = [...msgs];
        updated[updated.length - 1] = { role: "ai", text: "Sorry, I couldn't get a response. Please try again." };
        return updated;
      });
    } finally {
      setChatStreaming(false);
    }
  };

  async function handleGenerate() {
    if (generating || !article) return;
    setGenerating(true);
    try {
      const res = await fetch(API_PATHS.GENERATE_ARTICLE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: article.category, depth: reading, perspective }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const newArticle = await res.json();
      navigate(`/article/${newArticle.id}`);
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  function handleSelectionChange() {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) { setExplainPos(null); return; }
    if (!articleBodyRef.current?.contains(sel.anchorNode)) { setExplainPos(null); return; }
    const rects = sel.getRangeAt(0).getClientRects();
    if (!rects.length) { setExplainPos(null); return; }
    const last = rects[rects.length - 1];
    setExplainText(text);
    setExplainPos({ top: last.bottom + 6, left: last.right });
  }

  function handleExplain() {
    const prompt = EXPLAIN_PROMPT(explainText);
    setExplainPos(null);
    window.getSelection()?.removeAllRanges();
    sendChat(prompt);
  }

  return (
    <article className="wr-article">
      <div className="wr-article__layout">
        <div className="wr-article__left">
          <div className="wr-article__topbar">
            <button className="wr-article__back" onClick={() => navigate("/")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to today
            </button>
            <div className="wr-article__topbar-div" />
            <div className="wr-article__controls">
              <Dropdown
                label="Depth"
                icon={<DepthIcon />}
                options={READING_LEVELS}
                value={reading}
                onChange={setReading}
              />
              <Dropdown
                label="Perspective"
                icon={<PerspectiveIcon />}
                options={PERSPECTIVE_OPTIONS}
                value={perspective}
                onChange={setPerspective}
              />
              <button
                className="wr-generate-btn"
                onClick={handleGenerate}
                disabled={generating || variantLoading}
              >
                {generating ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>

          <div className="wr-article__main" ref={mainRef} style={{ opacity: variantLoading ? 0.45 : 1, transition: "opacity 0.15s ease" }}>
          <span className={`wr-tag wr-tag--${article.category.toLowerCase()}`}>
            {article.category}
          </span>
          <h1 className="wr-article__head">{article.title}</h1>
          <p className="wr-article__lede">{article.description}</p>

          <div className="wr-article__byline">
            {variantLoading
              ? <span className="label label--generating">Generating {reading} · {perspective}…</span>
              : <span className="label">{AI_NAME}</span>
            }
            <span>· Depth: <strong>{reading}</strong> · Perspective: <strong>{perspective}</strong></span>
            <span className="meta">{article.date} · {article.readTime}</span>
          </div>

          <div ref={articleBodyRef} onMouseUp={handleSelectionChange}>
            {paragraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          </div>
        </div>

        <div className="wr-article__sidebar">
          {/* Article Chat */}
          <div className="wr-inline-ask wr-inline-ask--chat">
            <div className="wr-chat-header">
              <h4>Article Chat</h4>
              <Dropdown
                label="Suggest"
                icon={<SuggestIcon />}
                options={FOLLOW_UPS.map((f) => f.label)}
                value={null}
                onChange={(label) => sendChat(FOLLOW_UPS.find((f) => f.label === label).prompt)}
              />
            </div>

            <div className="wr-chat-msgs">
              {chatMessages.map((m, i) => (
                <div key={i} className={`wr-msg ${m.role === "user" ? "is-user" : ""}`}>
                  <div className="wr-msg__av" />
                  <div className="wr-msg__body">
                    <div className="wr-msg__lbl">{m.role === "user" ? "You" : AI_NAME}</div>
                    <div className="wr-msg__txt">
                      {m.role === "ai" ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.text || (chatStreaming && i === chatMessages.length - 1 ? "…" : "")}
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

            <div className="wr-chat-compose">
              <div className="wr-composer">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                  placeholder="Ask about this story…"
                  disabled={chatStreaming}
                  rows={1}
                />
                <button onClick={() => sendChat()} disabled={chatStreaming}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {explainPos && (
        <button
          className="wr-explain-btn"
          style={{ top: explainPos.top, left: explainPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleExplain}
        >
          Explain
        </button>
      )}
    </article>
  );
}

export default ArticleDetail;
