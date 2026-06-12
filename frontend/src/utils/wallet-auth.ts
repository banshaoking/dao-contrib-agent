import { ethers } from "ethers";

/**
 * 钱包签名认证工具
 *
 * 用于前端与后端的签名验证交互
 */

const API_BASE = "/api";

interface ChallengeResponse {
  success: boolean;
  data?: {
    message: string;
    nonce: string;
    timestamp: number;
  };
  error?: string;
}

/**
 * 获取签名挑战
 */
async function getChallenge(address: string): Promise<{
  message: string;
  nonce: string;
  timestamp: number;
}> {
  const res = await fetch(
    `${API_BASE}/auth/challenge?address=${encodeURIComponent(address)}`
  );
  const data: ChallengeResponse = await res.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || "Failed to get challenge");
  }

  return data.data;
}

/**
 * 使用钱包签名认证
 *
 * @param signer - ethers JsonRpcSigner
 * @returns 认证头信息
 */
export async function authenticateWithWallet(
  signer: ethers.JsonRpcSigner
): Promise<Record<string, string>> {
  const address = await signer.getAddress();

  // 1. 获取签名挑战
  const challenge = await getChallenge(address);

  // 2. 请求用户签名
  const signature = await signer.signMessage(challenge.message);

  // 3. 返回认证头
  return {
    "x-wallet-address": address,
    "x-wallet-signature": signature,
    "x-wallet-message": challenge.message,
    "x-wallet-nonce": challenge.nonce,
    "x-wallet-timestamp": challenge.timestamp.toString(),
  };
}

/**
 * 带签名的 API 请求
 *
 * @param signer - ethers JsonRpcSigner (可选，无则跳过签名)
 * @param endpoint - API 端点
 * @param options - fetch 选项
 */
export async function fetchWithWalletAuth(
  signer: ethers.JsonRpcSigner | null,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // 如果有签名者，添加签名认证头
  if (signer) {
    try {
      const authHeaders = await authenticateWithWallet(signer);
      Object.assign(headers, authHeaders);
    } catch (error) {
      console.error("Wallet authentication failed:", error);
      throw new Error("Please sign the message in your wallet to continue");
    }
  }

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
}

/**
 * 检查签名是否过期
 */
export function isSignatureExpired(timestamp: number, maxAgeMs = 5 * 60 * 1000): boolean {
  return Date.now() - timestamp > maxAgeMs;
}

/**
 * 缓存签名认证
 *
 * 避免频繁请求用户签名
 */
class AuthCache {
  private cache: Map<
    string,
    {
      headers: Record<string, string>;
      timestamp: number;
    }
  > = new Map();

  private maxAge: number;

  constructor(maxAgeMs = 4 * 60 * 1000) {
    // 默认 4 分钟（签名有效期 5 分钟）
    this.maxAge = maxAgeMs;
  }

  async getAuth(
    signer: ethers.JsonRpcSigner
  ): Promise<Record<string, string>> {
    const address = await signer.getAddress();
    const cached = this.cache.get(address);

    // 检查缓存是否有效
    if (cached && !isSignatureExpired(cached.timestamp, this.maxAge)) {
      return cached.headers;
    }

    // 重新认证
    const headers = await authenticateWithWallet(signer);
    this.cache.set(address, {
      headers,
      timestamp: Date.now(),
    });

    return headers;
  }

  clear(address?: string) {
    if (address) {
      this.cache.delete(address);
    } else {
      this.cache.clear();
    }
  }
}

// 全局认证缓存实例
export const authCache = new AuthCache();

/**
 * 带缓存的签名 API 请求
 */
export async function fetchWithCachedAuth(
  signer: ethers.JsonRpcSigner | null,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (signer) {
    try {
      const authHeaders = await authCache.getAuth(signer);
      Object.assign(headers, authHeaders);
    } catch (error) {
      console.error("Wallet authentication failed:", error);
      throw new Error("Please sign the message in your wallet to continue");
    }
  }

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
}
