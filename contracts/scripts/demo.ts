import { ethers } from "hardhat";

async function main() {
  console.log("🚀 开始 DAO 贡献结算系统 Demo");
  console.log("================================\n");

  const [admin, user1, user2, user3] = await ethers.getSigners();

  console.log("👥 参与者地址：");
  console.log(`   Admin: ${admin.address}`);
  console.log(`   User1: ${user1.address}`);
  console.log(`   User2: ${user2.address}`);
  console.log(`   User3: ${user3.address}\n`);

  // 1. 部署 MockERC20 代币
  console.log("📦 第一步：部署测试代币合约");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy(
    "Test USDC",
    "TUSDC",
    ethers.parseEther("1000000") // 1M tokens
  );
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();
  console.log(`   ✅ MockERC20 已部署: ${tokenAddress}\n`);

  // 2. 部署 ContribSettlement 合约
  console.log("📦 第二步：部署结算合约");
  const Settlement = await ethers.getContractFactory("ContribSettlement");
  const settlement = await Settlement.deploy(tokenAddress, admin.address);
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log(`   ✅ ContribSettlement 已部署: ${settlementAddress}\n`);

  // 3. 批准和存入资金
  console.log("💰 第三步：向合约存入资金");
  const depositAmount = ethers.parseEther("100000"); // 100K TUSDC
  await mockToken.approve(settlementAddress, depositAmount);
  await settlement.deposit(depositAmount);
  const balance = await settlement.getBalance();
  console.log(`   ✅ 存入金额: ${ethers.formatEther(depositAmount)} TUSDC`);
  console.log(`   💵 当前合约余额: ${ethers.formatEther(balance)} TUSDC\n`);

  // 4. 记录贡献
  console.log("📝 第四步：记录用户贡献");
  const contributors = [user1.address, user2.address, user3.address];
  const amounts = [
    ethers.parseEther("500"), // User1: 500 TUSDC
    ethers.parseEther("1000"), // User2: 1000 TUSDC
    ethers.parseEther("750"), // User3: 750 TUSDC
  ];
  const platforms = ["github", "github", "discord"];
  const contributionIds = ["pr-123", "pr-456", "msg-789"];

  await settlement.recordContributions(
    contributors,
    amounts,
    platforms,
    contributionIds
  );

  console.log("   ✅ 已记录 3 条贡献记录：");
  console.log(`      - User1: 500 TUSDC (GitHub PR-123)`);
  console.log(`      - User2: 1000 TUSDC (GitHub PR-456)`);
  console.log(`      - User3: 750 TUSDC (Discord MSG-789)\n`);

  // 5. 查询待结算金额
  console.log("🔍 第五步：查询各用户待结算金额");
  const pending1 = await settlement.getPendingAmount(user1.address);
  const pending2 = await settlement.getPendingAmount(user2.address);
  const pending3 = await settlement.getPendingAmount(user3.address);

  console.log(`   User1 待结算: ${ethers.formatEther(pending1)} TUSDC`);
  console.log(`   User2 待结算: ${ethers.formatEther(pending2)} TUSDC`);
  console.log(`   User3 待结算: ${ethers.formatEther(pending3)} TUSDC`);
  console.log(`   总待结算: ${ethers.formatEther(pending1 + pending2 + pending3)} TUSDC\n`);

  // 6. 执行批量结算
  console.log("✨ 第六步：执行批量结算");
  const settleBatchTx = await settlement.settleBatch([0, 1, 2], "rule-hash-v1");
  const receipt = await settleBatchTx.wait();
  console.log(`   ✅ 结算已执行 (TxHash: ${receipt?.hash})\n`);

  // 7. 验证结算结果
  console.log("🎉 第七步：验证结算结果");
  const user1Balance = await mockToken.balanceOf(user1.address);
  const user2Balance = await mockToken.balanceOf(user2.address);
  const user3Balance = await mockToken.balanceOf(user3.address);

  console.log("   用户代币余额：");
  console.log(`   User1: ${ethers.formatEther(user1Balance)} TUSDC`);
  console.log(`   User2: ${ethers.formatEther(user2Balance)} TUSDC`);
  console.log(`   User3: ${ethers.formatEther(user3Balance)} TUSDC\n`);

  // 8. 查询结算统计
  const totalSettled = await settlement.totalSettled();
  const contractBalance = await settlement.getBalance();

  console.log("📊 结算统计：");
  console.log(`   总结算金额: ${ethers.formatEther(totalSettled)} TUSDC`);
  console.log(`   合约剩余: ${ethers.formatEther(contractBalance)} TUSDC`);
  console.log(
    `   消耗比例: ${(Number(totalSettled) / Number(depositAmount) * 100).toFixed(2)}%\n`
  );

  // 9. 访问控制演示
  console.log("🔐 第八步：访问控制演示");
  const SETTLE_ADMIN_ROLE = await settlement.SETTLE_ADMIN_ROLE();

  // 授予用户新角色
  await settlement.grantRole(SETTLE_ADMIN_ROLE, user1.address);
  console.log(`   ✅ 已授予 User1 SETTLE_ADMIN_ROLE\n`);

  // 演示新管理员可以记录贡献
  await settlement
    .connect(user1)
    .recordContributions(
      [user2.address],
      [ethers.parseEther("250")],
      ["github"],
      ["pr-789"]
    );
  console.log(`   ✅ User1 (新管理员) 成功记录贡献\n`);

  // 10. 取消角色
  await settlement.revokeRole(SETTLE_ADMIN_ROLE, user1.address);
  console.log(`   ✅ 已取消 User1 的 SETTLE_ADMIN_ROLE\n`);

  // 尝试失败
  try {
    await settlement
      .connect(user1)
      .recordContributions(
        [user2.address],
        [ethers.parseEther("250")],
        ["github"],
        ["pr-999"]
      );
  } catch (error) {
    console.log(`   ❌ User1 (已撤销权限) 无法记录贡献\n`);
  }

  console.log("✅ Demo 演示完毕！");
  console.log("================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
