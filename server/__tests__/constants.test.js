const { buildChatSystemPrompt, DEFAULTS, MAX_TOKENS } = require("../constants");

describe("buildChatSystemPrompt", () => {
  it("includes the article title", () => {
    const result = buildChatSystemPrompt("Test Title", "body text");
    expect(result).toContain("Test Title");
  });

  it("includes the article content", () => {
    const result = buildChatSystemPrompt("T", "unique body content xyz");
    expect(result).toContain("unique body content xyz");
  });

  it("returns a non-empty string", () => {
    expect(typeof buildChatSystemPrompt("t", "c")).toBe("string");
    expect(buildChatSystemPrompt("t", "c").length).toBeGreaterThan(0);
  });
});

describe("DEFAULTS", () => {
  it("depth is Medium", () => {
    expect(DEFAULTS.DEPTH).toBe("Medium");
  });

  it("perspective is Center", () => {
    expect(DEFAULTS.PERSPECTIVE).toBe("Center");
  });
});

describe("MAX_TOKENS", () => {
  it("variant token limit is greater than chat token limit", () => {
    expect(MAX_TOKENS.VARIANT).toBeGreaterThan(MAX_TOKENS.CHAT);
  });
});
