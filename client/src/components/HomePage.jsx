import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ArticleCard from "./ArticleCard";

const CATEGORIES = ["All", "Politics", "Technology", "World", "Economy", "Science"];
const DETAIL_LEVELS = ["Regular", "Simple", "Complex"];

function badgeClass(category) {
  return `category-badge badge-${category.toLowerCase()}`;
}

function perspectiveLabel(value) {
  if (value < 30) return "Left-leaning";
  if (value > 70) return "Right-leaning";
  return "Balanced";
}

function HomePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState("All");
  const [detailLevel, setDetailLevel] = useState("Regular");
  const [perspective, setPerspective] = useState(50);

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

  const filtered =
    activeCategory === "All"
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  const [featured, ...rest] = filtered;

  return (
    <div className="home-page">
      {/* Filter Panel */}
      <div className="filter-panel">
        {/* Category */}
        <div className="filter-row">
          <span className="filter-row-label">Category</span>
          <div className="filter-buttons">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`filter-btn${activeCategory === cat ? " active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Detail level */}
        <div className="filter-row">
          <span className="filter-row-label">Detail level</span>
          <div className="filter-buttons">
            {DETAIL_LEVELS.map((level) => (
              <button
                key={level}
                className={`filter-btn${detailLevel === level ? " active" : ""}`}
                onClick={() => setDetailLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Perspective slider */}
        <div className="filter-row">
          <span className="filter-row-label">Perspective</span>
          <div className="slider-wrap">
            <span className="slider-end-label">Left</span>
            <input
              type="range"
              min="0"
              max="100"
              value={perspective}
              onChange={(e) => setPerspective(Number(e.target.value))}
            />
            <span className="slider-end-label">Right</span>
          </div>
          <span className="perspective-value">{perspectiveLabel(perspective)}</span>
        </div>
      </div>

      {/* TOP STORY */}
      {featured ? (
        <section>
          <div className="section-label">Top Story</div>
          <article
            className="hero-article"
            onClick={() => navigate(`/article/${featured.id}`)}
          >
            <div className="hero-image">
              <div className="hero-image-circle" />
            </div>
            <div className="hero-body">
              <span className={badgeClass(featured.category)}>{featured.category}</span>
              <h2 className="hero-title">{featured.title}</h2>
              <p className="hero-desc">{featured.description}</p>
              <div className="hero-footer">
                <span className="hero-meta-text">
                  AI generated &middot; {detailLevel} &middot; Just now
                </span>
                <button
                  className="ask-claude-btn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="claude-dot" />
                  Ask Claude about this
                </button>
              </div>
            </div>
          </article>
        </section>
      ) : (
        <div className="loading-state" style={{ color: "#888" }}>
          No articles found for this category.
        </div>
      )}

      {/* MORE STORIES */}
      {rest.length > 0 && (
        <section>
          <div className="section-label">More Stories</div>
          <div className="articles-grid">
            {rest.map((article) => (
              <ArticleCard key={article.id} article={article} detailLevel={detailLevel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;
