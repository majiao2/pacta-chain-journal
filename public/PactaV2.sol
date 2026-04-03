// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Pacta V2 — 习惯挑战合约
 *
 * 机制：
 * 1. 创建挑战时一次性质押全部天数的 AVAX（msg.value = 总质押）
 * 2. 每天打卡一次（24h 间隔），合约记录 checkinCount 和 streak
 * 3. 打卡满 durationDays 天后自动标记完成，用户可领取：
 *    - 返还全部质押
 *    - 额外奖励 = 奖励池 × 10%（可调）
 * 4. 未完成的挑战，质押留在奖励池中
 */
contract Pacta {
    struct Pact {
        address user;
        string  habitName;
        uint256 stakeAmount;
        uint256 frequency;      // 0=每天 1=工作日 2=自定义
        uint256 startTime;
        uint256 lastCheckin;
        uint256 durationDays;
        bool    completed;
        uint256 checkinCount;   // 已打卡天数
        uint256 streak;         // 连续打卡天数
        bool    claimed;        // 是否已领取奖励
    }

    mapping(uint256 => Pact) public pacts;
    uint256 public pactCounter;
    uint256 public rewardPool;

    // 奖励比例：完成后从奖励池获取的百分比（默认 10%）
    uint256 public rewardPercent = 10;

    address public owner;

    event PactCreated(uint256 indexed pactId, address indexed user, string habitName, uint256 stake, uint256 durationDays);
    event CheckedIn(uint256 indexed pactId, uint256 checkinCount, uint256 streak);
    event PactCompleted(uint256 indexed pactId);
    event RewardClaimed(uint256 indexed pactId, uint256 stakeReturned, uint256 bonus);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createPact(
        string calldata habitName,
        uint256 frequency,
        uint256 durationDays
    ) external payable {
        require(msg.value > 0, "Must stake AVAX");
        require(durationDays > 0, "Duration must be > 0");

        uint256 id = pactCounter;
        pactCounter++;

        pacts[id] = Pact({
            user: msg.sender,
            habitName: habitName,
            stakeAmount: msg.value,
            frequency: frequency,
            startTime: block.timestamp,
            lastCheckin: 0,
            durationDays: durationDays,
            completed: false,
            checkinCount: 0,
            streak: 0,
            claimed: false
        });

        // 质押进入奖励池
        rewardPool += msg.value;

        emit PactCreated(id, msg.sender, habitName, msg.value, durationDays);
    }

    function checkin(uint256 pactId) external {
        Pact storage p = pacts[pactId];
        require(p.user == msg.sender, "Not your pact");
        require(!p.completed, "Already completed");

        // 每 24 小时只能打卡一次
        if (p.lastCheckin > 0) {
            require(
                block.timestamp >= p.lastCheckin + 20 hours,
                "Already checked in today"
            );
        }

        // 判断是否连续（36h 内算连续）
        if (p.lastCheckin > 0 && block.timestamp <= p.lastCheckin + 36 hours) {
            p.streak++;
        } else if (p.lastCheckin == 0) {
            p.streak = 1;
        } else {
            p.streak = 1; // 断签重置
        }

        p.lastCheckin = block.timestamp;
        p.checkinCount++;

        emit CheckedIn(pactId, p.checkinCount, p.streak);

        // 打卡满天数 → 自动完成
        if (p.checkinCount >= p.durationDays) {
            p.completed = true;
            emit PactCompleted(pactId);
        }
    }

    function claimReward(uint256 pactId) external {
        Pact storage p = pacts[pactId];
        require(p.user == msg.sender, "Not your pact");
        require(p.completed, "Not completed yet");
        require(!p.claimed, "Already claimed");

        p.claimed = true;

        // 返还质押
        uint256 stakeReturn = p.stakeAmount;

        // 从奖励池中额外奖励
        // 奖励池中扣除质押部分后，取 rewardPercent%
        uint256 poolAfterStake = rewardPool > stakeReturn ? rewardPool - stakeReturn : 0;
        uint256 bonus = (poolAfterStake * rewardPercent) / 100;

        uint256 total = stakeReturn + bonus;
        require(rewardPool >= total, "Insufficient pool");
        rewardPool -= total;

        (bool ok, ) = payable(msg.sender).call{value: total}("");
        require(ok, "Transfer failed");

        emit RewardClaimed(pactId, stakeReturn, bonus);
    }

    // 管理员调整奖励百分比
    function setRewardPercent(uint256 _pct) external onlyOwner {
        require(_pct <= 50, "Max 50%");
        rewardPercent = _pct;
    }

    // 读取接口
    function getPact(uint256 pactId) external view returns (Pact memory) {
        return pacts[pactId];
    }

    function getRewardPool() external view returns (uint256) {
        return rewardPool;
    }

    receive() external payable {
        rewardPool += msg.value;
    }
}
