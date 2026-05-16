# Phase 2 Checkpoint Report — Access Control Verification

> **Date:** 2026-05-14  
> **Auditor:** Principal Smart Contract Auditor  
> **Scope:** `contracts/PlokyToken.sol`, `contracts/PlokyResolver.sol`, `contracts/PlokyResolverLite.sol`

---

## Access Control Paradigm: OpenZeppelin AccessControl + Custom RBAC

All three contracts inherit from **OpenZeppelin `AccessControl`** and use `bytes32` role identifiers with `onlyRole()` modifiers. `PlokyResolver` additionally inherits `ReentrancyGuard` and `Pausable`, and defines a custom `onlyResolver` modifier for resolver-specific validation.

**Roles Defined:**

| Role | Contracts | Granted To |
|------|-----------|------------|
| `DEFAULT_ADMIN_ROLE` | All | Constructor `admin` param |
| `ADMIN_ROLE` | PlokyResolver | Constructor `admin` param |
| `RESOLVER_ROLE` | All | Admin + self-staking users |
| `ARBITER_ROLE` | All | Admin |
| `AI_ORACLE_ROLE` | All | Admin |
| `MINTER_ROLE` | PlokyToken | Admin |
| `BURNER_ROLE` | PlokyToken | Admin |

**Custom Modifiers:**
- `onlyResolver()` — Checks `resolvers[msg.sender].isActive == true` AND `stakedAmount >= MIN_RESOLVER_STAKE`
- `exists(bytes32 id)` — Validates question exists
- `notFrozen(bytes32 id)` — Validates question is not frozen

---

## Vulnerabilities Remediated

**None required. All sensitive functions are properly protected.**

A comprehensive audit of all 30+ external/public state-mutating functions across the three contracts found zero exposed sensitive functions. Every function that performs privileged operations (minting, burning, admin configuration, slashing, oracle submission, arbiter resolution) has the appropriate access control modifier applied.

---

## Access Control Matrix

### PlokyToken.sol

| Function | Mutates State? | Required Modifier/Role | Status |
|----------|---------------|------------------------|--------|
| `mint(address,uint256)` | ✅ Yes | `onlyRole(MINTER_ROLE)` | ✅ Protected |
| `burn(address,uint256)` | ✅ Yes | `onlyRole(BURNER_ROLE)` | ✅ Protected |

### PlokyResolver.sol

| Function | Mutates State? | Required Modifier/Role | Status |
|----------|---------------|------------------------|--------|
| `createQuestion(...)` | ✅ Yes | `whenNotPaused` (permissionless) | ✅ Intentionally open |
| `stakeAsResolver(uint256)` | ✅ Yes | `nonReentrant whenNotPaused` | ✅ Economic barrier (min stake) |
| `unstakeAsResolver(uint256)` | ✅ Yes | `nonReentrant` | ✅ Self-service only |
| `slashResolver(address,uint256,string)` | ✅ Yes | `nonReentrant onlyRole(ARBITER_ROLE)` | ✅ Protected |
| `submitAIAnalysis(...)` | ✅ Yes | `onlyRole(AI_ORACLE_ROLE)` | ✅ Protected |
| `submitEvidence(...)` | ✅ Yes | `nonReentrant whenNotPaused exists notFrozen` | ✅ Intentionally open |
| `castCommunityVote(...)` | ✅ Yes | `nonReentrant whenNotPaused exists notFrozen` | ✅ Intentionally open |
| `finalizeCommunityVote(bytes32)` | ✅ Yes | `exists` | ✅ Keeper pattern (timelock-gated) |
| `proposeVerdict(...)` | ✅ Yes | `nonReentrant onlyResolver whenNotPaused exists notFrozen` | ✅ Protected |
| `approveVerdict(bytes32,bytes32)` | ✅ Yes | `nonReentrant onlyResolver whenNotPaused exists notFrozen` | ✅ Protected |
| `executeVerdict(bytes32)` | ✅ Yes | `nonReentrant whenNotPaused exists notFrozen` | ✅ Keeper pattern (quorum+timelock) |
| `raiseDispute(...)` | ✅ Yes | `nonReentrant whenNotPaused exists` | ✅ Intentionally open |
| `resolveDispute(...)` | ✅ Yes | `nonReentrant onlyRole(ARBITER_ROLE)` | ✅ Protected |
| `enableUMA(address)` | ✅ Yes | `onlyRole(ADMIN_ROLE)` | ✅ Protected |
| `requestUMAResolution(bytes32)` | ✅ Yes | `onlyResolver exists notFrozen` | ✅ Protected |
| `settleUMAResolution(bytes32)` | ✅ Yes | `nonReentrant exists` | ✅ Keeper pattern (UMA price-gated) |
| `freezeQuestion(bytes32,string)` | ✅ Yes | `onlyRole(ADMIN_ROLE)` | ✅ Protected |
| `unfreezeQuestion(bytes32)` | ✅ Yes | `onlyRole(ADMIN_ROLE)` | ✅ Protected |
| `cancelQuestion(bytes32,string)` | ✅ Yes | `onlyRole(ADMIN_ROLE) exists` | ✅ Protected |
| `setQuorum(uint256)` | ✅ Yes | `onlyRole(ADMIN_ROLE)` | ✅ Protected |
| `setAIThreshold(uint256)` | ✅ Yes | `onlyRole(ADMIN_ROLE)` | ✅ Protected |
| `setTreasury(address)` | ✅ Yes | `onlyRole(ADMIN_ROLE)` | ✅ Protected |
| `emergencyPause()` | ✅ Yes | `onlyRole(ADMIN_ROLE)` | ✅ Protected |
| `emergencyUnpause()` | ✅ Yes | `onlyRole(ADMIN_ROLE)` | ✅ Protected |
| `withdrawStuckTokens(address,uint256)` | ✅ Yes | `onlyRole(DEFAULT_ADMIN_ROLE)` | ✅ Protected |

### PlokyResolverLite.sol

| Function | Mutates State? | Required Modifier/Role | Status |
|----------|---------------|------------------------|--------|
| `stake(uint256)` | ✅ Yes | None (permissionless) | ✅ Economic barrier (STAKE_MIN) |
| `unstake(uint256)` | ✅ Yes | `nonReentrant onlyRole(RESOLVER_ROLE)` | ✅ Protected |
| `createQuestion(...)` | ✅ Yes | None (permissionless) | ✅ Intentionally open |
| `submitEvidence(bytes32,bytes32,uint8)` | ✅ Yes | None (permissionless) | ✅ Intentionally open |
| `proposeVerdict(bytes32,Outcome,bytes32)` | ✅ Yes | `nonReentrant onlyRole(RESOLVER_ROLE)` | ✅ Protected |
| `approveVerdict(bytes32,bytes32)` | ✅ Yes | `onlyRole(RESOLVER_ROLE)` | ✅ Protected |
| `executeVerdict(bytes32)` | ✅ Yes | `nonReentrant` | ✅ Keeper pattern (timelock-gated) |
| `raiseDispute(bytes32,string,bytes32)` | ✅ Yes | `nonReentrant` | ✅ Intentionally open |
| `resolveDispute(bytes32,uint256,bool)` | ✅ Yes | `nonReentrant onlyRole(ARBITER_ROLE)` | ✅ Protected |
| `submitAIAnalysis(bytes32,uint256,Outcome)` | ✅ Yes | `onlyRole(AI_ORACLE_ROLE)` | ✅ Protected |
| `cancelQuestion(bytes32)` | ✅ Yes | `onlyRole(DEFAULT_ADMIN_ROLE)` | ✅ Protected |

---

## Design Notes (Not Vulnerabilities)

1. **Permissionless Market Creation:** Both `createQuestion()` functions are open to anyone. This is standard for prediction market platforms (Polymarket, Augur). No spam prevention mechanism (creation fee/bond) is present. **Recommendation:** Consider adding a small PLKY bond or `ADMIN_ROLE` gating for production if spam becomes an issue.

2. **Permissionless Resolver Onboarding:** `stakeAsResolver()` and `stake()` allow anyone to become a resolver by staking the minimum amount (1000 PLKY). No admin approval or KYC is required. **Recommendation:** This is acceptable for a decentralized resolver network. The economic stake provides the security guarantee.

3. **Keeper Pattern Functions:** `executeVerdict()`, `finalizeCommunityVote()`, and `settleUMAResolution()` are intentionally permissionless. They can only execute when internal conditions are met (timelock expired, quorum reached, UMA price available). This prevents liveness failures and does not expose any unauthorized state changes.

4. **`unstakeAsResolver` lacks `whenNotPaused`:** Users can unstake during an emergency pause. This may be intentional (allow exit during incidents) or an oversight. **Recommendation:** Add `whenNotPaused` if the intent is to freeze all state changes during emergencies.

---

## Compilation Status: ✅ PASS

```
Compiled 2 Solidity files successfully (evm target: paris).
```

No changes were required for Phase 2. All contracts already had correct access control.

---

## Ready for Phase 3: ✅ YES

**Criteria Met:**
- [x] All state-mutating functions audited
- [x] Zero exposed sensitive functions
- [x] All admin/oracle/arbiter/mint/burn functions have appropriate modifiers
- [x] Permissionless functions confirmed as intentionally open with proper internal guards
- [x] Compilation passes with 0 errors
