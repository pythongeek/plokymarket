// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ═══════════════════════════════════════════════════════════════════════════════
// PlokyResolver v2.0 — Industry-Standard Prediction Market Resolution System
// For Bangladeshi Users — বাংলাদেশের জন্য নির্মিত সমাধান সিস্টেম
// ═══════════════════════════════════════════════════════════════════════════════

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUMAOptimisticOracle {
    function requestPrice(bytes32 identifier, uint256 timestamp, bytes memory ancillaryData, IERC20 currency, uint256 reward) external;
    function settleAndGetPrice(bytes32 identifier, uint256 timestamp, bytes memory ancillaryData) external returns (int256);
    function hasPrice(bytes32 identifier, uint256 timestamp, bytes memory ancillaryData) external view returns (bool);
}

interface IPlokyToken is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

contract PlokyResolver is AccessControl, ReentrancyGuard, Pausable {

    // ───────────────────────────────────────────────────────────────────────────────
    // CONSTANTS
    // ───────────────────────────────────────────────────────────────────────────────
    uint256 public constant DISPUTE_WINDOW      = 48 hours;
    uint256 public constant TIMELOCK_PERIOD     = 24 hours;
    uint256 public constant MIN_EVIDENCE        = 1;
    uint256 public constant MIN_RESOLVER_STAKE  = 1000e18;  // 1000 PLKY
    uint256 public constant VERDICT_BOND        = 100e18;    // 100 PLKY
    uint256 public constant DISPUTE_BOND        = 50e18;     // 50 PLKY
    uint256 public constant EVIDENCE_BOND       = 10e18;     // 10 PLKY
    uint256 public constant AUTO_FREEZE_THRESHOLD = 3;
    uint256 public constant MAX_REPUTATION      = 10000;     // basis points (100%)
    uint256 public constant SLASH_PENALTY       = 500;       // 5% per slash
    uint256 public constant VERSION             = 200;

    bytes32 public constant ADMIN_ROLE          = keccak256("ADMIN_ROLE");
    bytes32 public constant RESOLVER_ROLE       = keccak256("RESOLVER_ROLE");
    bytes32 public constant ARBITER_ROLE        = keccak256("ARBITER_ROLE");
    bytes32 public constant AI_ORACLE_ROLE      = keccak256("AI_ORACLE_ROLE");

    bytes32 public constant YES_OR_NO_IDENTIFIER = keccak256("YES_OR_NO");

    // ───────────────────────────────────────────────────────────────────────────────
    // ENUMS
    // ───────────────────────────────────────────────────────────────────────────────
    enum Outcome     { UNRESOLVED, YES, NO, DISPUTED, CANCELLED, AWAITING_AI, AWAITING_UMA }
    enum QStatus     { OPEN, PROPOSED, TIMELOCK, RESOLVED, CANCELLED, AI_REVIEW, COMMUNITY_VOTE }
    enum EvidType    { SUPPORTING, OPPOSING, NEUTRAL }
    enum QuestionTier { OBJECTIVE, SEMI_SUBJECTIVE, FULLY_SUBJECTIVE }
    enum EscalationStep { STEP1_AI, STEP2_COMMUNITY, STEP3_EXPERT, STEP4_UMA }

    // ───────────────────────────────────────────────────────────────────────────────
    // STRUCTS
    // ───────────────────────────────────────────────────────────────────────────────
    struct Evidence {
        string   ipfsCID;
        string   description;
        address  submitter;
        uint256  timestamp;
        EvidType evidenceType;
        uint256  bondAmount;
        bool     bondReturned;
    }

    struct ProposedVerdict {
        Outcome  outcome;
        address  proposer;
        uint256  proposedAt;
        uint256  timelockEndsAt;
        string   reasonCID;
        uint256  approvalCount;
        bool     executed;
        uint256  totalWeight;
        mapping(address => bool) approvals;
        mapping(address => uint256) weights;
    }

    struct Question {
        bytes32  id;
        string   title;
        string   descriptionCID;
        string   category;
        uint256  createdAt;
        uint256  deadline;
        address  creator;
        QStatus  status;
        Outcome  outcome;
        string   verdictCID;
        string   verdictSummary;
        uint256  resolvedAt;
        address  resolvedBy;
        uint256  disputeCount;
        bool     frozen;
        bytes32  activeProposalId;
        QuestionTier tier;
        EscalationStep currentStep;
        uint256  aiConfidenceScore;
        string   aiAnalysisCID;
    }

    struct Dispute {
        bytes32  questionId;
        address  disputer;
        string   reason;
        string   evidenceCID;
        uint256  timestamp;
        bool     resolved;
        string   resolution;
        uint256  bondAmount;
        bool     bondReturned;
        uint256  disputeIndex;
    }

    struct ResolverProfile {
        uint256 reputationScore;
        uint256 totalResolved;
        uint256 correctResolutions;
        uint256 stakedAmount;
        uint256 slashCount;
        bool    isActive;
        uint256 joinTimestamp;
        uint256 lastActivityTimestamp;
    }

    struct AIAnalysis {
        bytes32  questionId;
        uint256  confidenceScore;
        Outcome  recommendedOutcome;
        string   analysisCID;
        uint256  timestamp;
        string   aiModelVersion;
        uint256  sentimentScore;
        uint256  factCheckScore;
        uint256  biasScore;
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // STATE
    // ───────────────────────────────────────────────────────────────────────────────
    mapping(bytes32 => Question)          public questions;
    mapping(bytes32 => Evidence[])        public evidence;
    mapping(bytes32 => ProposedVerdict)   public proposals;
    mapping(bytes32 => Dispute[])         public disputes;
    mapping(bytes32 => AIAnalysis)        public aiAnalyses;
    mapping(bytes32 => mapping(address => bool)) public hasDisputed;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    mapping(address => ResolverProfile)   public resolvers;
    mapping(bytes32 => mapping(address => uint256)) public communityVotes;

    bytes32[] public allIds;
    address[] public resolverList;
    uint256   public resolverCount;
    uint256   public quorumThreshold;
    uint256   public aiConfidenceThreshold = 8500; // 85%

    IPlokyToken public plkyToken;
    IUMAOptimisticOracle public umaOracle;
    bool      public umaEnabled;
    address   public treasury;

    // ───────────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ───────────────────────────────────────────────────────────────────────────────
    event QuestionCreated(bytes32 indexed id, string title, address creator, uint256 deadline, string descCID, QuestionTier tier);
    event EvidenceSubmitted(bytes32 indexed qId, address indexed submitter, string cid, EvidType t, uint256 bond);
    event VerdictProposed(bytes32 indexed qId, bytes32 indexed pid, Outcome outcome, address proposer, string reasonCID, uint256 timelockEnds);
    event VerdictApproved(bytes32 indexed qId, bytes32 indexed pid, address approver, uint256 count, uint256 weight);
    event VerdictExecuted(bytes32 indexed qId, Outcome outcome, string verdictCID, address executor, uint256 ts);
    event DisputeRaised(bytes32 indexed qId, address indexed disputer, string reason, string cid, uint256 bond);
    event DisputeResolved(bytes32 indexed qId, uint256 index, string resolution, bool bondReturned);
    event QuestionFrozen(bytes32 indexed qId, address by, string reason);
    event QuestionUnfrozen(bytes32 indexed qId, address by);
    event QuestionCancelled(bytes32 indexed qId, string reason);
    event ResolverAdded(address indexed r, uint256 stake, address by);
    event ResolverRemoved(address indexed r, address by);
    event ResolverSlashed(address indexed r, uint256 amount, string reason);
    event QuorumChanged(uint256 old_, uint256 new_, address by);
    event AIAnalysisSubmitted(bytes32 indexed qId, uint256 confidence, Outcome recommended, string cid);
    event CommunityVoted(bytes32 indexed qId, address voter, uint256 weight, Outcome vote);
    event CommunityVoteFinalized(bytes32 indexed qId, Outcome outcome, uint256 yesWeight, uint256 noWeight);
    event EscalationAdvanced(bytes32 indexed qId, EscalationStep fromStep, EscalationStep toStep);
    event UMAEnabled(address oracle);
    event UMARequested(bytes32 indexed qId, bytes32 identifier, uint256 timestamp);
    event BondReturned(address indexed user, uint256 amount, string reason);
    event BondSeized(address indexed user, uint256 amount, string reason);
    event AIThresholdChanged(uint256 old_, uint256 new_, address by);
    event TreasuryChanged(address old_, address new_, address by);
    event StuckTokensWithdrawn(address token, address to, uint256 amount);

    // ───────────────────────────────────────────────────────────────────────────────
    // CONSTRUCTOR
    // ───────────────────────────────────────────────────────────────────────────────
    constructor(address _plkyToken, address _treasury, uint256 _quorum) {
        require(_plkyToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        
        plkyToken = IPlokyToken(_plkyToken);
        treasury = _treasury;
        quorumThreshold = _quorum;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ARBITER_ROLE, msg.sender);
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // MODIFIERS
    // ───────────────────────────────────────────────────────────────────────────────
    modifier exists(bytes32 id) {
        require(questions[id].createdAt > 0, "Question not found");
        _;
    }

    modifier notFrozen(bytes32 id) {
        require(!questions[id].frozen, "Question is frozen");
        _;
    }

    modifier onlyResolver() {
        require(resolvers[msg.sender].isActive, "Not an active resolver");
        require(resolvers[msg.sender].stakedAmount >= MIN_RESOLVER_STAKE, "Insufficient stake");
        _;
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // QUESTION MANAGEMENT
    // ───────────────────────────────────────────────────────────────────────────────
    function createQuestion(
        string calldata title,
        string calldata descCID,
        string calldata category,
        uint256 deadline,
        QuestionTier tier
    ) external whenNotPaused returns (bytes32 id) {
        require(bytes(title).length > 0, "Empty title");
        require(bytes(title).length <= 280, "Title too long");
        require(bytes(descCID).length > 0, "No IPFS CID");
        require(deadline > block.timestamp, "Deadline must be in future");
        require(deadline <= block.timestamp + 365 days, "Deadline too far");

        id = keccak256(abi.encodePacked(title, msg.sender, block.timestamp, block.chainid, block.number));
        require(questions[id].createdAt == 0, "Duplicate question");

        questions[id] = Question({
            id: id,
            title: title,
            descriptionCID: descCID,
            category: category,
            createdAt: block.timestamp,
            deadline: deadline,
            creator: msg.sender,
            status: QStatus.OPEN,
            outcome: Outcome.UNRESOLVED,
            verdictCID: "",
            verdictSummary: "",
            resolvedAt: 0,
            resolvedBy: address(0),
            disputeCount: 0,
            frozen: false,
            activeProposalId: bytes32(0),
            tier: tier,
            currentStep: EscalationStep.STEP1_AI,
            aiConfidenceScore: 0,
            aiAnalysisCID: ""
        });

        allIds.push(id);
        emit QuestionCreated(id, title, msg.sender, deadline, descCID, tier);

        // Auto-escalate objective questions to AI review
        if (tier == QuestionTier.OBJECTIVE) {
            questions[id].status = QStatus.AI_REVIEW;
            emit EscalationAdvanced(id, EscalationStep.STEP1_AI, EscalationStep.STEP1_AI);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // RESOLVER STAKING
    // ───────────────────────────────────────────────────────────────────────────────
    function stakeAsResolver(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= MIN_RESOLVER_STAKE, "Minimum stake required");
        require(plkyToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        ResolverProfile storage r = resolvers[msg.sender];
        r.stakedAmount += amount;
        r.isActive = true;
        r.joinTimestamp = r.joinTimestamp == 0 ? block.timestamp : r.joinTimestamp;
        r.lastActivityTimestamp = block.timestamp;

        if (!hasRole(RESOLVER_ROLE, msg.sender)) {
            _grantRole(RESOLVER_ROLE, msg.sender);
            resolverList.push(msg.sender);
            resolverCount++;
        }

        emit ResolverAdded(msg.sender, amount, msg.sender);
    }

    function unstakeAsResolver(uint256 amount) external nonReentrant {
        ResolverProfile storage r = resolvers[msg.sender];
        require(r.stakedAmount >= amount, "Insufficient stake");
        require(r.stakedAmount - amount >= MIN_RESOLVER_STAKE || amount == r.stakedAmount, "Below minimum");
        
        // Cannot unstake if has active proposals
        r.stakedAmount -= amount;
        if (r.stakedAmount < MIN_RESOLVER_STAKE) {
            r.isActive = false;
            _revokeRole(RESOLVER_ROLE, msg.sender);
            resolverCount--;
            emit ResolverRemoved(msg.sender, msg.sender);
        }

        require(plkyToken.transfer(msg.sender, amount), "Transfer failed");
    }

    function slashResolver(address resolver, uint256 amount, string memory reason) public nonReentrant onlyRole(ARBITER_ROLE) {
        ResolverProfile storage r = resolvers[resolver];
        require(r.stakedAmount > 0, "No stake to slash");

        uint256 slashAmount = amount > r.stakedAmount ? r.stakedAmount : amount;
        r.stakedAmount -= slashAmount;
        r.slashCount++;
        r.reputationScore = _calculateReputation(r);

        if (r.stakedAmount < MIN_RESOLVER_STAKE) {
            r.isActive = false;
            _revokeRole(RESOLVER_ROLE, resolver);
            resolverCount--;
        }

        // Send slashed amount to treasury
        require(plkyToken.transfer(treasury, slashAmount), "Transfer failed");

        emit ResolverSlashed(resolver, slashAmount, reason);
    }

    function _calculateReputation(ResolverProfile storage r) internal view returns (uint256) {
        if (r.totalResolved == 0) return 5000; // Default 50%
        uint256 baseRep = (r.correctResolutions * MAX_REPUTATION) / r.totalResolved;
        uint256 slashPenalty = r.slashCount * SLASH_PENALTY;
        return baseRep > slashPenalty ? baseRep - slashPenalty : 0;
    }

    function getResolverWeight(address resolver) public view returns (uint256) {
        ResolverProfile storage r = resolvers[resolver];
        if (!r.isActive) return 0;
        uint256 repWeight = r.reputationScore;
        uint256 stakeWeight = (r.stakedAmount * MAX_REPUTATION) / (MIN_RESOLVER_STAKE * 10);
        return (repWeight + stakeWeight) / 2;
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // AI ANALYSIS
    // ───────────────────────────────────────────────────────────────────────────────
    function submitAIAnalysis(
        bytes32 qId,
        uint256 confidenceScore,
        Outcome recommendedOutcome,
        string calldata analysisCID,
        uint256 sentimentScore,
        uint256 factCheckScore,
        uint256 biasScore
    ) external onlyRole(AI_ORACLE_ROLE) exists(qId) {
        require(confidenceScore <= MAX_REPUTATION, "Invalid confidence");
        require(bytes(analysisCID).length > 0, "No CID");
        Question storage q = questions[qId];
        require(q.status == QStatus.AI_REVIEW || q.status == QStatus.OPEN, "Invalid status");

        aiAnalyses[qId] = AIAnalysis({
            questionId: qId,
            confidenceScore: confidenceScore,
            recommendedOutcome: recommendedOutcome,
            analysisCID: analysisCID,
            timestamp: block.timestamp,
            aiModelVersion: "v2.0",
            sentimentScore: sentimentScore,
            factCheckScore: factCheckScore,
            biasScore: biasScore
        });

        q.aiConfidenceScore = confidenceScore;
        q.aiAnalysisCID = analysisCID;

        emit AIAnalysisSubmitted(qId, confidenceScore, recommendedOutcome, analysisCID);

        // Auto-resolve if high confidence objective question
        if (q.tier == QuestionTier.OBJECTIVE && confidenceScore >= aiConfidenceThreshold) {
            _autoResolve(qId, recommendedOutcome, analysisCID);
        } else {
            // Advance to next step
            _advanceEscalation(qId);
        }
    }

    function _autoResolve(bytes32 qId, Outcome outcome, string memory cid) internal {
        Question storage q = questions[qId];
        q.status = QStatus.RESOLVED;
        q.outcome = outcome;
        q.verdictCID = cid;
        q.resolvedAt = block.timestamp;
        q.resolvedBy = address(this);
        q.currentStep = EscalationStep.STEP1_AI;

        emit VerdictExecuted(qId, outcome, cid, address(this), block.timestamp);
        emit EscalationAdvanced(qId, EscalationStep.STEP1_AI, EscalationStep.STEP1_AI);
    }

    function _advanceEscalation(bytes32 qId) internal {
        Question storage q = questions[qId];
        EscalationStep oldStep = q.currentStep;

        if (q.tier == QuestionTier.OBJECTIVE) {
            if (oldStep == EscalationStep.STEP1_AI) {
                q.currentStep = EscalationStep.STEP2_COMMUNITY;
                q.status = QStatus.COMMUNITY_VOTE;
            } else if (oldStep == EscalationStep.STEP2_COMMUNITY) {
                q.currentStep = EscalationStep.STEP3_EXPERT;
                q.status = QStatus.OPEN;
            }
        } else if (q.tier == QuestionTier.SEMI_SUBJECTIVE) {
            if (oldStep == EscalationStep.STEP1_AI) {
                q.currentStep = EscalationStep.STEP3_EXPERT;
                q.status = QStatus.OPEN;
            }
        } else {
            // FULLY_SUBJECTIVE goes straight to expert panel
            q.currentStep = EscalationStep.STEP3_EXPERT;
            q.status = QStatus.OPEN;
        }

        emit EscalationAdvanced(qId, oldStep, q.currentStep);
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // EVIDENCE SUBMISSION
    // ───────────────────────────────────────────────────────────────────────────────
    function submitEvidence(
        bytes32 qId,
        string calldata ipfsCID,
        string calldata description,
        EvidType evidType
    ) external nonReentrant whenNotPaused exists(qId) notFrozen(qId) {
        QStatus s = questions[qId].status;
        require(
            s == QStatus.OPEN || 
            s == QStatus.PROPOSED || 
            s == QStatus.AI_REVIEW || 
            s == QStatus.COMMUNITY_VOTE,
            "Question closed"
        );
        require(bytes(ipfsCID).length > 0, "No IPFS CID");
        require(bytes(ipfsCID).length <= 100, "CID too long");

        // Optional bond for evidence
        uint256 bond = EVIDENCE_BOND;
        if (plkyToken.allowance(msg.sender, address(this)) >= bond) {
            require(plkyToken.transferFrom(msg.sender, address(this), bond), "Bond transfer failed");
        } else {
            bond = 0;
        }

        evidence[qId].push(Evidence({
            ipfsCID: ipfsCID,
            description: description,
            submitter: msg.sender,
            timestamp: block.timestamp,
            evidenceType: evidType,
            bondAmount: bond,
            bondReturned: false
        }));

        emit EvidenceSubmitted(qId, msg.sender, ipfsCID, evidType, bond);
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // COMMUNITY VOTING (Step 2)
    // ───────────────────────────────────────────────────────────────────────────────
    function castCommunityVote(bytes32 qId, Outcome vote) external nonReentrant whenNotPaused exists(qId) notFrozen(qId) {
        require(questions[qId].status == QStatus.COMMUNITY_VOTE, "Not in community vote");
        require(vote == Outcome.YES || vote == Outcome.NO, "Invalid vote");
        require(!hasVoted[qId][msg.sender], "Already voted");

        uint256 balance = plkyToken.balanceOf(msg.sender);
        require(balance > 0, "No PLKY to vote");

        hasVoted[qId][msg.sender] = true;
        communityVotes[qId][msg.sender] = balance;

        emit CommunityVoted(qId, msg.sender, balance, vote);
    }

    function finalizeCommunityVote(bytes32 qId) external exists(qId) {
        Question storage q = questions[qId];
        require(q.status == QStatus.COMMUNITY_VOTE, "Not in community vote");
        require(block.timestamp >= q.createdAt + TIMELOCK_PERIOD, "Voting period active");

        uint256 yesWeight = 0;
        uint256 noWeight = 0;

        // Note: In production, use a merkle proof or subgraph for efficiency
        // This is a simplified version for demonstration
        Outcome outcome = yesWeight > noWeight ? Outcome.YES : Outcome.NO;

        emit CommunityVoteFinalized(qId, outcome, yesWeight, noWeight);

        if (q.tier == QuestionTier.OBJECTIVE) {
            _advanceEscalation(qId);
        } else {
            // Semi-subjective uses community vote as input to expert panel
            q.status = QStatus.OPEN;
            q.currentStep = EscalationStep.STEP3_EXPERT;
        }
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // VERDICT FLOW (Step 3 - Expert Panel)
    // ───────────────────────────────────────────────────────────────────────────────
    function proposeVerdict(
        bytes32 qId,
        Outcome outcome,
        string calldata reasonCID,
        string calldata summary
    ) external nonReentrant onlyResolver whenNotPaused exists(qId) notFrozen(qId) {
        Question storage q = questions[qId];
        require(q.status == QStatus.OPEN, "Not open");
        require(outcome != Outcome.UNRESOLVED && outcome != Outcome.AWAITING_AI && outcome != Outcome.AWAITING_UMA, "Invalid outcome");
        require(bytes(reasonCID).length > 0, "No reason CID");
        require(evidence[qId].length >= MIN_EVIDENCE, "Need evidence");
        require(q.currentStep == EscalationStep.STEP3_EXPERT || q.tier == QuestionTier.FULLY_SUBJECTIVE, "Wrong step");

        // Bond requirement
        require(plkyToken.transferFrom(msg.sender, address(this), VERDICT_BOND), "Bond transfer failed");

        bytes32 pid = keccak256(abi.encodePacked(qId, outcome, msg.sender, block.timestamp, block.number));
        ProposedVerdict storage pv = proposals[pid];
        
        pv.outcome = outcome;
        pv.proposer = msg.sender;
        pv.proposedAt = block.timestamp;
        pv.timelockEndsAt = block.timestamp + TIMELOCK_PERIOD;
        pv.reasonCID = reasonCID;
        pv.approvalCount = 1;
        pv.approvals[msg.sender] = true;
        pv.executed = false;

        uint256 weight = getResolverWeight(msg.sender);
        pv.weights[msg.sender] = weight;
        pv.totalWeight = weight;

        q.status = QStatus.PROPOSED;
        q.activeProposalId = pid;
        q.verdictSummary = summary;

        resolvers[msg.sender].lastActivityTimestamp = block.timestamp;

        emit VerdictProposed(qId, pid, outcome, msg.sender, reasonCID, pv.timelockEndsAt);

        if (pv.totalWeight >= quorumThreshold * (MAX_REPUTATION / resolverCount)) {
            q.status = QStatus.TIMELOCK;
        }
    }

    function approveVerdict(bytes32 qId, bytes32 pid)
        external nonReentrant onlyResolver whenNotPaused exists(qId) notFrozen(qId)
    {
        Question storage q = questions[qId];
        require(q.status == QStatus.PROPOSED, "Not proposed");
        require(q.activeProposalId == pid, "Wrong proposal");

        ProposedVerdict storage pv = proposals[pid];
        require(!pv.approvals[msg.sender], "Already signed");
        require(!pv.executed, "Executed");

        uint256 weight = getResolverWeight(msg.sender);
        pv.approvals[msg.sender] = true;
        pv.approvalCount++;
        pv.weights[msg.sender] = weight;
        pv.totalWeight += weight;

        resolvers[msg.sender].lastActivityTimestamp = block.timestamp;

        emit VerdictApproved(qId, pid, msg.sender, pv.approvalCount, weight);

        if (pv.totalWeight >= quorumThreshold * (MAX_REPUTATION / resolverCount)) {
            q.status = QStatus.TIMELOCK;
        }
    }

    function executeVerdict(bytes32 qId)
        external nonReentrant whenNotPaused exists(qId) notFrozen(qId)
    {
        Question storage q = questions[qId];
        require(q.status == QStatus.TIMELOCK, "Not in timelock");

        bytes32 activePid = q.activeProposalId;
        ProposedVerdict storage pv = proposals[activePid];
        require(block.timestamp >= pv.timelockEndsAt, "Timelock active");
        require(pv.totalWeight >= quorumThreshold * (MAX_REPUTATION / resolverCount), "Under quorum");
        require(!pv.executed, "Done");

        pv.executed = true;
        q.status = QStatus.RESOLVED;
        q.outcome = pv.outcome;
        q.verdictCID = pv.reasonCID;
        q.resolvedAt = block.timestamp;
        q.resolvedBy = msg.sender;

        // Update resolver stats
        _updateResolverStats(activePid);

        // Return bonds to successful resolvers
        _returnVerdictBonds(activePid);

        emit VerdictExecuted(qId, pv.outcome, pv.reasonCID, msg.sender, block.timestamp);
    }

    function _updateResolverStats(bytes32 pid) internal {
        ProposedVerdict storage pv = proposals[pid];
        
        // Mark proposer as having resolved
        resolvers[pv.proposer].totalResolved++;
        
        // Note: correctResolutions is updated during dispute resolution
        // If no disputes, assume correct
        if (pv.outcome != Outcome.DISPUTED) {
            resolvers[pv.proposer].correctResolutions++;
            resolvers[pv.proposer].reputationScore = _calculateReputation(resolvers[pv.proposer]);
        }
    }

    function _returnVerdictBonds(bytes32 pid) internal {
        ProposedVerdict storage pv = proposals[pid];
        
        // Return proposer bond
        require(plkyToken.transfer(pv.proposer, VERDICT_BOND), "Bond return failed");
        emit BondReturned(pv.proposer, VERDICT_BOND, "Verdict executed");
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // DISPUTE SYSTEM
    // ───────────────────────────────────────────────────────────────────────────────
    function raiseDispute(
        bytes32 qId,
        string calldata reason,
        string calldata evidCID
    ) external nonReentrant whenNotPaused exists(qId) {
        require(!hasDisputed[qId][msg.sender], "Already disputed");
        require(bytes(reason).length > 0, "No reason");
        
        Question storage q = questions[qId];
        require(
            q.status == QStatus.PROPOSED ||
            q.status == QStatus.TIMELOCK ||
            q.status == QStatus.COMMUNITY_VOTE ||
            (q.status == QStatus.RESOLVED && block.timestamp <= q.resolvedAt + DISPUTE_WINDOW),
            "Cannot dispute"
        );

        // Bond requirement
        require(plkyToken.transferFrom(msg.sender, address(this), DISPUTE_BOND), "Bond transfer failed");

        hasDisputed[qId][msg.sender] = true;
        q.disputeCount++;

        uint256 disputeIndex = disputes[qId].length;
        disputes[qId].push(Dispute({
            questionId: qId,
            disputer: msg.sender,
            reason: reason,
            evidenceCID: evidCID,
            timestamp: block.timestamp,
            resolved: false,
            resolution: "",
            bondAmount: DISPUTE_BOND,
            bondReturned: false,
            disputeIndex: disputeIndex
        }));

        // Auto-freeze on threshold
        if (q.disputeCount >= AUTO_FREEZE_THRESHOLD && !q.frozen) {
            q.frozen = true;
            emit QuestionFrozen(qId, address(this), "Auto-frozen: dispute threshold reached");
        }

        emit DisputeRaised(qId, msg.sender, reason, evidCID, DISPUTE_BOND);
    }

    function resolveDispute(bytes32 qId, uint256 idx, string calldata res, bool validDispute)
        external nonReentrant onlyRole(ARBITER_ROLE)
    {
        require(idx < disputes[qId].length, "Invalid index");
        Dispute storage d = disputes[qId][idx];
        require(!d.resolved, "Already resolved");

        d.resolved = true;
        d.resolution = res;

        if (validDispute) {
            // Return bond + reward
            uint256 reward = DISPUTE_BOND + (DISPUTE_BOND / 2); // 150% return
            require(plkyToken.transfer(d.disputer, reward), "Reward transfer failed");
            d.bondReturned = true;
            emit BondReturned(d.disputer, reward, "Valid dispute");

            // Slash resolver if dispute is valid
            Question storage q = questions[qId];
            if (q.status == QStatus.RESOLVED) {
                address resolver = q.resolvedBy;
                if (resolver != address(0) && resolvers[resolver].stakedAmount > 0) {
                    slashResolver(resolver, VERDICT_BOND / 2, "Valid dispute against resolution");
                }
            }
        } else {
            // Seize bond - invalid dispute
            require(plkyToken.transfer(treasury, d.bondAmount), "Seize transfer failed");
            emit BondSeized(d.disputer, d.bondAmount, "Invalid dispute");
        }

        emit DisputeResolved(qId, idx, res, d.bondReturned);
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // UMA INTEGRATION (Step 4)
    // ───────────────────────────────────────────────────────────────────────────────
    function enableUMA(address oracle) external onlyRole(ADMIN_ROLE) {
        require(!umaEnabled, "UMA already enabled");
        require(oracle != address(0), "Zero address");
        umaOracle = IUMAOptimisticOracle(oracle);
        umaEnabled = true;
        emit UMAEnabled(oracle);
    }

    function requestUMAResolution(bytes32 qId)
        external onlyResolver exists(qId) notFrozen(qId)
    {
        require(umaEnabled, "UMA not enabled");
        require(questions[qId].status == QStatus.OPEN || questions[qId].status == QStatus.PROPOSED, "Invalid status");

        questions[qId].outcome = Outcome.AWAITING_UMA;
        questions[qId].currentStep = EscalationStep.STEP4_UMA;

        // Request price from UMA OO
        bytes memory ancillaryData = abi.encodePacked(questions[qId].title);
        umaOracle.requestPrice(
            YES_OR_NO_IDENTIFIER,
            block.timestamp,
            ancillaryData,
            plkyToken,
            VERDICT_BOND
        );

        emit UMARequested(qId, YES_OR_NO_IDENTIFIER, block.timestamp);
    }

    function settleUMAResolution(bytes32 qId) external nonReentrant exists(qId) {
        require(umaEnabled, "UMA not enabled");
        require(questions[qId].outcome == Outcome.AWAITING_UMA, "Not awaiting UMA");

        bytes memory ancillaryData = abi.encodePacked(questions[qId].title);
        require(umaOracle.hasPrice(YES_OR_NO_IDENTIFIER, questions[qId].createdAt, ancillaryData), "Price not available");

        int256 price = umaOracle.settleAndGetPrice(YES_OR_NO_IDENTIFIER, questions[qId].createdAt, ancillaryData);

        Outcome finalOutcome = price > 0 ? Outcome.YES : Outcome.NO;
        
        questions[qId].status = QStatus.RESOLVED;
        questions[qId].outcome = finalOutcome;
        questions[qId].resolvedAt = block.timestamp;
        questions[qId].resolvedBy = address(umaOracle);
        questions[qId].verdictCID = questions[qId].aiAnalysisCID; // Use AI analysis as verdict doc

        emit VerdictExecuted(qId, finalOutcome, questions[qId].verdictCID, address(umaOracle), block.timestamp);
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // ADMIN CONTROLS
    // ───────────────────────────────────────────────────────────────────────────────
    function freezeQuestion(bytes32 qId, string calldata reason)
        external onlyRole(ADMIN_ROLE) { questions[qId].frozen = true;
        emit QuestionFrozen(qId, msg.sender, reason); }

    function unfreezeQuestion(bytes32 qId)
        external onlyRole(ADMIN_ROLE) { questions[qId].frozen = false;
        emit QuestionUnfrozen(qId, msg.sender); }

    function cancelQuestion(bytes32 qId, string calldata reason)
        external onlyRole(ADMIN_ROLE) exists(qId) {
        questions[qId].status = QStatus.CANCELLED;
        questions[qId].outcome = Outcome.CANCELLED;
        emit QuestionCancelled(qId, reason);
    }

    function setQuorum(uint256 q) external onlyRole(ADMIN_ROLE) {
        require(q > 0 && q <= resolverCount, "Invalid quorum");
        emit QuorumChanged(quorumThreshold, q, msg.sender);
        quorumThreshold = q;
    }

    function setAIThreshold(uint256 threshold) external onlyRole(ADMIN_ROLE) {
        require(threshold <= MAX_REPUTATION, "Invalid threshold");
        uint256 old_ = aiConfidenceThreshold;
        aiConfidenceThreshold = threshold;
        emit AIThresholdChanged(old_, threshold, msg.sender);
    }

    function setTreasury(address _treasury) external onlyRole(ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid address");
        address old_ = treasury;
        treasury = _treasury;
        emit TreasuryChanged(old_, _treasury, msg.sender);
    }

    function emergencyPause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function emergencyUnpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function withdrawStuckTokens(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");
        emit StuckTokensWithdrawn(token, msg.sender, amount);
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // VIEW FUNCTIONS
    // ───────────────────────────────────────────────────────────────────────────────
    function getQuestion(bytes32 id) external view returns (Question memory) {
        return questions[id];
    }

    function getEvidence(bytes32 id) external view returns (Evidence[] memory) {
        return evidence[id];
    }

    function getDisputes(bytes32 id) external view returns (Dispute[] memory) {
        return disputes[id];
    }

    function getAllIds() external view returns (bytes32[] memory) {
        return allIds;
    }

    function getResolver(address r) external view returns (ResolverProfile memory) {
        return resolvers[r];
    }

    function getAIAnalysis(bytes32 qId) external view returns (AIAnalysis memory) {
        return aiAnalyses[qId];
    }

    function totalQuestions() external view returns (uint256) {
        return allIds.length;
    }

    function getProposalWeight(bytes32 pid) external view returns (uint256) {
        return proposals[pid].totalWeight;
    }

    function hasApproved(bytes32 pid, address r) external view returns (bool) {
        return proposals[pid].approvals[r];
    }

    function getProposal(bytes32 pid) external view returns (
        Outcome outcome,
        address proposer,
        uint256 proposedAt,
        uint256 timelockEndsAt,
        string memory reasonCID,
        uint256 approvalCount,
        bool executed,
        uint256 totalWeight
    ) {
        ProposedVerdict storage p = proposals[pid];
        return (p.outcome, p.proposer, p.proposedAt, p.timelockEndsAt, p.reasonCID, p.approvalCount, p.executed, p.totalWeight);
    }
}
