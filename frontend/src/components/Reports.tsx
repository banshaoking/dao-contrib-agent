import { useState } from "react";
import { reportsApi } from "../utils/api";
import toast from "react-hot-toast";

interface Report {
  summary: string;
  topContributors: {
    address: string;
    github?: string;
    totalAmount: string;
    contributionCount: number;
    highlight: string;
  }[];
  insights: string[];
  recommendations: string[];
}

export default function Reports() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string>("");

  const handleGenerate = async () => {
    if (!selectedIds.trim()) {
      toast.error("请输入贡献 ID（逗号分隔）");
      return;
    }

    const ids = selectedIds.split(",").map((id) => id.trim()).filter(Boolean);

    if (ids.length === 0) {
      toast.error("请输入有效的贡献 ID");
      return;
    }

    try {
      setLoading(true);
      const res = await reportsApi.generate(ids);
      if (res.success) {
        setReport(res.data as Report);
        toast.success("报告生成成功");
      }
    } catch (error: any) {
      toast.error(error.message || "生成报告失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - iOS 26 Style */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="ios-gradient-text">Reports</span>
        </h1>
        <p className="text-ios-gray mt-1">使用 AI 生成贡献分析报告</p>
      </div>

      {/* Generate Form - iOS 26 Style */}
      <div className="ios-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ios-purple to-ios-pink flex items-center justify-center text-xl">
            📊
          </div>
          <div>
            <h2 className="font-semibold text-lg">生成报告</h2>
            <p className="text-ios-gray text-sm">输入贡献 ID 生成 AI 分析报告</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ios-gray mb-2">
              贡献 ID（逗号分隔）
            </label>
            <input
              type="text"
              value={selectedIds}
              onChange={(e) => setSelectedIds(e.target.value)}
              className="ios-input"
              placeholder="contrib_1, contrib_2, contrib_3"
            />
          </div>
          <button onClick={handleGenerate} disabled={loading} className="ios-btn ios-btn-primary w-full">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="ios-spinner w-4 h-4"></span>
                生成中...
              </span>
            ) : (
              "📊 生成 AI 报告"
            )}
          </button>
        </div>
      </div>

      {/* Report Display - iOS 26 Style */}
      {report && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="ios-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📋</span>
              总结
            </h2>
            <p className="text-ios-gray leading-relaxed">{report.summary}</p>
          </div>

          {/* Top Contributors */}
          <div className="ios-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">🏆</span>
              Top 贡献者
            </h2>
            <div className="space-y-3">
              {report.topContributors.map((contributor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "👤"}
                    </span>
                    <div>
                      <p className="font-medium">
                        {contributor.github || `${contributor.address.slice(0, 8)}...`}
                      </p>
                      <p className="text-xs text-ios-gray">{contributor.highlight}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ios-blue">
                      {contributor.totalAmount} wei
                    </p>
                    <p className="text-xs text-ios-gray">
                      {contributor.contributionCount} 贡献
                    </p>
                  </div>
                </div>
              ))}
              {report.topContributors.length === 0 && (
                <div className="text-center py-8 text-ios-gray">
                  <span className="text-4xl block mb-2">📭</span>
                  暂无数据
                </div>
              )}
            </div>
          </div>

          {/* Insights */}
          <div className="ios-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">💡</span>
              洞察
            </h2>
            <ul className="space-y-3">
              {report.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-ios-blue mt-1">•</span>
                  <span className="text-ios-gray">{insight}</span>
                </li>
              ))}
              {report.insights.length === 0 && (
                <div className="text-center py-8 text-ios-gray">
                  <span className="text-4xl block mb-2">📭</span>
                  暂无洞察
                </div>
              )}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="ios-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              建议
            </h2>
            <ul className="space-y-3">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-ios-green mt-1">✓</span>
                  <span className="text-ios-gray">{rec}</span>
                </li>
              ))}
              {report.recommendations.length === 0 && (
                <div className="text-center py-8 text-ios-gray">
                  <span className="text-4xl block mb-2">📭</span>
                  暂无建议
                </div>
              )}
            </ul>
          </div>

          {/* Export - iOS 26 Style */}
          <div className="ios-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📥</span>
              导出报告
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const content = JSON.stringify(report, null, 2);
                  const blob = new Blob([content], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `dao-contrib-report-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("报告已下载");
                }}
                className="ios-btn ios-btn-secondary flex-1"
              >
                📥 下载 JSON
              </button>
              <button
                onClick={() => {
                  let content = `# DAO 贡献分析报告\n\n`;
                  content += `## 总结\n${report.summary}\n\n`;
                  content += `## Top 贡献者\n`;
                  report.topContributors.forEach((c, i) => {
                    content += `${i + 1}. ${c.github || c.address} - ${c.totalAmount} wei (${c.contributionCount} 贡献)\n`;
                  });
                  content += `\n## 洞察\n`;
                  report.insights.forEach((i) => {
                    content += `- ${i}\n`;
                  });
                  content += `\n## 建议\n`;
                  report.recommendations.forEach((r) => {
                    content += `- ${r}\n`;
                  });

                  const blob = new Blob([content], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `dao-contrib-report-${Date.now()}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("报告已下载");
                }}
                className="ios-btn ios-btn-secondary flex-1"
              >
                📄 下载 Markdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
