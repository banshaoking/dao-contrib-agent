import { Contribution, AIAnalysisResult, AIReport, SettlementRule } from "../types";

/**
 * AI 服务 - 使用 mimov2.5pro 和 GPT-5.5
 */
export class AIService {
  private openaiApiKey: string;
  private mimoApiKey: string;

  constructor(openaiApiKey: string, mimoApiKey: string) {
    this.openaiApiKey = openaiApiKey;
    this.mimoApiKey = mimoApiKey;
  }

  /**
   * 调用 OpenAI GPT-5.5 API
   */
  private async callGPT55(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`GPT-5.5 API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.choices[0].message.content;
  }

  /**
   * 调用小米 mimov2.5pro API
   */
  private async callMimo(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await fetch("https://platform.xiaomimimo.com/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.mimoApiKey}`,
      },
      body: JSON.stringify({
        model: "mimov2.5pro",
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mimo API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    return data.choices[0].message.content;
  }

  /**
   * 分析单个贡献的价值 (使用 mimov2.5pro)
   */
  async analyzeContribution(
    contribution: Contribution,
    rule: SettlementRule
  ): Promise<AIAnalysisResult> {
    const weight = rule.weights.find((w) => w.type === contribution.type);
    const baseWeight = weight?.weight || 5;

    const systemPrompt = `你是一个 DAO 贡献评估专家。你的任务是评估开发者对 DAO 的贡献价值。
评估标准：
- 代码质量：PR 的复杂度、代码规范、测试覆盖
- 影响范围：对项目的影响程度
- 创新性：是否有创新的解决方案
- 协作性：是否帮助他人、Review 代码等

请返回 JSON 格式：{"score": 0-100, "reason": "评估理由", "suggestions": ["建议1", "建议2"]}`;

    const prompt = `请评估以下 DAO 贡献：

贡献类型：${contribution.type}
标题：${contribution.title}
描述：${contribution.description || "无"}
平台：${contribution.platform}
URL：${contribution.url || "无"}
当前权重系数：${baseWeight}/10

请给出 0-100 的评分和详细理由。`;

    try {
      // 优先使用 MIMO，失败则用 OpenAI，都失败则用规则评分
      let result: string | null = null;

      // 尝试 MIMO
      if (this.mimoApiKey) {
        try {
          result = await this.callMimo(prompt, systemPrompt);
        } catch (mimoError) {
          console.warn("Mimo API failed, trying OpenAI:", mimoError);
        }
      }

      // 尝试 OpenAI
      if (!result && this.openaiApiKey) {
        try {
          result = await this.callGPT55(prompt, systemPrompt);
        } catch (openaiError) {
          console.warn("OpenAI API failed:", openaiError);
        }
      }

      // 都失败则用规则评分
      if (!result) {
        return {
          score: baseWeight * 10,
          reason: `基于规则计算的基础评分 (权重: ${baseWeight}/10)`,
        };
      }

      const parsed = JSON.parse(result);
      return {
        score: Math.min(100, Math.max(0, parsed.score)),
        reason: parsed.reason,
        suggestions: parsed.suggestions,
      };
    } catch (error) {
      console.error("AI analysis failed:", error);
      // 降级到基于规则的简单评分
      return {
        score: baseWeight * 10,
        reason: `基于规则计算的基础评分 (权重: ${baseWeight}/10)`,
      };
    }
  }

  /**
   * 批量分析贡献
   */
  async analyzeContributions(
    contributions: Contribution[],
    rule: SettlementRule
  ): Promise<(Contribution & { aiScore: number; aiReason: string })[]> {
    const results = await Promise.all(
      contributions.map(async (contrib) => {
        const analysis = await this.analyzeContribution(contrib, rule);
        return {
          ...contrib,
          aiScore: analysis.score,
          aiReason: analysis.reason,
        };
      })
    );

    return results;
  }

  /**
   * 计算贡献奖励金额
   */
  calculateReward(
    contribution: Contribution,
    rule: SettlementRule,
    aiScore: number
  ): bigint {
    const weight = rule.weights.find((w) => w.type === contribution.type);
    const baseWeight = weight?.weight || 5;

    // 基础奖励 * 权重系数 * AI 评分系数
    const baseReward = BigInt(rule.baseReward);
    const weightMultiplier = BigInt(baseWeight);
    const aiMultiplier = BigInt(aiScore);
    const divisor = BigInt(100);

    const reward = (baseReward * weightMultiplier * aiMultiplier) / (BigInt(10) * divisor);

    // 检查是否超过最大限制
    const maxReward = BigInt(rule.maxRewardPerContributor);
    return reward > maxReward ? maxReward : reward;
  }

  /**
   * 生成结算报告 (使用 GPT-5.5)
   */
  async generateReport(
    contributions: (Contribution & { aiScore: number; aiReason: string })[],
    rule: SettlementRule
  ): Promise<AIReport> {
    // 统计数据
    const contributorMap = new Map<
      string,
      {
        totalAmount: bigint;
        count: number;
        github?: string;
        scores: number[];
      }
    >();

    contributions.forEach((c) => {
      const existing = contributorMap.get(c.contributorAddress) || {
        totalAmount: BigInt(0),
        count: 0,
        github: c.contributorGithub,
        scores: [],
      };

      existing.totalAmount += BigInt(c.amount);
      existing.count++;
      if (c.aiScore) existing.scores.push(c.aiScore);

      contributorMap.set(c.contributorAddress, existing);
    });

    const topContributors = Array.from(contributorMap.entries())
      .sort((a, b) => (a[1].totalAmount > b[1].totalAmount ? -1 : 1))
      .slice(0, 10)
      .map(([address, data]) => ({
        address,
        github: data.github,
        totalAmount: data.totalAmount.toString(),
        contributionCount: data.count,
        highlight: `平均评分: ${(data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)}`,
      }));

    const totalAmount = contributions.reduce(
      (sum, c) => sum + BigInt(c.amount),
      BigInt(0)
    );

    const systemPrompt = `你是一个 DAO 治理报告撰写专家。请根据提供的贡献数据生成简洁、专业的结算报告。
报告应该包括：
1. 总体概述
2. 关键洞察
3. 建议

请返回 JSON 格式。`;

    const prompt = `请为以下 DAO 贡献结算生成报告：

规则名称：${rule.name}
贡献总数：${contributions.length}
总结算额：${totalAmount.toString()} wei
贡献者数量：${contributorMap.size}

Top 贡献者：
${topContributors
  .map(
    (c) =>
      `- ${c.github || c.address.slice(0, 8)}: ${c.contributionCount} 贡献, ${c.totalAmount} wei`
  )
  .join("\n")}

贡献类型分布：
${
  Object.entries(
    contributions.reduce(
      (acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  )
    .map(([type, count]) => `- ${type}: ${count}`)
    .join("\n")
}

请生成 JSON 格式的报告：{"summary": "总结", "insights": ["洞察1", "洞察2"], "recommendations": ["建议1", "建议2"]}`;

    try {
      const result = await this.callGPT55(prompt, systemPrompt);
      const parsed = JSON.parse(result);

      return {
        summary: parsed.summary,
        topContributors,
        insights: parsed.insights,
        recommendations: parsed.recommendations,
      };
    } catch (error) {
      console.error("Report generation failed:", error);
      return {
        summary: `本次结算共处理 ${contributions.length} 笔贡献，涉及 ${contributorMap.size} 位贡献者，总结算金额为 ${totalAmount.toString()} wei。`,
        topContributors,
        insights: [
          `贡献类型涵盖 ${new Set(contributions.map((c) => c.type)).size} 种`,
          `平均每笔贡献金额为 ${(totalAmount / BigInt(contributions.length)).toString()} wei`,
        ],
        recommendations: [
          "建议定期进行贡献评估以保持公平性",
          "可以考虑引入更多维度的评估标准",
        ],
      };
    }
  }
}

export const createAIService = () => {
  const openaiKey = process.env.OPENAI_API_KEY || "";
  const mimoKey = process.env.MIMO_API_KEY || "";

  if (!openaiKey && !mimoKey) {
    throw new Error("At least one of OPENAI_API_KEY or MIMO_API_KEY is required");
  }

  return new AIService(openaiKey, mimoKey);
};
