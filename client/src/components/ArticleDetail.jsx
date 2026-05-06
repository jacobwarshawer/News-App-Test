import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const FOLLOW_UPS = [
  "Summarize in one paragraph",
  "What's the background?",
  "Who are the key players?",
  "Read in 1 minute",
];

function ArticleDetail({ reading, openAsk }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [askInput, setAskInput] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Article not found");
        return res.json();
      })
      .then((data) => { setArticle(data); setLoading(false); window.scrollTo(0, 0); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [id]);

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

  const visibleParagraphs =
    reading === "Simple"   ? paragraphs.slice(0, 2) :
    reading === "In-depth" ? paragraphs :
    paragraphs;

  const handleAsk = (seed) => {
    openAsk({ title: article.title, id: article.id }, seed || askInput || null);
    setAskInput("");
  };

  return (
    <article className="wr-article">
      <button className="wr-article__back" onClick={() => navigate("/")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to today
      </button>

      <div className="wr-article__body">
        <span className={`wr-tag wr-tag--${article.category.toLowerCase()}`}>
          {article.category}
        </span>
        <h1 className="wr-article__head">{article.title}</h1>
        <p className="wr-article__lede">{article.description}</p>

        <div className="wr-article__byline">
          <span className="label">Brief AI</span>
          <span>· Reading as <strong>{reading}</strong></span>
          <span className="meta">{article.date} · {article.readTime}</span>
        </div>

        {visibleParagraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}

        {reading === "Simple" && paragraphs.length > 2 && (
          <p style={{ fontStyle: "italic", color: "var(--fg-4)", font: "var(--type-meta)" }}>
            Simplified view shows the key paragraphs. Switch to Neutral or In-depth for the full story.
          </p>
        )}

        <div className="wr-inline-ask">
          <h4>Ask a follow-up</h4>
          <div className="wr-composer">
            <input
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="What would you like to know about this story?"
            />
            <button onClick={() => handleAsk()}>Ask</button>
          </div>
          <div className="wr-chip-row">
            {FOLLOW_UPS.map((q) => (
              <button key={q} className="wr-chip" onClick={() => handleAsk(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export default ArticleDetail;
