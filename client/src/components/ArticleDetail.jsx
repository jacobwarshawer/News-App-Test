import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Article not found");
        return res.json();
      })
      .then((data) => {
        setArticle(data);
        setLoading(false);
        window.scrollTo(0, 0);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        Loading article...
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="error-state">
        <p>{error || "Article not found."}</p>
        <Link to="/" className="back-link" style={{ justifyContent: "center", marginTop: "16px" }}>
          &larr; Back to Home
        </Link>
      </div>
    );
  }

  const paragraphs = article.content
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="article-detail">
      <Link to="/" className="back-link">
        &larr; Back to Home
      </Link>

      <header className="article-header">
        <span className={`category-badge badge-${article.category.toLowerCase()}`}>{article.category}</span>
        <h1 className="article-title">{article.title}</h1>
        <div className="article-byline">
          <span>By <strong>{article.author}</strong></span>
          <span className="dot" />
          <span>{article.date}</span>
          <span className="dot" />
          <span>{article.readTime}</span>
        </div>
      </header>

      <img
        className="article-hero-img"
        src={article.imageUrl}
        alt={article.title}
      />

      <div className="article-body">
        {paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  );
}

export default ArticleDetail;
