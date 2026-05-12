import { useState, useRef, useEffect } from "react";

const SAMPLE_CATALOG = [
  { name: "Core Java (Advanced Level) (New)", url: "https://www.shl.com/products/product-catalog/view/core-java-advanced-level-new/", test_type: "K", description: "Measures advanced Java, OOP, concurrency, generics.", duration: "13 min", levels: ["Mid-Professional", "Professional Individual Contributor"] },
  { name: "Automata Pro (New)", url: "https://www.shl.com/products/product-catalog/view/automata-pro-new/", test_type: "S", description: "AI-powered coding simulation in 40+ languages.", duration: "60 min", levels: ["Mid-Professional", "Professional Individual Contributor"] },
  { name: "OPQ32r", url: "https://www.shl.com/products/product-catalog/view/opq32r/", test_type: "P", description: "Occupational personality questionnaire — the gold standard.", duration: "25 min", levels: ["All levels"] },
  { name: "Data Science (New)", url: "https://www.shl.com/products/product-catalog/view/data-science-new/", test_type: "K", description: "Machine learning, statistics, and data reasoning.", duration: "14 min", levels: ["Mid-Professional", "Professional Individual Contributor"] },
  { name: "Verify Numerical Reasoning", url: "https://www.shl.com/products/product-catalog/view/verify-numerical-reasoning/", test_type: "A", description: "Measures numerical reasoning under time pressure.", duration: "17 min", levels: ["Graduate", "Manager"] },
  { name: "Global Skills Development Report", url: "https://www.shl.com/products/product-catalog/view/global-skills-development-report/", test_type: "P", description: "Self-reported skills across 8 domains, with development tips.", duration: "Variable", levels: ["All levels"] },
  { name: "Entry Level Customer Serv-Retail & Contact Center", url: "https://www.shl.com/products/product-catalog/view/entry-level-customer-serv-retail-and-contact-center/", test_type: "C", description: "Competency assessment for frontline customer service roles.", duration: "19 min", levels: ["Entry-Level"] },
  { name: "Automata Data Science (New)", url: "https://www.shl.com/products/product-catalog/view/automata-data-science-new/", test_type: "S", description: "Simulation: analyze and modify data using ML algorithms.", duration: "60 min", levels: ["Mid-Professional", "Professional Individual Contributor"] },
];

const TYPE_META = {
  A: { label: "Ability & Aptitude", color: "#3B82F6", bg: "#EFF6FF" },
  B: { label: "Biodata / SJT", color: "#8B5CF6", bg: "#F5F3FF" },
  C: { label: "Competencies", color: "#10B981", bg: "#ECFDF5" },
  D: { label: "Development / 360", color: "#F59E0B", bg: "#FFFBEB" },
  E: { label: "Exercises", color: "#EF4444", bg: "#FEF2F2" },
  K: { label: "Knowledge & Skills", color: "#0EA5E9", bg: "#F0F9FF" },
  P: { label: "Personality & Behavior", color: "#EC4899", bg: "#FDF2F8" },
  S: { label: "Simulations", color: "#6366F1", bg: "#EEF2FF" },
};

const STARTER_PERSONAS = [
  { label: "Java Developer", prompt: "I'm hiring a mid-level Java developer who will work with stakeholders" },
  { label: "Data Scientist", prompt: "Looking for a senior data scientist with Python and ML skills" },
  { label: "Customer Service", prompt: "Hiring entry-level customer service reps for our retail team" },
  { label: "Engineering Manager", prompt: "Need to assess candidates for an engineering manager role" },
];

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || TYPE_META["K"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: meta.color, background: meta.bg, border: `1px solid ${meta.color}22`,
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.02em"
    }}>
      {type} · {meta.label}
    </span>
  );
}

function AssessmentCard({ rec, index }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[rec.test_type] || TYPE_META["K"];
  
  // Find from sample catalog for extra info
  const extra = SAMPLE_CATALOG.find(c => c.name === rec.name);

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${meta.color}33`,
        borderLeft: `3px solid ${meta.color}`,
        borderRadius: 10,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        animation: `slideIn 0.3s ease ${index * 60}ms both`,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8, background: meta.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: meta.color, flexShrink: 0,
          border: `1px solid ${meta.color}33`
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#111", lineHeight: 1.3 }}>
            {rec.name}
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <TypeBadge type={rec.test_type} />
            {extra?.duration && (
              <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}>
                ⏱ {extra.duration}
              </span>
            )}
          </div>
          {expanded && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
              {extra?.description || "See catalog for full description."}
              <div style={{ marginTop: 8 }}>
                <a
                  href={rec.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    color: "#2563EB", fontSize: 12, fontWeight: 500,
                    textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3
                  }}
                >
                  View in SHL Catalog ↗
                </a>
              </div>
            </div>
          )}
        </div>
        <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 4, flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 2,
      animation: "fadeIn 0.25s ease",
    }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0, marginRight: 8, alignSelf: "flex-end"
        }}>
          🤖
        </div>
      )}
      <div style={{ maxWidth: "72%" }}>
        <div style={{
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "linear-gradient(135deg, #1D4ED8, #2563EB)"
            : "#F8FAFC",
          color: isUser ? "#fff" : "#1F2937",
          fontSize: 14, lineHeight: 1.6,
          border: isUser ? "none" : "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}>
          {msg.content}
        </div>
      </div>
      {isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: 10, background: "#E5E7EB",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0, marginLeft: 8, alignSelf: "flex-end"
        }}>
          👤
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14
      }}>🤖</div>
      <div style={{
        padding: "10px 16px", borderRadius: "16px 16px 16px 4px",
        background: "#F8FAFC", border: "1px solid #E5E7EB",
        display: "flex", gap: 4, alignItems: "center"
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "#9CA3AF",
            animation: `bounce 1.2s ease infinite ${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function SHLRecommender() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [conversationDone, setConversationDone] = useState(false);
  const [apiMessages, setApiMessages] = useState([]);
  const [error, setError] = useState(null);
  const [showSystem, setShowSystem] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const callAPI = async (newApiMessages) => {
  const response = await fetch("https://shl-backend-dmkb.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newApiMessages,
      }),
    });
  
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  
    const result = await response.json();
  
    return result;
  };

  const sendMessage = async (content) => {
    if (!content.trim() || loading || conversationDone) return;
    setError(null);

    const userMsg = { role: "user", content };
    const displayMsg = { role: "user", content };

    setMessages(prev => [...prev, displayMsg]);
    setInput("");

    const newApiMessages = [...apiMessages, { role: "user", content }];
    setApiMessages(newApiMessages);
    setLoading(true);

    try {
      const result = await callAPI(newApiMessages);
      
      setMessages(prev => [...prev, { role: "assistant", content: result.reply }]);
      setApiMessages(prev => [...prev, { role: "assistant", content: result.reply }]);

      if (result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations.slice(0, 10));
      }
      if (result.end_of_conversation) {
        setConversationDone(true);
      }
    } catch (e) {
      setError(e.message);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting to the API. Please check your setup and try again."
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const reset = () => {
    setMessages([]);
    setApiMessages([]);
    setRecommendations([]);
    setConversationDone(false);
    setError(null);
    setInput("");
  };

  const hasConversation = messages.length > 0;

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: "linear-gradient(135deg, #F0F4FF 0%, #FAF5FF 50%, #EFF6FF 100%)",
      minHeight: "100vh", display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
        textarea:focus { outline: none; }
        button:hover { filter: brightness(0.95); }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(90deg, #1E3A8A 0%, #312E81 50%, #1E3A8A 100%)",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 20px rgba(30,58,138,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: "rgba(255,255,255,0.15)",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, border: "1px solid rgba(255,255,255,0.2)"
          }}>🎯</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
              SHL Assessment Recommender
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
              AI-powered · Catalog-grounded · No hallucinations
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {hasConversation && (
            <button onClick={reset} style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 12,
              cursor: "pointer", fontWeight: 500,
            }}>
              New Chat
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: 0 }}>
        {/* Chat Panel */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          maxWidth: recommendations.length > 0 ? "60%" : "100%",
          transition: "max-width 0.3s ease",
        }}>
          {/* Messages */}
          <div ref={chatRef} style={{
            flex: 1, overflowY: "auto", padding: "20px 24px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {!hasConversation && (
              <div style={{ textAlign: "center", paddingTop: 32 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1E3A8A", marginBottom: 6 }}>
                  SHL Assessment Recommender
                </div>
                <div style={{ fontSize: 14, color: "#6B7280", maxWidth: 400, margin: "0 auto 28px" }}>
                  Describe who you're hiring and I'll recommend the right SHL assessments from the catalog.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 480, margin: "0 auto" }}>
                  {STARTER_PERSONAS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => sendMessage(p.prompt)}
                      style={{
                        padding: "12px 14px", borderRadius: 10,
                        border: "1px solid #E5E7EB",
                        background: "#fff", cursor: "pointer",
                        textAlign: "left", transition: "all 0.2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", marginBottom: 2 }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.4 }}>
                        {p.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {loading && <TypingIndicator />}

            {conversationDone && (
              <div style={{
                textAlign: "center", padding: "12px 20px",
                background: "#F0FDF4", border: "1px solid #BBF7D0",
                borderRadius: 10, fontSize: 13, color: "#15803D",
              }}>
                ✓ Recommendations delivered · <button onClick={reset} style={{ background: "none", border: "none", color: "#15803D", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Start new search</button>
              </div>
            )}

            {error && (
              <div style={{
                padding: "10px 14px", background: "#FEF2F2",
                border: "1px solid #FECACA", borderRadius: 8,
                fontSize: 12, color: "#DC2626",
              }}>
                ⚠ {error}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{
            padding: "12px 16px",
            background: "#fff",
            borderTop: "1px solid #E5E7EB",
          }}>
            <div style={{
              display: "flex", gap: 8, alignItems: "flex-end",
              background: "#F8FAFC", borderRadius: 12,
              border: "1px solid #E5E7EB", padding: "8px 8px 8px 14px",
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={conversationDone ? "Start a new search above" : "Describe the role you're hiring for…"}
                disabled={loading || conversationDone}
                rows={1}
                style={{
                  flex: 1, border: "none", background: "none", resize: "none",
                  fontSize: 14, color: "#111", lineHeight: 1.5,
                  fontFamily: "inherit", maxHeight: 100,
                  opacity: conversationDone ? 0.5 : 1,
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading || conversationDone}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: input.trim() && !loading && !conversationDone
                    ? "linear-gradient(135deg, #1D4ED8, #2563EB)"
                    : "#E5E7EB",
                  border: "none", cursor: input.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, transition: "all 0.2s", flexShrink: 0,
                }}
              >
                {loading ? (
                  <div style={{ width: 14, height: 14, border: "2px solid #9CA3AF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                ) : "→"}
              </button>
            </div>
            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 6, textAlign: "center" }}>
              Enter to send · Shift+Enter for new line · Powered by Claude
            </div>
          </div>
        </div>

        {/* Recommendations Panel */}
        {recommendations.length > 0 && (
          <div style={{
            width: "40%", borderLeft: "1px solid #E5E7EB",
            background: "#FAFBFC",
            display: "flex", flexDirection: "column",
            animation: "slideIn 0.3s ease",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #E5E7EB",
              background: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>
                    Recommended Assessments
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                    {recommendations.length} assessment{recommendations.length > 1 ? "s" : ""} · Click to expand
                  </div>
                </div>
                <div style={{
                  padding: "3px 10px", borderRadius: 20,
                  background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
                  color: "#fff", fontSize: 12, fontWeight: 700,
                }}>
                  {recommendations.length}
                </div>
              </div>
              {/* Type breakdown */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 10 }}>
                {Object.entries(
                  recommendations.reduce((acc, r) => { acc[r.test_type] = (acc[r.test_type] || 0) + 1; return acc; }, {})
                ).map(([type, count]) => (
                  <span key={type} style={{
                    padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                    color: TYPE_META[type]?.color || "#6B7280",
                    background: TYPE_META[type]?.bg || "#F3F4F6",
                    border: `1px solid ${TYPE_META[type]?.color || "#6B7280"}22`,
                  }}>
                    {count} {type}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {recommendations.map((rec, i) => (
                <AssessmentCard key={rec.name} rec={rec} index={i} />
              ))}
            </div>

            <div style={{ padding: "12px 16px", borderTop: "1px solid #E5E7EB", background: "#fff" }}>
              <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", lineHeight: 1.5 }}>
                All assessments sourced from the official SHL catalog.<br />
                URLs verified against catalog at retrieval time.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Design Note */}
      <div style={{
        padding: "8px 24px",
        background: "rgba(30,58,138,0.04)",
        borderTop: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        {[
          { icon: "🔍", label: "TF-IDF Hybrid Retrieval" },
          { icon: "🛡", label: "URL Guardrails" },
          { icon: "🔄", label: "Stateless API" },
          { icon: "📊", label: "Recall@10 Eval" },
          { icon: "⚡", label: "FastAPI Backend" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6B7280" }}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 10, color: "#9CA3AF" }}>
          This demo uses a sample catalog. The full system uses all 400+ SHL assessments.
        </div>
      </div>
    </div>
  );
}
