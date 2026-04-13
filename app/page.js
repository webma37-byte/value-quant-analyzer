"use client";
import { useState, useRef, useEffect } from "react";

const VERDICTS = {
  "STRONG BUY": { color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  BUY: { color: "#15803d", bg: "#d1fae5", border: "#6ee7b7" },
  HOLD: { color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
  AVOID: { color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
};

function parseAnalysis(text) {
  const sections = [];
  const lines = text.split("\n");
  let current = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace("## ", ""), content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);

  let verdict = "HOLD";
  for (const v of ["STRONG BUY", "BUY", "HOLD", "AVOID"]) {
    if (text.includes("최종 판단: " + v) || text.includes("판단: " + v) || text.includes("**" + v + "**")) {
      verdict = v;
      break;
    }
  }
  return { sections, verdict, raw: text };
}

function MarkdownBlock({ text }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.*)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  return (
    <div
      style={{ lineHeight: 1.8, fontSize: 14.5, color: "#1e293b" }}
      dangerouslySetInnerHTML={{ __html: "<p>" + html + "</p>" }}
    />
  );
}

function Section({ title, content, index }) {
  const [open, setOpen] = useState(index < 3);
  return (
    <div style={{ marginBottom: 12, border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between",
          alignItems: "center", background: open ? "#f8fafc" : "#fff", border: "none", cursor: "pointer",
          fontFamily: "'Noto Serif KR', Georgia, serif", fontSize: 16, fontWeight: 600, color: "#0f172a", textAlign: "left",
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 13, color: "#94a3b8", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: "4px 18px 18px" }}>
          <MarkdownBlock text={content.trim()} />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const analyze = async () => {
    if (!company.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: company.trim() }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.analysis) {
        const parsed = parseAnalysis(data.analysis);
        setResult(parsed);
        setHistory((prev) => [
          { company: company.trim(), verdict: parsed.verdict, date: new Date().toLocaleDateString("ko-KR") },
          ...prev.filter((h) => h.company !== company.trim()).slice(0, 19),
        ]);
      }
    } catch (e) {
      setError("네트워크 오류: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const vStyle = result ? VERDICTS[result.verdict] || VERDICTS["HOLD"] : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
      padding: "0 0 60px",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ul { padding-left: 20px; margin: 8px 0; }
        li { margin-bottom: 4px; }
        strong { color: #0f172a; }
        input::placeholder { color: #64748b; }
      `}</style>

      <div style={{ padding: "40px 24px 32px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#64748b", textTransform: "uppercase", marginBottom: 12 }}>
          Value Quant Analyzer
        </div>
        <h1 style={{
          fontFamily: "'Noto Serif KR', Georgia, serif", fontSize: 28, fontWeight: 700,
          color: "#f1f5f9", letterSpacing: -1, marginBottom: 8,
        }}>
          밸류 퀀트 실시간 분석기
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8", maxWidth: 500, margin: "0 auto" }}>
          버핏 · 그린블랫 · 그레이엄 프레임워크 기반 AI 기업 분석
        </p>
      </div>

      <div style={{
          display: "flex", flexWrap: "wrap", gap: 10, background: "rgba(255,255,255,0.04)",
          borderRadius: 14, padding: 6, border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <input
            ref={inputRef}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="회사명 입력 (예: 삼성전자, Tesla, Keyence...)"
            disabled={loading}
            style={{
              flex: 1, padding: "14px 18px", fontSize: 15, border: "none",
              background: "transparent", color: "#f1f5f9", outline: "none",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          />
          <button
            onClick={analyze}
            disabled={loading || !company.trim()}
            style={{
              padding: "12px 28px",
              background: loading ? "#334155" : "linear-gradient(135deg, #22d3ee, #0ea5e9)",
              color: loading ? "#94a3b8" : "#0f172a",
              border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: "nowrap",
            }}
          >
            {loading ? "분석 중..." : "분석 시작"}
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ maxWidth: 480, margin: "32px auto", padding: "0 20px", textAlign: "center" }}>
          <div style={{
            background: "rgba(255,255,255,0.03)", borderRadius: 14,
            padding: "40px 24px", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ animation: "pulse 1.5s infinite", fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
              🔍 웹에서 최신 데이터 수집 및 분석 중...
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              주가, 재무제표, 애널리스트 의견을 종합하고 있습니다 (20~40초 소요)
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ maxWidth: 640, margin: "24px auto", padding: "0 20px" }}>
          <div style={{
            background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 10, padding: "16px 20px", color: "#fca5a5", fontSize: 14,
          }}>
            ⚠️ {error}
          </div>
        </div>
      )}

      {result && (
        <div style={{ maxWidth: 720, margin: "32px auto", padding: "0 20px", animation: "slideUp 0.5s ease-out" }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 28, marginBottom: 20,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          }}>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                분석 완료
              </div>
              <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
                {company}
              </div>
            </div>
            <div style={{
              background: vStyle?.bg, border: "2px solid " + (vStyle?.border || "#d1d5db"),
              borderRadius: 12, padding: "12px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: 1, marginBottom: 2 }}>최종 판단</div>
              <div style={{
                fontFamily: "'Noto Serif KR', serif", fontSize: 22, fontWeight: 700, color: vStyle?.color,
              }}>
                {result.verdict}
              </div>
            </div>
          </div>

          {result.sections.length > 0 ? (
            result.sections.map((s, i) => <Section key={i} title={s.title} content={s.content} index={i} />)
          ) : (
            <div style={{ background: "#fff", borderRadius: 12, padding: 24 }}>
              <MarkdownBlock text={result.raw} />
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ maxWidth: 640, margin: "40px auto 0", padding: "0 20px" }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#64748b", textTransform: "uppercase", marginBottom: 12 }}>
            분석 이력
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {history.map((h, i) => {
              const hv = VERDICTS[h.verdict] || VERDICTS["HOLD"];
              return (
                <button
                  key={i}
                  onClick={() => { setCompany(h.company); }}
                  style={{
                    padding: "8px 14px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                    color: "#e2e8f0", fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  <span>{h.company}</span>
                  <span style={{
                    fontSize: 10, padding: "2px 6px", borderRadius: 4,
                    background: hv.bg, color: hv.color, fontWeight: 700,
                  }}>
                    {h.verdict}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 48, fontSize: 11, color: "#475569", lineHeight: 1.8 }}>
        본 분석은 투자 권유가 아닌 교육·참고 목적입니다<br />
        버핏 · 그린블랫 · 그레이엄 프레임워크 기반 · Claude Sonnet 4 Powered
      </div>
    </div>
  );
}
