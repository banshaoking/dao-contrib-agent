import { Router, Request, Response } from "express";
import { SettlementBatch, ExecuteSettlementRequest, ApiResponse } from "../types";

// 安全地导入 blockchain 服务
let createBlockchainService: (() => any) | null = null;
try {
  const blockchainModule = require("../services/blockchain");
  createBlockchainService = blockchainModule.createBlockchainService;
} catch (e) {
  console.warn("Blockchain service not available:", (e as Error).message);
}

// 安全地导入 Cobo 服务
let createCoboService: (() => any) | null = null;
let isCoboConfigured: (() => boolean) | null = null;
try {
  const coboModule = require("../services/cobo");
  createCoboService = coboModule.createCoboService;
  isCoboConfigured = coboModule.isCoboConfigured;
} catch (e) {
  console.warn("Cobo service not available:", (e as Error).message);
}

const router = Router();

// 内存存储
let settlements: SettlementBatch[] = [];
let idCounter = 0;

/**
 * GET /api/settlements
 * 获取所有结算记录
 */
router.get("/", (req: Request, res: Response) => {
  const { status, page = "1", pageSize = "20" } = req.query;

  let filtered = [...settlements];
  if (status) filtered = filtered.filter((s) => s.status === status);

  // 按时间倒序
  filtered.sort((a, b) => b.createdAt - a.createdAt);

  const pageNum = parseInt(page as string);
  const size = parseInt(pageSize as string);
  const start = (pageNum - 1) * size;

  res.json({
    success: true,
    data: {
      items: filtered.slice(start, start + size),
      total: filtered.length,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(filtered.length / size),
    },
  });
});

/**
 * GET /api/settlements/:id
 * 获取单个结算记录
 */
router.get("/:id", (req: Request, res: Response) => {
  const settlement = settlements.find((s) => s.id === req.params.id);

  if (!settlement) {
    return res.status(404).json({
      success: false,
      error: "Settlement not found",
    });
  }

  res.json({
    success: true,
    data: settlement,
  });
});

/**
 * POST /api/settlements/execute
 * 执行批量结算
 */
router.post("/execute", async (req: Request, res: Response) => {
  try {
    const { ruleId, contributionIds } = req.body as ExecuteSettlementRequest;

    if (!ruleId || !Array.isArray(contributionIds) || contributionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "ruleId and contributionIds array are required",
      });
    }

    // 创建结算批次
    const batch: SettlementBatch = {
      id: `settle_${++idCounter}`,
      ruleId,
      ruleHash: `rule_${ruleId}_${Date.now()}`, // 简化的规则哈希
      totalAmount: "0", // 待计算
      contributorCount: 0,
      contributionIds,
      status: "executing",
      executorAddress: process.env.PRIVATE_KEY
        ? new (require("ethers").Wallet)(process.env.PRIVATE_KEY).address
        : "unknown",
      createdAt: Date.now(),
    };

    settlements.push(batch);

    // 异步执行链上结算 - 优先使用 Cobo，否则使用传统区块链
    if (isCoboConfigured && isCoboConfigured()) {
      executeSettlementViaCobo(batch).catch((error) => {
        console.error("Cobo settlement execution failed:", error);
        batch.status = "failed";
      });
    } else if (createBlockchainService) {
      executeSettlement(batch).catch((error) => {
        console.error("Settlement execution failed:", error);
        batch.status = "failed";
      });
    } else {
      batch.status = "failed";
      console.warn("No settlement service configured, settlement skipped");
    }

    res.json({
      success: true,
      data: batch,
      message: "Settlement execution started",
    });
  } catch (error: any) {
    console.error("Settlement error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to execute settlement",
      message: error.message,
    });
  }
});

/**
 * POST /api/settlements/record
 * 记录贡献到链上
 */
router.post("/record", async (req: Request, res: Response) => {
  try {
    const { contributions } = req.body;

    if (!Array.isArray(contributions) || contributions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Contributions array is required",
      });
    }

    if (!createBlockchainService) {
      return res.status(503).json({
        success: false,
        error: "Blockchain service not configured",
        message: "Please configure RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS, and PAYMENT_TOKEN_ADDRESS in .env",
      });
    }
    const blockchain = createBlockchainService();

    const addresses = contributions.map((c: any) => c.contributorAddress);
    const amounts = contributions.map((c: any) => c.amount || "0");
    const platforms = contributions.map((c: any) => c.platform);
    const ids = contributions.map((c: any) => c.externalId || `contrib_${Date.now()}`);

    const result = await blockchain.recordContributions(
      addresses,
      amounts,
      platforms,
      ids
    );

    const events = blockchain.parseContributionRecordedEvents(result.receipt);

    res.json({
      success: true,
      data: {
        txHash: result.txHash,
        blockNumber: result.receipt.blockNumber,
        recordedCount: events.length,
        events,
      },
      message: `Recorded ${events.length} contributions on-chain`,
    });
  } catch (error: any) {
    console.error("Record error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record contributions",
      message: error.message,
    });
  }
});

/**
 * GET /api/settlements/tx/:hash
 * 查询交易状态
 */
router.get("/tx/:hash", async (req: Request, res: Response) => {
  try {
    if (!createBlockchainService) {
      return res.status(503).json({
        success: false,
        error: "Blockchain service not configured",
      });
    }
    const blockchain = createBlockchainService();
    const status = await blockchain.getTxStatus(req.params.hash);

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to get transaction status",
      message: error.message,
    });
  }
});

/**
 * GET /api/settlements/balance
 * 获取合约余额
 */
router.get("/balance/contract", async (req: Request, res: Response) => {
  try {
    // 优先使用 Cobo
    if (isCoboConfigured && isCoboConfigured() && createCoboService) {
      const cobo = createCoboService();
      const walletId = process.env.COBO_WALLET_ID;

      if (walletId) {
        const balance = await cobo.getBalance(walletId);
        return res.json({
          success: true,
          data: {
            balance,
            source: "cobo",
            walletId,
          },
        });
      }
    }

    // 降级到传统区块链
    if (!createBlockchainService) {
      return res.status(503).json({
        success: false,
        error: "No balance service configured",
        message: "Please configure COBO_WALLET_ID or blockchain settings",
      });
    }

    const blockchain = createBlockchainService();
    const balance = await blockchain.getBalance();

    res.json({
      success: true,
      data: {
        balance,
        source: "blockchain",
        contractAddress: process.env.CONTRACT_ADDRESS,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to get balance",
      message: error.message,
    });
  }
});

/**
 * 异步执行结算的辅助函数
 */
async function executeSettlement(batch: SettlementBatch) {
  try {
    if (!createBlockchainService) {
      throw new Error("Blockchain service not configured");
    }
    const blockchain = createBlockchainService();

    // 将 contributionIds 转换为数字
    const numericIds = batch.contributionIds.map((id) => {
      // 假设 ID 格式为 "contrib_123"，提取数字部分
      const match = id.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    });

    const result = await blockchain.settleBatch(numericIds, batch.ruleHash);

    const events = blockchain.parseSettlementExecutedEvents(result.receipt);

    // 更新批次状态
    batch.status = "completed";
    batch.txHash = result.txHash;
    batch.executedAt = Date.now();

    if (events.length > 0) {
      batch.totalAmount = events[0].totalAmount;
      batch.contributorCount = events[0].contributorCount;
    }

    console.log(`✅ Settlement ${batch.id} completed, tx: ${result.txHash}`);
  } catch (error: any) {
    batch.status = "failed";
    console.error(`❌ Settlement ${batch.id} failed:`, error.message);
    throw error;
  }
}

/**
 * 通过 Cobo Agentic Wallet 执行结算
 */
async function executeSettlementViaCobo(batch: SettlementBatch) {
  try {
    if (!createCoboService) {
      throw new Error("Cobo service not configured");
    }

    const cobo = createCoboService();
    const agentId = process.env.AGENT_ID || "dao-contrib-agent";
    const walletId = process.env.COBO_WALLET_ID;
    const tokenAddress = process.env.PAYMENT_TOKEN_ADDRESS;

    if (!walletId || !tokenAddress) {
      throw new Error("COBO_WALLET_ID and PAYMENT_TOKEN_ADDRESS are required");
    }

    // 构建结算数据
    const settlements = batch.contributionIds.map((id) => ({
      address: `0x${id.replace(/\D/g, '').padStart(40, '0')}`, // 模拟地址
      amount: "1000000000000000000", // 1 token
      reason: `Settlement for contribution ${id}`,
    }));

    // 通过 Cobo 执行批量结算
    const transactions = await cobo.agentBatchSettle(
      agentId,
      walletId,
      settlements,
      tokenAddress
    );

    // 更新批次状态
    batch.status = "completed";
    batch.txHash = transactions[0]?.txHash || "cobo-batch";
    batch.executedAt = Date.now();
    batch.totalAmount = settlements.reduce(
      (sum, s) => sum + BigInt(s.amount),
      BigInt(0)
    ).toString();
    batch.contributorCount = settlements.length;

    console.log(`✅ Cobo Settlement ${batch.id} completed, ${transactions.length} transactions`);
  } catch (error: any) {
    batch.status = "failed";
    console.error(`❌ Cobo Settlement ${batch.id} failed:`, error.message);
    throw error;
  }
}

export { router as settlementRoutes };
