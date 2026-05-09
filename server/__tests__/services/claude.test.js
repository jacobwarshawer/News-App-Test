// Mock must be declared before requiring the module under test
jest.mock("@anthropic-ai/sdk");
const Anthropic = require("@anthropic-ai/sdk");

const mockCreate = jest.fn();
const mockStreamOn = jest.fn();
const mockFinalMessage = jest.fn().mockResolvedValue({});
const mockStream = { on: mockStreamOn, finalMessage: mockFinalMessage };

Anthropic.mockImplementation(() => ({
  messages: {
    create: mockCreate,
    stream: jest.fn().mockReturnValue(mockStream),
  },
}));

const { generateVariant, streamChat } = require("../../services/claude");

const baseArticle = { title: "Test Article", category: "Tech", content: "Article body text." };

describe("generateVariant", () => {
  it("returns parsed description and content on a valid JSON response", async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: '{"description":"a summary","content":"rewritten body"}' }],
    });
    const result = await generateVariant(baseArticle, "Low", "Left");
    expect(result).toEqual({ description: "a summary", content: "rewritten body" });
  });

  it("strips markdown code fences before parsing", async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: "```json\n{\"description\":\"d\",\"content\":\"c\"}\n```" }],
    });
    const result = await generateVariant(baseArticle, "High", "Right");
    expect(result).toEqual({ description: "d", content: "c" });
  });

  it("throws when the description field is missing from the response", async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: '{"content":"body only"}' }],
    });
    await expect(generateVariant(baseArticle, "Low", "Left")).rejects.toThrow();
  });

  it("throws when the content field is missing from the response", async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: '{"description":"desc only"}' }],
    });
    await expect(generateVariant(baseArticle, "Low", "Left")).rejects.toThrow();
  });

  it("throws on completely invalid JSON", async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: "not valid json at all" }],
    });
    await expect(generateVariant(baseArticle, "Low", "Left")).rejects.toThrow();
  });
});

describe("streamChat", () => {
  it("calls onText for each text event fired by the stream", async () => {
    mockStreamOn.mockImplementation((event, handler) => {
      if (event === "text") handler("streamed chunk");
      return mockStream;
    });
    const onText = jest.fn();
    await streamChat("system prompt", [], { onText, onDone: jest.fn(), onError: jest.fn() });
    expect(onText).toHaveBeenCalledWith("streamed chunk");
  });

  it("calls onDone after finalMessage resolves", async () => {
    mockStreamOn.mockImplementation(() => mockStream);
    const onDone = jest.fn();
    await streamChat("system prompt", [], { onText: jest.fn(), onDone, onError: jest.fn() });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("calls onError when finalMessage rejects", async () => {
    mockStreamOn.mockImplementation(() => mockStream);
    mockFinalMessage.mockRejectedValueOnce(new Error("stream failure"));
    const onDone = jest.fn();
    const onError = jest.fn();
    await streamChat("system prompt", [], { onText: jest.fn(), onDone, onError });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
  });
});
