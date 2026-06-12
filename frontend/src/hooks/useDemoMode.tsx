import { useState, useEffect, createContext, useContext, ReactNode } from "react";

// 演示数据
const DEMO_CONTRIBUTIONS = [
  {
    id: "demo_1",
    contributorAddress: "0x1234567890123456789012345678901234567890",
    contributorGithub: "alice_dev",
    platform: "github",
    type: "pull_request",
    title: "feat: 添加用户认证模块",
    description: "实现了 JWT 认证和 OAuth2.0 登录",
    amount: "5000000000000000000",
    aiScore: 92,
    aiReason: "高质量的代码实现，包含完整的测试用例和文档",
    timestamp: Date.now() - 86400000 * 3,
    settled: false,
  },
  {
    id: "demo_2",
    contributorAddress: "0x2345678901234567890123456789012345678901",
    contributorGithub: "bob_engineer",
    platform: "github",
    type: "code_review",
    title: "review: 审查支付模块代码",
    description: "发现了 3 个潜在的安全漏洞并提供修复建议",
    amount: "0",
    aiScore: undefined,
    aiReason: undefined,
    timestamp: Date.now() - 86400000 * 2,
    settled: false,
  },
  {
    id: "demo_3",
    contributorAddress: "0x3456789012345678901234567890123456789012",
    contributorGithub: "charlie_ops",
    platform: "github",
    type: "commit",
    title: "fix: 修复数据库连接池泄漏",
    description: "解决了生产环境的连接池耗尽问题",
    amount: "2000000000000000000",
    aiScore: 75,
    aiReason: "重要的 bug 修复，但缺少测试用例",
    timestamp: Date.now() - 86400000,
    settled: true,
  },
  {
    id: "demo_4",
    contributorAddress: "0x1234567890123456789012345678901234567890",
    contributorGithub: "alice_dev",
    platform: "discord",
    type: "discord_help",
    title: "帮助新人解答技术问题",
    description: "在 Discord 帮助 5 位新人解决了环境配置问题",
    amount: "0",
    aiScore: undefined,
    aiReason: undefined,
    timestamp: Date.now() - 43200000,
    settled: false,
  },
  {
    id: "demo_5",
    contributorAddress: "0x4567890123456789012345678901234567890123",
    contributorGithub: "dave_design",
    platform: "github",
    type: "pull_request",
    title: "feat: 重新设计 Dashboard UI",
    description: "采用全新设计风格，提升用户体验",
    amount: "0",
    aiScore: undefined,
    aiReason: undefined,
    timestamp: Date.now() - 7200000,
    settled: false,
  },
];

const DEMO_RULES = [
  {
    id: "demo_rule_1",
    name: "标准贡献规则",
    description: "适用于大多数 DAO 的贡献评估",
    weights: [
      { type: "pull_request", weight: 8, description: "Pull Request - 代码贡献" },
      { type: "code_review", weight: 7, description: "Code Review - 代码审查" },
      { type: "commit", weight: 5, description: "Commit - 代码提交" },
      { type: "issue", weight: 4, description: "Issue - 问题反馈" },
      { type: "discord_message", weight: 2, description: "Discord 消息" },
      { type: "discord_help", weight: 6, description: "Discord 帮助" },
    ],
    baseReward: "1000000000000000000",
    maxRewardPerContributor: "100000000000000000000",
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000,
    active: true,
  },
];

const DEMO_SETTLEMENTS = [
  {
    id: "settle_demo_1",
    ruleId: "demo_rule_1",
    ruleHash: "rule_demo_rule_1_1717000000000",
    totalAmount: "2000000000000000000",
    contributorCount: 1,
    contributionIds: ["demo_3"],
    txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    status: "completed",
    executedAt: Date.now() - 86400000,
    executorAddress: "0x9876543210987654321098765432109876543210",
    createdAt: Date.now() - 86400000,
  },
];

// 演示钱包地址
const DEMO_WALLET = {
  address: "0x9876543210987654321098765432109876543210",
  balance: "10.5",
  chainId: 11155111, // Sepolia
};

interface DemoContextType {
  isDemoMode: boolean;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  demoWallet: typeof DEMO_WALLET;
  demoContributions: typeof DEMO_CONTRIBUTIONS;
  demoRules: typeof DEMO_RULES;
  demoSettlements: typeof DEMO_SETTLEMENTS;
  simulateAIAnalysis: (ids: string[]) => Promise<void>;
  simulateSettlement: (ids: string[]) => Promise<void>;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem("demoMode") === "true";
  });

  const [contributions, setContributions] = useState(DEMO_CONTRIBUTIONS);

  useEffect(() => {
    localStorage.setItem("demoMode", String(isDemoMode));
  }, [isDemoMode]);

  const enableDemoMode = () => {
    setIsDemoMode(true);
    setContributions(DEMO_CONTRIBUTIONS);
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
  };

  // AI 分析 - 调用后端 Mimo API
  const simulateAIAnalysis = async (ids: string[]) => {
    try {
      const res = await fetch("/api/contributions/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributionIds: ids }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          // 用真实 AI 结果更新贡献数据
          setContributions((prev) =>
            prev.map((c) => {
              const analyzed = data.data.find((a: any) => a.id === c.id);
              if (analyzed) {
                return {
                  ...c,
                  aiScore: analyzed.aiScore,
                  aiReason: analyzed.aiReason,
                  amount: analyzed.amount || c.amount,
                };
              }
              return c;
            })
          );
          return;
        }
      }
    } catch (error) {
      console.warn("AI API failed, using fallback:", error);
    }

    // 如果 API 失败，使用本地模拟
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const scores = [65, 72, 78, 85, 88, 92, 95];
    const reasons: Record<string, string[]> = {
      pull_request: [
        "高质量的代码实现，包含完整的测试用例",
        "功能完整，代码规范，对项目有重要贡献",
        "实现方案创新，显著提升了系统功能",
      ],
      code_review: [
        "详细的代码审查，发现了关键安全问题",
        "审查意见专业，帮助提升了代码质量",
        "发现了潜在的性能问题并提供优化建议",
      ],
      commit: [
        "重要的 bug 修复，解决了关键问题",
        "代码提交规范，commit message 清晰",
        "持续稳定的贡献，代码质量可靠",
      ],
      discord_help: [
        "积极帮助社区成员，提升了社区活跃度",
        "耐心解答新人问题，降低了社区入门门槛",
        "提供了有价值的技术指导",
      ],
      issue: [
        "提交了详细的问题报告，包含复现步骤",
        "发现了重要的功能缺陷",
        "问题描述清晰，有助于快速定位和修复",
      ],
    };

    setContributions((prev) =>
      prev.map((c) => {
        if (ids.includes(c.id)) {
          const typeReasons = reasons[c.type] || reasons["pull_request"];
          const score = scores[Math.floor(Math.random() * scores.length)];
          const reward = Math.floor(score * 5e16); // score * 0.05 ETH
          return {
            ...c,
            aiScore: score,
            aiReason: typeReasons[Math.floor(Math.random() * typeReasons.length)],
            amount: reward.toString(),
          };
        }
        return c;
      })
    );
  };

  // 模拟结算
  const simulateSettlement = async (ids: string[]) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setContributions((prev) =>
      prev.map((c) => (ids.includes(c.id) ? { ...c, settled: true } : c))
    );
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        enableDemoMode,
        disableDemoMode,
        demoWallet: DEMO_WALLET,
        demoContributions: contributions,
        demoRules: DEMO_RULES,
        demoSettlements: DEMO_SETTLEMENTS,
        simulateAIAnalysis,
        simulateSettlement,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemoMode must be used within DemoProvider");
  }
  return context;
}
