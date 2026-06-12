import { useState } from "react";
import { useDemoMode } from "../hooks/useDemoMode";
import { useLang } from "../hooks/useLang";
import { formatAmount, formatRelativeTime } from "../utils/format";

export default function AIAnalysis() {
  const { isDemoMode, demoContributions, simulateAIAnalysis } = useDemoMode();
  const { t } = useLang();
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = demoContributions.find((c) => c.id === selectedId);

  const dimensions = [
    { key: "codeImpact", label: t.codeImpact, weight: 40 },
    { key: "reviewQuality", label: t.reviewQuality, weight: 25 },
    { key: "communityHelp", label: t.communityHelp, weight: 20 },
    { key: "consistency", label: t.consistency, weight: 15 },
  ];

  const getBreakdown = (score: number) => {
    const base = score / 100;
    return dimensions.map((d) => ({ ...d, value: Math.round(base * d.weight * (0.8 + Math.random() * 0.4)) }));
  };

  const handleAnalyze = async () => {
    const unanalyzed = demoContributions.filter((c) => !c.aiScore).map((c) => c.id);
    if (unanalyzed.length === 0) return;
    setAnalyzing(true);
    try { await simulateAIAnalysis(unanalyzed); } finally { setAnalyzing(false); }
  };

  const breakdown = selected?.aiScore ? getBreakdown(selected.aiScore) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>{t.aiAnalysis}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{t.aiAnalysisDesc}</p>
        </div>
        <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-primary btn-sm">
          {analyzing ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} />{t.analyzing}</span> : t.runAnalysis}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="px-4 py-3 border-b text-sm font-medium" style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>
            {t.contributionsList}
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
            {demoContributions.map((c) => (
              <button key={c.id} onClick={() => setSelectedId(c.id)} className="w-full text-left px-4 py-3 transition-colors" style={{ background: selectedId === c.id ? "var(--bg-hover)" : "transparent" }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{c.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{c.platform} · {formatRelativeTime(c.timestamp)}</div>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {c.aiScore ? <span className="text-sm font-mono font-medium" style={{ color: "var(--color-primary)" }}>{c.aiScore}</span> : <span className="badge badge-neutral">{t.pending}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-6 animate-fade-in-up">
              <div className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{selected.platform} · {selected.type.replace(/_/g, " ")}</div>
                    <h2 className="text-lg font-semibold mt-1" style={{ color: "var(--text-primary)" }}>{selected.title}</h2>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{selected.description}</p>
                  </div>
                  {selected.aiScore && <div className="text-4xl font-semibold" style={{ color: "var(--color-primary)" }}>{selected.aiScore}</div>}
                </div>
                {selected.aiScore ? (
                  <>
                    <div className="divider" />
                    <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>{t.scoreBreakdown}</h3>
                    <div className="space-y-3">
                      {breakdown.map((d) => (
                        <div key={d.key} className="flex items-center gap-4">
                          <span className="text-sm w-28" style={{ color: "var(--text-secondary)" }}>{d.label}</span>
                          <div className="flex-1"><div className="progress"><div className="progress-bar progress-bar-primary" style={{ width: `${(d.value / d.weight) * 100}%` }} /></div></div>
                          <span className="text-sm font-mono w-12 text-right" style={{ color: "var(--text-tertiary)" }}>{d.value}/{d.weight}</span>
                        </div>
                      ))}
                    </div>
                    <div className="divider" />
                    <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{t.aiExplanation}</h3>
                    <div className="text-sm p-3 rounded-lg" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>{selected.aiReason}</div>
                    <div className="divider" />
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>{t.linkedEvidence}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge badge-blue">PR #{Math.floor(Math.random() * 500)}</span>
                      <span className="badge badge-purple">Issue #{Math.floor(Math.random() * 200)}</span>
                      <span className="badge badge-neutral">Discord</span>
                    </div>
                    <div className="divider" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.calculatedReward}</span>
                      <span className="text-lg font-semibold" style={{ color: "var(--color-success)" }}>{formatAmount(selected.amount)} USDC</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-sm" style={{ color: "var(--text-muted)" }}>{t.notAnalyzed}</div>
                    <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-primary btn-sm mt-4">{t.runAnalysis}</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-3xl mb-3" style={{ color: "var(--text-muted)" }}>◆</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>{t.selectContribution}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
