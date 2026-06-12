import { Router, Request, Response } from "express";
import { SettlementRule, CreateRuleRequest, ApiResponse } from "../types";

const router = Router();

// 内存存储
let rules: SettlementRule[] = [
  {
    id: "default",
    name: "默认规则",
    description: "DAO 贡献默认结算规则",
    weights: [
      { type: "pull_request", weight: 8, description: "Pull Request - 代码贡献" },
      { type: "code_review", weight: 7, description: "Code Review - 代码审查" },
      { type: "commit", weight: 5, description: "Commit - 代码提交" },
      { type: "issue", weight: 4, description: "Issue - 问题反馈" },
      { type: "discord_message", weight: 2, description: "Discord 消息 - 社区活跃" },
      { type: "discord_help", weight: 6, description: "Discord 帮助 - 社区互助" },
      { type: "forum_post", weight: 5, description: "论坛帖子 - 知识分享" },
      { type: "forum_reply", weight: 3, description: "论坛回复 - 讨论参与" },
    ],
    baseReward: "1000000000000000000", // 1 token (18 decimals)
    maxRewardPerContributor: "100000000000000000000", // 100 tokens
    createdAt: Date.now(),
    updatedAt: Date.now(),
    active: true,
  },
];
let idCounter = 1;

/**
 * GET /api/rules
 * 获取所有规则
 */
router.get("/", (req: Request, res: Response) => {
  const { active } = req.query;

  let filtered = [...rules];
  if (active !== undefined) {
    filtered = filtered.filter((r) => r.active === (active === "true"));
  }

  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * GET /api/rules/:id
 * 获取单个规则
 */
router.get("/:id", (req: Request, res: Response) => {
  const rule = rules.find((r) => r.id === req.params.id);

  if (!rule) {
    return res.status(404).json({
      success: false,
      error: "Rule not found",
    });
  }

  res.json({
    success: true,
    data: rule,
  });
});

/**
 * POST /api/rules
 * 创建新规则
 */
router.post("/", (req: Request, res: Response) => {
  try {
    const { name, description, weights, baseReward, maxRewardPerContributor } =
      req.body as CreateRuleRequest;

    if (!name || !weights || !baseReward) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, weights, baseReward",
      });
    }

    const newRule: SettlementRule = {
      id: `rule_${++idCounter}`,
      name,
      description: description || "",
      weights,
      baseReward,
      maxRewardPerContributor: maxRewardPerContributor || "1000000000000000000000",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      active: true,
    };

    rules.push(newRule);

    res.status(201).json({
      success: true,
      data: newRule,
      message: "Rule created successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create rule",
      message: error.message,
    });
  }
});

/**
 * PUT /api/rules/:id
 * 更新规则
 */
router.put("/:id", (req: Request, res: Response) => {
  try {
    const index = rules.findIndex((r) => r.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: "Rule not found",
      });
    }

    const { name, description, weights, baseReward, maxRewardPerContributor, active } =
      req.body;

    rules[index] = {
      ...rules[index],
      name: name || rules[index].name,
      description: description !== undefined ? description : rules[index].description,
      weights: weights || rules[index].weights,
      baseReward: baseReward || rules[index].baseReward,
      maxRewardPerContributor: maxRewardPerContributor || rules[index].maxRewardPerContributor,
      active: active !== undefined ? active : rules[index].active,
      updatedAt: Date.now(),
    };

    res.json({
      success: true,
      data: rules[index],
      message: "Rule updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update rule",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/rules/:id
 * 删除规则 (软删除)
 */
router.delete("/:id", (req: Request, res: Response) => {
  const index = rules.findIndex((r) => r.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: "Rule not found",
    });
  }

  rules[index].active = false;
  rules[index].updatedAt = Date.now();

  res.json({
    success: true,
    message: "Rule deactivated successfully",
  });
});

/**
 * POST /api/rules/:id/activate
 * 激活规则
 */
router.post("/:id/activate", (req: Request, res: Response) => {
  const index = rules.findIndex((r) => r.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: "Rule not found",
    });
  }

  rules[index].active = true;
  rules[index].updatedAt = Date.now();

  res.json({
    success: true,
    data: rules[index],
    message: "Rule activated successfully",
  });
});

/**
 * POST /api/rules/calculate-preview
 * 预览规则计算结果
 */
router.post("/calculate-preview", (req: Request, res: Response) => {
  try {
    const { ruleId, contributionTypes } = req.body;

    const rule = rules.find((r) => r.id === (ruleId || "default"));
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: "Rule not found",
      });
    }

    const baseReward = BigInt(rule.baseReward);
    const previews = contributionTypes.map((type: string) => {
      const weight = rule.weights.find((w) => w.type === type);
      const weightValue = weight?.weight || 5;
      const reward = (baseReward * BigInt(weightValue)) / BigInt(10);

      return {
        type,
        weight: weightValue,
        rewardPerContribution: reward.toString(),
        description: weight?.description || type,
      };
    });

    res.json({
      success: true,
      data: {
        rule: rule.name,
        baseReward: rule.baseReward,
        previews,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to calculate preview",
      message: error.message,
    });
  }
});

export { router as ruleRoutes };
