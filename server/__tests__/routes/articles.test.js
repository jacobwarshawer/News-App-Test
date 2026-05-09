jest.mock("../../services/claude");
const { generateVariant, streamChat } = require("../../services/claude");

const request = require("supertest");
const express = require("express");

// Build a fresh Express app for this test file.
// The variantCache Map starts empty because Jest loads modules fresh per file.
const app = express();
app.use(express.json());
app.use("/api/articles", require("../../routes/articles"));

describe("GET /api/articles", () => {
  it("returns 200 with an array", async () => {
    const res = await request(app).get("/api/articles");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns at least one article", async () => {
    const res = await request(app).get("/api/articles");
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("each item has the expected summary fields", async () => {
    const res = await request(app).get("/api/articles");
    for (const a of res.body) {
      expect(a).toHaveProperty("id");
      expect(a).toHaveProperty("title");
      expect(a).toHaveProperty("description");
      expect(a).toHaveProperty("category");
      expect(a).toHaveProperty("author");
      expect(a).toHaveProperty("date");
      expect(a).toHaveProperty("readTime");
    }
  });

  it("does NOT include the full content body in summaries", async () => {
    const res = await request(app).get("/api/articles");
    for (const a of res.body) {
      expect(a).not.toHaveProperty("content");
    }
  });
});

describe("GET /api/articles/:id — base variant (Medium / Center)", () => {
  it("returns 200 with the article for a valid id", async () => {
    const res = await request(app).get("/api/articles/1?depth=Medium&perspective=Center");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("content");
  });

  it("does NOT call generateVariant for the default depth and perspective", async () => {
    await request(app).get("/api/articles/1?depth=Medium&perspective=Center");
    expect(generateVariant).not.toHaveBeenCalled();
  });

  it("also skips generateVariant when no query params are provided (uses defaults)", async () => {
    await request(app).get("/api/articles/1");
    expect(generateVariant).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown article id", async () => {
    const res = await request(app).get("/api/articles/9999");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/articles/:id — non-default variant", () => {
  it("calls generateVariant and merges variant data into the response", async () => {
    generateVariant.mockResolvedValue({ description: "variant desc", content: "variant body" });
    const res = await request(app).get("/api/articles/1?depth=Low&perspective=Left");
    expect(res.status).toBe(200);
    expect(res.body.description).toBe("variant desc");
    expect(res.body.content).toBe("variant body");
    expect(generateVariant).toHaveBeenCalledTimes(1);
  });

  it("passes the correct depth and perspective to generateVariant", async () => {
    generateVariant.mockResolvedValue({ description: "d", content: "c" });
    await request(app).get("/api/articles/1?depth=High&perspective=Right");
    expect(generateVariant).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      "High",
      "Right"
    );
  });

  it("caches the result — second identical request does not call generateVariant again", async () => {
    generateVariant.mockResolvedValue({ description: "cached", content: "cached body" });
    // Use article 2 with params not used elsewhere in this file
    await request(app).get("/api/articles/2?depth=Low&perspective=Left");
    await request(app).get("/api/articles/2?depth=Low&perspective=Left");
    expect(generateVariant).toHaveBeenCalledTimes(1);
  });

  it("falls back to the base article when generateVariant throws", async () => {
    generateVariant.mockRejectedValue(new Error("Claude API unavailable"));
    const res = await request(app).get("/api/articles/1?depth=Low&perspective=Right");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("content");
  });
});

describe("POST /api/articles/:id/chat", () => {
  it("returns 404 for an unknown article id", async () => {
    const res = await request(app)
      .post("/api/articles/9999/chat")
      .send({ messages: [{ role: "user", text: "hello" }] });
    expect(res.status).toBe(404);
  });

  it("returns 400 when the messages field is missing", async () => {
    const res = await request(app).post("/api/articles/1/chat").send({});
    expect(res.status).toBe(400);
  });

  it("returns 400 when the messages array is empty", async () => {
    const res = await request(app).post("/api/articles/1/chat").send({ messages: [] });
    expect(res.status).toBe(400);
  });

  it("calls streamChat with the correct system prompt and mapped messages", async () => {
    streamChat.mockImplementation((_, __, { onDone }) => { onDone(); return Promise.resolve(); });
    await request(app)
      .post("/api/articles/1/chat")
      .send({ messages: [{ role: "user", text: "what happened?" }] });

    expect(streamChat).toHaveBeenCalledTimes(1);
    const [systemPrompt, messages] = streamChat.mock.calls[0];
    expect(typeof systemPrompt).toBe("string");
    expect(systemPrompt.length).toBeGreaterThan(0);
    expect(messages).toEqual([{ role: "user", content: "what happened?" }]);
  });

  it("maps the 'ai' role to 'assistant' before calling streamChat", async () => {
    streamChat.mockImplementation((_, __, { onDone }) => { onDone(); return Promise.resolve(); });
    await request(app)
      .post("/api/articles/1/chat")
      .send({
        messages: [
          { role: "user", text: "hello" },
          { role: "ai", text: "hi there" },
        ],
      });

    const [, messages] = streamChat.mock.calls[0];
    expect(messages[1].role).toBe("assistant");
  });
});
