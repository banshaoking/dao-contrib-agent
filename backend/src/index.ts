import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { contributionRoutes } from "./routes/contributions";
import { ruleRoutes } from "./routes/rules";
import { settlementRoutes } from "./routes/settlements";
import { reportRoutes } from "./routes/reports";
import { healthRoutes } from "./routes/health";
import { coboRoutes } from "./routes/cobo";

// 安全中间件
import {
  globalLimiter,
  authLimiter,
  settlementLimiter,
  aiLimiter,
  securityHeaders,
  sanitizeInput,
  auditLogger,
  validateBody,
  validateApiKey,
  githubFetchSchema,
  analyzeSchema,
  settlementSchema,
} from "./middleware/security";

import { getValidatedEnv, printFeatureStatus } from "./middleware/env-validation";
import { challengeHandler, requireWalletSignature } from "./services/wallet-verify";

dotenv.config();

// 验证环境变量
const env = getValidatedEnv();

const app = express();
const PORT = env.PORT;

// ========================================
// 基础安全中间件
// ========================================

// Helmet - HTTP 安全头
app.use(helmet());

// 自定义安全头
app.use(securityHeaders);

// CORS - 跨域配置
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);

// 请求体大小限制
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 输入清理
app.use(sanitizeInput);

// 全局限流
app.use(globalLimiter);

// 审计日志
app.use(auditLogger);

// HTTP 请求日志
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// ========================================
// 认证路由（无签名验证）
// ========================================

/**
 * 获取钱包签名挑战
 * GET /api/auth/challenge?address=0x...
 */
app.get("/api/auth/challenge", authLimiter, challengeHandler);

// 健康检查（无需认证）
app.use("/api/health", healthRoutes);

// ========================================
// 受保护的路由
// ========================================

// 贡献管理 - 需要钱包签名验证
app.use(
  "/api/contributions",
  requireWalletSignature,
  contributionRoutes
);

// 规则管理 - 需要钱包签名验证
app.use(
  "/api/rules",
  requireWalletSignature,
  ruleRoutes
);

// 结算管理 - 需要钱包签名 + 结算限流
app.use(
  "/api/settlements",
  requireWalletSignature,
  settlementLimiter,
  settlementRoutes
);

// 报告生成 - 需要钱包签名 + AI 限流
app.use(
  "/api/reports",
  requireWalletSignature,
  aiLimiter,
  reportRoutes
);

// Cobo 路由 - 需要 API Key
app.use("/api/cobo", validateApiKey, coboRoutes);

// ========================================
// 错误处理
// ========================================

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// 全局错误处理
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);

    // 不泄露内部错误细节到生产环境
    const isDev = env.NODE_ENV === "development";

    res.status(err.status || 500).json({
      success: false,
      error: isDev ? err.name : "Internal Server Error",
      message: isDev ? err.message : "Something went wrong",
      ...(isDev && { stack: err.stack }),
    });
  }
);

// ========================================
// 启动服务器
// ========================================

app.listen(PORT, () => {
  console.log(`\n🚀 DAO Contrib Agent Backend`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Frontend: ${env.FRONTEND_URL}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);

  printFeatureStatus();
});

export default app;
