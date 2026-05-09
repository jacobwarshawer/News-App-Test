import { useNavigate } from "react-router-dom";

function ArticleCard({ article, reading }) {
  const navigate = useNavigate();

  return (
    <article
      className="wr-card"
      onClick={() => navigate(`/article/${article.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/article/${article.id}`)}
    >
      <div
        className="wr-card__image"
        style={{ backgroundImage: `url(${article.imageUrl})` }}
        aria-hidden="true"
      />
      <span className={`wr-tag wr-tag--${article.category.toLowerCase()}`}>
        {article.category}
      </span>
      <h3>{article.title}</h3>
      <p className="wr-card__desc">{article.description}</p>
      <span className="wr-card__meta">AI generated · {reading}</span>
    </article>
  );
}

export default ArticleCard;
