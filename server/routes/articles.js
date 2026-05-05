const express = require("express");
const router = express.Router();
const articles = require("../data/articles");

router.get("/", (req, res) => {
  const summaries = articles.map(
    ({ id, title, description, category, author, date, readTime, imageUrl }) => ({
      id,
      title,
      description,
      category,
      author,
      date,
      readTime,
      imageUrl,
    })
  );
  res.json(summaries);
});

router.get("/:id", (req, res) => {
  const article = articles.find((a) => a.id === parseInt(req.params.id));
  if (!article) return res.status(404).json({ error: "Article not found" });
  res.json(article);
});

module.exports = router;
