// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ContribSettlement
 * @notice DAO 贡献结算智能合约 - 支持批量转账和贡献记录
 * @dev 使用 AccessControl 进行权限管理，ReentrancyGuard 防止重入攻击
 */
contract ContribSettlement is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ========================================
    // 状态变量
    // ========================================

    /// @notice 结算管理员角色
    bytes32 public constant SETTLE_ADMIN_ROLE = keccak256("SETTLE_ADMIN_ROLE");

    /// @notice 支付的 ERC20 代币地址
    IERC20 public paymentToken;

    /// @notice 结算记录 ID 计数器
    uint256 public settlementCounter;

    /// @notice 贡献记录结构
    struct Contribution {
        uint256 id;            // 记录 ID
        address contributor;   // 贡献者地址
        uint256 amount;        // 奖励金额 (wei)
        string platform;       // 平台 (github/discord)
        string contributionId; // 外部贡献 ID
        uint256 timestamp;     // 记录时间
        bool settled;          // 是否已结算
    }

    /// @notice 结算批次结构
    struct SettlementBatch {
        uint256 id;              // 批次 ID
        uint256 totalAmount;     // 总金额
        uint256 contributorCount;// 贡献者数量
        uint256 timestamp;       // 结算时间
        address executor;        // 执行者
        string ruleHash;         // 规则哈希 (IPFS 或链上)
    }

    // ========================================
    // 存储
    // ========================================

    /// @notice 贡献记录映射 (记录ID => Contribution)
    mapping(uint256 => Contribution) public contributions;

    /// @notice 结算批次映射 (批次ID => SettlementBatch)
    mapping(uint256 => SettlementBatch) public settlementBatches;

    /// @notice 用户贡献记录 ID 列表
    mapping(address => uint256[]) public userContributions;

    /// @notice 已结算总额
    uint256 public totalSettled;

    // ========================================
    // 事件
    // ========================================

    event ContributionRecorded(
        uint256 indexed id,
        address indexed contributor,
        uint256 amount,
        string platform,
        string contributionId
    );

    event SettlementExecuted(
        uint256 indexed batchId,
        uint256 totalAmount,
        uint256 contributorCount,
        address indexed executor
    );

    event ContributionSettled(
        uint256 indexed contributionId,
        address indexed contributor,
        uint256 amount
    );

    event TokensDeposited(address indexed depositor, uint256 amount);
    event TokensWithdrawn(address indexed admin, uint256 amount);

    // ========================================
    // 修饰器
    // ========================================

    modifier onlySettleAdmin() {
        require(
            hasRole(SETTLE_ADMIN_ROLE, msg.sender),
            "ContribSettlement: caller is not settle admin"
        );
        _;
    }

    // ========================================
    // 构造函数
    // ========================================

    /**
     * @notice 构造函数
     * @param _paymentToken 支付代币地址 (如 USDT, USDC)
     * @param _admin 初始管理员地址
     */
    constructor(address _paymentToken, address _admin) {
        require(_paymentToken != address(0), "Invalid token address");
        require(_admin != address(0), "Invalid admin address");

        paymentToken = IERC20(_paymentToken);

        // 授予默认管理员角色
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(SETTLE_ADMIN_ROLE, _admin);
    }

    // ========================================
    // 外部函数 - 贡献记录
    // ========================================

    /**
     * @notice 批量记录贡献
     * @param _contributors 贡献者地址数组
     * @param _amounts 奖励金额数组
     * @param _platforms 平台名称数组
     * @param _contributionIds 外部贡献 ID 数组
     */
    function recordContributions(
        address[] calldata _contributors,
        uint256[] calldata _amounts,
        string[] calldata _platforms,
        string[] calldata _contributionIds
    ) external onlySettleAdmin {
        require(
            _contributors.length == _amounts.length &&
            _contributors.length == _platforms.length &&
            _contributors.length == _contributionIds.length,
            "Array lengths mismatch"
        );

        for (uint256 i = 0; i < _contributors.length; i++) {
            uint256 recordId = settlementCounter++;

            contributions[recordId] = Contribution({
                id: recordId,
                contributor: _contributors[i],
                amount: _amounts[i],
                platform: _platforms[i],
                contributionId: _contributionIds[i],
                timestamp: block.timestamp,
                settled: false
            });

            userContributions[_contributors[i]].push(recordId);

            emit ContributionRecorded(
                recordId,
                _contributors[i],
                _amounts[i],
                _platforms[i],
                _contributionIds[i]
            );
        }
    }

    // ========================================
    // 外部函数 - 结算执行
    // ========================================

    /**
     * @notice 批量结算贡献奖励
     * @param _contributionIds 要结算的贡献记录 ID 数组
     * @param _ruleHash 规则哈希 (用于审计追踪)
     */
    function settleBatch(
        uint256[] calldata _contributionIds,
        string calldata _ruleHash
    ) external nonReentrant onlySettleAdmin {
        require(_contributionIds.length > 0, "Empty contribution list");

        uint256 batchId = settlementCounter++;
        uint256 totalAmount = 0;
        uint256 settledCount = 0;

        // 创建临时数组存储结算信息
        address[] memory recipients = new address[](_contributionIds.length);
        uint256[] memory amounts = new uint256[](_contributionIds.length);

        // 第一遍：验证并收集结算信息
        for (uint256 i = 0; i < _contributionIds.length; i++) {
            Contribution storage contrib = contributions[_contributionIds[i]];

            require(contrib.id == _contributionIds[i], "Contribution not found");
            require(!contrib.settled, "Already settled");
            require(contrib.amount > 0, "Zero amount");

            recipients[i] = contrib.contributor;
            amounts[i] = contrib.amount;
            totalAmount += contrib.amount;
        }

        // 检查合约余额
        require(
            paymentToken.balanceOf(address(this)) >= totalAmount,
            "Insufficient contract balance"
        );

        // 第二遍：执行批量转账
        for (uint256 i = 0; i < _contributionIds.length; i++) {
            Contribution storage contrib = contributions[_contributionIds[i]];

            contrib.settled = true;
            settledCount++;

            emit ContributionSettled(
                _contributionIds[i],
                contrib.contributor,
                contrib.amount
            );
        }

        // 使用 SafeERC20 批量转账
        // 注意：这里为了简化，逐个转账。生产环境可使用 multicall 优化
        for (uint256 i = 0; i < _contributionIds.length; i++) {
            paymentToken.safeTransfer(recipients[i], amounts[i]);
        }

        totalSettled += totalAmount;

        // 记录结算批次
        settlementBatches[batchId] = SettlementBatch({
            id: batchId,
            totalAmount: totalAmount,
            contributorCount: settledCount,
            timestamp: block.timestamp,
            executor: msg.sender,
            ruleHash: _ruleHash
        });

        emit SettlementExecuted(
            batchId,
            totalAmount,
            settledCount,
            msg.sender
        );
    }

    // ========================================
    // 外部函数 - 资金管理
    // ========================================

    /**
     * @notice 存入代币到合约
     * @param _amount 存入金额
     */
    function deposit(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");

        paymentToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit TokensDeposited(msg.sender, _amount);
    }

    /**
     * @notice 管理员提取代币
     * @param _amount 提取金额
     */
    function withdraw(uint256 _amount) external onlySettleAdmin {
        require(_amount > 0, "Amount must be > 0");
        require(
            paymentToken.balanceOf(address(this)) >= _amount,
            "Insufficient balance"
        );

        paymentToken.safeTransfer(msg.sender, _amount);

        emit TokensWithdrawn(msg.sender, _amount);
    }

    // ========================================
    // 视图函数
    // ========================================

    /**
     * @notice 获取合约代币余额
     * @return 余额
     */
    function getBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }

    /**
     * @notice 获取用户的贡献记录
     * @param _user 用户地址
     * @return 贡献记录 ID 数组
     */
    function getUserContributions(
        address _user
    ) external view returns (uint256[] memory) {
        return userContributions[_user];
    }

    /**
     * @notice 获取贡献详情
     * @param _contributionId 贡献记录 ID
     * @return 贡献详情
     */
    function getContribution(
        uint256 _contributionId
    ) external view returns (Contribution memory) {
        require(
            contributions[_contributionId].contributor != address(0),
            "Contribution not found"
        );
        return contributions[_contributionId];
    }

    /**
     * @notice 获取结算批次详情
     * @param _batchId 批次 ID
     * @return 批次详情
     */
    function getSettlementBatch(
        uint256 _batchId
    ) external view returns (SettlementBatch memory) {
        require(
            settlementBatches[_batchId].executor != address(0),
            "Batch not found"
        );
        return settlementBatches[_batchId];
    }

    /**
     * @notice 获取用户待结算金额
     * @param _user 用户地址
     * @return 待结算金额
     */
    function getPendingAmount(
        address _user
    ) external view returns (uint256) {
        uint256 pending = 0;
        uint256[] memory contribIds = userContributions[_user];

        for (uint256 i = 0; i < contribIds.length; i++) {
            Contribution storage contrib = contributions[contribIds[i]];
            if (!contrib.settled) {
                pending += contrib.amount;
            }
        }

        return pending;
    }
}
