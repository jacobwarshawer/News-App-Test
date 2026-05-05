import { useNavigate } from "react-router-dom";

function badgeClass(category) {
  return `category-badge badge-${category.toLowerCase()}`;
}

function ArticleCard({ article, detailLevel = "Regular" }) {
  const navigate = useNavigate();

  return (
    <article
      className="article-card"
      onClick={() => navigate(`/article/${article.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/article/${article.id}`)}
    >
      <span className={badgeClass(article.category)}>{article.category}</span>
      <h3 className="card-title">{article.title}</h3>
      <div className="card-footer">
        <span className="card-meta">AI generated &middot; {detailLevel}</span>
        <button
          className="ask-claude-small"
          onClick={(e) => e.stopPropagation()}
        >
          Ask Claude ↗
        </button>
      </div>
    </article>
  );
}

export default ArticleCard;
