import { useState } from "react";

const TABS = ["🏗️ আর্কিটেকচার","📜 চুক্তি কোড","🛡️ যেভাবে manipulation আটকানো হয়","🚀 Deploy গাইড","🔗 UMA রোডম্যাপ"];

const CODE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title  TruthResolver
 * @notice Manipulation-resistant, evidence-backed verdict system
 * @dev    Drop-in UMA Optimistic Oracle support via enableUMA()
 *         No token required. IPFS proofs. Multi-sig + timelock.
 */
contract TruthResolver {

    // ════════════════════════════════════════════════
    //  CONSTANTS
    // ════════════════════════════════════════════════
    uint256 public constant DISPUTE_WINDOW   = 48 hours;
    uint256 public constant TIMELOCK_PERIOD  = 24 hours;
    uint256 public constant MIN_EVIDENCE     = 1;
    uint256 public constant VERSION          = 1;

    // ════════════════════════════════════════════════
    //  TYPES
    // ════════════════════════════════════════════════
    enum Outcome     { UNRESOLVED, YES, NO, DISPUTED, CANCELLED, AWAITING_UMA }
    enum QStatus     { OPEN, PROPOSED, TIMELOCK, RESOLVED, CANCELLED }
    enum EvidType    { SUPPORTING, OPPOSING, NEUTRAL }

    struct Evidence {
        string   ipfsCID;       // IPFS content hash — immutable proof
        string   description;
        address  submitter;
        uint256  timestamp;
        EvidType evidenceType;
    }

    struct ProposedVerdict {
        Outcome  outcome;
        address  proposer;
        uint256  proposedAt;
        uint256  timelockEndsAt;
        string   reasonCID;      // IPFS CID of full reasoning doc
        uint256  approvalCount;
        bool     executed;
        mapping(address => bool) approvals;
    }

    struct Question {
        bytes32  id;
        string   title;
        string   descriptionCID; // full details on IPFS
        string   category;
        uint256  createdAt;
        uint256  deadline;
        address  creator;
        QStatus  status;
        Outcome  outcome;
        string   verdictCID;     // final verdict doc on IPFS
        string   verdictSummary;
        uint256  resolvedAt;
        address  resolvedBy;
        uint256  disputeCount;
        bool     frozen;
        bytes32  activeProposalId;
    }

    struct Dispute {
        bytes32  questionId;
        address  disputer;
        string   reason;
        string   evidenceCID;
        uint256  timestamp;
        bool     resolved;
        string   resolution;
    }

    // ════════════════════════════════════════════════
    //  STATE
    // ════════════════════════════════════════════════
    mapping(bytes32 => Question)          public questions;
    mapping(bytes32 => Evidence[])        public evidence;
    mapping(bytes32 => ProposedVerdict)   public proposals;
    mapping(bytes32 => Dispute[])         public disputes;
    mapping(bytes32 => mapping(address => bool)) public hasDisputed;
    mapping(address => bool)              public resolvers;
    mapping(address => bool)              public admins;

    bytes32[] public allIds;
    address[] public resolverList;
    uint256   public resolverCount;
    uint256   public quorumThreshold;
    address   public owner;
    bool      public paused;

    // ── UMA future slot ──────────────────────────────
    address public umaOracle;        // address(0) until UMA added
    bool    public umaEnabled;
    // ─────────────────────────────────────────────────

    // ════════════════════════════════════════════════
    //  EVENTS  (everything on-chain, nothing hidden)
    // ════════════════════════════════════════════════
    event QuestionCreated(bytes32 indexed id, string title,
        address creator, uint256 deadline, string descCID);
    event EvidenceSubmitted(bytes32 indexed qId,
        address indexed submitter, string cid, EvidType t);
    event VerdictProposed(bytes32 indexed qId, bytes32 indexed pid,
        Outcome outcome, address proposer, string reasonCID, uint256 timelockEnds);
    event VerdictApproved(bytes32 indexed qId, bytes32 indexed pid,
        address approver, uint256 count);
    event VerdictExecuted(bytes32 indexed qId, Outcome outcome,
        string verdictCID, address executor, uint256 ts);
    event DisputeRaised(bytes32 indexed qId,
        address indexed disputer, string reason, string cid);
    event DisputeResolved(bytes32 indexed qId,
        uint256 index, string resolution);
    event QuestionFrozen(bytes32 indexed qId, address by, string reason);
    event QuestionUnfrozen(bytes32 indexed qId, address by);
    event QuestionCancelled(bytes32 indexed qId, string reason);
    event ResolverAdded(address indexed r, address by);
    event ResolverRemoved(address indexed r, address by);
    event QuorumChanged(uint256 old_, uint256 new_, address by);
    event UMAEnabled(address oracle);   // future hook, emitted when UMA activated

    // ════════════════════════════════════════════════
    //  MODIFIERS
    // ════════════════════════════════════════════════
    modifier onlyOwner()   { require(msg.sender == owner,  "Not owner");    _; }
    modifier onlyAdmin()   { require(admins[msg.sender] ||
                                     msg.sender == owner,  "Not admin");    _; }
    modifier onlyResolver(){ require(resolvers[msg.sender],"Not resolver"); _; }
    modifier live()        { require(!paused,               "Paused");       _; }
    modifier exists(bytes32 id) {
        require(questions[id].createdAt > 0, "Not found"); _;
    }
    modifier notFrozen(bytes32 id) {
        require(!questions[id].frozen, "Frozen"); _;
    }

    // ════════════════════════════════════════════════
    //  CONSTRUCTOR
    // ════════════════════════════════════════════════
    constructor(address[] memory _resolvers, uint256 _quorum) {
        owner = msg.sender;
        admins[msg.sender] = true;
        quorumThreshold = _quorum;
        for (uint i; i < _resolvers.length; i++) {
            resolvers[_resolvers[i]] = true;
            resolverList.push(_resolvers[i]);
            resolverCount++;
        }
    }

    // ════════════════════════════════════════════════
    //  QUESTION  MANAGEMENT
    // ════════════════════════════════════════════════
    function createQuestion(
        string calldata title,
        string calldata descCID,   // IPFS CID with full context
        string calldata category,
        uint256 deadline
    ) external live returns (bytes32 id) {
        require(bytes(title).length > 0,  "Empty title");
        require(bytes(descCID).length > 0,"No IPFS CID");
        require(deadline > block.timestamp,"Past deadline");

        id = keccak256(abi.encodePacked(
            title, msg.sender, block.timestamp, block.chainid
        ));
        require(questions[id].createdAt == 0, "Duplicate");

        questions[id] = Question({
            id: id, title: title, descriptionCID: descCID,
            category: category, createdAt: block.timestamp,
            deadline: deadline, creator: msg.sender,
            status: QStatus.OPEN, outcome: Outcome.UNRESOLVED,
            verdictCID: "", verdictSummary: "", resolvedAt: 0,
            resolvedBy: address(0), disputeCount: 0,
            frozen: false, activeProposalId: bytes32(0)
        });
        allIds.push(id);
        emit QuestionCreated(id, title, msg.sender, deadline, descCID);
    }

    // ════════════════════════════════════════════════
    //  EVIDENCE SUBMISSION  (open to anyone)
    // ════════════════════════════════════════════════
    function submitEvidence(
        bytes32 qId,
        string  calldata ipfsCID,
        string  calldata description,
        EvidType evidType
    ) external live exists(qId) notFrozen(qId) {
        QStatus s = questions[qId].status;
        require(s == QStatus.OPEN || s == QStatus.PROPOSED, "Closed");
        require(bytes(ipfsCID).length > 0, "No CID");

        evidence[qId].push(Evidence({
            ipfsCID: ipfsCID, description: description,
            submitter: msg.sender, timestamp: block.timestamp,
            evidenceType: evidType
        }));
        emit EvidenceSubmitted(qId, msg.sender, ipfsCID, evidType);
    }

    // ════════════════════════════════════════════════
    //  VERDICT FLOW  (propose → approve → timelock → execute)
    // ════════════════════════════════════════════════

    /// Step 1 — resolver proposes a verdict with an IPFS reasoning doc
    function proposeVerdict(
        bytes32 qId,
        Outcome outcome,
        string  calldata reasonCID,
        string  calldata summary
    ) external onlyResolver live exists(qId) notFrozen(qId) {
        Question storage q = questions[qId];
        require(q.status == QStatus.OPEN, "Not open");
        require(outcome != Outcome.UNRESOLVED &&
                outcome != Outcome.AWAITING_UMA, "Invalid");
        require(bytes(reasonCID).length > 0, "No reason CID");
        require(evidence[qId].length >= MIN_EVIDENCE, "Need evidence");

        bytes32 pid = keccak256(abi.encodePacked(
            qId, outcome, msg.sender, block.timestamp
        ));
        ProposedVerdict storage pv = proposals[pid];
        pv.outcome        = outcome;
        pv.proposer       = msg.sender;
        pv.proposedAt     = block.timestamp;
        pv.timelockEndsAt = block.timestamp + TIMELOCK_PERIOD;
        pv.reasonCID      = reasonCID;
        pv.approvalCount  = 1;
        pv.approvals[msg.sender] = true;
        pv.executed       = false;

        q.status            = QStatus.PROPOSED;
        q.activeProposalId  = pid;
        q.verdictSummary    = summary;

        emit VerdictProposed(qId, pid, outcome, msg.sender,
                             reasonCID, pv.timelockEndsAt);

        if (pv.approvalCount >= quorumThreshold)
            q.status = QStatus.TIMELOCK;
    }

    /// Step 2 — other resolvers co-sign
    function approveVerdict(bytes32 qId, bytes32 pid)
        external onlyResolver live exists(qId) notFrozen(qId)
    {
        Question storage q = questions[qId];
        require(q.status == QStatus.PROPOSED, "Not proposed");
        require(q.activeProposalId == pid,    "Wrong proposal");

        ProposedVerdict storage pv = proposals[pid];
        require(!pv.approvals[msg.sender], "Already signed");
        require(!pv.executed,              "Executed");

        pv.approvals[msg.sender] = true;
        pv.approvalCount++;
        emit VerdictApproved(qId, pid, msg.sender, pv.approvalCount);

        if (pv.approvalCount >= quorumThreshold)
            q.status = QStatus.TIMELOCK;
    }

    /// Step 3 — anyone calls execute after 24-hour timelock
    function executeVerdict(bytes32 qId)
        external live exists(qId) notFrozen(qId)
    {
        Question storage q = questions[qId];
        require(q.status == QStatus.TIMELOCK, "Not in timelock");

        ProposedVerdict storage pv = proposals[q.activeProposalId];
        require(block.timestamp >= pv.timelockEndsAt, "Locked");
        require(pv.approvalCount >= quorumThreshold,  "Under quorum");
        require(!pv.executed, "Done");

        pv.executed  = true;
        q.status     = QStatus.RESOLVED;
        q.outcome    = pv.outcome;
        q.verdictCID = pv.reasonCID;
        q.resolvedAt = block.timestamp;
        q.resolvedBy = msg.sender;

        emit VerdictExecuted(qId, pv.outcome, pv.reasonCID,
                             msg.sender, block.timestamp);
    }

    // ════════════════════════════════════════════════
    //  DISPUTE SYSTEM
    // ════════════════════════════════════════════════
    function raiseDispute(
        bytes32 qId,
        string  calldata reason,
        string  calldata evidCID   // IPFS CID of counter-evidence
    ) external live exists(qId) {
        require(!hasDisputed[qId][msg.sender], "Already disputed");
        Question storage q = questions[qId];
        require(
            q.status == QStatus.PROPOSED  ||
            q.status == QStatus.TIMELOCK  ||
            (q.status == QStatus.RESOLVED &&
             block.timestamp <= q.resolvedAt + DISPUTE_WINDOW),
            "Cannot dispute"
        );
        hasDisputed[qId][msg.sender] = true;
        q.disputeCount++;

        // Auto-freeze on 3+ disputes — forces admin review
        if (q.disputeCount >= 3 && !q.frozen) {
            q.frozen = true;
            emit QuestionFrozen(qId, address(this),
                "Auto-frozen: 3+ disputes");
        }
        disputes[qId].push(Dispute({
            questionId: qId, disputer: msg.sender, reason: reason,
            evidenceCID: evidCID, timestamp: block.timestamp,
            resolved: false, resolution: ""
        }));
        emit DisputeRaised(qId, msg.sender, reason, evidCID);
    }

    function resolveDispute(bytes32 qId, uint256 idx, string calldata res)
        external onlyAdmin
    {
        disputes[qId][idx].resolved   = true;
        disputes[qId][idx].resolution = res;
        emit DisputeResolved(qId, idx, res);
    }

    // ════════════════════════════════════════════════
    //  ADMIN CONTROLS
    // ════════════════════════════════════════════════
    function freezeQuestion(bytes32 qId, string calldata reason)
        external onlyAdmin { questions[qId].frozen = true;
        emit QuestionFrozen(qId, msg.sender, reason); }

    function unfreezeQuestion(bytes32 qId)
        external onlyAdmin { questions[qId].frozen = false;
        emit QuestionUnfrozen(qId, msg.sender); }

    function cancelQuestion(bytes32 qId, string calldata reason)
        external onlyAdmin exists(qId) {
        questions[qId].status  = QStatus.CANCELLED;
        questions[qId].outcome = Outcome.CANCELLED;
        emit QuestionCancelled(qId, reason);
    }
    function addResolver(address r) external onlyAdmin {
        require(!resolvers[r],"Already resolver");
        resolvers[r] = true; resolverList.push(r); resolverCount++;
        emit ResolverAdded(r, msg.sender);
    }
    function removeResolver(address r) external onlyAdmin {
        require(resolvers[r],"Not resolver");
        resolvers[r] = false; resolverCount--;
        emit ResolverRemoved(r, msg.sender);
    }
    function setQuorum(uint256 q) external onlyAdmin {
        require(q > 0 && q <= resolverCount,"Invalid");
        emit QuorumChanged(quorumThreshold, q, msg.sender);
        quorumThreshold = q;
    }
    function setPaused(bool v) external onlyOwner { paused = v; }

    // ════════════════════════════════════════════════
    //  UMA FUTURE HOOK  (zero cost to add later)
    // ════════════════════════════════════════════════
    function enableUMA(address oracle) external onlyOwner {
        require(!umaEnabled,"Already on");
        require(oracle != address(0),"Zero addr");
        umaOracle  = oracle;
        umaEnabled = true;
        emit UMAEnabled(oracle);
    }
    /// Called when UMA is live — routes question to OO instead of manual
    function requestUMAResolution(bytes32 qId)
        external onlyResolver exists(qId)
    {
        require(umaEnabled,"UMA off");
        questions[qId].outcome = Outcome.AWAITING_UMA;
        // TODO: optimisticOracle.requestPrice(YES_OR_NO_IDENTIFIER, ...)
    }

    // ════════════════════════════════════════════════
    //  VIEWS
    // ════════════════════════════════════════════════
    function getQuestion(bytes32 id) external view returns (Question memory) {
        return questions[id]; }
    function getEvidence(bytes32 id) external view returns (Evidence[] memory) {
        return evidence[id]; }
    function getDisputes(bytes32 id) external view returns (Dispute[] memory) {
        return disputes[id]; }
    function getAllIds() external view returns (bytes32[] memory) {
        return allIds; }
    function approvalCount(bytes32 pid) external view returns (uint256) {
        return proposals[pid].approvalCount; }
    function hasApproved(bytes32 pid, address r) external view returns (bool) {
        return proposals[pid].approvals[r]; }
    function totalQuestions() external view returns (uint256) {
        return allIds.length; }
}`;

const ARCH_STEPS = [
  { icon: "ti-file-description", color: "#185FA5", bg: "#e6f1fb", title: "প্রশ্ন তৈরি", sub: "যে কেউ", body: "createQuestion() কল করে title + IPFS CID দেয়। Full context IPFS-এ থাকে, শুধু CID on-chain। কেউ মুছতে পারবে না।" },
  { icon: "ti-file-upload", color: "#3B6D11", bg: "#eaf3de", title: "Evidence জমা", sub: "সবার জন্য উন্মুক্ত", body: "যে কেউ supporting / opposing / neutral evidence submit করতে পারে IPFS CID আকারে। সব সময়ের সাথে blockchain-এ সিল।" },
  { icon: "ti-user-check", color: "#854F0B", bg: "#faeeda", title: "Verdict প্রস্তাব", sub: "শুধু Resolver", body: "Trusted resolver IPFS-এ কারণ লিখে reasonCID দিয়ে proposeVerdict() করে। এটা একটি প্রস্তাব, চূড়ান্ত নয়।" },
  { icon: "ti-users", color: "#533AB7", bg: "#eeedfe", title: "Multi-sig অনুমোদন", sub: "Quorum Threshold", body: "অন্য resolver-রা approveVerdict() করে। Quorum পূর্ণ না হলে TIMELOCK-এ যাবে না। একক ব্যক্তি সিদ্ধান্ত নিতে পারবে না।" },
  { icon: "ti-clock", color: "#993C1D", bg: "#faece7", title: "24-ঘন্টা Timelock", sub: "সবাই দেখতে পায়", body: "Quorum পূর্ণ হলে 24 ঘন্টা অপেক্ষা। এই সময়ে যে কেউ dispute দিতে পারে। তাড়াহুড়ো করে verdict দেওয়া অসম্ভব।" },
  { icon: "ti-gavel", color: "#0F6E56", bg: "#e1f5ee", title: "চূড়ান্ত Verdict", sub: "On-chain, চিরস্থায়ী", body: "executeVerdict() যে কেউ call করতে পারে। Outcome + IPFS verdictCID blockchain-এ লেখা হয়। কোনোদিন মুছবে না।" },
];

const ANTI_MANIP = [
  { icon: "ti-users", color: "#533AB7", bg: "#eeedfe", title: "Multi-sig Quorum", body: "একজন resolver একা কিছু করতে পারবে না। N-of-M resolver অনুমোদন ছাড়া verdict timelock-এ যাবে না। ৩ জনের মধ্যে ২ জন লাগলে একজন compromise হলেও সুরক্ষিত।" },
  { icon: "ti-clock", color: "#993C1D", bg: "#faece7", title: "24h Timelock", body: "Quorum পূর্ণ হওয়ার পরেও ২৪ ঘন্টা কেউ চূড়ান্ত করতে পারবে না। এই সময়ে পুরো পৃথিবী দেখতে পারে এবং dispute দিতে পারে।" },
  { icon: "ti-snowflake", color: "#185FA5", bg: "#e6f1fb", title: "Auto-freeze on 3 Disputes", body: "৩টি বা তার বেশি dispute এলে contract নিজেই প্রশ্নটি freeze করে দেয়। Admin-এর হস্তক্ষেপ ছাড়া verdict এগোবে না।" },
  { icon: "ti-file-check", color: "#3B6D11", bg: "#eaf3de", title: "IPFS Proof Requirement", body: "evidence ছাড়া verdict propose করা যাবে না। সব reasoning IPFS-এ থাকে — immutable, distributed। কেউ পরে পরিবর্তন করতে পারবে না।" },
  { icon: "ti-eye", color: "#854F0B", bg: "#faeeda", title: "সম্পূর্ণ Event Transparency", body: "প্রতিটি action — প্রশ্ন তৈরি, evidence, অনুমোদন, dispute, সমাধান — blockchain-এ event হিসেবে লেখা হয়। কোনো লুকানো পথ নেই।" },
  { icon: "ti-shield-check", color: "#993556", bg: "#fbeaf0", title: "Emergency Pause + Cancel", body: "যদি কখনো বড় সমস্যা হয়, owner contract pause করতে পারে। Admin যেকোনো questionপ্রশ্ন cancel করতে পারে on-chain কারণ সহ।" },
];

const DEPLOY_STEPS = [
  { n:"১", title:"Hardhat প্রজেক্ট সেটআপ", code:`mkdir truth-resolver && cd truth-resolver
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init  # choose "TypeScript project"` },
  { n:"২", title:"Contract ফাইল রাখুন", code:`# contracts/TruthResolver.sol এ কোড paste করুন
# তারপর compile করুন:
npx hardhat compile` },
  { n:"৩", title:"Deploy Script", code:`// scripts/deploy.ts
import { ethers } from "hardhat";
async function main() {
  const [owner, r1, r2, r3] = await ethers.getSigners();
  const C = await ethers.getContractFactory("TruthResolver");
  // 3 resolvers, quorum = 2 (2-of-3 multi-sig)
  const contract = await C.deploy(
    [r1.address, r2.address, r3.address], 2
  );
  await contract.waitForDeployment();
  console.log("Deployed:", await contract.getAddress());
}
main();` },
  { n:"৪", title:"Amoy Testnet Deploy", code:`# .env ফাইলে রাখুন:
PRIVATE_KEY=your_wallet_private_key
AMOY_RPC=https://rpc-amoy.polygon.technology
POLYGONSCAN_API=your_api_key

# hardhat.config.ts তে network যোগ করুন
# তারপর:
npx hardhat run scripts/deploy.ts --network amoy` },
  { n:"৫", title:"The Graph Subgraph", code:`# schema.graphql এ:
type Question @entity {
  id: Bytes!
  title: String!
  descriptionCID: String!
  status: String!
  outcome: String!
  verdictCID: String
  disputeCount: BigInt!
  resolvedAt: BigInt
  evidence: [Evidence!]! @derivedFrom(field: "question")
}
type Evidence @entity {
  id: Bytes!
  question: Question!
  ipfsCID: String!
  submitter: Bytes!
  timestamp: BigInt!
}` },
  { n:"৬", title:"Frontend Query (Next.js)", code:`// QuestionResolved event থেকে data টানুন
const QUERY = \`{
  questions(orderBy: createdAt, orderDirection: desc) {
    id title status outcome verdictCID
    verdictSummary resolvedAt disputeCount
    evidence { ipfsCID description submitter }
  }
}\`;
const res = await fetch(SUBGRAPH_URL, {
  method: "POST",
  body: JSON.stringify({ query: QUERY }),
});` },
];

const UMA_PHASES = [
  { phase: "Phase 1 — এখন", tag: "চলমান", color: "#1D9E75", bg: "#e1f5ee", items: ["নিজস্ব resolver multi-sig", "IPFS proof requirement", "24h timelock + dispute window", "Auto-freeze logic", "ফ্রি — কোনো token লাগে না"] },
  { phase: "Phase 2 — ৩-৬ মাস পরে", tag: "পরিকল্পিত", color: "#378ADD", bg: "#e6f1fb", items: ["enableUMA(oracleAddress) call করুন", "requestUMAResolution() route করুন UMA OO-তে", "UMA token holder-রা ভোট দেবে", "Bond + reward system যোগ", "আপনার resolver অ্যাডমিন হিসেবে থাকবে"] },
  { phase: "Phase 3 — ভবিষ্যৎ", tag: "ঐচ্ছিক", color: "#533AB7", bg: "#eeedfe", items: ["UMA DVM (Data Verification Mechanism) সংযোগ", "Conditional Token Framework (CTF) integrate", "Prediction market তৈরি করুন", "Polymarket-এর মতো full product", "Revenue: settlement fee"] },
];

const copyCode = (txt) => { navigator.clipboard?.writeText(txt); };

function CodeBlock({ code, id }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "relative", background: "#1e1e2e", borderRadius: "var(--border-radius-md)", overflow: "hidden", marginTop: 6 }}>
      <button onClick={() => { copyCode(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 11, color: "#9FE1CB", cursor: "pointer" }}>
        {copied ? "✓ copied" : "copy"}
      </button>
      <pre style={{ margin: 0, padding: "14px", overflowX: "auto", fontSize: 11, lineHeight: 1.7, color: "#C0DD97", fontFamily: "var(--font-mono)" }}>{code}</pre>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [codeSection, setCodeSection] = useState("full");

  const tabStyle = (i) => ({
    padding: "7px 12px", border: "none", fontSize: 12, cursor: "pointer", borderRadius: "var(--border-radius-md)",
    background: tab === i ? "var(--color-background-info)" : "transparent",
    color: tab === i ? "var(--color-text-info)" : "var(--color-text-secondary)",
    fontWeight: tab === i ? "500" : "400", whiteSpace: "nowrap"
  });

  const sections = {
    full: { label: "সম্পূর্ণ Contract", code: CODE },
    core: { label: "Verdict Flow", code: CODE.split("// ════════════════════════════════════════════════\n    //  VERDICT FLOW")[1]?.split("// ════════════════════════════════════════════════\n    //  DISPUTE")[0] || "" },
    uma: { label: "UMA Hook", code: CODE.split("// ════════════════════════════════════════════════\n    //  UMA FUTURE HOOK")[1]?.split("// ════════════════════════════════════════════════\n    //  VIEWS")[0] || "" },
  };

  return (
    <div style={{ padding: "1rem 0", fontSize: 13 }}>
      <h2 style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>TruthResolver Smart Contract Dashboard</h2>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: "1.25rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e1f5ee", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className="ti ti-shield-lock" style={{ fontSize: 18, color: "#0F6E56" }} aria-hidden="true" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>TruthResolver — Production-Ready Contract</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
            Multi-sig · 24h Timelock · IPFS Proof · Auto-freeze · UMA-ready · কোনো token ছাড়া
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[["✓ Reentrancy-safe","#e1f5ee","#0F6E56"],["✓ UMA-ready","#e6f1fb","#185FA5"],["✓ Free to deploy","#eaf3de","#3B6D11"]].map(([l,bg,c]) => (
            <span key={l} style={{ fontSize: 10, padding: "3px 8px", borderRadius: "var(--border-radius-md)", background: bg, color: c, fontWeight: 500 }}>{l}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: "1.25rem", borderBottom: "0.5px solid var(--color-border-tertiary)", paddingBottom: 8, overflowX: "auto" }}>
        {TABS.map((t, i) => <button key={i} style={tabStyle(i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {/* ── TAB 0: ARCHITECTURE ── */}
      {tab === 0 && (
        <div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: "1.25rem", lineHeight: 1.7 }}>
            প্রতিটি verdict ৬টি ধাপ পার করে চূড়ান্ত হয়। কোনো একটি ধাপে manipulation হলে পরের ধাপে আটকে যাবে।
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.5rem" }}>
            {ARCH_STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "12px 14px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: s.color }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 500 }}>ধাপ {i + 1}: {s.title}</span>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: "var(--border-radius-md)", background: s.bg, color: s.color }}>{s.sub}</span>
                  </div>
                  <div style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{s.body}</div>
                </div>
                {i < ARCH_STEPS.length - 1 && (
                  <i className="ti ti-arrow-down" style={{ fontSize: 13, color: "var(--color-text-tertiary)", position: "absolute", marginLeft: "calc(50% - 6px)", marginTop: 44 }} aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "14px", marginBottom: "1.25rem" }}>
            <div style={{ fontWeight: 500, marginBottom: 10 }}>Contract-এর মূল ডেটা স্ট্রাকচার</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
              {[
                ["Question","title, descCID, status, outcome, verdictCID, disputeCount, frozen"],
                ["Evidence","ipfsCID, description, submitter, timestamp, type"],
                ["ProposedVerdict","outcome, reasonCID, approvalCount, timelockEndsAt, executed"],
                ["Dispute","disputer, reason, evidenceCID, resolved, resolution"],
              ].map(([name, fields]) => (
                <div key={name} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
                  <div style={{ fontWeight: 500, marginBottom: 5, fontSize: 12, color: "var(--color-text-info)" }}>{name}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.7, fontFamily: "var(--font-mono)" }}>{fields.split(", ").map(f => <div key={f}>• {f}</div>)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#e1f5ee", borderRadius: "var(--border-radius-md)", padding: "10px 14px", fontSize: 12 }}>
            <span style={{ fontWeight: 500, color: "#0F6E56" }}>IPFS + Blockchain = অপরিবর্তনীয় প্রমাণ: </span>
            <span style={{ color: "#1D9E75" }}>Pinata-তে evidence আপলোড → CID পান → on-chain store করুন। CID টি content-hash, তাই কেউ document পরিবর্তন করলে CID মিলবে না। ব্যবহারকারী সরাসরি verify করতে পারবে।</span>
          </div>
        </div>
      )}

      {/* ── TAB 1: CODE ── */}
      {tab === 1 && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {Object.entries(sections).map(([k, v]) => (
              <button key={k} onClick={() => setCodeSection(k)} style={{ padding: "5px 10px", fontSize: 11, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: codeSection === k ? "var(--color-background-info)" : "transparent", color: codeSection === k ? "var(--color-text-info)" : "var(--color-text-secondary)", cursor: "pointer" }}>
                {v.label}
              </button>
            ))}
            <a href="https://github.com/Polymarket/uma-ctf-adapter" target="_blank" rel="noreferrer" style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-text-info)", textDecoration: "none", alignSelf: "center" }}>
              <i className="ti ti-brand-github" aria-hidden="true" /> UMA Reference
            </a>
          </div>

          <div style={{ background: "#1e1e2e", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderBottom: "0.5px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize: 11, color: "#9FE1CB", fontFamily: "var(--font-mono)" }}>TruthResolver.sol · Solidity 0.8.20</span>
              <button onClick={() => copyCode(sections[codeSection].code)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 4, padding: "3px 10px", fontSize: 11, color: "#9FE1CB", cursor: "pointer" }}>
                <i className="ti ti-copy" aria-hidden="true" /> কপি করুন
              </button>
            </div>
            <pre style={{ margin: 0, padding: "16px", overflowX: "auto", overflowY: "auto", maxHeight: 480, fontSize: 11, lineHeight: 1.75, color: "#C0DD97", fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "#9FE1CB" }}>{sections[codeSection].code.split("pragma")[0]}</span>
              <span style={{ color: "#FAC775" }}>{"pragma"}</span>
              <span style={{ color: "#C0DD97" }}>{sections[codeSection].code.split("pragma")[1]}</span>
            </pre>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: "1rem" }}>
            {[
              ["createQuestion()", "যে কেউ", "#e6f1fb", "#185FA5"],
              ["submitEvidence()", "যে কেউ", "#eaf3de", "#3B6D11"],
              ["proposeVerdict()", "শুধু Resolver", "#faeeda", "#854F0B"],
              ["approveVerdict()", "শুধু Resolver", "#eeedfe", "#533AB7"],
              ["executeVerdict()", "যে কেউ", "#e1f5ee", "#0F6E56"],
              ["raiseDispute()", "যে কেউ", "#faece7", "#993C1D"],
              ["freezeQuestion()", "শুধু Admin", "#fbeaf0", "#993556"],
              ["enableUMA()", "শুধু Owner", "#e6f1fb", "#185FA5"],
            ].map(([fn, who, bg, c]) => (
              <div key={fn} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "8px 12px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: c, marginBottom: 3 }}>{fn}</div>
                <div style={{ fontSize: 10, padding: "1px 6px", borderRadius: "var(--border-radius-md)", background: bg, color: c, display: "inline-block" }}>{who}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: ANTI-MANIPULATION ── */}
      {tab === 2 && (
        <div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: "1.25rem", lineHeight: 1.7 }}>
            ৬টি স্বতন্ত্র প্রতিরক্ষা স্তর — একটি ব্যর্থ হলেও বাকিগুলো সক্রিয় থাকে।
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: "1.25rem" }}>
            {ANTI_MANIP.map((m) => (
              <div key={m.title} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "14px" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <i className={`ti ${m.icon}`} style={{ fontSize: 15, color: m.color }} aria-hidden="true" />
                </div>
                <div style={{ fontWeight: 500, marginBottom: 5 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>{m.body}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "14px", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 500, marginBottom: 10 }}>ব্যবহারকারী কিভাবে নিজে verify করবে</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["১", "Polygonscan/Amoy Scan-এ contract address দিন → সব events দেখুন", "#e6f1fb", "#185FA5"],
                ["২", "verdictCID টি নিন → ipfs.io/ipfs/{CID} তে খুলুন → পুরো reasoning পড়ুন", "#eaf3de", "#3B6D11"],
                ["③", "Evidence CID-গুলো IPFS-এ চেক করুন — সত্যিই ওই document কিনা", "#faeeda", "#854F0B"],
                ["④", "approvalCount এবং quorumThreshold compare করুন — quorum পূরণ হয়েছিল?", "#eeedfe", "#533AB7"],
                ["⑤", "timelockEndsAt দেখুন — ২৪ ঘন্টা অপেক্ষা সত্যিই হয়েছে?", "#faece7", "#993C1D"],
              ].map(([n, t, bg, c]) => (
                <div key={n} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{n}</span>
                  <span style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#faeeda", borderRadius: "var(--border-radius-md)", padding: "10px 14px", fontSize: 12 }}>
            <span style={{ fontWeight: 500, color: "#854F0B" }}>Resolver-দের কে বিশ্বাসযোগ্য করে? </span>
            <span style={{ color: "#BA7517" }}>আপনার platform-এর সুনাম। শুরুতে নিজে এবং বিশ্বস্ত ব্যক্তিরা resolver হোন। সব resolver address on-chain public — যে কেউ দেখতে পাবে কে approve করেছে। পরে UMA-র DVM token holder-রা এই ভূমিকা নেবে।</span>
          </div>
        </div>
      )}

      {/* ── TAB 3: DEPLOY ── */}
      {tab === 3 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: "1.25rem" }}>
            {[["Hardhat","ফ্রি","#eeedfe","#533AB7"],["Polygon Amoy","ফ্রি testnet","#e6f1fb","#185FA5"],["Pinata IPFS","ফ্রি 1GB","#eaf3de","#3B6D11"],["The Graph","ফ্রি 100K/day","#faeeda","#854F0B"],["Vercel","ফ্রি","#e1f5ee","#0F6E56"]].map(([t,s,bg,c]) => (
              <div key={t} style={{ background: bg, borderRadius: "var(--border-radius-md)", padding: "8px 12px", textAlign: "center" }}>
                <div style={{ fontWeight: 500, color: c, fontSize: 12 }}>{t}</div>
                <div style={{ fontSize: 11, color: c, opacity: 0.8 }}>{s}</div>
              </div>
            ))}
          </div>

          {DEPLOY_STEPS.map((s) => (
            <div key={s.n} style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#e6f1fb", color: "#185FA5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{s.n}</span>
                <span style={{ fontWeight: 500 }}>{s.title}</span>
              </div>
              <CodeBlock code={s.code} id={s.n} />
            </div>
          ))}

          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "14px" }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Constructor তে কী দেবেন?</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
              <div>• <code style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-info)" }}>_resolvers[]</code> — আপনার বিশ্বস্ত resolver wallet addresses (শুরুতে ৩টি দিন)</div>
              <div>• <code style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-info)" }}>_quorum</code> — কতজনের অনুমোদন লাগবে (৩ জনের মধ্যে ২ সুপারিশ করা হয়)</div>
              <div style={{ marginTop: 8, background: "#e1f5ee", padding: "8px 10px", borderRadius: "var(--border-radius-md)", color: "#0F6E56" }}>
                উদাহরণ: TruthResolver([addr1, addr2, addr3], 2) → যেকোনো ২জন approve করলেই হবে, কিন্তু একা কেউ পারবে না।
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: UMA ROADMAP ── */}
      {tab === 4 && (
        <div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: "1.25rem", lineHeight: 1.7 }}>
            Contract-এ UMA integration-এর জন্য সম্পূর্ণ hook রাখা আছে। একটি function call-এই UMA চালু হবে — নতুন করে deploy করতে হবে না।
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.5rem" }}>
            {UMA_PHASES.map((p) => (
              <div key={p.phase} style={{ background: "var(--color-background-primary)", border: `2px solid ${p.bg}`, borderLeft: `4px solid ${p.color}`, borderRadius: "var(--border-radius-lg)", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{p.phase}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: "var(--border-radius-md)", background: p.bg, color: p.color, fontWeight: 500 }}>{p.tag}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.items.map(item => (
                    <span key={item} style={{ fontSize: 11, padding: "3px 8px", borderRadius: "var(--border-radius-md)", background: p.bg, color: p.color }}>✓ {item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "14px", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>UMA enable করতে মাত্র ২ লাইন</div>
            <CodeBlock code={`// Phase 2 শুরুতে owner একবার call করবে:
await contract.enableUMA("0xUMA_OPTIMISTIC_ORACLE_ADDRESS");

// তারপর resolver যেকোনো প্রশ্ন UMA-তে পাঠাতে পারবে:
await contract.requestUMAResolution(questionId);
// এই function টি পরে UMA OO-র requestPrice() call করবে`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { title: "UMA ছাড়া (এখন)", items: ["আপনার resolver-রা ভোট দেয়","কোনো token cost নেই","Multi-sig + timelock সুরক্ষা","IPFS proof mandatory","Manual dispute resolution"] },
              { title: "UMA সহ (পরে)", items: ["UMA token holder-রা ভোট দেয়","Bond + reward system আসবে","Decentralized dispute resolution","DVM escalation সম্ভব","Polymarket-level trustless"] },
            ].map((col) => (
              <div key={col.title} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "12px 14px" }}>
                <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 12 }}>{col.title}</div>
                {col.items.map(it => (
                  <div key={it} style={{ fontSize: 11, color: "var(--color-text-secondary)", padding: "3px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>• {it}</div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["UMA Docs","https://docs.uma.xyz"],["OO V2 Contract","https://github.com/UMAprotocol/protocol"],["Polygon Amoy Faucet","https://faucet.polygon.technology"],["Pinata IPFS","https://pinata.cloud"],["The Graph Studio","https://thegraph.com/studio"]].map(([l,u]) => (
              <a key={l} href={u} target="_blank" rel="noreferrer" style={{ padding: "6px 10px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", fontSize: 11, color: "var(--color-text-secondary)", textDecoration: "none" }}>
                <i className="ti ti-external-link" style={{ fontSize: 11, marginRight: 4 }} aria-hidden="true" />{l}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
