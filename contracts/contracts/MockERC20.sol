// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @notice 测试用 ERC20 代币合约 - 用于开发和测试环境
 * @dev 继承 OpenZeppelin 的 ERC20 和 Ownable 合约
 */
contract MockERC20 is ERC20, Ownable {
    /**
     * @notice 构造函数
     * @param name 代币名称
     * @param symbol 代币符号
     * @param initialSupply 初始供应量 (wei)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @notice 铸造新代币 (仅限合约所有者)
     * @param to 接收地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice 销毁代币 (任何持有者都可以销毁自己的代币)
     * @param amount 销毁数量
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice 批量空投代币
     * @param recipients 接收地址数组
     * @param amounts 空投数量数组
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        require(
            recipients.length == amounts.length,
            "MockERC20: recipients and amounts length mismatch"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }

    /**
     * @notice 获取代币小数位数
     * @return 小数位数 (默认为 18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
