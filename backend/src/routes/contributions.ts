import { Router, Request, Response } from "express";
import { Contribution, ApiResponse } from "../types";

// 安全地导入服务
let createGitHubService: (() => any) | null = null;
let createAIService: (() => any) | null = null;

try {
  const githubModule = require("../services/github");
  createGitHubService = githubModule.createGitHubService;
} catch (e) {
  console.warn("GitHub service not available:", (e as Error).message);
}

try {
  const aiModule = require("../services/ai");
  createAIService = aiModule.createAIService;
} catch (e) {
  console.warn("AI service not available:", (e as Error).message);
}

const router = Router();

// 内存存储 (生产环境应使用数据库)
let contributions: Contribution[] = [];
let idCounter = 0;

/**
 * GET /api/contributions
 * 获取所有贡献列表
 */
router.get("/", (req: Request, res: Response) => {
  const { platform, type, contributor, settled, page = "1", pageSize = "20" } = req.query;

  let filtered = [...contributions];

  // 过滤
  if (platform) filtered = filtered.filter((c) => c.platform === platform);
  if (type) filtered = filtered.filter((c) => c.type === type);
  if (contributor) filtered = filtered.filter((c) => c.contributorAddress === contributor);
  if (settled !== undefined) filtered = filtered.filter((c) => c.settled === (settled === "true"));

  // 分页
  const pageNum = parseInt(page as string);
  const size = parseInt(pageSize as string);
  const start = (pageNum - 1) * size;
  const end = start + size;

  const response: ApiResponse = {
    success: true,
    data: {
      items: filtered.slice(start, end),
      total: filtered.length,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(filtered.length / size),
    },
  };

  res.json(response);
});

/**
 * GET /api/contributions/:id
 * 获取单个贡献详情
 */
router.get("/:id", (req: Request, res: Response) => {
  const contrib = contributions.find((c) => c.id === req.params.id);

  if (!contrib) {
    return res.status(404).json({
      success: false,
      error: "Contribution not found",
    });
  }

  res.json({
    success: true,
    data: contrib,
  });
});

/**
 * POST /api/contributions/github
 * 从 GitHub 采集贡献数据
 */
router.post("/github", async (req: Request, res: Response) => {
  try {
    const { owner, repo, username, address, since } = req.body;

    if (!owner || !repo || !username || !address) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: owner, repo, username, address",
      });
    }

    if (!createGitHubService) {
      return res.status(503).json({
        success: false,
        error: "GitHub service not configured",
        message: "Please configure GITHUB_TOKEN in .env",
      });
    }
    const github = createGitHubService();
    const data = await github.getUserContributions(owner, repo, username, since);
    const githubContributions = github.convertToContributions(
      owner,
      repo,
      username,
      address,
      data
    );

    // 添加到贡献列表
    const newContributions: Contribution[] = githubContributions.map((c) => ({
      id: `contrib_${++idCounter}`,
      contributorAddress: c.contributorAddress,
      contributorGithub: c.contributorGithub,
      platform: c.platform,
      type: c.type,
      externalId: c.externalId,
      title: c.title,
      url: c.url,
      amount: "0", // 待 AI 计算
      timestamp: c.timestamp,
      settled: false,
    }));

    contributions.push(...newContributions);

    res.json({
      success: true,
      data: {
        count: newContributions.length,
        contributions: newContributions,
      },
      message: `Fetched ${newContributions.length} contributions from GitHub`,
    });
  } catch (error: any) {
    console.error("GitHub fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch GitHub contributions",
      message: error.message,
    });
  }
});

/**
 * POST /api/contributions/manual
 * 手动添加贡献
 */
router.post("/manual", (req: Request, res: Response) => {
  try {
    const { contributions: newContribs } = req.body;

    if (!Array.isArray(newContribs) || newContribs.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Contributions array is required",
      });
    }

    const added: Contribution[] = newContribs.map((c) => ({
      id: `contrib_${++idCounter}`,
      contributorAddress: c.contributorAddress,
      contributorGithub: c.contributorGithub,
      contributorDiscord: c.contributorDiscord,
      platform: c.platform,
      type: c.type,
      externalId: c.externalId || `manual_${idCounter}`,
      title: c.title,
      description: c.description,
      url: c.url,
      amount: c.amount || "0",
      timestamp: c.timestamp || Date.now(),
      settled: false,
    }));

    contributions.push(...added);

    res.json({
      success: true,
      data: added,
      message: `Added ${added.length} contributions`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to add contributions",
      message: error.message,
    });
  }
});

/**
 * POST /api/contributions/analyze
 * 使用 AI 分析贡献价值
 */
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { contributionIds, ruleId } = req.body;

    if (!Array.isArray(contributionIds) || contributionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Contribution IDs array is required",
      });
    }

    // 获取待分析的贡献
    const toAnalyze = contributions.filter((c) => contributionIds.includes(c.id));

    if (toAnalyze.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No contributions found",
      });
    }

    // 获取规则 (简化：使用默认规则)
    const defaultRule = {
      id: ruleId || "default",
      name: "Default Rule",
      description: "Default contribution rule",
      weights: [
        { type: "pull_request", weight: 8, description: "Pull Request" },
        { type: "code_review", weight: 7, description: "Code Review" },
        { type: "commit", weight: 5, description: "Commit" },
        { type: "issue", weight: 4, description: "Issue" },
        { type: "discord_message", weight: 2, description: "Discord Message" },
      ],
      baseReward: "1000000000000000000", // 1 token
      maxRewardPerContributor: "100000000000000000000", // 100 tokens
      createdAt: Date.now(),
      updatedAt: Date.now(),
      active: true,
    };

    // 调用 AI 分析
    if (!createAIService) {
      return res.status(503).json({
        success: false,
        error: "AI service not configured",
        message: "Please configure OPENAI_API_KEY or MIMO_API_KEY in .env",
      });
    }
    const ai = createAIService();
    const analyzed = await ai.analyzeContributions(toAnalyze, defaultRule);

    // 更新贡献记录
    analyzed.forEach((a) => {
      const index = contributions.findIndex((c) => c.id === a.id);
      if (index !== -1) {
        contributions[index].aiScore = a.aiScore;
        contributions[index].aiReason = a.aiReason;
        contributions[index].amount = a.amount;
      }
    });

    res.json({
      success: true,
      data: analyzed,
      message: `Analyzed ${analyzed.length} contributions`,
    });
  } catch (error: any) {
    console.error("AI analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze contributions",
      message: error.message,
    });
  }
});

/**
 * GET /api/contributions/stats
 * 获取贡献统计
 */
router.get("/stats/overview", (req: Request, res: Response) => {
  const total = contributions.length;
  const settled = contributions.filter((c) => c.settled).length;
  const pending = total - settled;

  const totalAmount = contributions.reduce((sum, c) => sum + BigInt(c.amount || "0"), BigInt(0));
  const settledAmount = contributions
    .filter((c) => c.settled)
    .reduce((sum, c) => sum + BigInt(c.amount || "0"), BigInt(0));

  const byPlatform = contributions.reduce(
    (acc, c) => {
      acc[c.platform] = (acc[c.platform] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const byType = contributions.reduce(
    (acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const uniqueContributors = new Set(contributions.map((c) => c.contributorAddress)).size;

  res.json({
    success: true,
    data: {
      total,
      settled,
      pending,
      totalAmount: totalAmount.toString(),
      settledAmount: settledAmount.toString(),
      uniqueContributors,
      byPlatform,
      byType,
    },
  });
});

export { router as contributionRoutes };
