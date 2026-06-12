import { useState } from "react";
import { useDemoMode } from "../hooks/useDemoMode";
import { useLang } from "../hooks/useLang";
import { formatAmount, formatTxHash, getEtherscanLink } from "../utils/format";

export default function Rewards() {
  const { isDemoMode, demoContributions, demoSettlements, simulateSettlement } = useDemoMode();
  const { t } = useLang();
  const [settling, setSettling] = useState(false);

  const pendingContributions = demoContributions.filter((c) => !c.settled);
  const settledContributions = demoContributions.filter((c) => c.settled);
  const totalPending = pendingContributions.reduce((sum, c) => sum + BigInt(c.amount), BigInt(0)).toString();
  const totalSettled = settledContributions.reduce((sum, c) => sum + BigInt(c.amount), BigInt(0)).toString();

  const handleSettle = async () => {
    const ids = pendingContributions.map((c) => c.id);
    if (ids.length === 0) return;
    setSettling(true);
    try { await simulateSettlement(ids); } finally { setSettling(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>{t.rewardsTitle}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{t.rewardsDesc}</p>
        </div>
        <button onClick={handleSettle} disabled={settling || pendingContributions.length === 0} className="btn btn-success btn-sm">
          {settling ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} />{t.settling}</span> : t.settleContributions.replace("{count}", String(pendingContributions.length))}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="stat-label">{t.pendingCount}</div>
          <div className="stat-value mt-1">{pendingContributions.length}</div>
          <div className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{formatAmount(totalPending)} USDC</div>
        </div>
        <div className="card">
          <div className="stat-label">{t.settledCount}</div>
          <div className="stat-value mt-1">{settledContributions.length}</div>
          <div className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{formatAmount(totalSettled)} USDC</div>
        </div>
        <div className="card">
          <div className="stat-label">{t.transactions}</div>
          <div className="stat-value mt-1">{demoSettlements.length}</div>
          <div className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{t.onChain}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t.settlementPipeline}</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { label: `${pendingContributions.length} ${t.contributors}`, active: pendingContributions.length > 0 },
            { label: t.aiAllocation, active: pendingContributions.length > 0 },
            { label: t.multiSend, active: settling },
            { label: t.onChain, active: settling },
            { label: t.completed, active: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="card-compact text-center min-w-[110px]" style={{ borderColor: step.active ? "var(--color-primary-muted)" : "var(--border-primary)" }}>
                <div className="text-sm font-medium" style={{ color: step.active ? "var(--color-primary)" : "var(--text-tertiary)" }}>{step.label}</div>
              </div>
              {i < 4 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      {pendingContributions.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="px-4 py-3 border-b text-sm font-medium" style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>{t.pendingSettlement}</div>
          <table className="table">
            <thead><tr><th>{t.contributor_col}</th><th>{t.contributions_col}</th><th>{t.score_col}</th><th className="text-right">{t.amount}</th></tr></thead>
            <tbody>
              {pendingContributions.map((c) => (
                <tr key={c.id}>
                  <td><span className="text-sm" style={{ color: "var(--text-primary)" }}>{c.contributorGithub}</span></td>
                  <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.title}</span></td>
                  <td><span className="font-mono text-sm" style={{ color: "var(--color-primary)" }}>{c.aiScore || "—"}</span></td>
                  <td className="text-right"><span className="font-medium" style={{ color: "var(--color-success)" }}>{formatAmount(c.amount)} USDC</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="px-4 py-3 border-b text-sm font-medium" style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>{t.txHistory}</div>
        <table className="table">
          <thead><tr><th>{t.txHash}</th><th>{t.contributors}</th><th>{t.amount}</th><th>{t.status}</th></tr></thead>
          <tbody>
            {demoSettlements.map((s) => (
              <tr key={s.id}>
                <td><a href={getEtherscanLink(s.txHash)} target="_blank" rel="noopener noreferrer" className="font-mono text-sm" style={{ color: "var(--color-secondary)" }}>{formatTxHash(s.txHash)}</a></td>
                <td><span style={{ color: "var(--text-secondary)" }}>{s.contributorCount}</span></td>
                <td><span className="font-medium" style={{ color: "var(--color-success)" }}>{formatAmount(s.totalAmount)} USDC</span></td>
                <td><span className="badge badge-green">{t.completed}</span></td>
              </tr>
            ))}
            {demoSettlements.length === 0 && <tr><td colSpan={4} className="text-center py-8"><span style={{ color: "var(--text-muted)" }}>{t.noTx}</span></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
