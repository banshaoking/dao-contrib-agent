import { ethers } from "ethers";
import { Request, Response, NextFunction } from "express";

/**
 * 钱包签名验证服务
 *
 * 用于验证用户是否拥有指定的以太坊地址
 * 流程：
 * 1. 前端使用 MetaMask 签名一条消息
 * 2. 后端验证签名是否由指定地址签署
 * 3. 验证通过后允许操作
 */

// 签名消息模板
const SIGN_MESSAGE_TEMPLATE = (nonce: string, timestamp: number) =>
  `DAO Contrib Agent Authentication\n\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nSign this message to verify your wallet ownership.`;

// 签名有效期（毫秒）
const SIGNATURE_MAX_AGE = 5 * 60 * 1000; // 5 分钟

// 已使用的 nonce 缓存（防止重放攻击）
const usedNonces = new Map<string, number>();

// 定期清理过期 nonce
setInterval(() => {
  const now = Date.now();
  for (const [nonce, timestamp] of usedNonces.entries()) {
    if (now - timestamp > SIGNATURE_MAX_AGE * 2) {
      usedNonces.delete(nonce);
    }
  }
}, 60 * 1000); // 每分钟清理一次

/**
 * 生成签名挑战
 */
export function generateChallenge(address: string): {
  message: string;
  nonce: string;
  timestamp: number;
} {
  const nonce = ethers.hexlify(ethers.randomBytes(16));
  const timestamp = Date.now();
  const message = SIGN_MESSAGE_TEMPLATE(nonce, timestamp);

  return { message, nonce, timestamp };
}

/**
 * 验证签名
 */
export function verifySignature(
  address: string,
  message: string,
  signature: string,
  nonce: string,
  timestamp: number
): { valid: boolean; error?: string } {
  try {
    // 1. 检查时间戳是否在有效期内
    const now = Date.now();
    if (now - timestamp > SIGNATURE_MAX_AGE) {
      return { valid: false, error: "Signature expired" };
    }

    // 2. 检查 nonce 是否已使用（防重放）
    if (usedNonces.has(nonce)) {
      return { valid: false, error: "Nonce already used" };
    }

    // 3. 验证签名
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // 4. 检查恢复的地址是否匹配
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return { valid: false, error: "Signature mismatch" };
    }

    // 5. 标记 nonce 为已使用
    usedNonces.set(nonce, now);

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid signature format" };
  }
}

/**
 * Express 中间件：验证钱包签名
 *
 * 请求头需要包含：
 * - x-wallet-address: 钱包地址
 * - x-wallet-signature: 签名
 * - x-wallet-message: 签名的消息
 * - x-wallet-nonce: nonce
 * - x-wallet-timestamp: 时间戳
 */
export function requireWalletSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const address = req.headers["x-wallet-address"] as string;
  const signature = req.headers["x-wallet-signature"] as string;
  const message = req.headers["x-wallet-message"] as string;
  const nonce = req.headers["x-wallet-nonce"] as string;
  const timestampStr = req.headers["x-wallet-timestamp"] as string;

  // 检查必需的头部
  if (!address || !signature || !message || !nonce || !timestampStr) {
    return res.status(401).json({
      success: false,
      error: "Missing wallet authentication headers",
      message: "Please provide wallet signature for authentication",
    });
  }

  // 验证地址格式
  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: "Invalid wallet address",
    });
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return res.status(400).json({
      success: false,
      error: "Invalid timestamp",
    });
  }

  // 验证签名
  const result = verifySignature(address, message, signature, nonce, timestamp);

  if (!result.valid) {
    return res.status(401).json({
      success: false,
      error: "Signature verification failed",
      message: result.error,
    });
  }

  // 将验证后的地址添加到请求对象
  (req as any).verifiedAddress = address.toLowerCase();

  next();
}

/**
 * Express 中间件：可选的签名验证
 *
 * 如果提供了签名则验证，否则跳过
 */
export function optionalWalletSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const address = req.headers["x-wallet-address"] as string;
  const signature = req.headers["x-wallet-signature"] as string;

  // 如果没有提供签名，跳过验证
  if (!address || !signature) {
    return next();
  }

  // 如果提供了部分认证信息，要求完整的
  const message = req.headers["x-wallet-message"] as string;
  const nonce = req.headers["x-wallet-nonce"] as string;
  const timestampStr = req.headers["x-wallet-timestamp"] as string;

  if (!message || !nonce || !timestampStr) {
    return res.status(400).json({
      success: false,
      error: "Incomplete wallet authentication headers",
    });
  }

  // 执行完整验证
  return requireWalletSignature(req, res, next);
}

/**
 * 获取签名挑战的路由处理器
 */
export function challengeHandler(req: Request, res: Response) {
  const { address } = req.query;

  if (!address || typeof address !== "string") {
    return res.status(400).json({
      success: false,
      error: "Address parameter is required",
    });
  }

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: "Invalid Ethereum address",
    });
  }

  const challenge = generateChallenge(address);

  res.json({
    success: true,
    data: challenge,
  });
}
