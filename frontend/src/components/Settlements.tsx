import { useState, useEffect } from "react";
import { settlementsApi, contributionsApi } from "../utils/api";
import { formatAddress, formatDate, formatTxHash, getEtherscanLink, statusNames, statusColors } from "../utils/format";
import toast from "react-hot-toast";

interface Settlement {
  id: string;
  ruleId: string;
  totalAmount: string;
  contributorCount: number;
  contributionIds: string[];
  txHash?: string;
  status: string;
  executedAt?: number;
  executorAddress: string;
  createdAt: number;
}

export default function Settlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [balance, setBalance] = useState("0");
  const [showExecuteForm, setShowExecuteForm] = useState(false);
  const [pendingContributions, setPendingContributions] = useState<any[]>([]);
  const [selectedContributions, setSelectedContributions] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settlementsRes, balanceRes, contribRes] = await Promise.all([
        settlementsApi.getAll(),
        settlementsApi.getContractBalance(),
        contributionsApi.getAll({ settled: false, pageSize: 100 }),
      ]);

      if (settlementsRes.success) setSettlements((settlementsRes.data as any).items || []);
      if (balanceRes.success) setBalance((balanceRes.data as any).balance);
      if (contribRes.success) setPendingContributions((contribRes.data as any).items || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (selectedContributions.length === 0) {
      toast.error("请选择要结算的贡献");
      return;
    }

    try {
      setExecuting(true);
      const res = await settlementsApi.execute({
        ruleId: "default",
        contributionIds: selectedContributions,
      });

      if (res.success) {
        toast.success("结算已提交，请等待链上确认");
        setShowExecuteForm(false);
        setSelectedContributions([]);
        // 轮询检查状态
        setTimeout(loadData, 5000);
      }
    } catch (error: any) {
      toast.error(error.message || "结算失败");
    } finally {
      setExecuting(false);
    }
  };

  const toggleSelectContribution = (id: string) => {
    setSelectedContributions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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
            <span className="ios-gradient-text">Settlements</span>
          </h1>
          <p className="text-ios-gray mt-1">管理链上结算记录</p>
        </div>
        <button onClick={() => setShowExecuteForm(true)} className="ios-btn ios-btn-success">
          💸 执行结算
        </button>
      </div>

      {/* Stats - iOS 26 Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="ios-stat-card">
          <div className="text-3xl mb-2">💰</div>
          <div className="ios-stat-value">{balance}</div>
          <div className="ios-stat-label">合约余额 (USDC)</div>
        </div>
        <div className="ios-stat-card">
          <div className="text-3xl mb-2">⏳</div>
          <div className="ios-stat-value">{pendingContributions.length}</div>
          <div className="ios-stat-label">待结算贡献</div>
        </div>
        <div className="ios-stat-card">
          <div className="text-3xl mb-2">✅</div>
          <div className="ios-stat-value">{settlements.length}</div>
          <div className="ios-stat-label">结算记录</div>
        </div>
      </div>

      {/* Execute Form Modal - iOS 26 Style */}
      {showExecuteForm && (
        <div className="ios-modal-overlay" onClick={() => setShowExecuteForm(false)}>
          <div className="ios-modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ios-green to-ios-teal flex items-center justify-center text-2xl">
                💸
              </div>
              <div>
                <h2 className="text-xl font-bold">执行批量结算</h2>
                <p className="text-ios-gray text-sm">选择要结算的贡献</p>
              </div>
            </div>

            {pendingContributions.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl block mb-4">✅</span>
                <p className="text-ios-gray text-lg">暂无待结算的贡献</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-ios-gray mb-4">
                  已选择: <span className="font-semibold text-ios-blue">{selectedContributions.length}</span>
                </p>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {pendingContributions.map((contrib) => (
                    <div
                      key={contrib.id}
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedContributions.includes(contrib.id)
                          ? "bg-ios-blue/10 border-2 border-ios-blue"
                          : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                      }`}
                      onClick={() => toggleSelectContribution(contrib.id)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedContributions.includes(contrib.id)}
                          onChange={() => toggleSelectContribution(contrib.id)}
                          className="w-4 h-4 rounded-ios accent-ios-blue"
                        />
                        <div>
                          <p className="font-medium text-sm">{contrib.title}</p>
                          <p className="text-xs text-ios-gray font-mono">
                            {contrib.contributorGithub || formatAddress(contrib.contributorAddress)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-ios-blue">
                        {contrib.amount && contrib.amount !== "0"
                          ? `${contrib.amount} wei`
                          : "待评估"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowExecuteForm(false)} className="ios-btn ios-btn-secondary flex-1">
                取消
              </button>
              <button
                onClick={handleExecute}
                disabled={selectedContributions.length === 0 || executing}
                className="ios-btn ios-btn-success flex-1"
              >
                {executing ? (
                  <span className="flex items-center gap-2">
                    <span className="ios-spinner w-4 h-4"></span>
                    执行中...
                  </span>
                ) : (
                  `结算 (${selectedContributions.length})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlements List - iOS 26 Style */}
      <div className="ios-list">
        {/* Table Header */}
        <div className="grid grid-cols-8 gap-4 px-6 py-4 border-b border-glass-border bg-white/5">
          <div className="col-span-1 text-sm font-semibold text-ios-gray">批次 ID</div>
          <div className="col-span-1 text-sm font-semibold text-ios-gray">状态</div>
          <div className="col-span-1 text-sm font-semibold text-ios-gray">贡献者数</div>
          <div className="col-span-1 text-sm font-semibold text-ios-gray">总金额</div>
          <div className="col-span-1 text-sm font-semibold text-ios-gray">执行者</div>
          <div className="col-span-2 text-sm font-semibold text-ios-gray">交易哈希</div>
          <div className="col-span-1 text-sm font-semibold text-ios-gray">时间</div>
        </div>

        {/* Table Body */}
        {settlements.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">📭</span>
            <p className="text-ios-gray text-lg">暂无结算记录</p>
          </div>
        ) : (
          settlements.map((settlement) => (
            <div
              key={settlement.id}
              className="grid grid-cols-8 gap-4 px-6 py-4 ios-list-item items-center"
            >
              <div className="col-span-1 font-mono text-sm">{settlement.id}</div>
              <div className="col-span-1">
                <span className={`ios-badge ${statusColors[settlement.status] || "ios-badge-blue"}`}>
                  {statusNames[settlement.status] || settlement.status}
                </span>
              </div>
              <div className="col-span-1 font-semibold">{settlement.contributorCount}</div>
              <div className="col-span-1 text-sm font-medium text-ios-blue">
                {settlement.totalAmount} wei
              </div>
              <div className="col-span-1 text-sm font-mono text-ios-gray">
                {formatAddress(settlement.executorAddress)}
              </div>
              <div className="col-span-2">
                {settlement.txHash ? (
                  <a
                    href={getEtherscanLink(settlement.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ios-blue hover:text-ios-blue/80 text-sm font-mono flex items-center gap-1"
                  >
                    {formatTxHash(settlement.txHash)}
                    <span className="text-xs">↗</span>
                  </a>
                ) : (
                  <span className="text-ios-gray">-</span>
                )}
              </div>
              <div className="col-span-1 text-xs text-ios-gray">
                {formatDate(settlement.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
