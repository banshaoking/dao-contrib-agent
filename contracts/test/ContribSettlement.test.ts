import { expect } from "chai";
import { ethers } from "hardhat";
import { ContribSettlement, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ContribSettlement", function () {
  let settlement: ContribSettlement;
  let mockToken: MockERC20;
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const DEPOSIT_AMOUNT = ethers.parseEther("10000"); // 10K tokens

  beforeEach(async function () {
    [admin, user1, user2, user3] = await ethers.getSigners();

    // 部署 Mock ERC20 代币
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Test USDC", "TUSDC", INITIAL_SUPPLY);
    await mockToken.waitForDeployment();

    // 部署 ContribSettlement 合约
    const Settlement = await ethers.getContractFactory("ContribSettlement");
    settlement = await Settlement.deploy(
      await mockToken.getAddress(),
      admin.address
    );
    await settlement.waitForDeployment();

    // 向合约存入代币
    await mockToken.approve(await settlement.getAddress(), DEPOSIT_AMOUNT);
    await settlement.deposit(DEPOSIT_AMOUNT);
  });

  describe("Deployment", function () {
    it("Should set the correct payment token", async function () {
      expect(await settlement.paymentToken()).to.equal(
        await mockToken.getAddress()
      );
    });

    it("Should set the correct admin", async function () {
      expect(
        await settlement.hasRole(
          await settlement.DEFAULT_ADMIN_ROLE(),
          admin.address
        )
      ).to.be.true;
    });

    it("Should have initial balance", async function () {
      expect(await settlement.getBalance()).to.equal(DEPOSIT_AMOUNT);
    });
  });

  describe("Record Contributions", function () {
    it("Should record contributions correctly", async function () {
      const contributors = [user1.address, user2.address];
      const amounts = [ethers.parseEther("100"), ethers.parseEther("200")];
      const platforms = ["github", "github"];
      const ids = ["pr-1", "pr-2"];

      await settlement.recordContributions(
        contributors,
        amounts,
        platforms,
        ids
      );

      expect(await settlement.settlementCounter()).to.equal(2);

      const contrib1 = await settlement.getContribution(0);
      expect(contrib1.contributor).to.equal(user1.address);
      expect(contrib1.amount).to.equal(amounts[0]);
      expect(contrib1.platform).to.equal("github");
      expect(contrib1.settled).to.be.false;
    });

    it("Should reject if arrays length mismatch", async function () {
      await expect(
        settlement.recordContributions(
          [user1.address],
          [ethers.parseEther("100"), ethers.parseEther("200")],
          ["github"],
          ["pr-1"]
        )
      ).to.be.revertedWith("Array lengths mismatch");
    });

    it("Should reject if caller is not admin", async function () {
      await expect(
        settlement
          .connect(user1)
          .recordContributions(
            [user1.address],
            [ethers.parseEther("100")],
            ["github"],
            ["pr-1"]
          )
      ).to.be.revertedWith("ContribSettlement: caller is not settle admin");
    });

    it("Should track user contributions", async function () {
      await settlement.recordContributions(
        [user1.address, user1.address],
        [ethers.parseEther("100"), ethers.parseEther("200")],
        ["github", "discord"],
        ["pr-1", "msg-1"]
      );

      const userContribs = await settlement.getUserContributions(user1.address);
      expect(userContribs.length).to.equal(2);
    });
  });

  describe("Settlement", function () {
    beforeEach(async function () {
      // 记录贡献
      await settlement.recordContributions(
        [user1.address, user2.address, user3.address],
        [
          ethers.parseEther("100"),
          ethers.parseEther("200"),
          ethers.parseEther("300"),
        ],
        ["github", "github", "discord"],
        ["pr-1", "pr-2", "msg-1"]
      );
    });

    it("Should settle batch correctly", async function () {
      const contributionIds = [0, 1, 2];
      const totalAmount = ethers.parseEther("600");

      await expect(
        settlement.settleBatch(contributionIds, "rule-hash-1")
      )
        .to.emit(settlement, "SettlementExecuted")
        .withArgs(3, totalAmount, 3, admin.address); // ID 3 because counter starts from 0 and we recorded 3 + batch ID

      // 检查贡献已结算
      const contrib1 = await settlement.getContribution(0);
      expect(contrib1.settled).to.be.true;

      const contrib2 = await settlement.getContribution(1);
      expect(contrib2.settled).to.be.true;

      // 检查用户余额
      expect(await mockToken.balanceOf(user1.address)).to.equal(
        ethers.parseEther("100")
      );
      expect(await mockToken.balanceOf(user2.address)).to.equal(
        ethers.parseEther("200")
      );

      // 检查总结算额
      expect(await settlement.totalSettled()).to.equal(totalAmount);
    });

    it("Should reject settling already settled contributions", async function () {
      await settlement.settleBatch([0, 1], "rule-1");

      await expect(
        settlement.settleBatch([0], "rule-2")
      ).to.be.revertedWith("Already settled");
    });

    it("Should reject settling non-existent contribution", async function () {
      await expect(
        settlement.settleBatch([999], "rule-1")
      ).to.be.revertedWith("Contribution not found");
    });

    it("Should reject if insufficient balance", async function () {
      // 先提取大部分资金
      await settlement.withdraw(ethers.parseEther("9500"));

      await expect(
        settlement.settleBatch([0, 1, 2], "rule-1")
      ).to.be.revertedWith("Insufficient contract balance");
    });

    it("Should return correct pending amount", async function () {
      const pending = await settlement.getPendingAmount(user1.address);
      expect(pending).to.equal(ethers.parseEther("100"));

      // 结算后应该为 0
      await settlement.settleBatch([0], "rule-1");
      const pendingAfter = await settlement.getPendingAmount(user1.address);
      expect(pendingAfter).to.equal(0);
    });
  });

  describe("Fund Management", function () {
    it("Should allow deposits", async function () {
      const amount = ethers.parseEther("5000");

      await mockToken.approve(await settlement.getAddress(), amount);
      await expect(settlement.deposit(amount))
        .to.emit(settlement, "TokensDeposited")
        .withArgs(admin.address, amount);

      expect(await settlement.getBalance()).to.equal(
        DEPOSIT_AMOUNT + amount
      );
    });

    it("Should allow admin withdrawal", async function () {
      const amount = ethers.parseEther("1000");

      await expect(settlement.withdraw(amount))
        .to.emit(settlement, "TokensWithdrawn")
        .withArgs(admin.address, amount);

      expect(await settlement.getBalance()).to.equal(
        DEPOSIT_AMOUNT - amount
      );
    });

    it("Should reject withdrawal by non-admin", async function () {
      await expect(
        settlement.connect(user1).withdraw(ethers.parseEther("1000"))
      ).to.be.revertedWith("ContribSettlement: caller is not settle admin");
    });

    it("Should reject withdrawal exceeding balance", async function () {
      await expect(
        settlement.withdraw(ethers.parseEther("20000"))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to grant settle admin role", async function () {
      const SETTLE_ADMIN_ROLE = await settlement.SETTLE_ADMIN_ROLE();

      await settlement.grantRole(SETTLE_ADMIN_ROLE, user1.address);
      expect(await settlement.hasRole(SETTLE_ADMIN_ROLE, user1.address)).to.be
        .true;
    });

    it("Should allow granted admin to record contributions", async function () {
      const SETTLE_ADMIN_ROLE = await settlement.SETTLE_ADMIN_ROLE();

      await settlement.grantRole(SETTLE_ADMIN_ROLE, user1.address);

      await expect(
        settlement
          .connect(user1)
          .recordContributions(
            [user2.address],
            [ethers.parseEther("100")],
            ["github"],
            ["pr-1"]
          )
      ).to.not.be.reverted;
    });
  });
});
