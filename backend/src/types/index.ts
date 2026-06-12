/**
 * DAO Contrib Agent - 类型定义
 */

// ========================================
// 贡献相关类型
// ========================================

/** 贡献来源平台 */
export type ContributionPlatform = "github" | "discord" | "forum";

/** 贡献类型 */
export type ContributionType =
  | "pull_request"
  | "code_review"
  | "commit"
  | "issue"
  | "discord_message"
  | "discord_help"
  | "forum_post"
  | "forum_reply";

/** 贡献记录 */
export interface Contribution {
  id: string;
  contributorAddress: string;
  contributorGithub?: string;
  contributorDiscord?: string;
  platform: ContributionPlatform;
  type: ContributionType;
  externalId: string;
  title: string;
  description?: string;
  url?: string;
  amount: string; // wei string
  aiScore?: number; // AI 评分 0-100
  aiReason?: string; // AI 评分理由
  timestamp: number;
  settled: boolean;
  settledAt?: number;
  txHash?: string;
}

/** 批量贡献记录请求 */
export interface RecordContributionsRequest {
  contributions: {
    contributorAddress: string;
    platform: ContributionPlatform;
    type: ContributionType;
    externalId: string;
    title: string;
    description?: string;
    url?: string;
  }[];
}

// ========================================
// 规则相关类型
// ========================================

/** 规则权重配置 */
export interface RuleWeight {
  type: ContributionType;
  weight: number; // 权重系数 1-10
  description: string;
}

/** 结算规则 */
export interface SettlementRule {
  id: string;
  name: string;
  description: string;
  weights: RuleWeight[];
  baseReward: string; // 基础奖励 (wei)
  maxRewardPerContributor: string; // 每人最大奖励
  createdAt: number;
  updatedAt: number;
  active: boolean;
}

/** 创建规则请求 */
export interface CreateRuleRequest {
  name: string;
  description: string;
  weights: RuleWeight[];
  baseReward: string;
  maxRewardPerContributor: string;
}

// ========================================
// 结算相关类型
// ========================================

/** 结算批次 */
export interface SettlementBatch {
  id: string;
  ruleId: string;
  ruleHash: string;
  totalAmount: string;
  contributorCount: number;
  contributionIds: string[];
  txHash?: string;
  status: "pending" | "executing" | "completed" | "failed";
  executedAt?: number;
  executorAddress: string;
  createdAt: number;
}

/** 执行结算请求 */
export interface ExecuteSettlementRequest {
  ruleId: string;
  contributionIds: string[];
}

// ========================================
// AI 相关类型
// ========================================

/** AI 分析结果 */
export interface AIAnalysisResult {
  score: number; // 0-100
  reason: string;
  suggestions?: string[];
}

/** AI 报告 */
export interface AIReport {
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

// ========================================
// API 响应类型
// ========================================

/** 标准 API 响应 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ========================================
// GitHub 相关类型
// ========================================

/** GitHub PR 数据 */
export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  merged_at: string | null;
  html_url: string;
  additions: number;
  deletions: number;
  changed_files: number;
}

/** GitHub Commit 数据 */
export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
  } | null;
  html_url: string;
}

/** GitHub Review 数据 */
export interface GitHubReview {
  id: number;
  user: {
    login: string;
  };
  state: string;
  submitted_at: string;
  html_url: string;
}

// ========================================
// Discord 相关类型
// ========================================

/** Discord 消息数据 */
export interface DiscordMessage {
  id: string;
  author: {
    id: string;
    username: string;
  };
  content: string;
  timestamp: string;
  channel_id: string;
}

// ========================================
// 区块链相关类型
// ========================================

/** 链上交易状态 */
export interface TxStatus {
  hash: string;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

/** 合约贡献数据 (链上) */
export interface OnchainContribution {
  id: number;
  contributor: string;
  amount: string;
  platform: string;
  contributionId: string;
  timestamp: number;
  settled: boolean;
}
