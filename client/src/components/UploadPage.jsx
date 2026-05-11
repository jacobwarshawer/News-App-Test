import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AI_NAME, FOLLOW_UPS } from "../constants";
import Dropdown from "./Dropdown";

const UPLOAD_CHAT_API = (id) => `/api/uploads/${id}/chat`;

const EXPLAIN_PROMPT_DOC = (text) =>
  `Please explain this part of the document: "${text}"`;

const SuggestIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 1.5L7.8 5.2L11.5 6.5L7.8 7.8L6.5 11.5L5.2 7.8L1.5 6.5L5.2 5.2Z" />
  </svg>
);

function UploadPage() {
  const navigate = useNavigate();
  const [uploadId, setUploadId] = useState(null);
  const [filename, setFilename] = useState("");
  const [paragraphs, setParagraphs] = useState([]);
  const [summarized, setSummarized] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const msgsEndRef = useRef(null);
  const mainRef = useRef(null);

  const [explainPos, setExplainPos] = useState(null);
  const [explainText, setExplainText] = useState("");
  const textBodyRef = useRef(null);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    function onMouseDown(e) {
      if (!e.target.closest(".wr-explain-btn")) setExplainPos(null);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  async function handleFile(file) {
    if (!file || file.type !== "application/pdf") {
      setUploadError("Please upload a PDF file.");
      return;
    }
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setFilename(data.filename);
      setParagraphs(data.text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean));
      setSummarized(data.summarized ?? false);
      setUploadId(data.id);
      setChatMessages([]);
      mainRef.current?.scrollTo(0, 0);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleFileInput(e) {
    handleFile(e.target.files[0]);
  }

  function handleSelectionChange() {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) { setExplainPos(null); return; }
    if (!textBodyRef.current?.contains(sel.anchorNode)) { setExplainPos(null); return; }
    const rects = sel.getRangeAt(0).getClientRects();
    if (!rects.length) { setExplainPos(null); return; }
    const last = rects[rects.length - 1];
    setExplainText(text);
    setExplainPos({ top: last.bottom + 6, left: last.right });
  }

  function handleExplain() {
    setExplainPos(null);
    window.getSelection()?.removeAllRanges();
    sendChat(EXPLAIN_PROMPT_DOC(explainText));
  }

  function resetUpload() {
    setUploadId(null);
    setFilename("");
    setParagraphs([]);
    setSummarized(false);
    setChatMessages([]);
    setUploadError(null);
  }

  const sendChat = async (text) => {
    if (!uploadId) return;
    const q = (text !== undefined ? text : chatInput).trim();
    if (!q || chatStreaming) return;

    const newMessages = [...chatMessages, { role: "user", text: q }];
    setChatMessages([...newMessages, { role: "ai", text: "" }]);
    setChatInput("");
    setChatStreaming(true);

    try {
      const res = await fetch(UPLOAD_CHAT_API(uploadId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const { text: chunk } = JSON.parse(payload);
            if (chunk) {
              aiText += chunk;
              setChatMessages((msgs) => {
                const updated = [...msgs];
                updated[updated.length - 1] = { role: "ai", text: aiText };
                return updated;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setChatMessages((msgs) => {
        const updated = [...msgs];
        updated[updated.length - 1] = { role: "ai", text: "Sorry, I couldn't get a response. Please try again." };
        return updated;
      });
    } finally {
      setChatStreaming(false);
    }
  };

  return (
    <article className="wr-article">
      <div className="wr-article__layout">
        <div className="wr-article__left">
          <div className="wr-article__topbar">
            {uploadId ? (
              <>
                <button className="wr-article__back" onClick={resetUpload}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Upload another
                </button>
              </>
            ) : (
              <button className="wr-article__back" onClick={() => navigate("/")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to today
              </button>
            )}
          </div>

          <div className="wr-article__main" ref={mainRef}>
            {!uploadId ? (
              <div
                className={`wr-drop-zone${dragOver ? " wr-drop-zone--active" : ""}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                {uploading ? (
                  <div className="wr-upload-loading">
                    <div className="spinner" />
                    <p>Extracting text…</p>
                  </div>
                ) : (
                  <>
                    <svg className="wr-drop-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="8" y="4" width="32" height="40" rx="3" />
                      <path d="M28 4v10h12M16 28l8-8 8 8M24 20v14" />
                    </svg>
                    <p className="wr-drop-label">Drag a PDF here</p>
                    <p className="wr-drop-sub">or</p>
                    <label className="wr-upload-btn">
                      Choose file
                      <input
                        type="file"
                        accept="application/pdf"
                        style={{ display: "none" }}
                        onChange={handleFileInput}
                      />
                    </label>
                    {uploadError && <p className="wr-upload-error">{uploadError}</p>}
                  </>
                )}
              </div>
            ) : (
              <>
                <span className="wr-tag wr-tag--upload">Document</span>
                <h1 className="wr-article__head">{filename}</h1>
                {summarized && (
                  <p className="wr-upload-summary-notice">
                    This document was large — chat responses are based on an AI-generated summary.
                  </p>
                )}
                <div ref={textBodyRef} onMouseUp={handleSelectionChange}>
                  {paragraphs.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="wr-article__sidebar">
          <div className="wr-inline-ask wr-inline-ask--chat">
            <div className="wr-chat-header">
              <h4>Document Chat</h4>
              {uploadId && (
                <Dropdown
                  label="Suggest"
                  icon={<SuggestIcon />}
                  options={FOLLOW_UPS.map((f) => f.label)}
                  value={null}
                  onChange={(label) => sendChat(FOLLOW_UPS.find((f) => f.label === label).prompt)}
                />
              )}
            </div>

            <div className="wr-chat-msgs">
              {!uploadId && (
                <p className="wr-chat-empty">Upload a PDF to start chatting.</p>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`wr-msg ${m.role === "user" ? "is-user" : ""}`}>
                  <div className="wr-msg__av" />
                  <div className="wr-msg__body">
                    <div className="wr-msg__lbl">{m.role === "user" ? "You" : AI_NAME}</div>
                    <div className="wr-msg__txt">
                      {m.role === "ai" ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.text || (chatStreaming && i === chatMessages.length - 1 ? "…" : "")}
                        </ReactMarkdown>
                      ) : (
                        m.text
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={msgsEndRef} />
            </div>

            <div className="wr-chat-compose">
              <div className="wr-composer">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  placeholder={uploadId ? "Ask about this document…" : "Upload a PDF to start chatting…"}
                  disabled={chatStreaming || !uploadId}
                  rows={1}
                />
                <button onClick={() => sendChat()} disabled={chatStreaming || !uploadId}>Ask</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {explainPos && (
        <button
          className="wr-explain-btn"
          style={{ top: explainPos.top, left: explainPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleExplain}
        >
          Explain
        </button>
      )}
    </article>
  );
}

export default UploadPage;
