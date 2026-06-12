import { z } from "zod";

/**
 * 环境变量验证
 *
 * 在应用启动时验证必需的环境变量
 * 防止因配置缺失导致的运行时错误
 */

const envSchema = z.object({
  // 服务器配置
  PORT: z.string().default("3001").transform(Number),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  // AI API Keys (至少需要一个)
  OPENAI_API_KEY: z.string().min(1).optional(),
  MIMO_API_KEY: z.string().min(1).optional(),

  // GitHub Token (可选)
  GITHUB_TOKEN: z.string().optional(),

  // 区块链配置 (可选，但结算功能需要)
  RPC_URL: z.string().url().optional(),
  PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid private key format").optional(),
  CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address").optional(),
  PAYMENT_TOKEN_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address").optional(),

  // 安全配置
  INTERNAL_API_KEY: z.string().min(8).optional(),
  JWT_SECRET: z.string().min(16).optional(),

  // 速率限制配置
  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform(Number),
}).refine(
  (data) => data.OPENAI_API_KEY || data.MIMO_API_KEY,
  {
    message: "At least one AI API key (OPENAI_API_KEY or MIMO_API_KEY) is required",
    path: ["OPENAI_API_KEY"],
  }
);

export type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig | null = null;

/**
 * 验证并返回环境变量配置
 * 首次调用时验证，之后返回缓存结果
 */
export function getValidatedEnv(): EnvConfig {
  if (validatedEnv) {
    return validatedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Environment validation failed:");
    console.error(result.error.format());

    // 在开发模式下显示更详细的错误
    if (process.env.NODE_ENV !== "production") {
      console.error("\nMissing or invalid environment variables:");
      result.error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      console.error("\nPlease check your .env file.");
    }

    // 使用默认值继续（开发模式）
    validatedEnv = {
      PORT: 3001,
      NODE_ENV: "development",
      FRONTEND_URL: "http://localhost:5173",
      RATE_LIMIT_WINDOW_MS: 900000,
      RATE_LIMIT_MAX_REQUESTS: 100,
    } as EnvConfig;

    return validatedEnv;
  }

  validatedEnv = result.data;
  console.log("✅ Environment validation passed");
  return validatedEnv;
}

/**
 * 检查特定功能是否可用
 */
export function checkFeatureAvailability() {
  const env = getValidatedEnv();

  return {
    ai: !!env.OPENAI_API_KEY || !!env.MIMO_API_KEY,
    github: !!env.GITHUB_TOKEN,
    blockchain: !!env.RPC_URL && !!env.PRIVATE_KEY && !!env.CONTRACT_ADDRESS,
    security: !!env.INTERNAL_API_KEY,
  };
}

/**
 * 启动时打印功能状态
 */
export function printFeatureStatus() {
  const status = checkFeatureAvailability();

  console.log("\n📦 Feature Status:");
  console.log(`  AI Analysis:    ${status.ai ? "✅ Available" : "❌ Not configured"}`);
  console.log(`  GitHub Fetch:   ${status.github ? "✅ Available" : "❌ Not configured"}`);
  console.log(`  Blockchain:     ${status.blockchain ? "✅ Available" : "❌ Not configured"}`);
  console.log(`  API Security:   ${status.security ? "✅ Enabled" : "⚠️  Disabled (dev mode)"}`);
  console.log("");
}
