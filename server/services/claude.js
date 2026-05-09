const Anthropic = require("@anthropic-ai/sdk");
const { MODELS, MAX_TOKENS, VARIANT_SYSTEM_PROMPT } = require("../constants");

const client = new Anthropic();

async function generateVariant(article, depth, perspective) {
  const message = await client.messages.create({
    model: MODELS.VARIANT,
    max_tokens: MAX_TOKENS.VARIANT,
    system: VARIANT_SYSTEM_PROMPT,
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

async function streamChat(systemPrompt, messages, { onText, onDone, onError }) {
  try {
    const stream = client.messages.stream({
      model: MODELS.CHAT,
      max_tokens: MAX_TOKENS.CHAT,
      system: systemPrompt,
      messages,
    });

    stream.on("text", onText);
    await stream.finalMessage();
    onDone();
  } catch (err) {
    onError(err);
  }
}

module.exports = { generateVariant, streamChat };
