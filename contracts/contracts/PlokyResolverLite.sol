// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PlokyResolverLite is AccessControl, ReentrancyGuard {
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    bytes32 public constant AI_ORACLE_ROLE = keccak256("AI_ORACLE_ROLE");
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");

    IERC20 public plkyToken;
    uint256 public quorum;
    uint256 public constant VERDICT_BOND = 100e18;
    uint256 public constant DISPUTE_BOND = 50e18;
    uint256 public constant STAKE_MIN = 1000e18;

    enum QStatus { OPEN, PROPOSED, TIMELOCK, RESOLVED, CANCELLED }
    enum Outcome { UNRESOLVED, YES, NO, DISPUTED }
    enum Tier { OBJECTIVE, SEMI_SUBJECTIVE, FULLY_SUBJECTIVE }

    struct Question {
        string title;
        bytes32 evidenceCID;
        uint256 resolutionTime;
        QStatus status;
        Outcome outcome;
        Tier tier;
        uint256 disputeCount;
        bool isFrozen;
        address resolvedBy;
        bytes32 activeProposalId;
        uint256 aiConfidence;
        Outcome aiOutcome;
    }

    struct Proposal {
        Outcome outcome;
        bytes32 reasonCID;
        uint256 approvals;
        uint256 required;
        uint256 timelockUntil;
        bool executed;
        address proposer;
    }

    struct Dispute {
        address disputer;
        string reason;
        bytes32 evidenceCID;
        uint256 bondAmount;
        bool resolved;
        bool bondReturned;
    }

    mapping(bytes32 => Question) public questions;
    mapping(bytes32 => Proposal) public proposals;
    mapping(bytes32 => Dispute[]) public disputes;
    mapping(address => uint256) public stakes;
    bytes32[] public questionIds;

    event QuestionCreated(bytes32 id, string title, address creator, uint256 time, string category, uint8 tier);
    event EvidenceSubmitted(bytes32 qId, address submitter, bytes32 cid, uint8 etype);
    event VerdictProposed(bytes32 qId, bytes32 pid, uint8 outcome, address proposer);
    event VerdictApproved(bytes32 qId, bytes32 pid, address approver);
    event VerdictExecuted(bytes32 qId, uint8 outcome, address executor);
    event DisputeRaised(bytes32 qId, uint256 idx, address disputer);
    event DisputeResolved(bytes32 qId, uint256 idx, bool accepted);
    event AIAnalysis(bytes32 qId, uint256 confidence, uint8 outcome);
    event Staked(address resolver, uint256 amount);
    event Unstaked(address resolver, uint256 amount);
    event QuestionCancelled(bytes32 id, address by);

    constructor(address _plky, address _admin, uint256 _quorum) {
        plkyToken = IERC20(_plky);
        quorum = _quorum;
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(RESOLVER_ROLE, _admin);
        _grantRole(AI_ORACLE_ROLE, _admin);
        _grantRole(ARBITER_ROLE, _admin);
    }

    function stake(uint256 amount) external {
        require(amount >= STAKE_MIN, "Min 1000 PLKY");
        require(plkyToken.transferFrom(msg.sender, address(this), amount), "Stake failed");
        stakes[msg.sender] += amount;
        _grantRole(RESOLVER_ROLE, msg.sender);
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant onlyRole(RESOLVER_ROLE) {
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        stakes[msg.sender] -= amount;
        if (stakes[msg.sender] < STAKE_MIN) _revokeRole(RESOLVER_ROLE, msg.sender);
        require(plkyToken.transfer(msg.sender, amount), "Unstake failed");
        emit Unstaked(msg.sender, amount);
    }

    function createQuestion(
        string calldata title,
        bytes32 evidenceCID,
        string calldata category,
        uint256 resolutionTime,
        Tier tier
    ) external returns (bytes32) {
        bytes32 id = keccak256(abi.encodePacked(title, block.timestamp, msg.sender));
        questions[id] = Question({
            title: title,
            evidenceCID: evidenceCID,
            resolutionTime: resolutionTime,
            status: QStatus.OPEN,
            outcome: Outcome.UNRESOLVED,
            tier: tier,
            disputeCount: 0,
            isFrozen: false,
            resolvedBy: address(0),
            activeProposalId: bytes32(0),
            aiConfidence: 0,
            aiOutcome: Outcome.UNRESOLVED
        });
        questionIds.push(id);
        emit QuestionCreated(id, title, msg.sender, resolutionTime, category, uint8(tier));
        return id;
    }

    function submitEvidence(bytes32 qId, bytes32 cid, uint8 etype) external {
        require(questions[qId].status == QStatus.OPEN || questions[qId].status == QStatus.PROPOSED, "Not open");
        emit EvidenceSubmitted(qId, msg.sender, cid, etype);
    }

    function proposeVerdict(bytes32 qId, Outcome outcome, bytes32 reasonCID) external nonReentrant onlyRole(RESOLVER_ROLE) {
        Question storage q = questions[qId];
        require(q.status == QStatus.OPEN, "Not open");
        require(plkyToken.transferFrom(msg.sender, address(this), VERDICT_BOND), "Bond failed");

        bytes32 pid = keccak256(abi.encodePacked(qId, outcome, block.timestamp, msg.sender));
        proposals[pid] = Proposal({
            outcome: outcome,
            reasonCID: reasonCID,
            approvals: 1,
            required: quorum,
            timelockUntil: block.timestamp + 24 hours,
            executed: false,
            proposer: msg.sender
        });
        q.activeProposalId = pid;
        q.status = QStatus.PROPOSED;
        emit VerdictProposed(qId, pid, uint8(outcome), msg.sender);
    }

    function approveVerdict(bytes32 qId, bytes32 pid) external onlyRole(RESOLVER_ROLE) {
        Proposal storage p = proposals[pid];
        require(!p.executed, "Executed");
        p.approvals++;
        emit VerdictApproved(qId, pid, msg.sender);

        if (p.approvals >= p.required) {
            questions[qId].status = QStatus.TIMELOCK;
        }
    }

    function executeVerdict(bytes32 qId) external nonReentrant {
        Question storage q = questions[qId];
        require(q.status == QStatus.TIMELOCK, "Not timelock");
        Proposal storage p = proposals[q.activeProposalId];
        require(block.timestamp >= p.timelockUntil, "Timelock active");
        require(!p.executed, "Already executed");

        p.executed = true;
        q.status = QStatus.RESOLVED;
        q.outcome = p.outcome;
        q.resolvedBy = p.proposer;

        require(plkyToken.transfer(p.proposer, VERDICT_BOND), "Return failed");
        emit VerdictExecuted(qId, uint8(p.outcome), msg.sender);
    }

    function raiseDispute(bytes32 qId, string calldata reason, bytes32 evidenceCID) external nonReentrant {
        Question storage q = questions[qId];
        require(q.status == QStatus.RESOLVED, "Not resolved");
        require(plkyToken.transferFrom(msg.sender, address(this), DISPUTE_BOND), "Bond failed");

        disputes[qId].push(Dispute({
            disputer: msg.sender,
            reason: reason,
            evidenceCID: evidenceCID,
            bondAmount: DISPUTE_BOND,
            resolved: false,
            bondReturned: false
        }));
        q.disputeCount++;
        q.status = QStatus.OPEN;
        emit DisputeRaised(qId, disputes[qId].length - 1, msg.sender);
    }

    function resolveDispute(bytes32 qId, uint256 idx, bool accept) external nonReentrant onlyRole(ARBITER_ROLE) {
        Dispute storage d = disputes[qId][idx];
        require(!d.resolved, "Already resolved");
        d.resolved = true;

        if (accept) {
            require(plkyToken.transfer(d.disputer, d.bondAmount + d.bondAmount / 2), "Reward failed");
            d.bondReturned = true;
            Question storage q = questions[qId];
            q.status = QStatus.OPEN;
            q.outcome = Outcome.UNRESOLVED;
        } else {
            require(plkyToken.transfer(address(this), d.bondAmount), "Seize failed");
        }
        emit DisputeResolved(qId, idx, accept);
    }

    function submitAIAnalysis(bytes32 qId, uint256 confidence, Outcome outcome) external onlyRole(AI_ORACLE_ROLE) {
        Question storage q = questions[qId];
        q.aiConfidence = confidence;
        q.aiOutcome = outcome;
        emit AIAnalysis(qId, confidence, uint8(outcome));

        if (q.tier == Tier.OBJECTIVE && confidence >= 8500 && q.status == QStatus.OPEN) {
            q.status = QStatus.RESOLVED;
            q.outcome = outcome;
            emit VerdictExecuted(qId, uint8(outcome), address(0));
        }
    }

    function cancelQuestion(bytes32 qId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        questions[qId].status = QStatus.CANCELLED;
        emit QuestionCancelled(qId, msg.sender);
    }

    function getAllIds() external view returns (bytes32[] memory) {
        return questionIds;
    }

    function getDisputes(bytes32 qId) external view returns (Dispute[] memory) {
        return disputes[qId];
    }

    function getQuestionCount() external view returns (uint256) {
        return questionIds.length;
    }
}
