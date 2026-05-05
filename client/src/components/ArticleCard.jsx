import { useNavigate } from "react-router-dom";

function ArticleCard({ article }) {
  const navigate = useNavigate();

  return (
    <article
      className="article-card"
      onClick={() => navigate(`/article/${article.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/article/${article.id}`)}
    >
      <div className="card-image-wrap">
        <img src={article.imageUrl} alt={article.title} loading="lazy" />
      </div>
      <div className="card-body">
        <span className="category-badge">{article.category}</span>
        <h3 className="card-title">{article.title}</h3>
        <p className="card-desc">{article.description}</p>
        <div className="card-meta">
          <span>{article.author}</span>
          <span className="dot" />
          <span>{article.date}</span>
          <span className="dot" />
          <span>{article.readTime}</span>
        </div>
      </div>
    </article>
  );
}

export default ArticleCard;
