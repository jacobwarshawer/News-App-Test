const express = require("express");
const router = express.Router();
const articles = require("../data/articles");
const { generateVariant, streamChat } = require("../services/claude");
const { buildChatSystemPrompt, DEFAULTS } = require("../constants");

const variantCache = new Map();

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

router.post("/:id/chat", async (req, res) => {
  const article = articles.find((a) => a.id === parseInt(req.params.id));
  if (!article) return res.status(404).json({ error: "Article not found" });

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const claudeMessages = messages.map((m) => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.text,
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const systemPrompt = buildChatSystemPrompt(article.title, article.content);

  await streamChat(systemPrompt, claudeMessages, {
    onText: (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
    onDone: () => {
      res.write("data: [DONE]\n\n");
      res.end();
    },
    onError: (err) => {
      console.error("Chat API error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to get response" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Something went wrong" })}\n\n`);
        res.end();
      }
    },
  });
});

router.get("/:id", async (req, res) => {
  console.log(`GET /api/articles/${req.params.id} depth=${req.query.depth} perspective=${req.query.perspective}`);
  const article = articles.find((a) => a.id === parseInt(req.params.id));
  if (!article) return res.status(404).json({ error: "Article not found" });

  const depth = req.query.depth || DEFAULTS.DEPTH;
  const perspective = req.query.perspective || DEFAULTS.PERSPECTIVE;

  if (depth === DEFAULTS.DEPTH && perspective === DEFAULTS.PERSPECTIVE) {
    return res.json(article);
  }

  const cacheKey = `${article.id}-${depth}-${perspective}`;

  if (variantCache.has(cacheKey)) {
    return res.json({ ...article, ...variantCache.get(cacheKey) });
  }

  try {
    const variant = await generateVariant(article, depth, perspective);
    variantCache.set(cacheKey, variant);
    res.json({ ...article, ...variant });
  } catch (err) {
    console.error(`Claude API error for ${cacheKey}:`);
    console.error("  message:", err.message);
    console.error("  status:", err.status);
    console.error("  error type:", err.error?.type);
    console.error("  error message:", err.error?.message);
    console.error("  API key set?", !!process.env.ANTHROPIC_API_KEY);
    res.json(article);
  }
});

module.exports = router;
