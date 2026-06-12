import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "zh" | "en";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof zh;
}

const zh = {
  // Landing
  navBrand: "DAO 贡献代理",
  signIn: "登录",
  getStarted: "开始使用",
  heroTag: "AI × Web3 · 自动化贡献代理",
  heroTitle1: "奖励每一份贡献。",
  heroTitle2: "自动完成。",
  heroDesc: "连接 GitHub 和 Discord，让 AI 评估贡献价值并公平分配奖励。无需人工统计，没有争议。",
  connectWorkspace: "连接工作区",
  viewDemo: "查看演示",
  dataCollection: "多平台数据采集",
  dataCollectionDesc: "自动从 DAO 使用的每个平台采集贡献数据。",
  aiScoring: "透明评分",
  aiScoringDesc: "每个评分都有清晰的解释。贡献者可以确切看到评分依据。",
  explainScore: "查看评分依据 →",
  prMerged: "已合并",
  leaderboard: "贡献排行榜",
  leaderboardDesc: "基于 AI 评估的贡献影响力实时排名。",
  rank: "排名",
  contributor: "贡献者",
  score: "评分",
  reward: "奖励",
  settlement: "链上结算",
  settlementDesc: "一键批量发放。每笔交易都可在链上验证。",
  contributors: "贡献者",
  allCollected: "已采集完成",
  aiAllocation: "AI 分配",
  scoreBased: "基于评分分配",
  multiSend: "批量发送",
  batchTx: "批量交易",
  multiChain: "多链支持",
  completed: "已完成",
  txVerified: "交易已验证",
  ctaTitle: "开始奖励贡献",
  ctaDesc: "2 分钟内连接你的工作区。",
  footer: "© 2026",
  hackathon: "黑客松",
  github: "GitHub",

  // Dashboard
  overview: "概览",
  overviewDesc: "DAO 贡献结算系统概览",
  demoMode: "演示模式 — 使用模拟数据",
  totalContributors: "贡献者总数",
  pendingRewards: "待发放奖励",
  aiReviews: "AI 审核数",
  completedPayouts: "已完成结算",
  treasuryBalance: "金库余额",
  totalDistributed: "已发放总额",
  recentActivity: "最近活动",
  noActivity: "暂无活动记录",
  settled: "已结算",
  pending: "待处理",

  // Contributors
  contributorsTitle: "贡献者",
  activeContributors: "位活跃贡献者",
  rank_col: "排名",
  contributor_col: "贡献者",
  score_col: "评分",
  contributions_col: "贡献数",
  reward_col: "奖励",
  lastActive: "最后活跃",
  totalReward: "总奖励",
  contributionHistory: "贡献记录",
  close: "关闭",

  // AI Analysis
  aiAnalysis: "AI 分析",
  aiAnalysisDesc: "基于 AI 的可解释贡献评分",
  runAnalysis: "运行分析",
  analyzing: "分析中...",
  contributionsList: "贡献列表",
  scoreBreakdown: "评分细分",
  aiExplanation: "AI 解释",
  linkedEvidence: "关联证据",
  calculatedReward: "计算奖励",
  notAnalyzed: "该贡献尚未被分析。",
  selectContribution: "选择一个贡献查看 AI 分析",
  codeImpact: "代码影响",
  reviewQuality: "审查质量",
  communityHelp: "社区帮助",
  consistency: "持续性",

  // Rewards
  rewardsTitle: "奖励",
  rewardsDesc: "链上批量结算",
  settleContributions: "结算 {count} 项贡献",
  settling: "结算中...",
  pendingCount: "待处理",
  settledCount: "已结算",
  transactions: "交易",
  onChain: "链上",
  settlementPipeline: "结算流程",
  pendingSettlement: "待结算",
  txHistory: "交易历史",
  txHash: "交易哈希",
  amount: "金额",
  status: "状态",
  noTx: "暂无交易记录",
  network: "网络",
  wallet: "钱包",
  contract: "合约",
  notDeployed: "未部署",
  paymentToken: "支付代币",

  // Treasury
  treasury: "金库",
  treasuryDesc: "资金管理与发放概览",
  walletBalance: "钱包余额",
  totalDistributedLabel: "已发放总额",
  contractInfo: "合约信息",

  // Settings
  settings: "设置",
  settingsDesc: "配置集成与偏好",
  integrations: "集成",
  githubToken: "GitHub Token",
  githubTokenDesc: "用于 GitHub 数据采集",
  discordToken: "Discord Bot Token",
  discordTokenDesc: "用于 Discord 活动追踪",
  aiConfig: "AI 配置",
  connected: "已连接",
  notConfigured: "未配置",
  blockchain: "区块链",

  // Sidebar
  demoModeActive: "演示模式已开启",
  enableDemo: "开启演示模式",
  disconnect: "断开",
  connectWallet: "连接钱包",
  connecting: "连接中...",

  // Common
  on: "开",
  off: "关",
};

const en = {
  navBrand: "DAO Contrib Agent",
  signIn: "Sign In",
  getStarted: "Get Started",
  heroTag: "AI × Web3 · Autonomous Contribution Agent",
  heroTitle1: "Reward Every Contribution.",
  heroTitle2: "Automatically.",
  heroDesc: "Connect GitHub and Discord. Let AI evaluate impact and distribute rewards fairly. No manual tracking. No disputes.",
  connectWorkspace: "Connect Workspace",
  viewDemo: "View Demo",
  dataCollection: "Multi-Platform Data Collection",
  dataCollectionDesc: "Automatically collect contributions from every platform your DAO uses.",
  aiScoring: "Transparent Scoring",
  aiScoringDesc: "Every score comes with a clear explanation. Contributors can see exactly why they received their rating.",
  explainScore: "Explain Score →",
  prMerged: "Merged",
  leaderboard: "Contribution Leaderboard",
  leaderboardDesc: "Real-time rankings based on AI-evaluated contribution impact.",
  rank: "Rank",
  contributor: "Contributor",
  score: "Score",
  reward: "Reward",
  settlement: "On-Chain Settlement",
  settlementDesc: "One-click batch payout. Every transaction is verifiable on-chain.",
  contributors: "Contributors",
  allCollected: "All collected",
  aiAllocation: "AI Allocation",
  scoreBased: "Score-based",
  multiSend: "Multi-Send",
  batchTx: "Batch tx",
  multiChain: "Multi-chain",
  completed: "Completed",
  txVerified: "Tx verified",
  ctaTitle: "Start Rewarding Contributions",
  ctaDesc: "Connect your workspace in under 2 minutes.",
  footer: "© 2026",
  hackathon: "Hackathon",
  github: "GitHub",

  overview: "Overview",
  overviewDesc: "DAO contribution settlement dashboard",
  demoMode: "Demo mode — using simulated data",
  totalContributors: "Total Contributors",
  pendingRewards: "Pending Rewards",
  aiReviews: "AI Reviews",
  completedPayouts: "Completed Payouts",
  treasuryBalance: "Treasury Balance",
  totalDistributed: "Total distributed",
  recentActivity: "Recent Activity",
  noActivity: "No recent activity",
  settled: "Settled",
  pending: "Pending",

  contributorsTitle: "Contributors",
  activeContributors: "active contributors",
  rank_col: "Rank",
  contributor_col: "Contributor",
  score_col: "Score",
  contributions_col: "Contributions",
  reward_col: "Reward",
  lastActive: "Last Active",
  totalReward: "Total Reward",
  contributionHistory: "Contribution History",
  close: "Close",

  aiAnalysis: "AI Analysis",
  aiAnalysisDesc: "Explainable contribution scoring powered by AI",
  runAnalysis: "Run Analysis",
  analyzing: "Analyzing...",
  contributionsList: "Contributions",
  scoreBreakdown: "Score Breakdown",
  aiExplanation: "AI Explanation",
  linkedEvidence: "Linked Evidence",
  calculatedReward: "Calculated Reward",
  notAnalyzed: "This contribution hasn't been analyzed yet.",
  selectContribution: "Select a contribution to view AI analysis",
  codeImpact: "Code Impact",
  reviewQuality: "Review Quality",
  communityHelp: "Community Help",
  consistency: "Consistency",

  rewardsTitle: "Rewards",
  rewardsDesc: "On-chain batch settlement",
  settleContributions: "Settle {count} Contributions",
  settling: "Settling...",
  pendingCount: "Pending",
  settledCount: "Settled",
  transactions: "Transactions",
  onChain: "On-chain",
  settlementPipeline: "Settlement Pipeline",
  pendingSettlement: "Pending Settlement",
  txHistory: "Transaction History",
  txHash: "Tx Hash",
  amount: "Amount",
  status: "Status",
  noTx: "No transactions yet",
  network: "Network",
  wallet: "Wallet",
  contract: "Contract",
  notDeployed: "Not deployed",
  paymentToken: "Payment Token",

  treasury: "Treasury",
  treasuryDesc: "Fund management and distribution overview",
  walletBalance: "Wallet Balance",
  totalDistributedLabel: "Total Distributed",
  contractInfo: "Contract Info",

  settings: "Settings",
  settingsDesc: "Configure integrations and preferences",
  integrations: "Integrations",
  githubToken: "GitHub Token",
  githubTokenDesc: "Used for GitHub data collection",
  discordToken: "Discord Bot Token",
  discordTokenDesc: "Used for Discord activity tracking",
  aiConfig: "AI Configuration",
  connected: "Connected",
  notConfigured: "Not Configured",
  blockchain: "Blockchain",

  demoModeActive: "Demo Mode Active",
  enableDemo: "Enable Demo Mode",
  disconnect: "Disconnect",
  connectWallet: "Connect Wallet",
  connecting: "Connecting...",

  on: "On",
  off: "Off",
};

const translations = { zh, en };

const LangContext = createContext<LangContextType>({
  lang: "zh",
  setLang: () => {},
  t: zh,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem("lang") as Lang) || "zh";
  });

  const handleSetLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("lang", l);
  };

  return (
    <LangContext.Provider
      value={{ lang, setLang: handleSetLang, t: translations[lang] }}
    >
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
