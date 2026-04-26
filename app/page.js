"use client";
import { useState, useRef, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://your-space.hf.space";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "مرحباً! أنا مساعد المعرفة العالمي 🌍\nاسألني عن أي موضوع وسأبحث في ويكيبيديا العربية والإنجليزية.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [indexTopic, setIndexTopic] = useState("");
  const [indexLang, setIndexLang] = useState("ar");
  const [indexing, setIndexing] = useState(false);
  const [indexMsg, setIndexMsg] = useState("");
  const [stats, setStats] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const r = await fetch(`${API_BASE}/stats`);
      const d = await r.json();
      setStats(d);
    } catch {}
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, lang: "auto" }),
      });
      const d = await r.json();
      setMessages((m) => [...m, { role: "assistant", text: d.answer || "حدث خطأ." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "❌ لا يمكن الاتصال بالـ API. تأكد من رفع Backend على Hugging Face." }]);
    }
    setLoading(false);
    fetchStats();
  }

  async function handleIndex() {
    if (!indexTopic.trim() || indexing) return;
    setIndexing(true);
    setIndexMsg("");
    try {
      const r = await fetch(`${API_BASE}/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: indexTopic.trim(), lang: indexLang, sentences: 20 }),
      });
      const d = await r.json();
      setIndexMsg(`✅ تم فهرسة "${d.topic}" — ${d.chunks_added} قطعة نصية`);
      setIndexTopic("");
      fetchStats();
    } catch {
      setIndexMsg("❌ فشل الاتصال بالـ API");
    }
    setIndexing(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=Space+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #0a0c10;
          --surface:  #111520;
          --panel:    #161b28;
          --border:   #1e2740;
          --accent:   #3b82f6;
          --accent2:  #8b5cf6;
          --gold:     #f59e0b;
          --text:     #e2e8f0;
          --muted:    #64748b;
          --user-bg:  linear-gradient(135deg,#1d4ed8,#7c3aed);
          --ai-bg:    #161b28;
          --glow:     0 0 40px rgba(59,130,246,.15);
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Tajawal', sans-serif;
          min-height: 100vh;
          direction: rtl;
          overflow: hidden;
        }

        .grid-bg {
          position: fixed; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(59,130,246,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .orb {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
          filter: blur(80px); opacity: .25;
        }
        .orb-1 { width: 500px; height: 500px; background: #3b82f6; top: -200px; right: -150px; }
        .orb-2 { width: 400px; height: 400px; background: #8b5cf6; bottom: -150px; left: -100px; }

        .app {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: 280px 1fr;
          height: 100vh;
        }

        /* ── Sidebar ── */
        .sidebar {
          background: var(--panel);
          border-left: 1px solid var(--border);
          display: flex; flex-direction: column;
          padding: 24px 16px;
          gap: 20px;
          overflow-y: auto;
        }

        .logo {
          display: flex; align-items: center; gap: 10px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .logo-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: grid; place-items: center;
          font-size: 18px;
        }
        .logo-text { font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.2; }
        .logo-sub  { font-size: 11px; color: var(--muted); font-family: 'Space Mono', monospace; }

        .section-title {
          font-size: 10px; letter-spacing: .12em; text-transform: uppercase;
          color: var(--muted); font-family: 'Space Mono', monospace;
          padding: 0 4px;
        }

        .index-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          display: flex; flex-direction: column; gap: 10px;
        }

        .lang-tabs {
          display: flex; gap: 6px;
        }
        .lang-tab {
          flex: 1; padding: 6px; border-radius: 7px; border: 1px solid var(--border);
          background: transparent; color: var(--muted); cursor: pointer;
          font-family: 'Tajawal', sans-serif; font-size: 13px; font-weight: 600;
          transition: all .2s;
        }
        .lang-tab.active {
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-color: transparent; color: #fff;
        }

        .idx-input {
          width: 100%;
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 8px; padding: 9px 12px;
          color: var(--text); font-family: 'Tajawal', sans-serif; font-size: 14px;
          outline: none; transition: border-color .2s;
          direction: rtl;
        }
        .idx-input:focus { border-color: var(--accent); }

        .idx-btn {
          width: 100%;
          padding: 9px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none; border-radius: 8px;
          color: #fff; font-family: 'Tajawal', sans-serif;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: opacity .2s, transform .1s;
        }
        .idx-btn:hover { opacity: .9; }
        .idx-btn:active { transform: scale(.98); }
        .idx-btn:disabled { opacity: .5; cursor: not-allowed; }

        .idx-msg { font-size: 12px; color: #4ade80; text-align: center; min-height: 16px; }

        .stats-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px; display: flex; flex-direction: column; gap: 8px;
        }
        .stat-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 13px;
        }
        .stat-label { color: var(--muted); }
        .stat-val {
          font-family: 'Space Mono', monospace; font-size: 13px;
          color: var(--gold);
        }

        .tips {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px; padding: 14px;
          font-size: 12px; color: var(--muted); line-height: 1.7;
        }
        .tips b { color: var(--text); }

        /* ── Chat Area ── */
        .chat-area {
          display: flex; flex-direction: column;
          height: 100vh; overflow: hidden;
        }

        .chat-header {
          padding: 18px 28px;
          border-bottom: 1px solid var(--border);
          background: var(--panel);
          display: flex; align-items: center; gap: 12px;
        }
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 8px #4ade80;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .chat-title { font-size: 17px; font-weight: 700; }
        .chat-sub   { font-size: 12px; color: var(--muted); font-family: 'Space Mono', monospace; margin-right: auto; }

        .messages {
          flex: 1; overflow-y: auto; padding: 24px 28px;
          display: flex; flex-direction: column; gap: 16px;
          scroll-behavior: smooth;
        }
        .messages::-webkit-scrollbar { width: 4px; }
        .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

        .msg {
          max-width: 75%; display: flex; flex-direction: column; gap: 4px;
          animation: fadeUp .3s ease;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

        .msg.user { align-self: flex-start; }
        .msg.assistant { align-self: flex-end; }

        .bubble {
          padding: 13px 17px; border-radius: 16px;
          font-size: 15px; line-height: 1.7; white-space: pre-wrap;
          box-shadow: var(--glow);
        }
        .msg.user .bubble {
          background: var(--user-bg);
          border-radius: 16px 16px 4px 16px;
          color: #fff;
        }
        .msg.assistant .bubble {
          background: var(--ai-bg);
          border: 1px solid var(--border);
          border-radius: 16px 16px 16px 4px;
          color: var(--text);
        }
        .msg-meta { font-size: 11px; color: var(--muted); padding: 0 4px; font-family: 'Space Mono', monospace; }
        .msg.user .msg-meta { text-align: right; }

        .typing {
          align-self: flex-end;
          display: flex; align-items: center; gap: 6px;
          background: var(--ai-bg); border: 1px solid var(--border);
          border-radius: 16px 16px 16px 4px;
          padding: 14px 18px;
        }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); animation: bounce 1.2s infinite; }
        .dot:nth-child(2){animation-delay:.2s}
        .dot:nth-child(3){animation-delay:.4s}
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }

        .input-area {
          padding: 16px 28px 20px;
          background: var(--panel);
          border-top: 1px solid var(--border);
          display: flex; gap: 10px; align-items: flex-end;
        }

        .chat-input {
          flex: 1; resize: none;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 13px 16px;
          color: var(--text); font-family: 'Tajawal', sans-serif; font-size: 15px;
          outline: none; line-height: 1.5; max-height: 140px;
          transition: border-color .2s;
          direction: rtl;
        }
        .chat-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
        .chat-input::placeholder { color: var(--muted); }

        .send-btn {
          width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border: none; cursor: pointer; color: #fff; font-size: 20px;
          display: grid; place-items: center;
          transition: opacity .2s, transform .1s;
          box-shadow: 0 4px 15px rgba(59,130,246,.35);
        }
        .send-btn:hover  { opacity: .9; }
        .send-btn:active { transform: scale(.94); }
        .send-btn:disabled { opacity: .4; cursor: not-allowed; }
      `}</style>

      <div className="grid-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="app">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">🌍</div>
            <div>
              <div className="logo-text">موسوعة الذكاء</div>
              <div className="logo-sub">Wikipedia RAG</div>
            </div>
          </div>

          <div className="section-title">فهرسة موضوع جديد</div>
          <div className="index-box">
            <div className="lang-tabs">
              {["ar", "en"].map((l) => (
                <button key={l} className={`lang-tab ${indexLang === l ? "active" : ""}`} onClick={() => setIndexLang(l)}>
                  {l === "ar" ? "عربي 🇸🇦" : "English 🇬🇧"}
                </button>
              ))}
            </div>
            <input
              className="idx-input"
              placeholder="مثال: الذكاء الاصطناعي"
              value={indexTopic}
              onChange={(e) => setIndexTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleIndex()}
            />
            <button className="idx-btn" onClick={handleIndex} disabled={indexing || !indexTopic.trim()}>
              {indexing ? "⏳ جاري الفهرسة..." : "➕ فهرس الموضوع"}
            </button>
            <div className="idx-msg">{indexMsg}</div>
          </div>

          {stats && (
            <>
              <div className="section-title">إحصاءات الفهرس</div>
              <div className="stats-box">
                <div className="stat-row"><span className="stat-label">القطع المفهرسة</span><span className="stat-val">{stats.total_chunks}</span></div>
                <div className="stat-row"><span className="stat-label">حجم الفهرس</span><span className="stat-val">{stats.index_size}</span></div>
                <div className="stat-row"><span className="stat-label">النموذج</span><span className="stat-val">MiniLM-L12</span></div>
                <div className="stat-row"><span className="stat-label">الأبعاد</span><span className="stat-val">{stats.embedding_dim}D</span></div>
              </div>
            </>
          )}

          <div className="section-title">نصائح</div>
          <div className="tips">
            <b>1.</b> افهرس موضوعاً أولاً<br />
            <b>2.</b> ثم اسأل عنه في الشات<br />
            <b>3.</b> يدعم العربية والإنجليزية
          </div>
        </aside>

        {/* ── Chat ── */}
        <section className="chat-area">
          <div className="chat-header">
            <div className="status-dot" />
            <div className="chat-title">مساعد المعرفة</div>
            <div className="chat-sub">RAG · FAISS · Wikipedia</div>
          </div>

          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="bubble">{m.text}</div>
                <div className="msg-meta">{m.role === "user" ? "أنت" : "🤖 المساعد"}</div>
              </div>
            ))}
            {loading && (
              <div className="typing">
                <div className="dot" /><div className="dot" /><div className="dot" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="input-area">
            <textarea
              className="chat-input"
              rows={1}
              placeholder="اكتب سؤالك هنا..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
              ↑
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
