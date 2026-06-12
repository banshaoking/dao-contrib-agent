import { ethers } from "ethers";
import { TxStatus, OnchainContribution } from "../types";

// ContribSettlement 合约 ABI (简化版，仅包含需要的方法)
const CONTRACT_ABI = [
  "function recordContributions(address[] contributors, uint256[] amounts, string[] platforms, string[] contributionIds) external",
  "function settleBatch(uint256[] contributionIds, string ruleHash) external",
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function getBalance() external view returns (uint256)",
  "function getUserContributions(address user) external view returns (uint256[])",
  "function getContribution(uint256 contributionId) external view returns (tuple(uint256 id, address contributor, uint256 amount, string platform, string contributionId, uint256 timestamp, bool settled))",
  "function getPendingAmount(address user) external view returns (uint256)",
  "function settlementCounter() external view returns (uint256)",
  "event ContributionRecorded(uint256 indexed id, address indexed contributor, uint256 amount, string platform, string contributionId)",
  "event SettlementExecuted(uint256 indexed batchId, uint256 totalAmount, uint256 contributorCount, address indexed executor)",
  "event ContributionSettled(uint256 indexed contributionId, address indexed contributor, uint256 amount)",
];

// ERC20 ABI (简化版)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private tokenContract: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const tokenAddress = process.env.PAYMENT_TOKEN_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress || !tokenAddress) {
      throw new Error(
        "RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS, and PAYMENT_TOKEN_ADDRESS are required"
      );
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, this.wallet);
    this.tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
  }

  /**
   * 获取合约余额
   */
  async getBalance(): Promise<string> {
    const balance = await this.contract.getBalance();
    return balance.toString();
  }

  /**
   * 获取用户的待结算金额
   */
  async getPendingAmount(address: string): Promise<string> {
    const amount = await this.contract.getPendingAmount(address);
    return amount.toString();
  }

  /**
   * 获取用户的贡献记录 ID 列表
   */
  async getUserContributionIds(address: string): Promise<number[]> {
    const ids = await this.contract.getUserContributions(address);
    return ids.map((id: bigint) => Number(id));
  }

  /**
   * 获取贡献详情
   */
  async getContribution(id: number): Promise<OnchainContribution> {
    const contrib = await this.contract.getContribution(id);
    return {
      id: Number(contrib.id),
      contributor: contrib.contributor,
      amount: contrib.amount.toString(),
      platform: contrib.platform,
      contributionId: contrib.contributionId,
      timestamp: Number(contrib.timestamp),
      settled: contrib.settled,
    };
  }

  /**
   * 批量记录贡献到链上
   */
  async recordContributions(
    contributors: string[],
    amounts: string[],
    platforms: string[],
    contributionIds: string[]
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    // 检查数组长度
    if (
      contributors.length !== amounts.length ||
      contributors.length !== platforms.length ||
      contributors.length !== contributionIds.length
    ) {
      throw new Error("Array lengths mismatch");
    }

    // 估算 gas
    const gasEstimate = await this.contract.recordContributions.estimateGas(
      contributors,
      amounts,
      platforms,
      contributionIds
    );

    // 添加 20% gas buffer
    const gasLimit = (gasEstimate * 120n) / 100n;

    // 发送交易
    const tx = await this.contract.recordContributions(
      contributors,
      amounts,
      platforms,
      contributionIds,
      { gasLimit }
    );

    console.log(`📝 Recording contributions, tx: ${tx.hash}`);

    // 等待确认
    const receipt = await tx.wait();

    console.log(`✅ Contributions recorded, block: ${receipt.blockNumber}`);

    return {
      txHash: tx.hash,
      receipt,
    };
  }

  /**
   * 执行批量结算
   */
  async settleBatch(
    contributionIds: number[],
    ruleHash: string
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt }> {
    // 先检查合约余额
    const balance = await this.contract.getBalance();

    // 估算 gas
    const gasEstimate = await this.contract.settleBatch.estimateGas(
      contributionIds,
      ruleHash
    );

    const gasLimit = (gasEstimate * 120n) / 100n;

    // 发送交易
    const tx = await this.contract.settleBatch(contributionIds, ruleHash, {
      gasLimit,
    });

    console.log(`💰 Executing settlement, tx: ${tx.hash}`);

    // 等待确认
    const receipt = await tx.wait();

    console.log(`✅ Settlement executed, block: ${receipt.blockNumber}`);

    return {
      txHash: tx.hash,
      receipt,
    };
  }

  /**
   * 存入代币到合约
   */
  async deposit(amount: string): Promise<{ txHash: string }> {
    const contractAddress = process.env.CONTRACT_ADDRESS;

    // 先授权
    const allowance = await this.tokenContract.allowance(
      this.wallet.address,
      contractAddress
    );

    if (allowance < BigInt(amount)) {
      console.log("⏳ Approving token spend...");
      const approveTx = await this.tokenContract.approve(
        contractAddress,
        amount
      );
      await approveTx.wait();
      console.log("✅ Token approved");
    }

    // 存入
    const tx = await this.contract.deposit(amount);
    await tx.wait();

    return { txHash: tx.hash };
  }

  /**
   * 获取交易状态
   */
  async getTxStatus(txHash: string): Promise<TxStatus> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return { hash: txHash, status: "pending" };
      }

      return {
        hash: txHash,
        status: receipt.status === 1 ? "confirmed" : "failed",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error: any) {
      return {
        hash: txHash,
        status: "failed",
        error: error.message,
      };
    }
  }

  /**
   * 解析合约事件
   */
  parseContributionRecordedEvents(receipt: ethers.TransactionReceipt) {
    const events: any[] = [];

    for (const log of receipt.logs) {
      try {
        const parsed = this.contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed?.name === "ContributionRecorded") {
          events.push({
            id: Number(parsed.args[0]),
            contributor: parsed.args[1],
            amount: parsed.args[2].toString(),
            platform: parsed.args[3],
            contributionId: parsed.args[4],
          });
        }
      } catch (e) {
        // 忽略无法解析的日志
      }
    }

    return events;
  }

  parseSettlementExecutedEvents(receipt: ethers.TransactionReceipt) {
    const events: any[] = [];

    for (const log of receipt.logs) {
      try {
        const parsed = this.contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed?.name === "SettlementExecuted") {
          events.push({
            batchId: Number(parsed.args[0]),
            totalAmount: parsed.args[1].toString(),
            contributorCount: Number(parsed.args[2]),
            executor: parsed.args[3],
          });
        }
      } catch (e) {
        // 忽略无法解析的日志
      }
    }

    return events;
  }

  /**
   * 获取当前 Gas 价格
   */
  async getGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice?.toString() || "0";
  }

  /**
   * 获取钱包地址
   */
  getAddress(): string {
    return this.wallet.address;
  }
}

let blockchainService: BlockchainService | null = null;

export const createBlockchainService = (): BlockchainService => {
  if (!blockchainService) {
    blockchainService = new BlockchainService();
  }
  return blockchainService;
};
