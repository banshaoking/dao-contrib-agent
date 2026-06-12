import { ethers } from "ethers";

/**
 * 格式化地址 (缩写)
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * 格式化 ETH/Token 金额
 */
export function formatAmount(amount: string | bigint, decimals = 18, displayDecimals = 4): string {
  try {
    const formatted = ethers.formatUnits(amount, decimals);
    const num = parseFloat(formatted);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    return num.toFixed(displayDecimals);
  } catch {
    return "0";
  }
}

/**
 * 格式化日期时间
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小时前`;
  if (minutes > 0) return `${minutes} 分钟前`;
  return "刚刚";
}

/**
 * 格式化交易哈希
 */
export function formatTxHash(hash: string): string {
  if (!hash) return "";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * 获取 Etherscan 链接
 */
export function getEtherscanLink(
  hash: string,
  type: "tx" | "address" | "block" = "tx",
  network = "sepolia"
): string {
  const baseUrl = network === "mainnet" ? "https://etherscan.io" : `https://${network}.etherscan.io`;
  return `${baseUrl}/${type}/${hash}`;
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * 贡献类型中文名称
 */
export const contributionTypeNames: Record<string, string> = {
  pull_request: "Pull Request",
  code_review: "Code Review",
  commit: "Commit",
  issue: "Issue",
  discord_message: "Discord 消息",
  discord_help: "Discord 帮助",
  forum_post: "论坛帖子",
  forum_reply: "论坛回复",
};

/**
 * 贡献平台中文名称
 */
export const platformNames: Record<string, string> = {
  github: "GitHub",
  discord: "Discord",
  forum: "论坛",
};

/**
 * 状态颜色映射
 */
export const statusColors: Record<string, string> = {
  pending: "badge-warning",
  executing: "badge-info",
  completed: "badge-success",
  failed: "badge-danger",
};

/**
 * 状态中文名称
 */
export const statusNames: Record<string, string> = {
  pending: "待处理",
  executing: "执行中",
  completed: "已完成",
  failed: "失败",
};
