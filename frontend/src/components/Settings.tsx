import { useState } from "react";
import { useLang } from "../hooks/useLang";

export default function Settings() {
  const { t } = useLang();
  const [githubToken, setGithubToken] = useState("");
  const [discordToken, setDiscordToken] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>{t.settings}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{t.settingsDesc}</p>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t.integrations}</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm block mb-1.5" style={{ color: "var(--text-secondary)" }}>{t.githubToken}</label>
            <input type="password" className="input" placeholder="ghp_xxxxxxxxxxxx" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t.githubTokenDesc}</p>
          </div>
          <div>
            <label className="text-sm block mb-1.5" style={{ color: "var(--text-secondary)" }}>{t.discordToken}</label>
            <input type="password" className="input" placeholder="MTxxxxxxxxxxxxxx" value={discordToken} onChange={(e) => setDiscordToken(e.target.value)} />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t.discordTokenDesc}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t.aiConfig}</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>OpenAI API</span>
            <span className="badge badge-green">{t.connected}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Mimo API</span>
            <span className="badge badge-neutral">{t.notConfigured}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t.blockchain}</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.network}</span>
            <span className="badge badge-blue">Sepolia</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.contract}</span>
            <span className="text-sm font-mono" style={{ color: "var(--text-tertiary)" }}>{t.notDeployed}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.paymentToken}</span>
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>USDC (Sepolia)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
