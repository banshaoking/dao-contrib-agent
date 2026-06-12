/**
 * Cobo Agentic Wallet (CAW) Service
 *
 * 集成 Cobo Agentic Wallet 实现 Agent 资金管理
 * 文档: https://developers.cobo.com/en/agentic-wallet/
 */

import crypto from 'crypto';

// ========================================
// 类型定义
// ========================================

export interface CoboConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  chainId: number;
}

export interface WalletInfo {
  walletId: string;
  address: string;
  chainId: number;
  balance: string;
  status: 'active' | 'frozen' | 'pending';
}

export interface Transaction {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  blockNumber?: number;
}

export interface AgentPermission {
  agentId: string;
  maxAmount: string;
  allowedActions: string[];
  expiresAt: number;
}

export interface TransferRequest {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  tokenAddress: string;
  agentId: string;
  reason: string;
}

export interface BatchTransferRequest {
  fromWalletId: string;
  transfers: {
    toAddress: string;
    amount: string;
    reason: string;
  }[];
  tokenAddress: string;
  agentId: string;
}

// ========================================
// Cobo Agentic Wallet Service
// ========================================

export class CoboAgenticWalletService {
  private config: CoboConfig;

  constructor(config: CoboConfig) {
    this.config = config;
  }

  /**
   * 生成 HMAC 签名
   */
  private generateSignature(method: string, path: string, body?: string): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const message = `${method}${path}${timestamp}${body || ''}`;
    const signature = crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(message)
      .digest('hex');
    return `HMAC-SHA256 ${signature}`;
  }

  /**
   * 发送 API 请求
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const bodyStr = body ? JSON.stringify(body) : '';
    const signature = this.generateSignature(method, path, bodyStr);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Cobo-Signature': signature,
        'X-Cobo-Timestamp': Math.floor(Date.now() / 1000).toString(),
      },
      body: bodyStr || undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cobo API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // ========================================
  // 钱包管理
  // ========================================

  /**
   * 创建 Agent 钱包
   */
  async createAgentWallet(agentId: string): Promise<WalletInfo> {
    const result = await this.request<any>('POST', '/v1/wallets/create', {
      wallet_type: 'agentic',
      chain_id: this.config.chainId,
      agent_id: agentId,
      name: `Agent-${agentId}`,
    });

    return {
      walletId: result.wallet_id,
      address: result.address,
      chainId: result.chain_id,
      balance: '0',
      status: 'active',
    };
  }

  /**
   * 获取钱包信息
   */
  async getWallet(walletId: string): Promise<WalletInfo> {
    const result = await this.request<any>('GET', `/v1/wallets/${walletId}`);
    return {
      walletId: result.wallet_id,
      address: result.address,
      chainId: result.chain_id,
      balance: result.balance,
      status: result.status,
    };
  }

  /**
   * 获取 Agent 钱包列表
   */
  async getAgentWallets(agentId: string): Promise<WalletInfo[]> {
    const result = await this.request<any>('GET', `/v1/wallets?agent_id=${agentId}`);
    return result.wallets.map((w: any) => ({
      walletId: w.wallet_id,
      address: w.address,
      chainId: w.chain_id,
      balance: w.balance,
      status: w.status,
    }));
  }

  // ========================================
  // 权限管理
  // ========================================

  /**
   * 设置 Agent 权限
   */
  async setAgentPermission(
    agentId: string,
    permission: Omit<AgentPermission, 'agentId'>
  ): Promise<void> {
    await this.request('POST', '/v1/permissions/set', {
      agent_id: agentId,
      max_amount: permission.maxAmount,
      allowed_actions: permission.allowedActions,
      expires_at: permission.expiresAt,
    });
  }

  /**
   * 获取 Agent 权限
   */
  async getAgentPermission(agentId: string): Promise<AgentPermission> {
    const result = await this.request<any>('GET', `/v1/permissions/${agentId}`);
    return {
      agentId: result.agent_id,
      maxAmount: result.max_amount,
      allowedActions: result.allowed_actions,
      expiresAt: result.expires_at,
    };
  }

  /**
   * 检查交易权限
   */
  async checkPermission(
    agentId: string,
    amount: string,
    action: string
  ): Promise<boolean> {
    try {
      const permission = await this.getAgentPermission(agentId);

      // 检查金额限制
      if (BigInt(amount) > BigInt(permission.maxAmount)) {
        return false;
      }

      // 检查操作权限
      if (!permission.allowedActions.includes(action)) {
        return false;
      }

      // 检查是否过期
      if (Date.now() > permission.expiresAt) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  // ========================================
  // 资金操作
  // ========================================

  /**
   * 单笔转账
   */
  async transfer(request: TransferRequest): Promise<Transaction> {
    // 检查权限
    const hasPermission = await this.checkPermission(
      request.agentId,
      request.amount,
      'transfer'
    );

    if (!hasPermission) {
      throw new Error('Agent does not have permission for this transfer');
    }

    const result = await this.request<any>('POST', '/v1/transactions/transfer', {
      wallet_id: request.fromWalletId,
      to_address: request.toAddress,
      amount: request.amount,
      token_address: request.tokenAddress,
      agent_id: request.agentId,
      reason: request.reason,
    });

    return {
      txHash: result.tx_hash,
      from: result.from,
      to: result.to,
      amount: result.amount,
      status: result.status,
      timestamp: result.timestamp,
    };
  }

  /**
   * 批量转账
   */
  async batchTransfer(request: BatchTransferRequest): Promise<Transaction[]> {
    // 检查总金额权限
    const totalAmount = request.transfers.reduce(
      (sum, t) => sum + BigInt(t.amount),
      BigInt(0)
    ).toString();

    const hasPermission = await this.checkPermission(
      request.agentId,
      totalAmount,
      'batch_transfer'
    );

    if (!hasPermission) {
      throw new Error('Agent does not have permission for batch transfer');
    }

    const result = await this.request<any>('POST', '/v1/transactions/batch', {
      wallet_id: request.fromWalletId,
      transfers: request.transfers.map((t) => ({
        to_address: t.toAddress,
        amount: t.amount,
        reason: t.reason,
      })),
      token_address: request.tokenAddress,
      agent_id: request.agentId,
    });

    return result.transactions.map((tx: any) => ({
      txHash: tx.tx_hash,
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      status: tx.status,
      timestamp: tx.timestamp,
    }));
  }

  /**
   * 查询交易状态
   */
  async getTransactionStatus(txHash: string): Promise<Transaction> {
    const result = await this.request<any>('GET', `/v1/transactions/${txHash}`);
    return {
      txHash: result.tx_hash,
      from: result.from,
      to: result.to,
      amount: result.amount,
      status: result.status,
      timestamp: result.timestamp,
      blockNumber: result.block_number,
    };
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(
    walletId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const result = await this.request<any>(
      'GET',
      `/v1/wallets/${walletId}/transactions?page=${page}&page_size=${pageSize}`
    );

    return {
      transactions: result.transactions.map((tx: any) => ({
        txHash: tx.tx_hash,
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        status: tx.status,
        timestamp: tx.timestamp,
        blockNumber: tx.block_number,
      })),
      total: result.total,
    };
  }

  // ========================================
  // 余额管理
  // ========================================

  /**
   * 获取钱包余额
   */
  async getBalance(walletId: string, tokenAddress?: string): Promise<string> {
    const path = tokenAddress
      ? `/v1/wallets/${walletId}/balance?token_address=${tokenAddress}`
      : `/v1/wallets/${walletId}/balance`;

    const result = await this.request<any>('GET', path);
    return result.balance;
  }

  /**
   * 获取多代币余额
   */
  async getAllBalances(walletId: string): Promise<Record<string, string>> {
    const result = await this.request<any>('GET', `/v1/wallets/${walletId}/balances`);
    return result.balances;
  }

  // ========================================
  // Agent 专用方法
  // ========================================

  /**
   * Agent 自主支付
   */
  async agentPay(
    agentId: string,
    walletId: string,
    toAddress: string,
    amount: string,
    tokenAddress: string,
    reason: string
  ): Promise<Transaction> {
    return this.transfer({
      fromWalletId: walletId,
      toAddress,
      amount,
      tokenAddress,
      agentId,
      reason,
    });
  }

  /**
   * Agent 批量结算
   */
  async agentBatchSettle(
    agentId: string,
    walletId: string,
    settlements: { address: string; amount: string; reason: string }[],
    tokenAddress: string
  ): Promise<Transaction[]> {
    return this.batchTransfer({
      fromWalletId: walletId,
      transfers: settlements.map((s) => ({
        toAddress: s.address,
        amount: s.amount,
        reason: s.reason,
      })),
      tokenAddress,
      agentId,
    });
  }

  /**
   * 获取 Agent 资金流水
   */
  async getAgentCashFlow(
    agentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalInflow: string;
    totalOutflow: string;
    transactions: Transaction[];
  }> {
    const result = await this.request<any>('GET', `/v1/agents/${agentId}/cashflow?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);

    return {
      totalInflow: result.total_inflow,
      totalOutflow: result.total_outflow,
      transactions: result.transactions.map((tx: any) => ({
        txHash: tx.tx_hash,
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        status: tx.status,
        timestamp: tx.timestamp,
      })),
    };
  }
}

// ========================================
// 工厂函数
// ========================================

let coboService: CoboAgenticWalletService | null = null;

export const createCoboService = (): CoboAgenticWalletService => {
  if (coboService) {
    return coboService;
  }

  const apiKey = process.env.COBO_API_KEY;
  const apiSecret = process.env.COBO_API_SECRET;
  const baseUrl = process.env.COBO_BASE_URL || 'https://api.cobo.com';
  const chainId = parseInt(process.env.CHAIN_ID || '11155111'); // Sepolia

  if (!apiKey || !apiSecret) {
    throw new Error('COBO_API_KEY and COBO_API_SECRET are required');
  }

  coboService = new CoboAgenticWalletService({
    apiKey,
    apiSecret,
    baseUrl,
    chainId,
  });

  return coboService;
};

export const isCoboConfigured = (): boolean => {
  return !!(process.env.COBO_API_KEY && process.env.COBO_API_SECRET);
};
