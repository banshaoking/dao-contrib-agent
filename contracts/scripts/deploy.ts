import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 部署参数 - 使用 Sepolia 测试网的 USDC 地址
  // 注意：实际部署时需要替换为真实的代币地址
  const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  const adminAddress = deployer.address;

  // 部署 ContribSettlement 合约
  const ContribSettlement = await ethers.getContractFactory("ContribSettlement");
  const settlement = await ContribSettlement.deploy(USDC_SEPOLIA, adminAddress);

  await settlement.deployed();

  console.log("ContribSettlement deployed to:", settlement.address);
  console.log("\nDeployment completed!");
  console.log("================================");
  console.log("Contract Address:", settlement.address);
  console.log("Admin Address:", adminAddress);
  console.log("Payment Token:", USDC_SEPOLIA);
  console.log("================================");

  // 等待区块确认后验证合约
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\nWaiting for block confirmations...");
    await settlement.deployTransaction.wait(5);

    try {
      await hre.run("verify:verify", {
        address: settlement.address,
        constructorArguments: [USDC_SEPOLIA, adminAddress],
      });
      console.log("Contract verified on Etherscan!");
    } catch (error: any) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
