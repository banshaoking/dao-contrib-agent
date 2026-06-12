/**
 * Cobo Agentic Wallet Routes
 *
 * 处理 Cobo 钱包相关的 API 路由
 */

import { Router, Request, Response } from 'express';
import { createCoboService, isCoboConfigured } from '../services/cobo';

const router = Router();

// ========================================
// 钱包管理
// ========================================

/**
 * POST /api/cobo/wallets/create
 * 创建 Agent 钱包
 */
router.post('/wallets/create', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
        message: 'Please configure COBO_API_KEY and COBO_API_SECRET in .env',
      });
    }

    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'agentId is required',
      });
    }

    const cobo = createCoboService();
    const wallet = await cobo.createAgentWallet(agentId);

    res.json({
      success: true,
      data: wallet,
      message: 'Agent wallet created successfully',
    });
  } catch (error: any) {
    console.error('Create wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create wallet',
      message: error.message,
    });
  }
});

/**
 * GET /api/cobo/wallets/:walletId
 * 获取钱包信息
 */
router.get('/wallets/:walletId', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
      });
    }

    const cobo = createCoboService();
    const wallet = await cobo.getWallet(req.params.walletId);

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet',
      message: error.message,
    });
  }
});

/**
 * GET /api/cobo/wallets/agent/:agentId
 * 获取 Agent 的钱包列表
 */
router.get('/wallets/agent/:agentId', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
      });
    }

    const cobo = createCoboService();
    const wallets = await cobo.getAgentWallets(req.params.agentId);

    res.json({
      success: true,
      data: wallets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get wallets',
      message: error.message,
    });
  }
});

// ========================================
// 余额查询
// ========================================

/**
 * GET /api/cobo/wallets/:walletId/balance
 * 获取钱包余额
 */
router.get('/wallets/:walletId/balance', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
      });
    }

    const { tokenAddress } = req.query;
    const cobo = createCoboService();
    const balance = await cobo.getBalance(
      req.params.walletId,
      tokenAddress as string
    );

    res.json({
      success: true,
      data: { balance },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get balance',
      message: error.message,
    });
  }
});

// ========================================
// 转账操作
// ========================================

/**
 * POST /api/cobo/transfer
 * 单笔转账
 */
router.post('/transfer', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
      });
    }

    const { fromWalletId, toAddress, amount, tokenAddress, agentId, reason } = req.body;

    if (!fromWalletId || !toAddress || !amount || !tokenAddress || !agentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fromWalletId, toAddress, amount, tokenAddress, agentId',
      });
    }

    const cobo = createCoboService();
    const transaction = await cobo.transfer({
      fromWalletId,
      toAddress,
      amount,
      tokenAddress,
      agentId,
      reason: reason || 'DAO contribution settlement',
    });

    res.json({
      success: true,
      data: transaction,
      message: 'Transfer initiated successfully',
    });
  } catch (error: any) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute transfer',
      message: error.message,
    });
  }
});

/**
 * POST /api/cobo/batch-transfer
 * 批量转账
 */
router.post('/batch-transfer', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
      });
    }

    const { fromWalletId, transfers, tokenAddress, agentId } = req.body;

    if (!fromWalletId || !transfers || !tokenAddress || !agentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fromWalletId, transfers, tokenAddress, agentId',
      });
    }

    const cobo = createCoboService();
    const transactions = await cobo.batchTransfer({
      fromWalletId,
      transfers,
      tokenAddress,
      agentId,
    });

    res.json({
      success: true,
      data: transactions,
      message: `Batch transfer initiated: ${transactions.length} transactions`,
    });
  } catch (error: any) {
    console.error('Batch transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute batch transfer',
      message: error.message,
    });
  }
});

// ========================================
// Agent 专用接口
// ========================================

/**
 * POST /api/cobo/agent/settle
 * Agent 批量结算
 */
router.post('/agent/settle', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
      });
    }

    const { agentId, walletId, settlements, tokenAddress } = req.body;

    if (!agentId || !walletId || !settlements || !tokenAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const cobo = createCoboService();
    const transactions = await cobo.agentBatchSettle(
      agentId,
      walletId,
      settlements,
      tokenAddress
    );

    res.json({
      success: true,
      data: {
        transactions,
        summary: {
          total: transactions.length,
          totalAmount: settlements.reduce(
            (sum: bigint, s: any) => sum + BigInt(s.amount),
            BigInt(0)
          ).toString(),
        },
      },
      message: `Agent settled ${transactions.length} contributions`,
    });
  } catch (error: any) {
    console.error('Agent settle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute agent settlement',
      message: error.message,
    });
  }
});

/**
 * GET /api/cobo/agent/:agentId/cashflow
 * 获取 Agent 资金流水
 */
router.get('/agent/:agentId/cashflow', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
      });
    }

    const { startDate, endDate } = req.query;
    const cobo = createCoboService();

    const cashflow = await cobo.getAgentCashFlow(
      req.params.agentId,
      new Date(startDate as string || Date.now() - 30 * 86400000),
      new Date(endDate as string || Date.now())
    );

    res.json({
      success: true,
      data: cashflow,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cashflow',
      message: error.message,
    });
  }
});

// ========================================
// 交易查询
// ========================================

/**
 * GET /api/cobo/transactions/:txHash
 * 查询交易状态
 */
router.get('/transactions/:txHash', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
      });
    }

    const cobo = createCoboService();
    const transaction = await cobo.getTransactionStatus(req.params.txHash);

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction status',
      message: error.message,
    });
  }
});

/**
 * GET /api/cobo/wallets/:walletId/transactions
 * 获取交易历史
 */
router.get('/wallets/:walletId/transactions', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
      });
    }

    const { page = '1', pageSize = '20' } = req.query;
    const cobo = createCoboService();

    const result = await cobo.getTransactionHistory(
      req.params.walletId,
      parseInt(page as string),
      parseInt(pageSize as string)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction history',
      message: error.message,
    });
  }
});

// ========================================
// 权限管理
// ========================================

/**
 * POST /api/cobo/permissions/set
 * 设置 Agent 权限
 */
router.post('/permissions/set', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
      });
    }

    const { agentId, maxAmount, allowedActions, expiresAt } = req.body;

    if (!agentId || !maxAmount || !allowedActions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const cobo = createCoboService();
    await cobo.setAgentPermission(agentId, {
      maxAmount,
      allowedActions,
      expiresAt: expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000, // 默认 7 天
    });

    res.json({
      success: true,
      message: 'Agent permission set successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to set permission',
      message: error.message,
    });
  }
});

/**
 * GET /api/cobo/permissions/:agentId
 * 获取 Agent 权限
 */
router.get('/permissions/:agentId', async (req: Request, res: Response) => {
  try {
    if (!isCoboConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Cobo service not configured',
      });
    }

    const cobo = createCoboService();
    const permission = await cobo.getAgentPermission(req.params.agentId);

    res.json({
      success: true,
      data: permission,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get permission',
      message: error.message,
    });
  }
});

/**
 * GET /api/cobo/status
 * 检查 Cobo 服务状态
 */
router.get('/status', (req: Request, res: Response) => {
  const configured = isCoboConfigured();
  res.json({
    success: true,
    data: {
      configured,
      apiKey: !!process.env.COBO_API_KEY,
      apiSecret: !!process.env.COBO_API_SECRET,
      baseUrl: process.env.COBO_BASE_URL || 'https://api.cobo.com',
      chainId: process.env.CHAIN_ID || '11155111',
    },
  });
});

export { router as coboRoutes };
