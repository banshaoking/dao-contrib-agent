import { useState, useEffect } from "react";
import { formatAmount, formatRelativeTime } from "../utils/format";
import { useDemoMode } from "../hooks/useDemoMode";
import { useLang } from "../hooks/useLang";

interface Contributor {
  address: string;
  github: string;
  score: number;
  totalAmount: string;
  contributionCount: number;
  lastActive: number;
}

export default function Contributors() {
  const { isDemoMode, demoContributions } = useDemoMode();
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const contributors: Contributor[] = isDemoMode
    ? (() => {
        const map = new Map<string, Contributor>();
        demoContributions.forEach((c) => {
          const existing = map.get(c.contributorAddress);
          if (existing) {
            existing.totalAmount = (BigInt(existing.totalAmount) + BigInt(c.amount)).toString();
            existing.contributionCount += 1;
            if (c.aiScore && c.aiScore > existing.score) existing.score = c.aiScore;
            if (c.timestamp > existing.lastActive) existing.lastActive = c.timestamp;
          } else {
            map.set(c.contributorAddress, {
              address: c.contributorAddress,
              github: c.contributorGithub || "unknown",
              score: c.aiScore || 0,
              totalAmount: c.amount,
              contributionCount: 1,
              lastActive: c.timestamp,
            });
          }
        });
        return Array.from(map.values()).sort((a, b) => b.score - a.score);
      })()
    : [];

  useEffect(() => { setLoading(false); }, [isDemoMode]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  const selectedContributor = contributors.find((c) => c.address === selected);
  const selectedContributions = selected ? demoContributions.filter((c) => c.contributorAddress === selected) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>{t.contributorsTitle}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{contributors.length} {t.activeContributors}</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t.rank_col}</th>
              <th>{t.contributor_col}</th>
              <th>{t.score_col}</th>
              <th>{t.contributions_col}</th>
              <th>{t.reward_col}</th>
              <th>{t.lastActive}</th>
            </tr>
          </thead>
          <tbody>
            {contributors.map((c, i) => (
              <tr key={c.address} className="cursor-pointer" onClick={() => setSelected(selected === c.address ? null : c.address)} style={{ background: selected === c.address ? "var(--bg-hover)" : undefined }}>
                <td><span className="font-mono text-sm" style={{ color: i < 3 ? "var(--color-primary)" : "var(--text-tertiary)" }}>#{i + 1}</span></td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar">{c.github[0]?.toUpperCase()}</div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{c.github}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{c.address.slice(0, 6)}...{c.address.slice(-4)}</div>
                    </div>
                  </div>
                </td>
                <td><span className="font-mono font-medium" style={{ color: "var(--color-primary)" }}>{c.score}</span></td>
                <td><span style={{ color: "var(--text-secondary)" }}>{c.contributionCount}</span></td>
                <td><span className="font-medium" style={{ color: "var(--color-success)" }}>{formatAmount(c.totalAmount)} USDC</span></td>
                <td><span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{formatRelativeTime(c.lastActive)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedContributor && (
        <div className="card animate-fade-in-up">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="avatar avatar-lg">{selectedContributor.github[0]?.toUpperCase()}</div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{selectedContributor.github}</h2>
                <div className="text-sm font-mono" style={{ color: "var(--text-tertiary)" }}>{selectedContributor.address}</div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card-compact text-center">
              <div className="stat-label">{t.score_col}</div>
              <div className="text-2xl font-semibold mt-1" style={{ color: "var(--color-primary)" }}>{selectedContributor.score}</div>
            </div>
            <div className="card-compact text-center">
              <div className="stat-label">{t.contributions_col}</div>
              <div className="text-2xl font-semibold mt-1" style={{ color: "var(--text-primary)" }}>{selectedContributor.contributionCount}</div>
            </div>
            <div className="card-compact text-center">
              <div className="stat-label">{t.totalReward}</div>
              <div className="text-2xl font-semibold mt-1" style={{ color: "var(--color-success)" }}>{formatAmount(selectedContributor.totalAmount)}</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>{t.contributionHistory}</h3>
          <div className="space-y-2">
            {selectedContributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
                <div>
                  <div className="text-sm" style={{ color: "var(--text-primary)" }}>{c.title}</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{c.platform} · {c.type.replace(/_/g, " ")}</div>
                </div>
                <div className="flex items-center gap-3">
                  {c.aiScore && <span className="text-sm font-mono" style={{ color: "var(--color-primary)" }}>{c.aiScore}</span>}
                  <span className={`badge ${c.settled ? "badge-green" : "badge-neutral"}`}>{c.settled ? t.settled : t.pending}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
