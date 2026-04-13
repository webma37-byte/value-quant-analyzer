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
      current = { title: line.replace("## ", "").replace(/^\d+\.\s*/, ""), content: "" };
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
    .replace(/\|(.+)\|/g, function(match) {
      return '<div style="overflow-x:auto;margin:8px 0"><table style="border-collapse:collapse;font-size:12px;width:100%"><tr>' +
        match.split("|").filter(Boolean).map(function(c) {
          return '<td style="border:1px solid #e2e8f0;padding:6px 8px">' + c.trim() + '</td>';
        }).join("") + '</tr></table></div>';
    })
    .replace(/^- (.*)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  return (
    <div
      style={{
        lineHeight: 1.9,
        fontSize: 13.5,
        color: "#1e293b",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        letterSpacing: -0.2,
      }}
      dangerouslySetInnerHTML={{ __html: "<p>" + html + "</p>" }}
    />
  );
}

function Section({ title, content, index }) {
  const [open, setOpen] = useState(index < 5);
  return (
    <div style={{ marginBottom: 8, border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "12px 14px", display: "flex", justifyContent: "space-between",
          alignItems: "center", background: open ? "#f8fafc" : "#fff", border: "none", cursor: "pointer",
          fontFamily: "'Noto Serif KR', Georgia, serif", fontSize: 14, fontWeight: 600, color: "#0f172a", textAlign: "left",
        }}
      >
        <span style={{ flex: 1, marginRight: 8 }}>{title}</span>
        <span style={{ fontSize: 11, color: "#94a3b8", transform: open ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: "2px 14px 14px" }}>
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
          { company: company.trim(), verdict: parsed.verdict },
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
      padding: "0 0 40px",
      overflowX: "hidden",
      width: "100%",
      maxWidth: "100vw",
    }}>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; width: 100%; max-width: 100vw; }
        ul { padding-left: 16px; margin: 4px 0; }
        li { margin-bottom: 2px; font-size: 13px; }
        strong { color: #0f172a; }
        input::placeholder { color: #64748b; }
      `}</style>

      <div style={{ padding: "28px 14px 20px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 9, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>
          Value Quant Analyzer
        </div>
        <h1 style={{
          fontFamily: "'Noto Serif KR', Georgia, serif", fontSize: 20, fontWeight: 700,
          color: "#f1f5f9", letterSpacing: -0.5, marginBottom: 4,
        }}>
          밸류 퀀트 실시간 분석기
        </h1>
        <p style={{ fontSize: 11, color: "#94a3b8" }}>
          버핏 · 그린블랫 · 그레이엄 기반 AI 분석
        </p>
      </div>

      <div style={{ maxWidth: 540, margin: "20px auto 0", padding: "0 10px" }}>
        <div style={{
          display: "flex", flexDirection: "column", gap: 6,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 10, padding: 6, border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <input
            ref={inputRef}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="회사명 (예: 삼성전자, Tesla...)"
            disabled={loading}
            style={{
              width: "100%", padding: "11px 12px", fontSize: 14, border: "none",
              background: "transparent", color: "#f1f5f9", outline: "none",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          />
          <button
            onClick={analyze}
            disabled={loading || !company.trim()}
            style={{
              width: "100%", padding: "11px", fontSize: 13, fontWeight: 700,
              background: loading ? "#334155" : "linear-gradient(135deg, #22d3ee, #0ea5e9)",
              color: loading ? "#94a3b8" : "#0f172a",
              border: "none", borderRadius: 7, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            {loading ? "분석 중..." : "분석 시작"}
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ maxWidth: 540, margin: "20px auto", padding: "0 10px", textAlign: "center" }}>
          <div style={{
            background: "rgba(255,255,255,0.03)", borderRadius: 10,
            padding: "28px 14px", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ animation: "pulse 1.5s infinite", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
              🔍 최신 데이터 수집 및 분석 중...
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>20~40초 소요</div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ maxWidth: 540, margin: "14px auto", padding: "0 10px" }}>
          <div style={{
            background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 8, padding: "10px 14px", color: "#fca5a5", fontSize: 12,
          }}>
            ⚠️ {error}
          </div>
        </div>
      )}

      {result && (
        <div style={{ maxWidth: 640, margin: "20px auto", padding: "0 10px", animation: "slideUp 0.4s ease-out" }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: "16px 14px", marginBottom: 12,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}>
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>
                분석 완료
              </div>
              <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                {company}
              </div>
            </div>
            <div style={{
              background: vStyle?.bg, border: "2px solid " + (vStyle?.border || "#d1d5db"),
              borderRadius: 8, padding: "8px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 8, color: "#94a3b8", letterSpacing: 1, marginBottom: 1 }}>최종 판단</div>
              <div style={{
                fontFamily: "'Noto Serif KR', serif", fontSize: 17, fontWeight: 700, color: vStyle?.color,
              }}>
                {result.verdict}
              </div>
            </div>
          </div>

          {result.sections.length > 0 ? (
            result.sections.map((s, i) => <Section key={i} title={s.title} content={s.content} index={i} />)
          ) : (
            <div style={{ background: "#fff", borderRadius: 10, padding: 14 }}>
              <MarkdownBlock text={result.raw} />
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ maxWidth: 540, margin: "28px auto 0", padding: "0 10px" }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>
            분석 이력
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {history.map((h, i) => {
              const hv = VERDICTS[h.verdict] || VERDICTS["HOLD"];
              return (
                <button
                  key={i}
                  onClick={() => { setCompany(h.company); }}
                  style={{
                    padding: "5px 10px", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5,
                    color: "#e2e8f0", fontSize: 11, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  <span>{h.company}</span>
                  <span style={{
                    fontSize: 8, padding: "1px 4px", borderRadius: 2,
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

      <div style={{ textAlign: "center", marginTop: 30, fontSize: 9, color: "#475569", lineHeight: 1.7, padding: "0 10px" }}>
        투자 권유가 아닌 교육·참고 목적입니다<br />
        버핏 · 그린블랫 · 그레이엄 기반 · Claude Sonnet 4
      </div>
    </div>
  );
}
