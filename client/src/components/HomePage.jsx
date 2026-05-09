import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ArticleCard from "./ArticleCard";
import Dropdown from "./Dropdown";
import { CATEGORIES, READING_LEVELS, PERSPECTIVE_OPTIONS, DEFAULTS, API_PATHS } from "../constants";

function tagClass(category) {
  return `wr-tag wr-tag--${category.toLowerCase()}`;
}

const CategoryIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="1" width="4.5" height="4.5" rx="1" />
    <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" />
    <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" />
    <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" />
  </svg>
);

const ReadingIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M1 3h11M1 6.5h8M1 10h5" />
  </svg>
);

const PerspectiveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 6.5h11M4 3L1 6.5l3 3.5M9 3l3 3.5-3 3.5" />
  </svg>
);

function HomePage({ reading, setReading, articles, setArticles }) {
  const [loading, setLoading] = useState(articles === null);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(DEFAULTS.CATEGORY);
  const [perspective, setPerspective] = useState(DEFAULTS.PERSPECTIVE);
  const [generating, setGenerating] = useState(false);

  const navigate = useNavigate();

  async function handleGenerate() {
    setGenerating(true);
    const contentCategories = CATEGORIES.filter((c) => c !== "All");
    try {
      const results = await Promise.all(
        contentCategories.map((cat) =>
          fetch(API_PATHS.GENERATE_ARTICLE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: cat, depth: reading, perspective }),
          }).then((r) => r.json())
        )
      );
      setArticles(results);
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    if (articles !== null) return;
    fetch(API_PATHS.ARTICLES)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load articles");
        return res.json();
      })
      .then((data) => { setArticles(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <div className="loading-state"><div className="spinner" />Loading latest news…</div>;
  if (error)   return <div className="error-state">Unable to load articles: {error}</div>;

  const filtered = category === "All" ? articles : articles.filter((a) => a.category === category);
  const [hero, ...rest] = filtered;

  return (
    <>
      <div className="wr-controls" role="toolbar" aria-label="Reader controls">
        <Dropdown label="Category"    icon={<CategoryIcon />}    options={CATEGORIES}          value={category}    onChange={setCategory} />
        <Dropdown label="Depth"     icon={<ReadingIcon />}     options={READING_LEVELS}      value={reading}     onChange={setReading} />
        <Dropdown label="Perspective" icon={<PerspectiveIcon />} options={PERSPECTIVE_OPTIONS} value={perspective} onChange={setPerspective} />
        <button className="wr-generate-btn" onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating…" : "Generate"}
        </button>
      </div>

      {hero ? (
        <>
          <div className="wr-eyebrow">Top story</div>
          <article className="wr-hero" onClick={() => navigate(`/article/${hero.id}`)}>
            <div
              className="wr-hero__image"
              style={{ backgroundImage: `url(${hero.imageUrl})` }}
              aria-hidden="true"
            />
            <div className="wr-hero__body">
              <span className={tagClass(hero.category)}>{hero.category}</span>
              <h1>{hero.title}</h1>
              <p>{hero.description}</p>
              <div className="wr-hero__foot">
                <span className="wr-card__meta">
                  AI generated · {reading} · Just now
                </span>
              </div>
            </div>
          </article>
        </>
      ) : (
        <div className="loading-state" style={{ paddingTop: 40 }}>
          No articles found for this category.
        </div>
      )}

      {rest.length > 0 && (
        <>
          <div className="wr-eyebrow">More stories</div>
          <div className="wr-grid">
            {rest.map((a) => (
              <ArticleCard key={a.id} article={a} reading={reading} />
            ))}
          </div>
        </>
      )}

      <footer className="wr-footer">
        <span>© 2026 The DailyBrief · All AI-generated stories are reviewed against verified sources.</span>
        <div className="wr-footer__links">
          <a href="#">About</a>
          <a href="#">Sources</a>
          <a href="#">Editorial standards</a>
        </div>
      </footer>
    </>
  );
}

export default HomePage;
