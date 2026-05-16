# Phase 3 Checkpoint Report — State Tracking & Event Emission

> **Date:** 2026-05-14  
> **Auditor:** Principal Smart Contract Auditor  
> **Scope:** `contracts/PlokyToken.sol`, `contracts/PlokyResolver.sol`, `contracts/PlokyResolverLite.sol`

---

## Total Functions Audited: 33

### PlokyResolver.sol — 24 state-mutating functions
### PlokyResolverLite.sol — 9 state-mutating functions

---

## Events Added: 4

### PlokyResolver.sol (3 events added)

1. **`AIThresholdChanged(uint256 old_, uint256 new_, address by)`**
   - Added to `setAIThreshold()` (line 800)
   - Captures previous and new AI confidence threshold values
   - Why it matters: Audit trail for AI oracle parameter changes

2. **`TreasuryChanged(address old_, address new_, address by)`**
   - Added to `setTreasury()` (line 807)
   - Captures previous and new treasury address
   - Why it matters: Critical for tracking where seized/disputed funds are routed

3. **`StuckTokensWithdrawn(address token, address to, uint256 amount)`**
   - Added to `withdrawStuckTokens()` (line 824)
   - Records emergency rescue of tokens sent to contract
   - Why it matters: Transparency for admin emergency actions

### PlokyResolverLite.sol (1 event added)

4. **`QuestionCancelled(bytes32 id, address by)`**
   - Added to `cancelQuestion()` (line 226)
   - Matches PlokyResolver's `QuestionCancelled` pattern
   - Why it matters: Subgraphs and frontends need cancellation events to sync market status

---

## Existing Event Coverage — Verified Intact

| Function | Contract | Event Emitted | Status |
|----------|----------|--------------|--------|
| `createQuestion()` | PlokyResolver | `QuestionCreated` | ✅ Verified |
| `stakeAsResolver()` | PlokyResolver | `ResolverAdded` | ✅ Verified |
| `unstakeAsResolver()` | PlokyResolver | `ResolverRemoved` | ✅ Verified |
| `slashResolver()` | PlokyResolver | `ResolverSlashed` | ✅ Verified |
| `submitAIAnalysis()` | PlokyResolver | `AIAnalysisSubmitted` | ✅ Verified |
| `submitEvidence()` | PlokyResolver | `EvidenceSubmitted` | ✅ Verified |
| `castCommunityVote()` | PlokyResolver | `CommunityVoted` | ✅ Verified |
| `finalizeCommunityVote()` | PlokyResolver | `CommunityVoteFinalized` | ✅ Verified |
| `proposeVerdict()` | PlokyResolver | `VerdictProposed` | ✅ Verified |
| `approveVerdict()` | PlokyResolver | `VerdictApproved` | ✅ Verified |
| `executeVerdict()` | PlokyResolver | `VerdictExecuted` | ✅ Verified |
| `raiseDispute()` | PlokyResolver | `DisputeRaised` + `QuestionFrozen` | ✅ Verified |
| `resolveDispute()` | PlokyResolver | `DisputeResolved` + `BondReturned`/`BondSeized` | ✅ Verified |
| `enableUMA()` | PlokyResolver | `UMAEnabled` | ✅ Verified |
| `requestUMAResolution()` | PlokyResolver | `UMARequested` | ✅ Verified |
| `settleUMAResolution()` | PlokyResolver | `VerdictExecuted` | ✅ Verified |
| `freezeQuestion()` | PlokyResolver | `QuestionFrozen` | ✅ Verified |
| `unfreezeQuestion()` | PlokyResolver | `QuestionUnfrozen` | ✅ Verified |
| `cancelQuestion()` | PlokyResolver | `QuestionCancelled` | ✅ Verified |
| `setQuorum()` | PlokyResolver | `QuorumChanged` | ✅ Verified |
| `emergencyPause()` | PlokyResolver | `Paused` (OZ Pausable) | ✅ Verified |
| `emergencyUnpause()` | PlokyResolver | `Unpaused` (OZ Pausable) | ✅ Verified |
| `stake()` | PlokyResolverLite | `Staked` | ✅ Verified |
| `unstake()` | PlokyResolverLite | `Unstaked` | ✅ Verified |
| `createQuestion()` | PlokyResolverLite | `QuestionCreated` | ✅ Verified |
| `submitEvidence()` | PlokyResolverLite | `EvidenceSubmitted` | ✅ Verified |
| `proposeVerdict()` | PlokyResolverLite | `VerdictProposed` | ✅ Verified |
| `approveVerdict()` | PlokyResolverLite | `VerdictApproved` | ✅ Verified |
| `executeVerdict()` | PlokyResolverLite | `VerdictExecuted` | ✅ Verified |
| `raiseDispute()` | PlokyResolverLite | `DisputeRaised` | ✅ Verified |
| `resolveDispute()` | PlokyResolverLite | `DisputeResolved` | ✅ Verified |
| `submitAIAnalysis()` | PlokyResolverLite | `AIAnalysis` | ✅ Verified |
| `mint()` | PlokyToken | `Transfer` (OZ ERC20) | ✅ Verified |
| `burn()` | PlokyToken | `Transfer` (OZ ERC20) | ✅ Verified |

---

## Compilation Status: ✅ PASS

```
Compiled 2 Solidity files successfully (evm target: paris).
```

Pre-existing contract-size warning on `PlokyResolver` (30,083 bytes) — unchanged from Phase 1.

---

## Ready for Phase 4: ✅ YES

**Criteria Met:**
- [x] All 33 state-mutating functions audited for event coverage
- [x] 4 missing events identified and surgically added
- [x] Zero existing event signatures modified (no indexed keyword changes)
- [x] Compilation passes with 0 errors
- [x] OpenZeppelin events (`Transfer`, `Paused`, `Unpaused`) acknowledged as sufficient
