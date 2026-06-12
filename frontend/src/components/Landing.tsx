import { Link } from "react-router-dom";
import { useLang } from "../hooks/useLang";

const platforms = [
  { name: "GitHub", items: ["PR", "Commit", "Review", "Issue"] },
  { name: "Discord", items: ["消息", "帖子", "帮助记录"] },
  { name: "Telegram", items: ["消息", "回复", "转发"] },
  { name: "X", items: ["发帖", "提及", "互动"] },
  { name: "Wallet", items: ["交易", "质押", "治理"] },
];

const scoreBreakdown = [
  { label: "codeImpact", pct: 40, color: "var(--color-primary)" },
  { label: "reviewQuality", pct: 25, color: "var(--color-secondary)" },
  { label: "communityHelp", pct: 20, color: "var(--color-success)" },
  { label: "consistency", pct: 15, color: "var(--text-tertiary)" },
];

const leaderboard = [
  { rank: 1, name: "Alice", score: 96, reward: "500 USDC", avatar: "A" },
  { rank: 2, name: "Bob", score: 91, reward: "320 USDC", avatar: "B" },
  { rank: 3, name: "Charlie", score: 84, reward: "180 USDC", avatar: "C" },
  { rank: 4, name: "Diana", score: 79, reward: "120 USDC", avatar: "D" },
  { rank: 5, name: "Eve", score: 72, reward: "80 USDC", avatar: "E" },
];

export default function Landing() {
  const { lang, setLang, t } = useLang();

  const dimensionLabels: Record<string, string> = {
    codeImpact: t.codeImpact,
    reviewQuality: t.reviewQuality,
    communityHelp: t.communityHelp,
    consistency: t.consistency,
  };

  return (
    <div className="min-h-screen grid-bg" style={{ position: "relative" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "rgba(9, 9, 11, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--color-primary)" }}
            />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {t.navBrand}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === "zh" ? "en" : "zh")}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: "12px", padding: "4px 10px" }}
            >
              {lang === "zh" ? "EN" : "中文"}
            </button>
            <Link to="/app" className="btn btn-ghost btn-sm">
              {t.signIn}
            </Link>
            <Link to="/app" className="btn btn-primary btn-sm">
              {t.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="badge badge-purple mb-8 text-sm px-4 py-1.5">{t.heroTag}</div>
          <h1
            className="text-6xl md:text-8xl font-bold leading-tight tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {t.heroTitle1}
            <br />
            <span className="text-gradient">{t.heroTitle2}</span>
          </h1>
          <p
            className="text-xl md:text-2xl mt-8 leading-relaxed max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            {t.heroDesc}
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Link to="/app" className="btn btn-primary" style={{ padding: "14px 36px", fontSize: "16px" }}>
              {t.connectWorkspace}
            </Link>
            <a href="#demo" className="btn btn-secondary" style={{ padding: "14px 36px", fontSize: "16px" }}>
              {t.viewDemo}
            </a>
          </div>
        </div>
      </section>

      {/* Data Collection + Flow */}
      <section id="demo" className="border-t" style={{ borderColor: "var(--border-primary)" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {t.dataCollection}
            </h2>
            <p className="mt-3" style={{ color: "var(--text-secondary)" }}>
              {t.dataCollectionDesc}
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="flex flex-col items-center space-y-4 mb-16">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 w-full max-w-2xl">
              {["GitHub", "Discord", "Telegram", "X", "Wallet"].map((name) => (
                <div key={name} className="card-compact text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                  {name}
                </div>
              ))}
            </div>
            <span className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>↓</span>
            <div className="card-compact text-center w-full max-w-xs" style={{ borderColor: "var(--color-primary-muted)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>AI Engine</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>↓</span>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              <div className="card-compact text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                {t.leaderboard}
              </div>
              <div className="card-compact text-center text-sm" style={{ borderColor: "var(--color-success-muted)", color: "var(--color-success)" }}>
                USDC
              </div>
            </div>
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {platforms.map((p) => (
              <div key={p.name} className="card text-center">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  {p.name}
                </h3>
                <div className="space-y-1.5">
                  {p.items.map((item) => (
                    <div
                      key={item}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Scoring */}
      <section className="border-t" style={{ borderColor: "var(--border-primary)" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="badge badge-blue mb-4">Explainable AI</div>
              <h2 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {t.aiScoring}
              </h2>
              <p className="mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {t.aiScoringDesc}
              </p>
              <div className="mt-8 space-y-3">
                {scoreBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <span className="text-sm w-28" style={{ color: "var(--text-secondary)" }}>
                      {dimensionLabels[item.label]}
                    </span>
                    <div className="flex-1">
                      <div className="progress">
                        <div className="progress-bar" style={{ width: `${item.pct}%`, background: item.color }} />
                      </div>
                    </div>
                    <span className="text-sm font-mono w-10 text-right" style={{ color: "var(--text-tertiary)" }}>
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary mt-6 btn-sm">{t.explainScore}</button>
            </div>

            <div className="card" style={{ borderColor: "var(--border-hover)" }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    PR #324 · {t.prMerged}
                  </div>
                  <h3 className="text-sm font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                    feat: add batch settlement flow
                  </h3>
                </div>
                <div className="text-2xl font-semibold" style={{ color: "var(--color-primary)" }}>
                  92
                </div>
              </div>
              <div className="divider" />
              <div className="space-y-3">
                {scoreBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {dimensionLabels[item.label]}
                    </span>
                    <span className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="divider" />
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                <span>{t.score}:</span>
                <span className="font-semibold text-sm" style={{ color: "var(--color-primary)" }}>92</span>
                <span>· Top 5%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="border-t" style={{ borderColor: "var(--border-primary)" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {t.leaderboard}
            </h2>
            <p className="mt-3" style={{ color: "var(--text-secondary)" }}>
              {t.leaderboardDesc}
            </p>
          </div>
          <div className="card max-w-2xl mx-auto" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t.rank}</th>
                  <th>{t.contributor}</th>
                  <th>{t.score}</th>
                  <th className="text-right">{t.reward}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item) => (
                  <tr key={item.rank}>
                    <td>
                      <span className="text-sm font-mono" style={{ color: item.rank <= 3 ? "var(--color-primary)" : "var(--text-tertiary)" }}>
                        #{item.rank}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">{item.avatar}</div>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: "var(--text-primary)" }}>{item.score}</span>
                    </td>
                    <td className="text-right">
                      <span className="font-medium" style={{ color: "var(--color-success)" }}>{item.reward}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Settlement Flow */}
      <section className="border-t" style={{ borderColor: "var(--border-primary)" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {t.settlement}
            </h2>
            <p className="mt-3" style={{ color: "var(--text-secondary)" }}>
              {t.settlementDesc}
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2">
            {[
              { label: `30 ${t.contributors}`, sub: t.allCollected },
              { label: t.aiAllocation, sub: t.scoreBased },
              { label: t.multiSend, sub: t.batchTx },
              { label: `Base · Arbitrum · Polygon`, sub: t.multiChain },
              { label: t.completed, sub: t.txVerified },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="card-compact text-center min-w-[130px]">
                  <div className="text-sm font-medium" style={{ color: i === 4 ? "var(--color-success)" : "var(--text-primary)" }}>
                    {step.label}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    {step.sub}
                  </div>
                </div>
                {i < 4 && (
                  <span className="text-xs mx-1" style={{ color: "var(--text-muted)" }}>→</span>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded" style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
              <span>Tx:</span>
              <span style={{ color: "var(--text-secondary)" }}>0x7a3f...e2b1</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-success)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t" style={{ borderColor: "var(--border-primary)" }}>
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {t.ctaTitle}
          </h2>
          <p className="mt-3 mb-8" style={{ color: "var(--text-secondary)" }}>
            {t.ctaDesc}
          </p>
          <Link to="/app" className="btn btn-primary btn-lg">
            {t.getStarted} →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "var(--border-primary)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-primary)" }} />
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.navBrand}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://casualhackathon.com/" target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {t.hackathon}
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {t.github}
            </a>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t.footer}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
