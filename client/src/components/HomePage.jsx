import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ArticleCard from "./ArticleCard";

function HomePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load articles");
        return res.json();
      })
      .then((data) => {
        setArticles(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        Loading latest news...
      </div>
    );
  }

  if (error) {
    return <div className="error-state">Unable to load articles: {error}</div>;
  }

  const [featured, ...rest] = articles;

  return (
    <div className="home-page">
      {/* Featured article */}
      <section>
        <div className="section-label">Top Story</div>
        {featured && (
          <article
            className="hero-article"
            onClick={() => navigate(`/article/${featured.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && navigate(`/article/${featured.id}`)
            }
          >
            <div className="hero-image-wrap">
              <img src={featured.imageUrl} alt={featured.title} />
            </div>
            <div className="hero-body">
              <span className="category-badge">{featured.category}</span>
              <h2 className="hero-title">{featured.title}</h2>
              <p className="hero-desc">{featured.description}</p>
              <div className="hero-meta">
                <span>{featured.author}</span>
                <span className="dot" />
                <span>{featured.date}</span>
                <span className="dot" />
                <span>{featured.readTime}</span>
              </div>
              <span className="read-more-btn">Read Full Story &rarr;</span>
            </div>
          </article>
        )}
      </section>

      {/* Article grid */}
      {rest.length > 0 && (
        <section>
          <div className="section-label">Latest News</div>
          <div className="articles-grid">
            {rest.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;
