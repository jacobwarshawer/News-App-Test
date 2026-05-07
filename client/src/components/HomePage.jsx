import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ArticleCard from "./ArticleCard";

const CATEGORIES = ["All", "Politics", "Technology", "World", "Economy", "Science"];
const READING_LEVELS = ["Neutral", "Simple", "In-depth"];

function perspectiveLabel(p) {
  if (p < 0.20) return "Left-leaning";
  if (p < 0.40) return "Center-left";
  if (p < 0.60) return "Balanced";
  if (p < 0.80) return "Center-right";
  return "Right-leaning";
}

function tagClass(category) {
  return `wr-tag wr-tag--${category.toLowerCase()}`;
}

function ControlBar({ category, setCategory, reading, setReading, perspective, setPerspective }) {
  const trackRef = useRef(null);
  const drag = useRef(false);

  const onTrack = (e) => {
    const r = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setPerspective(x);
  };

  useEffect(() => {
    const up = () => (drag.current = false);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  return (
    <section className="wr-controls" aria-label="Reader controls">
      <div className="wr-controls__row">
        <div className="wr-controls__label">Category</div>
        <div className="wr-controls__field">
          <div className="wr-seg">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={c === category ? "is-active" : ""}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="wr-controls__row">
        <div className="wr-controls__label">Reading as</div>
        <div className="wr-controls__field">
          <div className="wr-seg">
            {READING_LEVELS.map((r) => (
              <button
                key={r}
                className={r === reading ? "is-active" : ""}
                onClick={() => setReading(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="wr-controls__row">
        <div className="wr-controls__label">Perspective</div>
        <div className="wr-controls__field">
          <div className="wr-slider">
            <span className="wr-slider__end">Left</span>
            <div
              className="wr-slider__track"
              ref={trackRef}
              onMouseDown={(e) => { drag.current = true; onTrack(e); }}
              onMouseMove={(e) => { if (drag.current) onTrack(e); }}
              onClick={onTrack}
            >
              <div className="wr-slider__fill" style={{ width: `${perspective * 100}%` }} />
              <div className="wr-slider__thumb" style={{ left: `${perspective * 100}%` }} />
            </div>
            <span className="wr-slider__end">Right</span>
            <span className="wr-slider__pill">{perspectiveLabel(perspective)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomePage({ reading, setReading, openAsk }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("All");
  const [perspective, setPerspective] = useState(0.5);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/articles")
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
      <ControlBar
        category={category} setCategory={setCategory}
        reading={reading}   setReading={setReading}
        perspective={perspective} setPerspective={setPerspective}
      />

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
                <button
                  className="wr-ask"
                  onClick={(e) => { e.stopPropagation(); openAsk(hero); }}
                >
                  <span className="wr-ask__dot" />
                  Ask Brief AI about this
                </button>
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
              <ArticleCard key={a.id} article={a} reading={reading} openAsk={openAsk} />
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
