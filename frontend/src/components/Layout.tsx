import { Outlet, NavLink } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useDemoMode } from "../hooks/useDemoMode";
import { useLang } from "../hooks/useLang";
import { formatAddress } from "../utils/format";

export default function Layout() {
  const { address, balance, isConnected, isConnecting, connect, disconnect } = useWallet();
  const { isDemoMode, enableDemoMode, disableDemoMode, demoWallet } = useDemoMode();
  const { lang, setLang, t } = useLang();

  const displayAddress = isDemoMode ? demoWallet.address : address;
  const displayBalance = isDemoMode ? demoWallet.balance : balance;
  const displayConnected = isDemoMode || isConnected;

  const navItems = [
    { path: "/app", label: t.overview, icon: "◎" },
    { path: "/app/contributors", label: t.contributorsTitle, icon: "◇" },
    { path: "/app/analysis", label: t.aiAnalysis, icon: "◆" },
    { path: "/app/rewards", label: t.rewardsTitle, icon: "$" },
    { path: "/app/treasury", label: t.treasury, icon: "◈" },
    { path: "/app/settings", label: t.settings, icon: "⚙" },
  ];

  return (
    <div className="flex h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
      >
        {/* Logo */}
        <div className="h-14 px-5 flex items-center gap-2.5 border-b" style={{ borderColor: "var(--border-primary)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-primary)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {t.navBrand}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/app"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "font-medium" : ""}`
              }
              style={({ isActive }) => ({
                background: isActive ? "var(--color-primary-muted)" : "transparent",
                color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
              })}
            >
              <span className="text-base w-5 text-center" style={{ opacity: 0.7 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Demo Toggle */}
        <div className="px-3 pb-3">
          <button
            onClick={isDemoMode ? disableDemoMode : enableDemoMode}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
            style={{
              background: isDemoMode ? "var(--color-success-muted)" : "var(--bg-tertiary)",
              color: isDemoMode ? "var(--color-success)" : "var(--text-tertiary)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: isDemoMode ? "var(--color-success)" : "var(--text-muted)" }} />
            {isDemoMode ? t.demoModeActive : t.enableDemo}
          </button>
        </div>

        {/* Wallet */}
        <div className="px-3 pb-4">
          {displayConnected ? (
            <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--bg-tertiary)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.wallet}</span>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-success)" }} />
              </div>
              <div className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>
                {formatAddress(displayAddress || "")}
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {parseFloat(displayBalance).toFixed(4)} ETH
              </div>
              {!isDemoMode && (
                <button onClick={disconnect} className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {t.disconnect}
                </button>
              )}
            </div>
          ) : (
            <button onClick={connect} disabled={isConnecting} className="btn btn-primary w-full btn-sm">
              {isConnecting ? t.connecting : t.connectWallet}
            </button>
          )}
        </div>

        {/* Language */}
        <div className="px-3 pb-4">
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
          >
            <span>{lang === "zh" ? "中文" : "English"}</span>
            <span style={{ color: "var(--text-muted)" }}>{lang === "zh" ? "EN" : "中"}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
