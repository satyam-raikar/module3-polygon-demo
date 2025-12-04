# 🧱 ERC-1155 Trade & Forge System – Module 3 Assignment

This repository contains a **two-contract on-chain crafting and trading system** built using **Solidity (v0.8.27)** and **OpenZeppelin Contracts v5**.

The system allows:
- Public minting of base tokens with cooldown
- Forging of higher-tier tokens using burn mechanics
- Burning tokens permanently
- Trading any token into base tokens using admin-defined rates
- Full role-based access control and operator permissions

---

## 📦 Contracts Overview

| Contract | Purpose |
|----------|---------|
| `AModule3.sol` | Core ERC-1155 token contract |
| `tradeContract.sol` | Game logic for minting, forging, trading, and burning |

---

## 🔐 1. AModule3 – ERC-1155 Token Contract

This is the core multi-token contract.

### ✅ Features
- ERC-1155 multi-token standard
- Burnable tokens
- Supply tracking per token
- Role-based access control
- Dynamic metadata URI support

### ✅ Roles

| Role | Purpose |
|------|---------|
| `DEFAULT_ADMIN_ROLE` | Full administrative control |
| `MINTER_ROLE` | Can mint tokens |
| `URI_SETTER_ROLE` | Can update metadata URI |

### ✅ Minting
Only addresses with `MINTER_ROLE` can mint:
```solidity
mint(address account, uint256 id, uint256 amount)
mintBatch(address to, uint256[] ids, uint256[] amounts)
```

### ✅ Burning
Any holder can burn their own tokens:
```solidity
burn(address account, uint256 id, uint256 amount)
burnBatch(address account, uint256[] ids, uint256[] amounts)
```

---

## ⚙️ 2. tradeContract – Version 1

This contract controls:
- Cooldown-based minting
- On-chain forging (crafting)
- Token trading
- Permanent burning of forged tokens
- Exchange rate economy

The `tradeContract` **must be granted `MINTER_ROLE` on `AModule3`** so it can mint after burns.

---

## 🪙 Token System

There are exactly **7 token IDs** in the system:

| ID | Type | Description |
|----|------|-------------|
| `0` | Base | Public mintable |
| `1` | Base | Public mintable |
| `2` | Base | Public mintable |
| `3` | Forged | Crafted from `0 + 1` |
| `4` | Forged | Crafted from `1 + 2` |
| `5` | Forged | Crafted from `0 + 2` |
| `6` | Forged | Crafted from `0 + 1 + 2` |

✅ No supply limits on any token.

---

## ⏱️ 3. Base Token Minting (Tokens 0–2)

```solidity
mintBase(uint256 id, uint256 amount)
```

### Rules
- Only token IDs: `0`, `1`, `2`
- Anyone can mint
- 60-second cooldown per wallet
- Cooldown applies globally across all base tokens
- Unlimited supply

---

## 🔧 4. Forging (Crafting) System

Users can craft higher-tier tokens by burning base tokens.

```solidity
forge(uint256 targetId)
```

### Forge Recipes

| Output | Required Burns |
|--------|----------------|
| `3` | `0 + 1` |
| `4` | `1 + 2` |
| `5` | `0 + 2` |
| `6` | `0 + 1 + 2` |

✅ Uses batch burning for gas optimization  
✅ Requires operator approval  
❌ Tokens `3–6` cannot be forged into anything else  
❌ No reverse crafting is possible  

---

## 🔥 5. Burning Forged Tokens (No Reward)

```solidity
burnTop(uint256 id, uint256 amount)
```

### Rules
- Only tokens `3–6` are allowed
- Tokens are destroyed permanently
- No rewards are given in return

---

## 🔁 6. Trading System (Any Token → Base Tokens)

Users can trade **any token (0–6)** into base tokens (`0–2`).

```solidity
tradeForBase(uint256 giveId, uint256 giveAmount, uint256 receiveId)
```

### Exchange Rates
Admin configures the economy using:
```solidity
setExchangeRate(giveId, receiveId, rate)
```

Meaning:
> 1 unit of giveId → rate units of receiveId

Example:
```solidity
setExchangeRate(6, 0, 5);
```
Burning 1x token(6) gives 5x token(0).

✅ Burn + mint happens atomically  
✅ Fully customizable economy  

---

## 👑 7. Admin Controls

Only the **owner of tradeContract** can:
- Configure exchange rates
- Control trading routes
- Tune the token economy

---

## 🔐 8. Approval Model

Before forging, burning or trading, users must approve:

```solidity
setApprovalForAll(tradeContract, true)
```

Otherwise all burn operations will revert.

---

## 🔄 9. Complete User Flow Example

```
1. User mints token(0)
2. Waits 60 seconds
3. User mints token(1)
4. User approves tradeContract
5. User forges token(3)
6. User trades token(3) → token(2)
7. User burns token(4) permanently
```

All operations are:
✅ Trustless  
✅ Non-custodial  
✅ Fully on-chain  

---

## 🛡️ 10. Security Design

| Protection | Status |
|------------|--------|
| Role-based access control | ✅ |
| Operator approvals | ✅ |
| Reentrancy protection | ✅ |
| No reverse forging | ✅ |
| No unrestricted minting | ✅ |
| Admin-only rate control | ✅ |

---

## 🚀 11. Deployment Steps

1. Deploy `AModule3`
   - Assign `DEFAULT_ADMIN_ROLE`
   - Assign `MINTER_ROLE` later

2. Deploy `tradeContract`
   - Pass the ERC-1155 contract address

3. Grant minting rights:
```solidity
grantRole(MINTER_ROLE, tradeContract)
```

4. Users approve:
```solidity
setApprovalForAll(tradeContract, true)
```

✅ System is now live.

---

## 🧾 Versioning

- ✅ **tradeContract – Version 1**
- ✅ Batch burning enabled
- ✅ Production-ready baseline

Future upgrades may include:
- Batch forging
- Batch trading
- Signature-based minting
- Meta-transactions
- Upgradeable proxy pattern

---

## ✅ Summary

This system delivers a **fully on-chain, gas-optimized crafting and trading economy** using ERC-1155 with:

- Public minting with cooldown
- Controlled forging
- Permanent burns
- Flexible trading economy
- Hardened security model

Ideal for:
- Web3 games
- NFT crafting systems
- On-chain economies
- DeFi-integrated assets

## 🔧 Clone and Run Project Locally

If you want to work locally using your own IDE, you can clone this repo.

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <GIT_URL>

# Step 2: Navigate to the project directory.
cd <PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```