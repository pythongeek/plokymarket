import { useState } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_EVENTS = [
  {
    id: "evt-001",
    name: "BPL 2026 ফাইনাল",
    nameEn: "BPL 2026 Final",
    category: "Sports",
    image: null,
    status: "active",
    date: "2026-03-15",
    hasMarket: false,
  },
  {
    id: "evt-002",
    name: "বিটকয়েন মূল্য Q2 2026",
    nameEn: "Bitcoin Price Q2 2026",
    category: "Crypto",
    image: null,
    status: "active",
    date: "2026-06-30",
    hasMarket: true,
  },
];

const MOCK_MARKETS = [
  {
    id: "mkt-001",
    event_id: "evt-002",
    event_name: "বিটকয়েন মূল্য Q2 2026",
    question: "২০২৬ সালের জুনের মধ্যে বিটকয়েনের দাম কি $১ লাখ ছাড়াবে?",
    category: "Crypto",
    market_type: "binary",
    status: "active",
    current_stage: "deployment",
    stages_completed: ["template_selection","parameter_configuration","liquidity_commitment","legal_review","preview_simulation","deployment"],
    yes_price: 0.68,
    no_price: 0.32,
    liquidity: 50000,
    trading_fee_percent: 2.0,
    total_volume: 125000,
    resolution_deadline: "2026-06-30T18:00:00",
    trading_closes_at: "2026-06-29T18:00:00",
    oracle_type: "AI",
    resolution_source: "CoinGecko",
    traders: 847,
    created_at: "2026-02-20",
    image_url: null,
    risk_score: 25,
    confidence: 91,
  },
  {
    id: "mkt-002",
    event_id: null,
    event_name: null,
    question: "২০২৬ সালের নির্বাচনে কে জিতবে?",
    category: "Politics",
    market_type: "binary",
    status: "draft",
    current_stage: "parameter_configuration",
    stages_completed: ["template_selection"],
    yes_price: 0.50,
    no_price: 0.50,
    liquidity: 0,
    trading_fee_percent: 2.5,
    total_volume: 0,
    resolution_deadline: "2026-12-01T00:00:00",
    trading_closes_at: "2026-11-30T00:00:00",
    oracle_type: "MANUAL",
    resolution_source: "Bangladesh Election Commission",
    traders: 0,
    created_at: "2026-02-26",
    image_url: null,
    risk_score: 72,
    confidence: 0,
  },
  {
    id: "mkt-003",
    event_id: "evt-001",
    event_name: "BPL 2026 ফাইনাল",
    question: "নতুন মার্কেট (Untitled Market)",
    category: "Sports",
    market_type: "binary",
    status: "draft",
    current_stage: "liquidity_commitment",
    stages_completed: ["template_selection","parameter_configuration"],
    yes_price: 0.55,
    no_price: 0.45,
    liquidity: 0,
    trading_fee_percent: 2.0,
    total_volume: 0,
    resolution_deadline: "2026-03-16T00:00:00",
    trading_closes_at: "2026-03-14T18:00:00",
    oracle_type: "MANUAL",
    resolution_source: "",
    traders: 0,
    created_at: "2026-02-27",
    image_url: null,
    risk_score: 18,
    confidence: 0,
  },
  {
    id: "mkt-004",
    event_id: null,
    event_name: null,
    question: "নতুন মার্কেট (Untitled Market)",
    category: "Categorical",
    market_type: "multi_outcome",
    status: "pending_review",
    current_stage: "legal_review",
    stages_completed: ["template_selection","parameter_configuration","liquidity_commitment"],
    yes_price: 0,
    no_price: 0,
    liquidity: 10000,
    trading_fee_percent: 1.5,
    total_volume: 0,
    resolution_deadline: "2026-04-01T00:00:00",
    trading_closes_at: "2026-03-31T00:00:00",
    oracle_type: "MULTI",
    resolution_source: "",
    traders: 0,
    created_at: "2026-02-25",
    image_url: null,
    risk_score: 45,
    confidence: 0,
  },
];

const STAGES = [
  { id: "template_selection", short: "টেমপ্লেট" },
  { id: "parameter_configuration", short: "কনফিগ" },
  { id: "liquidity_commitment", short: "তারল্য" },
  { id: "legal_review", short: "আইনি" },
  { id: "preview_simulation", short: "প্রিভিউ" },
  { id: "deployment", short: "ডিপ্লয়" },
];

const CATEGORY_META = {
  Sports: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: "⚽" },
  Crypto: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "₿" },
  Politics: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: "🗳️" },
  Finance: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: "📈" },
  Entertainment: { color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: "🎬" },
  Technology: { color: "#06b6d4", bg: "rgba(6,182,212,0.12)", icon: "💻" },
  Categorical: { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", icon: "🔮" },
  Other: { color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: "📋" },
};

const STATUS_META = {
  draft: { label: "খসড়া", color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  pending_review: { label: "পর্যালোচনা", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  active: { label: "লাইভ", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  paused: { label: "বিরতি", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  resolved: { label: "সমাধান", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  rejected: { label: "প্রত্যাখ্যাত", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

const ORACLE_LABELS = {
  MANUAL: "ম্যানুয়াল",
  AI: "AI ওরাকল",
  CHAINLINK: "Chainlink",
  UMA: "UMA",
  MULTI: "মাল্টি-সোর্স",
};

function formatBDT(n) {
  if (!n) return "৳0";
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)} লাখ`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(1)}K`;
  return `৳${n}`;
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  const days = Math.floor(diff / 86400000);
  if (days > 30) return `${Math.floor(days / 30)} মাস বাকি`;
  if (days > 0) return `${days} দিন বাকি`;
  if (days === 0) return "আজ শেষ";
  return "মেয়াদ শেষ";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Other;
  return (
    <span style={{
      background: meta.bg,
      color: meta.color,
      border: `1px solid ${meta.color}30`,
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    }}>
      {meta.icon} {category}
    </span>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return (
    <span style={{
      background: meta.bg,
      color: meta.color,
      border: `1px solid ${meta.color}40`,
      borderRadius: 6,
      padding: "2px 9px",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.02em",
    }}>
      {meta.label}
    </span>
  );
}

function StageProgress({ completed, current }) {
  const currentIdx = STAGES.findIndex(s => s.id === current);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
      {STAGES.map((stage, i) => {
        const isDone = completed?.includes(stage.id);
        const isCurrent = stage.id === current && !isDone;
        const color = isDone ? "#22c55e" : isCurrent ? "#3b82f6" : "#334155";
        return (
          <div key={stage.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 20, height: 20,
                borderRadius: "50%",
                background: isDone ? "#22c55e" : isCurrent ? "#1d4ed8" : "#1e293b",
                border: `2px solid ${color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: isDone || isCurrent ? "#fff" : "#64748b",
                fontWeight: 700, flexShrink: 0,
                transition: "all 0.2s",
              }}>
                {isDone ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 9, color: isDone ? "#22c55e" : isCurrent ? "#93c5fd" : "#475569", marginTop: 2, whiteSpace: "nowrap" }}>
                {stage.short}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: isDone ? "#22c55e" : "#1e293b",
                margin: "0 2px", marginBottom: 14,
                transition: "background 0.3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RiskMeter({ score }) {
  const color = score < 30 ? "#22c55e" : score < 60 ? "#f59e0b" : "#ef4444";
  const label = score < 30 ? "নিরাপদ" : score < 60 ? "মাঝারি" : "উচ্চ ঝুঁকি";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 50, height: 4, borderRadius: 2, background: "#1e293b", position: "relative", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.5s" }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

// ─── Market Config Panel (Side Drawer) ───────────────────────────────────────

function MarketConfigPanel({ market, onClose }) {
  const [activeTab, setActiveTab] = useState("basics");
  const tabs = [
    { id: "basics", label: "মূল তথ্য", icon: "📋" },
    { id: "trading", label: "ট্রেডিং", icon: "📊" },
    { id: "resolution", label: "সমাধান", icon: "⚖️" },
    { id: "liquidity", label: "তারল্য", icon: "💧" },
    { id: "risk", label: "ঝুঁকি", icon: "🛡️" },
  ];

  const catMeta = CATEGORY_META[market.category] || CATEGORY_META.Other;

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, width: 480,
      background: "#0f172a",
      borderLeft: "1px solid #1e293b",
      boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
      display: "flex", flexDirection: "column",
      zIndex: 100,
      fontFamily: "'Inter', 'Hind Siliguri', sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e293b", background: "#0b1220" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: catMeta.bg, border: `1px solid ${catMeta.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                {catMeta.icon}
              </div>
              <div>
                <CategoryBadge category={market.category} />
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <StatusBadge status={market.status} />
                  <span style={{ fontSize: 10, color: "#64748b" }}>ID: {market.id}</span>
                </div>
              </div>
            </div>
            <h2 style={{ color: "#f1f5f9", fontSize: 15, fontWeight: 700, lineHeight: 1.4, margin: 0 }}>
              {market.question}
            </h2>
            {market.event_name && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#3b82f6" }}>🔗 ইভেন্ট:</span> {market.event_name}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: "#1e293b", border: "none", color: "#94a3b8", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Stage progress in panel */}
        <div style={{ marginTop: 16 }}>
          <StageProgress completed={market.stages_completed} current={market.current_stage} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e293b", background: "#0b1220" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: "10px 4px", background: "none", border: "none",
            borderBottom: activeTab === t.id ? "2px solid #3b82f6" : "2px solid transparent",
            color: activeTab === t.id ? "#3b82f6" : "#64748b",
            cursor: "pointer", fontSize: 10, fontWeight: 600,
          }}>
            <div>{t.icon}</div>
            <div style={{ marginTop: 2 }}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {activeTab === "basics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ConfigField label="মার্কেট প্রশ্ন" value={market.question} editable multiline />
            <ConfigField label="মার্কেট ধরন" value={market.market_type === "binary" ? "বাইনারি (YES/NO)" : market.market_type === "multi_outcome" ? "মাল্টি-আউটকাম" : "স্কেলার"} />
            <ConfigField label="ক্যাটাগরি" value={market.category} />
            <ConfigField label="ওরাকল ধরন" value={ORACLE_LABELS[market.oracle_type] || market.oracle_type} />
            <ConfigField label="রেজোলিউশন সোর্স" value={market.resolution_source || "—"} editable />
            <div style={{ borderRadius: 10, background: "#111827", border: "1px solid #1e293b", padding: 14 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>লিংক ইভেন্ট</div>
              {market.event_name ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "#93c5fd", fontSize: 13 }}>🔗 {market.event_name}</span>
                  <button style={{ fontSize: 10, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>আনলিংক</button>
                </div>
              ) : (
                <button style={{ width: "100%", padding: "8px 12px", background: "#1e3a5f", border: "1px dashed #3b82f6", borderRadius: 8, color: "#60a5fa", fontSize: 12, cursor: "pointer" }}>
                  + ইভেন্টের সাথে লিংক করুন
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "trading" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <NumberField label="ট্রেডিং ফি %" value={market.trading_fee_percent} min={0.1} max={10} step={0.1} suffix="%" />
              <NumberField label="মিনিমাম ট্রেড" value={10} suffix="৳" />
              <NumberField label="ম্যাক্সিমাম ট্রেড" value={100000} suffix="৳" />
              <NumberField label="টিক সাইজ" value={0.01} suffix="¢" />
            </div>
            <ConfigField label="YES বর্তমান মূল্য" value={`${Math.round(market.yes_price * 100)}¢`} />
            <ConfigField label="NO বর্তমান মূল্য" value={`${Math.round(market.no_price * 100)}¢`} />
            <DateField label="ট্রেডিং বন্ধের সময়" value={market.trading_closes_at} />
            <ToggleField label="মার্কেট সার্কিট ব্রেকার" subtext="5 মিনিটে >10% দাম পরিবর্তনে স্বয়ংক্রিয় বিরতি" defaultOn />
            <ToggleField label="স্লিপেজ সুরক্ষা" subtext="3% এর বেশি স্লিপেজে সতর্কতা" defaultOn />
          </div>
        )}

        {activeTab === "resolution" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SelectField label="রেজোলিউশন পদ্ধতি" value={market.oracle_type} options={[
              { value: "MANUAL", label: "ম্যানুয়াল (অ্যাডমিন)" },
              { value: "AI", label: "AI ওরাকল (Vertex/Kimi)" },
              { value: "CHAINLINK", label: "Chainlink ফিড" },
              { value: "UMA", label: "UMA অপটিমিস্টিক" },
              { value: "MULTI", label: "মাল্টি-সোর্স" },
            ]} />
            <ConfigField label="প্রাথমিক সোর্স" value={market.resolution_source || "—"} editable />
            <ConfigField label="ব্যাকআপ সোর্স" value="—" editable />
            <NumberField label="কনফিডেন্স থ্রেশোল্ড %" value={market.confidence || 80} suffix="%" min={50} max={100} />
            <DateField label="রেজোলিউশন ডেডলাইন" value={market.resolution_deadline} />
            <div style={{ borderRadius: 10, background: "#111827", border: "1px solid #1e293b", padding: 14 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>এজ কেস হ্যান্ডলিং</div>
              <SelectField label="টাই হলে" value="NO" options={[
                { value: "NO", label: "NO জেতে" },
                { value: "YES", label: "YES জেতে" },
                { value: "refund", label: "রিফান্ড" },
              ]} />
              <div style={{ marginTop: 10 }}>
                <SelectField label="বাতিল হলে" value="refund" options={[
                  { value: "refund", label: "সম্পূর্ণ রিফান্ড" },
                  { value: "extend", label: "ডেডলাইন বাড়ানো" },
                ]} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "liquidity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ borderRadius: 10, background: market.liquidity > 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${market.liquidity > 0 ? "#22c55e" : "#ef4444"}30`, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>বর্তমান তারল্য পুল</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: market.liquidity > 0 ? "#22c55e" : "#ef4444" }}>
                {formatBDT(market.liquidity)}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>মিনিমাম ৳10,000 প্রয়োজন</div>
            </div>
            <NumberField label="প্রাথমিক তারল্য" value={market.liquidity || 10000} suffix="৳" min={10000} />
            <SelectField label="তারল্য সোর্স" value="platform" options={[
              { value: "platform", label: "প্ল্যাটফর্ম ট্রেজারি" },
              { value: "creator", label: "মার্কেট ক্রিয়েটর" },
              { value: "amm", label: "AMM বুটস্ট্র্যাপ" },
            ]} />
            <NumberField label="LP ফি শেয়ার %" value={50} suffix="%" min={0} max={100} />
            <ToggleField label="অটো-রিব্যালেন্সিং" subtext="50/50 YES/NO ব্যালেন্স বজায় রাখুন" defaultOn />
          </div>
        )}

        {activeTab === "risk" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ borderRadius: 10, background: "#111827", border: "1px solid #1e293b", padding: 14 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>ঝুঁকি স্কোর</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: market.risk_score < 30 ? "#22c55e" : market.risk_score < 60 ? "#f59e0b" : "#ef4444" }}>
                  {market.risk_score}
                </div>
                <div>
                  <div style={{ width: 120, height: 6, borderRadius: 3, background: "#1e293b", overflow: "hidden" }}>
                    <div style={{ width: `${market.risk_score}%`, height: "100%", background: market.risk_score < 30 ? "#22c55e" : market.risk_score < 60 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                    {market.risk_score < 30 ? "নিরাপদ — অটো-অ্যাপ্রুভ যোগ্য" : market.risk_score < 60 ? "মাঝারি — ম্যানুয়াল রিভিউ প্রয়োজন" : "উচ্চ ঝুঁকি — আইনি পর্যালোচনা বাধ্যতামূলক"}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, paddingBottom: 4, borderBottom: "1px solid #1e293b" }}>কমপ্লায়েন্স চেক</div>
            {[
              { label: "বাংলাদেশ সাইবার সিকিউরিটি আইন ২০২৩", pass: market.risk_score < 70 },
              { label: "গেম্বলিং নীতি (স্কিল-বেসড)", pass: true },
              { label: "রাজনৈতিক সংবেদনশীলতা", pass: market.category !== "Politics" || market.risk_score < 50 },
              { label: "আর্থিক নিয়মকানুন", pass: market.risk_score < 60 },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #0f172a" }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{item.label}</span>
                <span style={{ fontSize: 12, color: item.pass ? "#22c55e" : "#ef4444" }}>{item.pass ? "✓ পাস" : "✗ ব্যর্থ"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid #1e293b", display: "flex", gap: 10, background: "#0b1220" }}>
        <button style={{ flex: 1, padding: "10px 0", background: "#1e3a5f", border: "1px solid #3b82f6", color: "#60a5fa", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          💾 সেভ করুন
        </button>
        {market.status === "draft" && (
          <button style={{ flex: 1, padding: "10px 0", background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", border: "none", color: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            🚀 পরবর্তী ধাপ
          </button>
        )}
        {market.status === "active" && (
          <button style={{ flex: 1, padding: "10px 0", background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            ⏸ বিরতি দিন
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Form Field Helpers ───────────────────────────────────────────────────────

function ConfigField({ label, value, editable, multiline }) {
  const [val, setVal] = useState(value);
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>{label}</div>
      {editable ? (
        multiline ? (
          <textarea value={val} onChange={e => setVal(e.target.value)} rows={3} style={{ width: "100%", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", padding: "8px 10px", fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
        ) : (
          <input value={val} onChange={e => setVal(e.target.value)} style={{ width: "100%", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", padding: "8px 10px", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
        )
      ) : (
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", padding: "8px 10px", fontSize: 13 }}>{val || "—"}</div>
      )}
    </div>
  );
}

function NumberField({ label, value, min, max, step, suffix }) {
  const [val, setVal] = useState(value);
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, overflow: "hidden" }}>
        <input type="number" value={val} min={min} max={max} step={step || 1} onChange={e => setVal(e.target.value)}
          style={{ flex: 1, background: "none", border: "none", color: "#f1f5f9", padding: "8px 10px", fontSize: 13, outline: "none" }} />
        {suffix && <span style={{ color: "#64748b", fontSize: 12, padding: "0 10px" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function SelectField({ label, value, options }) {
  const [val, setVal] = useState(value);
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>{label}</div>}
      <select value={val} onChange={e => setVal(e.target.value)} style={{ width: "100%", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", padding: "8px 10px", fontSize: 13, outline: "none", cursor: "pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function DateField({ label, value }) {
  const [val, setVal] = useState(value?.slice(0, 16) || "");
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5, fontWeight: 500 }}>{label}</div>
      <input type="datetime-local" value={val} onChange={e => setVal(e.target.value)}
        style={{ width: "100%", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9", padding: "8px 10px", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
    </div>
  );
}

function ToggleField({ label, subtext, defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#111827", borderRadius: 8, border: "1px solid #1e293b" }}>
      <div>
        <div style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 500 }}>{label}</div>
        {subtext && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{subtext}</div>}
      </div>
      <div onClick={() => setOn(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? "#1d4ed8" : "#334155", position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
        <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </div>
    </div>
  );
}

// ─── Market Card ─────────────────────────────────────────────────────────────

function MarketCard({ market, onConfigure, onContinue, onDelete, onPreview }) {
  const catMeta = CATEGORY_META[market.category] || CATEGORY_META.Other;
  const stageIdx = STAGES.findIndex(s => s.id === market.current_stage);
  const progress = ((market.stages_completed?.length || 0) / STAGES.length) * 100;
  const isUntitled = market.question?.includes("Untitled") || market.question?.includes("নতুন মার্কেট");
  const [hovered, setHovered] = useState(false);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#111827" : "#0d1b2e",
        border: `1px solid ${hovered ? "#334155" : "#1e293b"}`,
        borderRadius: 14,
        padding: "18px 20px",
        transition: "all 0.18s",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Category accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: catMeta.color, opacity: 0.7 }} />

      {/* Top row: category + status + actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Category icon */}
          <div style={{ width: 34, height: 34, borderRadius: 8, background: catMeta.bg, border: `1px solid ${catMeta.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            {catMeta.icon}
          </div>
          <div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <CategoryBadge category={market.category} />
              <StatusBadge status={market.status} />
              {market.market_type === "multi_outcome" && (
                <span style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
                  মাল্টি-আউটকাম
                </span>
              )}
            </div>
            {market.event_name && (
              <div style={{ fontSize: 10, color: "#3b82f6", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                🔗 ইভেন্ট: {market.event_name}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 6 }}>
          <ActionButton icon="👁" title="প্রিভিউ" onClick={() => onPreview(market)} color="#3b82f6" />
          <ActionButton icon="⚙" title="কনফিগার" onClick={() => onConfigure(market)} color="#8b5cf6" />
          <ActionButton icon="🗑" title="মুছুন" onClick={() => onDelete(market.id)} color="#ef4444" />
        </div>
      </div>

      {/* Market Question */}
      <div style={{ marginBottom: 12 }}>
        {isUntitled ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ color: "#f97316", fontSize: 13, fontWeight: 600, margin: 0 }}>
              ⚠️ প্রশ্ন এখনো সেট করা হয়নি
            </p>
            <button onClick={() => onConfigure(market)} style={{ fontSize: 10, color: "#3b82f6", background: "rgba(59,130,246,0.1)", border: "1px solid #3b82f6", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>
              এখনই সেট করুন →
            </button>
          </div>
        ) : (
          <p style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {market.question}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <StatChip icon="💧" label="তারল্য" value={formatBDT(market.liquidity)} warn={market.liquidity === 0} />
        <StatChip icon="📈" label="ভলিউম" value={formatBDT(market.total_volume)} />
        <StatChip icon="👥" label="ট্রেডার" value={`${market.traders}+`} />
        <StatChip icon="💰" label="ফি" value={`${market.trading_fee_percent}%`} />
        {market.oracle_type && <StatChip icon="⚖️" label="ওরাকল" value={ORACLE_LABELS[market.oracle_type] || market.oracle_type} />}
        {market.resolution_deadline && <StatChip icon="⏰" label="ডেডলাইন" value={timeUntil(market.resolution_deadline)} />}
      </div>

      {/* Stage progress */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>কোয়ালিটি গেট প্রগ্রেস</span>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>{market.stages_completed?.length || 0}/{STAGES.length} সম্পূর্ণ</span>
        </div>
        <StageProgress completed={market.stages_completed} current={market.current_stage} />
      </div>

      {/* Bottom: risk + actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <RiskMeter score={market.risk_score} />
          {market.confidence > 0 && (
            <span style={{ fontSize: 10, color: "#22c55e" }}>🤖 AI {market.confidence}% আস্থা</span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {market.status === "draft" && (
            <button onClick={() => onContinue(market)} style={{
              padding: "7px 16px", background: "linear-gradient(135deg, #1d4ed8, #6d28d9)",
              border: "none", color: "#fff", borderRadius: 7, cursor: "pointer",
              fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
            }}>
              চালিয়ে যান →
            </button>
          )}
          {market.status === "pending_review" && (
            <button style={{ padding: "7px 16px", background: "rgba(245,158,11,0.15)", border: "1px solid #f59e0b", color: "#f59e0b", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              পর্যালোচনা করুন
            </button>
          )}
          {market.status === "active" && (
            <button style={{ padding: "7px 16px", background: "rgba(34,197,94,0.12)", border: "1px solid #22c55e", color: "#22c55e", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              📊 লাইভ ড্যাশবোর্ড
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, title, onClick, color }) {
  return (
    <button title={title} onClick={e => { e.stopPropagation(); onClick(); }}
      style={{ width: 28, height: 28, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 6, color, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {icon}
    </button>
  );
}

function StatChip({ icon, label, value, warn }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: 9, color: "#475569", marginBottom: 1 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: warn ? "#f97316" : "#94a3b8", display: "flex", alignItems: "center", gap: 3 }}>
        {icon} {value}
      </span>
    </div>
  );
}

// ─── Events Panel (Unlinked Events) ──────────────────────────────────────────

function EventsReadyPanel({ events, onCreateMarket }) {
  const unlinked = events.filter(e => !e.hasMarket && e.status === "active");
  if (unlinked.length === 0) return null;

  return (
    <div style={{ marginBottom: 24, padding: 16, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12 }}>
      <div style={{ fontSize: 12, color: "#60a5fa", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
        {unlinked.length}টি পাবলিশড ইভেন্টে মার্কেট নেই — মার্কেট তৈরি করুন
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {unlinked.map(evt => {
          const cat = CATEGORY_META[evt.category] || CATEGORY_META.Other;
          return (
            <div key={evt.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0d1b2e", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 14px", flex: "1 1 220px" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{cat.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{evt.name}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>{evt.date} · {evt.category}</div>
              </div>
              <button onClick={() => onCreateMarket(evt)} style={{ padding: "5px 12px", background: "linear-gradient(135deg, #1d4ed8, #6d28d9)", border: "none", color: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                + মার্কেট তৈরি করুন
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function AdminMarketDashboard() {
  const [markets, setMarkets] = useState(MOCK_MARKETS);
  const [configuring, setConfiguring] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const stats = {
    total: markets.length,
    draft: markets.filter(m => m.status === "draft").length,
    pending: markets.filter(m => m.status === "pending_review").length,
    active: markets.filter(m => m.status === "active").length,
    rejected: markets.filter(m => m.status === "rejected").length,
  };

  const filtered = markets.filter(m => {
    const matchSearch = !searchQuery || m.question?.toLowerCase().includes(searchQuery.toLowerCase()) || m.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    const matchTab = activeTab === "all" || (activeTab === "live" && m.status === "active") || (activeTab === "drafts" && m.status === "draft") || (activeTab === "review" && m.status === "pending_review");
    return matchSearch && matchStatus && matchTab;
  });

  const handleDelete = (id) => {
    setMarkets(ms => ms.filter(m => m.id !== id));
    showNotif("মার্কেট মুছে ফেলা হয়েছে");
  };

  const handleCreateFromEvent = (evt) => {
    const newMarket = {
      id: `mkt-${Date.now()}`,
      event_id: evt.id,
      event_name: evt.name,
      question: `${evt.name} সংক্রান্ত প্রশ্ন`,
      category: evt.category,
      market_type: "binary",
      status: "draft",
      current_stage: "template_selection",
      stages_completed: [],
      yes_price: 0.50, no_price: 0.50,
      liquidity: 0, trading_fee_percent: 2.0,
      total_volume: 0, resolution_deadline: evt.date + "T18:00:00",
      trading_closes_at: evt.date + "T17:00:00",
      oracle_type: "MANUAL", resolution_source: "", traders: 0,
      created_at: new Date().toISOString().slice(0, 10),
      image_url: null, risk_score: 20, confidence: 0,
    };
    setMarkets(ms => [newMarket, ...ms]);
    setConfiguring(newMarket);
    showNotif(`✅ "${evt.name}" ইভেন্টের জন্য মার্কেট তৈরি শুরু হয়েছে`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080f1a",
      fontFamily: "'Inter', 'Hind Siliguri', system-ui, sans-serif",
      color: "#f1f5f9",
      padding: "0 0 60px 0",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        input[type=number]::-webkit-inner-spin-button { display: none; }
      `}</style>

      {/* Notification toast */}
      {notification && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 200,
          background: notification.type === "success" ? "#064e3b" : "#7f1d1d",
          border: `1px solid ${notification.type === "success" ? "#22c55e" : "#ef4444"}`,
          color: "#fff", borderRadius: 10, padding: "10px 18px",
          fontSize: 13, fontWeight: 600, animation: "fadeIn 0.2s ease",
        }}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "24px 28px 0", borderBottom: "1px solid #1e293b", background: "#0b1220" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              মার্কেট ব্যবস্থাপনা
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Market Creation & Quality Gate Management</p>
          </div>
          <button style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
            border: "none", color: "#fff", borderRadius: 10,
            cursor: "pointer", fontSize: 13, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 4px 20px rgba(109,40,217,0.3)",
          }}>
            ✨ নতুন মার্কেট তৈরি করুন
          </button>
        </div>

        {/* Stats KPIs */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "মোট মার্কেট", value: stats.total, color: "#64748b", icon: "📋" },
            { label: "খসড়া", value: stats.draft, color: "#94a3b8", icon: "📝" },
            { label: "পর্যালোচনা মুলতুবি", value: stats.pending, color: "#f59e0b", icon: "⏳" },
            { label: "লাইভ মার্কেট", value: stats.active, color: "#22c55e", icon: "🟢" },
            { label: "প্রত্যাখ্যাত", value: stats.rejected, color: "#ef4444", icon: "🔴" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#0d1b2e", border: "1px solid #1e293b",
              borderRadius: 10, padding: "12px 18px",
              display: "flex", alignItems: "center", gap: 10, flex: "1 1 140px",
            }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1e293b" }}>
          {[
            { id: "all", label: "সব মার্কেট", count: stats.total },
            { id: "live", label: "লাইভ", count: stats.active },
            { id: "drafts", label: "খসড়া", count: stats.draft },
            { id: "review", label: "পর্যালোচনা", count: stats.pending },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "10px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
              cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {tab.label}
              <span style={{
                background: activeTab === tab.id ? "#1d4ed8" : "#1e293b",
                color: activeTab === tab.id ? "#fff" : "#94a3b8",
                borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700,
              }}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 28px" }}>
        {/* Events ready to get markets */}
        <EventsReadyPanel events={MOCK_EVENTS} onCreateMarket={handleCreateFromEvent} />

        {/* Search & filter */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#475569" }}>🔍</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="মার্কেট, ইভেন্ট বা ক্যাটাগরি খুঁজুন..."
              style={{ width: "100%", background: "#0d1b2e", border: "1px solid #1e293b", borderRadius: 10, color: "#f1f5f9", padding: "10px 12px 10px 36px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ background: "#0d1b2e", border: "1px solid #1e293b", borderRadius: 10, color: "#94a3b8", padding: "10px 14px", fontSize: 13, outline: "none", cursor: "pointer" }}>
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="draft">খসড়া</option>
            <option value="pending_review">পর্যালোচনা মুলতুবি</option>
            <option value="active">লাইভ</option>
            <option value="rejected">প্রত্যাখ্যাত</option>
          </select>
        </div>

        {/* Market cards grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>কোনো মার্কেট পাওয়া যায়নি</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>অন্য ফিল্টার ব্যবহার করুন বা নতুন মার্কেট তৈরি করুন</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(520px, 1fr))", gap: 14 }}>
            {filtered.map(market => (
              <MarketCard
                key={market.id}
                market={market}
                onConfigure={setConfiguring}
                onContinue={setConfiguring}
                onDelete={handleDelete}
                onPreview={(m) => showNotif(`🔍 "${m.question.slice(0,30)}..." প্রিভিউ খুলছে`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Config side panel */}
      {configuring && (
        <>
          <div onClick={() => setConfiguring(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99, backdropFilter: "blur(2px)" }} />
          <MarketConfigPanel market={configuring} onClose={() => setConfiguring(null)} />
        </>
      )}
    </div>
  );
}
