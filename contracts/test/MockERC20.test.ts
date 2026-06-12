import { expect } from "chai";
import { ethers } from "hardhat";
import { MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MockERC20", function () {
  let token: MockERC20;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Test Token", "TEST", INITIAL_SUPPLY);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal("Test Token");
      expect(await token.symbol()).to.equal("TEST");
    });

    it("Should have 18 decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("Should mint initial supply to owner", async function () {
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should have correct total supply", async function () {
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens correctly", async function () {
      const amount = ethers.parseEther("100");

      await token.transfer(user1.address, amount);

      expect(await token.balanceOf(user1.address)).to.equal(amount);
      expect(await token.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY - amount
      );
    });

    it("Should approve and transfer from", async function () {
      const amount = ethers.parseEther("100");

      await token.approve(user2.address, amount);
      await token
        .connect(user2)
        .transferFrom(owner.address, user1.address, amount);

      expect(await token.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should reject transfer exceeding balance", async function () {
      const amount = ethers.parseEther("2000000"); // More than supply

      await expect(
        token.transfer(user1.address, amount)
      ).to.be.revertedWithoutReason(); // ERC20 standard revert
    });
  });

  describe("Mint", function () {
    it("Should allow owner to mint", async function () {
      const amount = ethers.parseEther("100000");

      await token.mint(user1.address, amount);

      expect(await token.balanceOf(user1.address)).to.equal(amount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY + amount);
    });

    it("Should reject mint by non-owner", async function () {
      const amount = ethers.parseEther("100000");

      await expect(
        token.connect(user1).mint(user2.address, amount)
      ).to.be.revertedWithoutReason(); // Ownable revert
    });
  });

  describe("Burn", function () {
    it("Should allow user to burn their own tokens", async function () {
      const amount = ethers.parseEther("100");

      await token.transfer(user1.address, amount);
      await token.connect(user1).burn(amount);

      expect(await token.balanceOf(user1.address)).to.equal(0);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - amount);
    });

    it("Should reject burn exceeding balance", async function () {
      const amount = ethers.parseEther("100");

      await expect(
        token.connect(user1).burn(amount)
      ).to.be.revertedWithoutReason();
    });
  });

  describe("Batch Transfer", function () {
    it("Should batch transfer tokens", async function () {
      const recipients = [user1.address, user2.address];
      const amounts = [ethers.parseEther("100"), ethers.parseEther("200")];

      await token.batchTransfer(recipients, amounts);

      expect(await token.balanceOf(user1.address)).to.equal(amounts[0]);
      expect(await token.balanceOf(user2.address)).to.equal(amounts[1]);
    });

    it("Should reject batch transfer with mismatched arrays", async function () {
      const recipients = [user1.address, user2.address];
      const amounts = [ethers.parseEther("100")]; // Only one amount

      await expect(
        token.batchTransfer(recipients, amounts)
      ).to.be.revertedWith("MockERC20: recipients and amounts length mismatch");
    });

    it("Should reject batch transfer exceeding balance", async function () {
      const recipients = [user1.address];
      const amounts = [ethers.parseEther("2000000")]; // More than supply

      await expect(
        token.batchTransfer(recipients, amounts)
      ).to.be.revertedWithoutReason();
    });
  });
});
