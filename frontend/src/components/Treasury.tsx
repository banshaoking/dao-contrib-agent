import { useDemoMode } from "../hooks/useDemoMode";
import { useLang } from "../hooks/useLang";
import { formatAmount } from "../utils/format";

export default function Treasury() {
  const { isDemoMode, demoWallet, demoSettlements } = useDemoMode();
  const { t } = useLang();

  const totalDistributed = demoSettlements.reduce((sum, s) => sum + BigInt(s.totalAmount), BigInt(0)).toString();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>{t.treasury}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{t.treasuryDesc}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="stat-label">{t.walletBalance}</div>
          <div className="stat-value mt-1">
            {parseFloat(demoWallet.balance).toFixed(4)} <span className="text-lg" style={{ color: "var(--text-tertiary)" }}>ETH</span>
          </div>
        </div>
        <div className="card">
          <div className="stat-label">{t.totalDistributedLabel}</div>
          <div className="stat-value mt-1">
            {formatAmount(totalDistributed)} <span className="text-lg" style={{ color: "var(--text-tertiary)" }}>USDC</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t.contractInfo}</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{t.network}</span>
            <span className="badge badge-blue">Sepolia Testnet</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{t.wallet}</span>
            <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{demoWallet.address.slice(0, 10)}...{demoWallet.address.slice(-8)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{t.transactions}</span>
            <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{demoSettlements.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
