const express = require("express");
const router = express.Router();
const Anthropic = require("@anthropic-ai/sdk");
const articles = require("../data/articles");

const client = new Anthropic();

// In-memory cache: key = "${articleId}-${depth}-${perspective}"
const variantCache = new Map();

const SYSTEM_PROMPT = `You are a news article rewriter for The Daily Brief, a digital news publication.

Your task is to rewrite a provided article at a specific depth level and political perspective framing.

DEPTH LEVELS:
- Low: Very short summary, 2-3 paragraphs only. Cover only the most essential facts.
- Medium: Standard news article, 4-5 paragraphs. Cover key facts, context, and one reaction or quote.
- High: Detailed deep dive, 6-7+ paragraphs. Include background, multiple angles, implications, and supporting detail.

PERSPECTIVE FRAMING:
- Left: Progressive framing. Emphasize worker rights, corporate accountability, regulatory need, environmental urgency, and social equity. Foreground impacts on vulnerable groups.
- Center: Balanced and neutral. Present multiple viewpoints fairly. Stick to verified facts. Avoid loaded language.
- Right: Conservative framing. Emphasize free market solutions, limited government, individual liberty, fiscal responsibility, national sovereignty, and the costs of regulation.

RULES:
- Rewrite both a short description (1-2 sentences, for the article card) AND the full article body.
- Do not include the article title in your output.
- Keep all proper nouns, statistics, dates, and factual claims from the original accurate.
- Do not invent facts not present in the original.
- Return ONLY valid JSON in this exact format, with no additional text before or after:
{"description": "...", "content": "..."}`;

async function generateVariant(article, depth, perspective) {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Title: ${article.title}\nCategory: ${article.category}\n\nOriginal article:\n${article.content}`,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `Rewrite the above article for Depth: ${depth}, Perspective: ${perspective}.`,
          },
        ],
      },
    ],
  });

  const raw = message.content[0].text;

  // Strip markdown code fences if present (e.g. ```json ... ```)
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error("Claude JSON parse error. Raw response was:\n", raw);
    throw parseErr;
  }

  if (!parsed.description || !parsed.content) throw new Error("Missing fields in Claude response");
  return { description: parsed.description, content: parsed.content };
}

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

router.get("/:id", async (req, res) => {
  console.log(`GET /api/articles/${req.params.id} depth=${req.query.depth} perspective=${req.query.perspective}`);
  const article = articles.find((a) => a.id === parseInt(req.params.id));
  if (!article) return res.status(404).json({ error: "Article not found" });

  const depth = req.query.depth || "Medium";
  const perspective = req.query.perspective || "Center";

  // Base variant: return stored content directly, no API call
  if (depth === "Medium" && perspective === "Center") {
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
