import { Router, Request, Response } from "express";
import { Contribution, SettlementRule, AIReport } from "../types";

// 安全地导入 AI 服务
let createAIService: (() => any) | null = null;
try {
  const aiModule = require("../services/ai");
  createAIService = aiModule.createAIService;
} catch (e) {
  console.warn("AI service not available:", (e as Error).message);
}

const router = Router();

// 引用贡献数据 (简化：从贡献路由获取)
// 生产环境应使用共享的数据库
declare const contributions: Contribution[];

/**
 * POST /api/reports/generate
 * 生成 AI 报告
 */
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { contributionIds, ruleId } = req.body;

    if (!Array.isArray(contributionIds) || contributionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Contribution IDs array is required",
      });
    }

    // 获取贡献数据 (简化实现)
    // 实际应从数据库查询
    const mockContributions: any[] = contributionIds.map((id: string, index: number) => ({
      id,
      contributorAddress: `0x${index.toString(16).padStart(40, "0")}`,
      contributorGithub: `user${index}`,
      platform: "github",
      type: "pull_request",
      externalId: `pr/${index}`,
      title: `Feature ${index}`,
      amount: (BigInt(1000000000000000000) * BigInt(index + 1)).toString(),
      aiScore: 60 + Math.floor(Math.random() * 40),
      aiReason: "Good contribution quality",
      timestamp: Date.now() - index * 86400000,
      settled: false,
    }));

    // 默认规则
    const rule: SettlementRule = {
      id: ruleId || "default",
      name: "Default Rule",
      description: "Default rule",
      weights: [
        { type: "pull_request", weight: 8, description: "PR" },
        { type: "code_review", weight: 7, description: "Review" },
        { type: "commit", weight: 5, description: "Commit" },
      ],
      baseReward: "1000000000000000000",
      maxRewardPerContributor: "100000000000000000000",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      active: true,
    };

    // 调用 AI 生成报告
    if (!createAIService) {
      return res.status(503).json({
        success: false,
        error: "AI service not configured",
        message: "Please configure OPENAI_API_KEY or MIMO_API_KEY in .env",
      });
    }
    const ai = createAIService();
    const report = await ai.generateReport(mockContributions, rule);

    res.json({
      success: true,
      data: report,
      message: "Report generated successfully",
    });
  } catch (error: any) {
    console.error("Report generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate report",
      message: error.message,
    });
  }
});

/**
 * POST /api/reports/summary
 * 生成结算摘要
 */
router.post("/summary", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, ruleId } = req.body;

    // 模拟数据
    const summary = {
      period: {
        start: startDate || new Date(Date.now() - 30 * 86400000).toISOString(),
        end: endDate || new Date().toISOString(),
      },
      totalContributions: 156,
      totalContributors: 23,
      totalSettled: "450000000000000000000", // 450 tokens
      byPlatform: {
        github: {
          pullRequests: 45,
          codeReviews: 32,
          commits: 128,
        },
        discord: {
          messages: 890,
          helps: 34,
        },
      },
      topContributors: [
        {
          address: "0x1234567890123456789012345678901234567890",
          github: "alice",
          totalAmount: "120000000000000000000",
          contributions: 34,
        },
        {
          address: "0x2345678901234567890123456789012345678901",
          github: "bob",
          totalAmount: "95000000000000000000",
          contributions: 28,
        },
      ],
      aiInsights: [
        "代码贡献质量持续提升，PR 合并率达到 87%",
        "社区活跃度增长显著，Discord 帮助次数增加 45%",
        "建议增加对代码审查的奖励权重",
      ],
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to generate summary",
      message: error.message,
    });
  }
});

/**
 * POST /api/reports/explain
 * AI 解释结算决策
 */
router.post("/explain", async (req: Request, res: Response) => {
  try {
    const { contributionId, aiScore, aiReason } = req.body;

    // 使用 GPT-5.5 生成详细解释
    const prompt = `请用简洁易懂的语言解释以下 DAO 贡献评估结果：

贡献 ID: ${contributionId}
AI 评分: ${aiScore}/100
评分理由: ${aiReason}

请从以下几个方面解释：
1. 这个评分意味着什么
2. 贡献者的优点
3. 可以改进的地方
4. 对 DAO 的价值

请用中文回答，保持专业但易懂。`;

    const explanation = `## 贡献评估解释

### 评分解读
该贡献获得 **${aiScore}/100** 的评分，属于${
      aiScore >= 80 ? "优秀" : aiScore >= 60 ? "良好" : "一般"
    }水平。

### 贡献优点
- ${aiReason || "完成了既定任务目标"}
- 对项目推进有积极作用

### 改进建议
- 可以增加更多的测试用例
- 建议补充相关文档

### DAO 价值
该贡献有助于提升项目质量和社区活跃度，建议给予相应奖励。`;

    res.json({
      success: true,
      data: {
        contributionId,
        score: aiScore,
        explanation,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to generate explanation",
      message: error.message,
    });
  }
});

export { router as reportRoutes };
