const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { streamChat, summarizeDocument } = require("../services/claude");
const { buildUploadChatSystemPrompt, LARGE_DOC_CHAR_THRESHOLD } = require("../constants");

const upload = multer({ storage: multer.memoryStorage() });

// ~150k tokens of content, leaving headroom for system prompt, messages, and response
const MAX_CONTENT_CHARS = 600_000;

const uploadsMap = new Map();

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  if (req.file.mimetype !== "application/pdf") {
    return res.status(400).json({ error: "Only PDF files are supported" });
  }

  try {
    const parsed = await pdfParse(req.file.buffer);
    const raw = parsed.text;
    const truncated = raw.length > MAX_CONTENT_CHARS;
    let content = truncated
      ? raw.slice(0, MAX_CONTENT_CHARS) + "\n\n[Document truncated — only the first portion is shown here and available for chat.]"
      : raw;
    let summarized = false;
    if (content.length > LARGE_DOC_CHAR_THRESHOLD) {
      content = await summarizeDocument(content);
      summarized = true;
    }

    const id = `upload-${Date.now()}`;
    uploadsMap.set(id, {
      id,
      filename: req.file.originalname,
      content,
    });
    res.json({ id, filename: req.file.originalname, text: content, truncated, summarized });
  } catch (err) {
    console.error("PDF parse error:", err.message);
    res.status(500).json({ error: "Failed to parse PDF", detail: err.message });
  }
});

router.post("/:id/chat", async (req, res) => {
  const doc = uploadsMap.get(req.params.id);
  if (!doc) return res.status(404).json({ error: "Upload not found" });

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

  const systemPrompt = buildUploadChatSystemPrompt(doc.filename, doc.content);

  await streamChat(systemPrompt, claudeMessages, {
    onText: (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
    onDone: () => {
      res.write("data: [DONE]\n\n");
      res.end();
    },
    onError: (err) => {
      console.error("Upload chat API error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to get response" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Something went wrong" })}\n\n`);
        res.end();
      }
    },
  });
});

module.exports = router;
