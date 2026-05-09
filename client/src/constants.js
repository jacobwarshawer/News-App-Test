export const READING_LEVELS = ["Low", "Medium", "High"];

export const PERSPECTIVE_OPTIONS = ["Left", "Center", "Right"];

export const CATEGORIES = ["All", "Politics", "Technology", "World", "Economy", "Science"];

export const FOLLOW_UPS = [
  {
    label: "Summarize in one paragraph",
    prompt: "Summarize this article in a single concise paragraph covering only the most important point.",
  },
  {
    label: "What's the background?",
    prompt: "What background context or history is relevant to understanding this story? What led to this situation?",
  },
  {
    label: "Who are the key players?",
    prompt: "Who are the key people, organizations, or groups involved in this story, and what role does each play?",
  },
  {
    label: "Read in 1 minute",
    prompt: "Give me a 1-minute read of this article — just the essential facts as 3 to 4 short bullet points.",
  },
  {
    label: "How does this connect to other issues?",
    prompt: "How does this story connect to broader trends, related issues, or other current events? What is the bigger picture?",
  },
  {
    label: "What questions should I be asking?",
    prompt: "What are the most important questions a critical reader should ask about this story? What might be missing, overstated, or worth scrutinizing?",
  },
  {
    label: "Further reading",
    prompt: "What topics, events, or concepts from this article are worth reading more about? List 3 to 5 areas with a brief note on why each matters.",
  },
];

export const EXPLAIN_PROMPT = (selectedText) =>
  `Please explain this part of the article: "${selectedText}"`;

export const AI_NAME = "Brief AI";

export const CHAT_GREETING = "I've read this story. Ask me anything about it — I'll cite the sections I'm drawing from.";

export const API_PATHS = {
  ARTICLES: "/api/articles",
  ARTICLE: (id) => `/api/articles/${id}`,
  ARTICLE_CHAT: (id) => `/api/articles/${id}/chat`,
  GENERATE_ARTICLE: "/api/articles/generate",
};

export const DEFAULTS = {
  READING: "Medium",
  PERSPECTIVE: "Center",
  CATEGORY: "All",
};
