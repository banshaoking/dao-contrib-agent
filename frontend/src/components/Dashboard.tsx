import { useState, useEffect } from "react";
import { contributionsApi, settlementsApi } from "../utils/api";
import { formatAmount } from "../utils/format";
import { useWallet } from "../hooks/useWallet";
import { useDemoMode } from "../hooks/useDemoMode";
import { useLang } from "../hooks/useLang";

interface Stats {
  total: number;
  settled: number;
  pending: number;
  totalAmount: string;
  settledAmount: string;
  uniqueContributors: number;
  byPlatform: Record<string, number>;
  byType: Record<string, number>;
}

export default function Dashboard() {
  const { isConnected } = useWallet();
  const { isDemoMode, demoContributions, demoWallet } = useDemoMode();
  const { t } = useLang();
  const [apiStats, setApiStats] = useState<Stats | null>(null);
  const [apiBalance, setApiBalance] = useState("0");
  const [loading, setLoading] = useState(true);

  const stats = isDemoMode
    ? (() => {
        const total = demoContributions.length;
        const settled = demoContributions.filter((c) => c.settled).length;
        const pending = total - settled;
        const totalAmount = demoContributions.reduce((sum, c) => sum + BigInt(c.amount), BigInt(0)).toString();
        const settledAmount = demoContributions.filter((c) => c.settled).reduce((sum, c) => sum + BigInt(c.amount), BigInt(0)).toString();
        const byPlatform: Record<string, number> = {};
        const byType: Record<string, number> = {};
        const contributors = new Set<string>();
        demoContributions.forEach((c) => {
          byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1;
          byType[c.type] = (byType[c.type] || 0) + 1;
          contributors.add(c.contributorAddress);
        });
        return { total, settled, pending, totalAmount, settledAmount, uniqueContributors: contributors.size, byPlatform, byType };
      })()
    : apiStats;

  const balance = isDemoMode ? demoWallet.balance : apiBalance;

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const loadData = async () => {
    if (isDemoMode) { setLoading(false); return; }
    try {
      const [statsRes, balanceRes] = await Promise.all([contributionsApi.getStats(), settlementsApi.getContractBalance()]);
      if (statsRes.success) setApiStats(statsRes.data as Stats);
      if (balanceRes.success) setApiBalance((balanceRes.data as any).balance);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  const statCards = [
    { label: t.totalContributors, value: stats?.uniqueContributors || 0, change: "+12%" },
    { label: t.pendingRewards, value: stats?.pending || 0, change: null },
    { label: t.aiReviews, value: stats?.total || 0, change: "+8%" },
    { label: t.completedPayouts, value: stats?.settled || 0, change: null },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {t.overview}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          {isDemoMode ? t.demoMode : t.overviewDesc}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="card">
            <div className="stat-label">{card.label}</div>
            <div className="stat-value mt-1">{card.value}</div>
            {card.change && <div className="stat-change stat-change-up">{card.change}</div>}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="stat-label">{t.treasuryBalance}</div>
            <div className="stat-value mt-1">
              {formatAmount(balance)} <span className="text-lg" style={{ color: "var(--text-tertiary)" }}>USDC</span>
            </div>
          </div>
          <div className="text-xs font-mono px-3 py-1.5 rounded" style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
            {formatAmount(stats?.totalAmount || "0")} {t.totalDistributed}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          {t.recentActivity}
        </h2>
        <div className="space-y-3">
          {(isDemoMode ? demoContributions : []).slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                  {c.contributorGithub?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="text-sm" style={{ color: "var(--text-primary)" }}>{c.title}</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{c.contributorGithub} · {c.platform}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {c.aiScore && <span className="text-sm font-mono" style={{ color: "var(--color-primary)" }}>{c.aiScore}</span>}
                <span className={`badge ${c.settled ? "badge-green" : "badge-neutral"}`}>
                  {c.settled ? t.settled : t.pending}
                </span>
              </div>
            </div>
          ))}
          {(!isDemoMode || demoContributions.length === 0) && (
            <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>{t.noActivity}</div>
          )}
        </div>
      </div>
    </div>
  );
}
