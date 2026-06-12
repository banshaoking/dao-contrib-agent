import { useState, useEffect } from "react";
import { contributionsApi } from "../utils/api";
import {
  formatAddress,
  formatDate,
  formatAmount,
  contributionTypeNames,
  platformNames,
} from "../utils/format";
import { useDemoMode } from "../hooks/useDemoMode";
import toast from "react-hot-toast";

interface Contribution {
  id: string;
  contributorAddress: string;
  contributorGithub?: string;
  platform: string;
  type: string;
  title: string;
  amount: string;
  aiScore?: number;
  aiReason?: string;
  timestamp: number;
  settled: boolean;
}

export default function Contributions() {
  const { isDemoMode, demoContributions, simulateAIAnalysis } = useDemoMode();
  const [apiContributions, setApiContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  // 演示模式下直接使用 demoContributions，否则使用 apiContributions
  const contributions = isDemoMode ? demoContributions : apiContributions;

  // GitHub 采集表单
  const [showGithubForm, setShowGithubForm] = useState(false);
  const [githubForm, setGithubForm] = useState({
    owner: "",
    repo: "",
    username: "",
    address: "",
  });

  // 手动添加表单
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    contributorAddress: "",
    platform: "github",
    type: "pull_request",
    title: "",
    description: "",
  });

  useEffect(() => {
    loadContributions();
  }, [isDemoMode]);

  const loadContributions = async () => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    try {
      const res = await contributionsApi.getAll({ pageSize: 100 });
      if (res.success) {
        setApiContributions((res.data as any).items || []);
      }
    } catch (error) {
      console.error("Failed to load contributions:", error);
      toast.error("加载贡献数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchGithub = async () => {
    if (!githubForm.owner || !githubForm.repo || !githubForm.username || !githubForm.address) {
      toast.error("请填写所有必填字段");
      return;
    }

    try {
      setLoading(true);
      const res = await contributionsApi.fetchFromGithub(githubForm);
      if (res.success) {
        toast.success(`成功采集 ${(res.data as any).count} 条贡献`);
        setShowGithubForm(false);
        setGithubForm({ owner: "", repo: "", username: "", address: "" });
        await loadContributions();
      }
    } catch (error: any) {
      toast.error(error.message || "采集失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = async () => {
    if (!manualForm.contributorAddress || !manualForm.title) {
      toast.error("请填写必填字段");
      return;
    }

    try {
      const res = await contributionsApi.addManual([
        {
          ...manualForm,
          externalId: `manual_${Date.now()}`,
          timestamp: Date.now(),
        },
      ]);
      if (res.success) {
        toast.success("添加成功");
        setShowManualForm(false);
        setManualForm({
          contributorAddress: "",
          platform: "github",
          type: "pull_request",
          title: "",
          description: "",
        });
        await loadContributions();
      }
    } catch (error: any) {
      toast.error(error.message || "添加失败");
    }
  };

  const handleAnalyze = async () => {
    if (selected.length === 0) {
      toast.error("请选择要分析的贡献");
      return;
    }

    try {
      setAnalyzing(true);

      if (isDemoMode) {
        // 演示模式：模拟 AI 分析
        await simulateAIAnalysis(selected);
        toast.success(`成功分析 ${selected.length} 条贡献`);
        setSelected([]);
      } else {
        const res = await contributionsApi.analyze(selected);
        if (res.success) {
          toast.success(`成功分析 ${selected.length} 条贡献`);
          await loadContributions();
          setSelected([]);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === contributions.length) {
      setSelected([]);
    } else {
      setSelected(contributions.map((c) => c.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="ios-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - iOS 26 Style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="ios-gradient-text">Contributions</span>
          </h1>
          <p className="text-ios-gray mt-1">管理 DAO 成员的贡献记录</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowGithubForm(true)} className="ios-btn ios-btn-primary">
            🐙 GitHub 采集
          </button>
          <button onClick={() => setShowManualForm(true)} className="ios-btn ios-btn-secondary">
            ➕ 手动添加
          </button>
          <button
            onClick={handleAnalyze}
            disabled={selected.length === 0 || analyzing}
            className="ios-btn ios-btn-success"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <span className="ios-spinner w-4 h-4"></span>
                分析中...
              </span>
            ) : (
              `🤖 AI 分析 (${selected.length})`
            )}
          </button>
        </div>
      </div>

      {/* GitHub Form Modal - iOS 26 Style */}
      {showGithubForm && (
        <div className="ios-modal-overlay" onClick={() => setShowGithubForm(false)}>
          <div className="ios-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-2xl">
                🐙
              </div>
              <div>
                <h2 className="text-xl font-bold">GitHub 采集</h2>
                <p className="text-ios-gray text-sm">从 GitHub 仓库采集贡献数据</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ios-gray mb-2">仓库所有者 *</label>
                <input
                  type="text"
                  value={githubForm.owner}
                  onChange={(e) => setGithubForm({ ...githubForm, owner: e.target.value })}
                  className="ios-input"
                  placeholder="例如: ethereum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ios-gray mb-2">仓库名称 *</label>
                <input
                  type="text"
                  value={githubForm.repo}
                  onChange={(e) => setGithubForm({ ...githubForm, repo: e.target.value })}
                  className="ios-input"
                  placeholder="例如: go-ethereum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ios-gray mb-2">GitHub 用户名 *</label>
                <input
                  type="text"
                  value={githubForm.username}
                  onChange={(e) => setGithubForm({ ...githubForm, username: e.target.value })}
                  className="ios-input"
                  placeholder="例如: vitalik"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ios-gray mb-2">钱包地址 *</label>
                <input
                  type="text"
                  value={githubForm.address}
                  onChange={(e) => setGithubForm({ ...githubForm, address: e.target.value })}
                  className="ios-input"
                  placeholder="0x..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowGithubForm(false)} className="ios-btn ios-btn-secondary flex-1">
                取消
              </button>
              <button onClick={handleFetchGithub} className="ios-btn ios-btn-primary flex-1">
                开始采集
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Form Modal - iOS 26 Style */}
      {showManualForm && (
        <div className="ios-modal-overlay" onClick={() => setShowManualForm(false)}>
          <div className="ios-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ios-blue to-ios-purple flex items-center justify-center text-2xl">
                ➕
              </div>
              <div>
                <h2 className="text-xl font-bold">手动添加</h2>
                <p className="text-ios-gray text-sm">手动添加贡献记录</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ios-gray mb-2">贡献者地址 *</label>
                <input
                  type="text"
                  value={manualForm.contributorAddress}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, contributorAddress: e.target.value })
                  }
                  className="ios-input"
                  placeholder="0x..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ios-gray mb-2">平台</label>
                <select
                  value={manualForm.platform}
                  onChange={(e) => setManualForm({ ...manualForm, platform: e.target.value })}
                  className="ios-input"
                >
                  <option value="github">GitHub</option>
                  <option value="discord">Discord</option>
                  <option value="forum">论坛</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ios-gray mb-2">类型</label>
                <select
                  value={manualForm.type}
                  onChange={(e) => setManualForm({ ...manualForm, type: e.target.value })}
                  className="ios-input"
                >
                  {Object.entries(contributionTypeNames).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ios-gray mb-2">标题 *</label>
                <input
                  type="text"
                  value={manualForm.title}
                  onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                  className="ios-input"
                  placeholder="贡献标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ios-gray mb-2">描述</label>
                <textarea
                  value={manualForm.description}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, description: e.target.value })
                  }
                  className="ios-input"
                  rows={3}
                  placeholder="可选描述"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowManualForm(false)} className="ios-btn ios-btn-secondary flex-1">
                取消
              </button>
              <button onClick={handleAddManual} className="ios-btn ios-btn-primary flex-1">
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contributions List - iOS 26 Style */}
      <div className="ios-list">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-glass-border bg-white/5">
          <div className="col-span-1">
            <input
              type="checkbox"
              checked={selected.length === contributions.length && contributions.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded-ios accent-ios-blue"
            />
          </div>
          <div className="col-span-2 text-sm font-semibold text-ios-gray">贡献者</div>
          <div className="col-span-1 text-sm font-semibold text-ios-gray">平台</div>
          <div className="col-span-2 text-sm font-semibold text-ios-gray">类型</div>
          <div className="col-span-2 text-sm font-semibold text-ios-gray">标题</div>
          <div className="col-span-1 text-sm font-semibold text-ios-gray">AI 评分</div>
          <div className="col-span-1 text-sm font-semibold text-ios-gray">金额</div>
          <div className="col-span-1 text-sm font-semibold text-ios-gray">状态</div>
          <div className="col-span-1 text-sm font-semibold text-ios-gray">时间</div>
        </div>

        {/* Table Body */}
        {contributions.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">📭</span>
            <p className="text-ios-gray text-lg">暂无贡献数据</p>
            <p className="text-ios-gray/60 text-sm mt-1">请先采集或添加贡献</p>
          </div>
        ) : (
          contributions.map((contrib) => (
            <div
              key={contrib.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 ios-list-item items-center"
            >
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selected.includes(contrib.id)}
                  onChange={() => toggleSelect(contrib.id)}
                  className="w-4 h-4 rounded-ios accent-ios-blue"
                />
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="ios-avatar w-8 h-8 text-xs">
                    {(contrib.contributorGithub || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {contrib.contributorGithub || formatAddress(contrib.contributorAddress)}
                    </p>
                    <p className="text-xs text-ios-gray font-mono">
                      {formatAddress(contrib.contributorAddress)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-span-1">
                <span className="ios-badge ios-badge-blue">
                  {platformNames[contrib.platform] || contrib.platform}
                </span>
              </div>
              <div className="col-span-2 text-sm">
                {contributionTypeNames[contrib.type] || contrib.type}
              </div>
              <div className="col-span-2 text-sm truncate">{contrib.title}</div>
              <div className="col-span-1">
                {contrib.aiScore ? (
                  <span
                    className={`font-semibold ${
                      contrib.aiScore >= 80
                        ? "text-ios-green"
                        : contrib.aiScore >= 60
                        ? "text-ios-orange"
                        : "text-ios-red"
                    }`}
                  >
                    {contrib.aiScore}
                  </span>
                ) : (
                  <span className="text-ios-gray">-</span>
                )}
              </div>
              <div className="col-span-1 text-sm font-medium text-ios-blue">
                {contrib.amount && contrib.amount !== "0"
                  ? `${formatAmount(contrib.amount)} USDC`
                  : "-"}
              </div>
              <div className="col-span-1">
                <span
                  className={`ios-badge ${
                    contrib.settled ? "ios-badge-green" : "ios-badge-orange"
                  }`}
                >
                  {contrib.settled ? "已结算" : "待结算"}
                </span>
              </div>
              <div className="col-span-1 text-xs text-ios-gray">
                {formatDate(contrib.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
