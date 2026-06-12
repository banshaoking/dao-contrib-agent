import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

// ========================================
// Rate Limiting
// ========================================

/**
 * 全局 API 限流 - 每 15 分钟最多 100 次请求
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests",
    message: "Please try again later",
  },
});

/**
 * 认证相关限流 - 每 15 分钟最多 10 次
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many auth attempts",
    message: "Please try again later",
  },
});

/**
 * 结算操作限流 - 每小时最多 5 次
 */
export const settlementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many settlement requests",
    message: "Settlement rate limit exceeded",
  },
});

/**
 * AI 分析限流 - 每 10 分钟最多 20 次
 */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many analysis requests",
    message: "AI analysis rate limit exceeded",
  },
});

// ========================================
// Input Validation Schemas (Zod)
// ========================================

/** 以太坊地址格式 */
const ethAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

/** GitHub 用户名格式 */
const githubUsername = z
  .string()
  .min(1)
  .max(39)
  .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/, "Invalid GitHub username");

/** 仓库名格式 */
const repoName = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9._-]+$/, "Invalid repository name");

/** 贡献类型枚举 */
const contributionType = z.enum([
  "pull_request",
  "code_review",
  "commit",
  "issue",
  "discord_message",
  "discord_help",
  "forum_post",
  "forum_reply",
]);

/** 平台枚举 */
const platform = z.enum(["github", "discord", "forum", "telegram", "twitter"]);

/**
 * GitHub 采集请求验证
 */
export const githubFetchSchema = z.object({
  owner: githubUsername,
  repo: repoName,
  username: githubUsername,
  address: ethAddress,
  since: z.string().datetime().optional(),
});

/**
 * 手动添加贡献请求验证
 */
export const manualContributionSchema = z.object({
  contributions: z
    .array(
      z.object({
        contributorAddress: ethAddress,
        contributorGithub: githubUsername.optional(),
        contributorDiscord: z.string().max(100).optional(),
        platform,
        type: contributionType,
        externalId: z.string().max(200).optional(),
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional(),
        url: z.string().url().max(2000).optional(),
        amount: z.string().regex(/^\d+$/, "Invalid amount").optional(),
        timestamp: z.number().positive().optional(),
      })
    )
    .min(1)
    .max(100),
});

/**
 * AI 分析请求验证
 */
export const analyzeSchema = z.object({
  contributionIds: z.array(z.string().min(1).max(50)).min(1).max(50),
  ruleId: z.string().max(50).optional(),
});

/**
 * 结算执行请求验证
 */
export const settlementSchema = z.object({
  ruleId: z.string().min(1).max(50),
  contributionIds: z.array(z.string().min(1).max(50)).min(1).max(100),
});

/**
 * 规则创建请求验证
 */
export const ruleCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  weights: z
    .array(
      z.object({
        type: contributionType,
        weight: z.number().min(0).max(100),
        description: z.string().max(200),
      })
    )
    .min(1)
    .max(20),
  baseReward: z.string().regex(/^\d+$/, "Invalid amount"),
  maxRewardPerContributor: z.string().regex(/^\d+$/, "Invalid amount"),
});

// ========================================
// Validation Middleware Factory
// ========================================

/**
 * 创建请求体验证中间件
 */
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: result.error.errors[0].message,
        details: result.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}

/**
 * 创建查询参数验证中间件
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Query validation failed",
        message: result.error.errors[0].message,
      });
    }
    req.query = result.data;
    next();
  };
}

// ========================================
// Security Headers Middleware
// ========================================

/**
 * 自定义安全头
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // 防止点击劫持
  res.setHeader("X-Frame-Options", "DENY");
  // 防止 MIME 类型嗅探
  res.setHeader("X-Content-Type-Options", "nosniff");
  // XSS 保护
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // 严格传输安全
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // 内容安全策略
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.infura.io https://sepolia.infura.io"
  );
  // 引用策略
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // 权限策略
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  next();
}

// ========================================
// Request Sanitization
// ========================================

/**
 * 清理请求体中的潜在危险字符
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      // 移除潜在的 XSS 字符
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
}

// ========================================
// API Key Validation (for internal services)
// ========================================

/**
 * 验证内部 API Key
 */
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string;
  const validApiKey = process.env.INTERNAL_API_KEY;

  // 如果没有配置 API Key，跳过验证（开发模式）
  if (!validApiKey) {
    return next();
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Invalid or missing API key",
    });
  }

  next();
}

// ========================================
// Request Logging (Security Audit)
// ========================================

/**
 * 安全审计日志
 */
export function auditLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, url, ip } = req;

  // 记录敏感操作
  const sensitivePaths = ["/api/settlements", "/api/contributions/analyze", "/api/rules"];
  const isSensitive = sensitivePaths.some((path) => url.startsWith(path));

  if (isSensitive) {
    console.log(`[AUDIT] ${new Date().toISOString()} | ${method} ${url} | IP: ${ip} | Body: ${JSON.stringify(req.body).slice(0, 200)}`);
  }

  // 响应完成后记录
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (isSensitive) {
      console.log(`[AUDIT] ${new Date().toISOString()} | ${method} ${url} | Status: ${res.statusCode} | Duration: ${duration}ms`);
    }
  });

  next();
}
