import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { WalletProvider } from "./hooks/useWallet";
import { DemoProvider } from "./hooks/useDemoMode";
import { LangProvider } from "./hooks/useLang";
import Layout from "./components/Layout";
import Landing from "./components/Landing";
import Dashboard from "./components/Dashboard";
import Contributors from "./components/Contributors";
import AIAnalysis from "./components/AIAnalysis";
import Rewards from "./components/Rewards";
import Treasury from "./components/Treasury";
import Settings from "./components/Settings";

function App() {
  return (
    <LangProvider>
      <DemoProvider>
        <WalletProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-primary)",
                fontSize: "13px",
                borderRadius: "8px",
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="contributors" element={<Contributors />} />
              <Route path="analysis" element={<AIAnalysis />} />
              <Route path="rewards" element={<Rewards />} />
              <Route path="treasury" element={<Treasury />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </WalletProvider>
      </DemoProvider>
    </LangProvider>
  );
}

export default App;
