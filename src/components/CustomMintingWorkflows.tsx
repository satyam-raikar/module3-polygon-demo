import { useState, useEffect } from "react";
import { BrutalCard, BrutalCardContent, BrutalCardHeader, BrutalCardTitle } from "./ui/brutal-card";
import { BrutalButton } from "./ui/brutal-button";
import { BrutalInput } from "./ui/brutal-input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { toast } from "sonner";
import { Code, ChevronDown, ExternalLink } from "lucide-react";
import { useERC1155Contract } from "@/hooks/useERC1155Contract";
import { useTradeContract } from "@/hooks/useTradeContract";
import { TRADE_CONTRACT_ADDRESS } from "@/lib/tradeContractABI";

const POLYGONSCAN_URL = "https://polygonscan.com/tx/";

const showTxToast = (message: string, txHash?: string, isError = false) => {
  if (isError) {
    toast.error(message);
    return;
  }
  
  toast.success(message, {
    description: txHash ? `TX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}` : undefined,
    action: txHash ? {
      label: "View TX",
      onClick: () => window.open(`${POLYGONSCAN_URL}${txHash}`, "_blank"),
    } : undefined,
    duration: 5000,
  });
};
const CONTRACT_FUNCTIONS = [{
  name: "mintBase",
  signature: "mintBase(uint256 id, uint256 amount)",
  description: "Mint base tokens (0-2). 60 second cooldown between mints.",
  type: "write"
}, {
  name: "forge",
  signature: "forge(uint256 targetId)",
  description: "Forge tokens 3-6 by burning required base tokens. Token 3: burn 0+1, Token 4: burn 1+2, Token 5: burn 0+2, Token 6: burn 0+1+2.",
  type: "write"
}, {
  name: "burnTop",
  signature: "burnTop(uint256 id, uint256 amount)",
  description: "Burn tokens 3-6 for no reward. Irreversible.",
  type: "write"
}, {
  name: "tradeForBase",
  signature: "tradeForBase(uint256 giveId, uint256 giveAmount, uint256 receiveId)",
  description: "Trade any token for base tokens (0-2) at admin-configured exchange rates.",
  type: "write"
}, {
  name: "canMintBase",
  signature: "canMintBase(address user) → bool",
  description: "Check if user can mint (cooldown expired).",
  type: "view"
}, {
  name: "lastBaseMintTimestamp",
  signature: "lastBaseMintTimestamp(address) → uint256",
  description: "Get the last mint timestamp for cooldown calculation.",
  type: "view"
}, {
  name: "getExchangeRate",
  signature: "getExchangeRate(uint256 giveId, uint256 receiveId) → uint256",
  description: "Get exchange rate for trading tokens.",
  type: "view"
}];
interface CustomMintingWorkflowsProps {
  contractAddress: string;
  isWalletConnected: boolean;
}
interface TokenInfo {
  id: number;
  name: string;
  description: string;
  isMintable: boolean;
}
interface BurnRecipe {
  tokensToBurn: number[];
}
const TOKEN_INFO: TokenInfo[] = [{
  id: 0,
  name: "Token 0",
  description: "Free mint with 60s cooldown",
  isMintable: true
}, {
  id: 1,
  name: "Token 1",
  description: "Free mint with 60s cooldown",
  isMintable: true
}, {
  id: 2,
  name: "Token 2",
  description: "Free mint with 60s cooldown",
  isMintable: true
}, {
  id: 3,
  name: "Token 3",
  description: "Forge by burning Token 0 & 1",
  isMintable: false
}, {
  id: 4,
  name: "Token 4",
  description: "Forge by burning Token 1 & 2",
  isMintable: false
}, {
  id: 5,
  name: "Token 5",
  description: "Forge by burning Token 0 & 2",
  isMintable: false
}, {
  id: 6,
  name: "Token 6",
  description: "Forge by burning Token 0, 1 & 2",
  isMintable: false
}];
const BURN_RECIPES: {
  [key: number]: BurnRecipe;
} = {
  3: {
    tokensToBurn: [0, 1]
  },
  4: {
    tokensToBurn: [1, 2]
  },
  5: {
    tokensToBurn: [0, 2]
  },
  6: {
    tokensToBurn: [0, 1, 2]
  }
};
export const CustomMintingWorkflows = ({
  contractAddress,
  isWalletConnected
}: CustomMintingWorkflowsProps) => {
  const [mintAmounts, setMintAmounts] = useState<{
    [key: number]: number;
  }>({
    0: 1,
    1: 1,
    2: 1
  });
  const [burnAmounts, setBurnAmounts] = useState<{
    [key: number]: number;
  }>({
    3: 1,
    4: 1,
    5: 1,
    6: 1
  });
  const [tradeAmounts, setTradeAmounts] = useState<{
    [key: number]: number;
  }>({});
  const [selectedTradeToken, setSelectedTradeToken] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<{
    [key: string]: number;
  }>({});
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const {
    balances,
    isApproved,
    checkingApproval,
    loadBalancesAndApproval,
    handleApproval: handleERC1155Approval,
    handleRevoke: handleERC1155Revoke
  } = useERC1155Contract({
    contractAddress,
    isWalletConnected
  });
  const {
    loading: tradeLoading,
    mintToken,
    forgeToken,
    burnToken,
    tradeToken,
    getLastMintTimestamp,
    getExchangeRate
  } = useTradeContract({
    onSuccess: () => {
      loadBalancesAndApproval();
      checkCooldown();
    }
  });
  const checkCooldown = async () => {
    if (!isWalletConnected || typeof window.ethereum === "undefined") return;
    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts"
      });
      if (accounts && accounts.length > 0) {
        const lastMintTimestamp = await getLastMintTimestamp(accounts[0]);
        if (lastMintTimestamp > 0) {
          const cooldownEndTime = (lastMintTimestamp + 60) * 1000; // Convert to milliseconds
          if (cooldownEndTime > Date.now()) {
            setCooldownEnd(cooldownEndTime);
          } else {
            setCooldownEnd(null);
          }
        } else {
          setCooldownEnd(null);
        }
      }
    } catch (error) {
      // Silently fail - contract might not be deployed or address might be wrong
      console.warn("Cooldown check failed (contract may not exist at this address):", error);
      setCooldownEnd(null);
    }
  };
  useEffect(() => {
    if (isWalletConnected) {
      loadBalancesAndApproval();
      checkCooldown();
    }
  }, [isWalletConnected]);
  useEffect(() => {
    if (!cooldownEnd) {
      setTimeRemaining(0);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) setCooldownEnd(null);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  const handleMint = async (tokenId: number) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    const amount = mintAmounts[tokenId] || 1;
    const result = await mintToken(tokenId, amount);
    if (result.success) {
      showTxToast(`Successfully minted ${amount}x Token ${tokenId}!`, result.txHash);
    } else {
      showTxToast(`Failed to mint: ${result.error}`, undefined, true);
    }
  };
  const handleApproval = async () => {
    const result = await handleERC1155Approval();
    if (result.success) {
      toast.success("Contract approved!");
    } else {
      toast.error(`Failed to approve: ${result.error}`);
    }
  };
  const handleRevoke = async () => {
    const result = await handleERC1155Revoke();
    if (result.success) {
      toast.success("Approval revoked.");
    } else {
      toast.error(`Failed to revoke: ${result.error}`);
    }
  };
  const canForgeToken = (tokenId: number): boolean => {
    const recipe = BURN_RECIPES[tokenId];
    if (!recipe) return false;
    return recipe.tokensToBurn.every(id => (balances[id] || 0) >= 1);
  };
  const handleForge = async (tokenId: number) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!isApproved) {
      toast.error("Please approve the contract first");
      return;
    }
    if (!canForgeToken(tokenId)) {
      toast.error("Insufficient tokens to forge");
      return;
    }
    const result = await forgeToken(tokenId);
    if (result.success) {
      showTxToast(`Successfully forged Token ${tokenId}!`, result.txHash);
    } else {
      showTxToast(`Failed to forge: ${result.error}`, undefined, true);
    }
  };
  const handleBurnTop = async (tokenId: number) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!isApproved) {
      toast.error("Please approve the contract first");
      return;
    }
    const amount = burnAmounts[tokenId] || 1;
    if ((balances[tokenId] || 0) < amount) {
      toast.error("Insufficient balance to burn");
      return;
    }
    const result = await burnToken(tokenId, amount);
    if (result.success) {
      showTxToast(`Burned ${amount}x Token ${tokenId}!`, result.txHash);
    } else {
      showTxToast(`Failed to burn: ${result.error}`, undefined, true);
    }
  };
  const handleTrade = async (giveId: number, receiveId: number) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!isApproved) {
      toast.error("Please approve the contract first");
      return;
    }
    const amount = tradeAmounts[giveId] || 1;
    const result = await tradeToken(giveId, amount, receiveId);
    if (result.success) {
      showTxToast(`Traded ${amount}x Token ${giveId} for Token ${receiveId}!`, result.txHash);
      setSelectedTradeToken(null);
    } else {
      showTxToast(`Failed to trade: ${result.error}`, undefined, true);
    }
  };
  const isCooldownActive = cooldownEnd !== null && timeRemaining > 0;
  return <div className="space-y-8">
      {/* Contract Functions Reference - Collapsible */}
      <Collapsible>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold uppercase flex items-center gap-2">
            <Code className="w-5 h-5" />
            <span className="bg-muted text-muted-foreground px-3 py-1">Trade Contract Functions</span>
            
          </h3>
          <CollapsibleTrigger asChild>
            <BrutalButton variant="outline" size="sm" className="gap-2">
              <span>Show Functions</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </BrutalButton>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-4">
          <BrutalCard>
            <BrutalCardContent className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CONTRACT_FUNCTIONS.map(fn => <div key={fn.name} className="border-2 border-border p-3 bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 ${fn.type === 'write' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                        {fn.type}
                      </span>
                      <span className="font-mono font-bold text-sm">{fn.name}</span>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground mb-2 break-all">{fn.signature}</div>
                    <p className="text-xs text-muted-foreground">{fn.description}</p>
                  </div>)}
              </div>
            </BrutalCardContent>
          </BrutalCard>
        </CollapsibleContent>
      </Collapsible>

      {/* Free Mint Tokens 0-2 */}
      <div>
        <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
          <span className="bg-primary text-primary-foreground px-3 py-1">Free Mint</span>
          <span className="text-muted-foreground text-sm">Tokens 0, 1, 2</span>
        </h3>

        {isCooldownActive && <div className="bg-destructive/10 border-2 border-destructive p-4 mb-4">
            <div className="text-sm font-bold uppercase text-destructive mb-1">Global Cooldown Active</div>
            <div className="text-2xl font-mono font-bold text-destructive">{formatTime(timeRemaining)}</div>
          </div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOKEN_INFO.filter(t => t.isMintable).map(token => <BrutalCard key={token.id}>
              <BrutalCardHeader>
                <BrutalCardTitle className="flex items-center justify-between">
                  <span>{token.name}</span>
                  <span className="text-xs font-mono bg-accent text-accent-foreground px-2 py-1">
                    Balance: {balances[token.id] || 0}
                  </span>
                </BrutalCardTitle>
              </BrutalCardHeader>
              <BrutalCardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{token.description}</p>
                <div className="flex gap-2">
                  <BrutalInput type="number" min={1} value={mintAmounts[token.id] || 1} onChange={e => setMintAmounts(prev => ({
                ...prev,
                [token.id]: Math.max(1, parseInt(e.target.value) || 1)
              }))} className="w-20" />
                  <BrutalButton onClick={() => handleMint(token.id)} disabled={tradeLoading === token.id || !isWalletConnected || isCooldownActive} className="flex-1">
                    {tradeLoading === token.id ? "Minting..." : isCooldownActive ? `Wait ${timeRemaining}s` : "Mint"}
                  </BrutalButton>
                </div>
                {!isWalletConnected && <div className="text-xs text-center text-muted-foreground">Connect wallet to mint</div>}
              </BrutalCardContent>
            </BrutalCard>)}
        </div>
      </div>

      {/* Forge Tokens 3-6 */}
      <div>
        <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
          <span className="bg-accent text-accent-foreground px-3 py-1">Forge Tokens</span>
          <span className="text-muted-foreground text-sm">Tokens 3, 4, 5, 6</span>
        </h3>

        {!isWalletConnected ? <BrutalCard>
            <BrutalCardContent className="py-6 text-center">
              <p className="text-lg font-bold mb-2">Wallet Connection Required</p>
              <p className="text-muted-foreground">Connect your wallet to forge tokens</p>
            </BrutalCardContent>
          </BrutalCard> : <>
            {/* Approval Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <BrutalCard>
                <BrutalCardContent className="py-6 space-y-4">
                  <div className="text-center">
                    <p className="text-lg font-bold mb-2">{isApproved ? "✓ Contract Approved" : "Approval Required"}</p>
                    <p className="text-muted-foreground text-sm">
                      {isApproved ? "Ready for forging, burning, and trading" : "Approve to enable operations"}
                    </p>
                  </div>
                  <BrutalButton onClick={handleApproval} disabled={checkingApproval || isApproved} className="w-full" size="lg">
                    {checkingApproval ? "Approving..." : isApproved ? "Already Approved" : "Approve Contract"}
                  </BrutalButton>
                </BrutalCardContent>
              </BrutalCard>
              <BrutalCard>
                <BrutalCardContent className="py-6 space-y-4">
                  <div className="text-center">
                    <p className="text-lg font-bold mb-2">Revoke Approval</p>
                    <p className="text-muted-foreground text-sm">Remove contract permissions</p>
                  </div>
                  <BrutalButton onClick={handleRevoke} disabled={checkingApproval || !isApproved} className="w-full" variant="destructive" size="lg">
                    {checkingApproval ? "Revoking..." : !isApproved ? "Not Approved" : "Revoke Approval"}
                  </BrutalButton>
                </BrutalCardContent>
              </BrutalCard>
            </div>

            {/* Forge Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TOKEN_INFO.filter(t => !t.isMintable).map(token => {
            const recipe = BURN_RECIPES[token.id];
            const canMint = canForgeToken(token.id);
            return <BrutalCard key={token.id}>
                    <BrutalCardHeader>
                      <BrutalCardTitle className="flex items-center justify-between">
                        <span>{token.name}</span>
                        <span className="text-xs font-mono bg-accent text-accent-foreground px-2 py-1">
                          Balance: {balances[token.id] || 0}
                        </span>
                      </BrutalCardTitle>
                    </BrutalCardHeader>
                    <BrutalCardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{token.description}</p>
                      {recipe && <div className="bg-muted border-2 border-border p-3">
                          <div className="text-xs font-bold uppercase text-muted-foreground mb-2">Required:</div>
                          {recipe.tokensToBurn.map(burnId => <div key={burnId} className="flex items-center justify-between text-sm mb-1">
                              <span>Token {burnId}</span>
                              <span className={(balances[burnId] || 0) >= 1 ? "text-primary font-bold" : "text-destructive"}>
                                {balances[burnId] || 0} / 1
                              </span>
                            </div>)}
                        </div>}
                      <BrutalButton onClick={() => handleForge(token.id)} disabled={tradeLoading === token.id || !isApproved || !canMint} className="w-full" variant={canMint && isApproved ? "default" : "outline"}>
                        {tradeLoading === token.id ? "Forging..." : !isApproved ? "Approval Required" : !canMint ? "Need Tokens" : "Forge"}
                      </BrutalButton>
                    </BrutalCardContent>
                  </BrutalCard>;
          })}
            </div>
          </>}
      </div>

      {/* Burn Tokens 3-6 */}
      <div>
        <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
          <span className="bg-destructive text-destructive-foreground px-3 py-1">Burn Tokens</span>
          <span className="text-muted-foreground text-sm">Tokens 3, 4, 5, 6 → Nothing</span>
        </h3>

        {!isWalletConnected ? <BrutalCard>
            <BrutalCardContent className="py-6 text-center">
              <p className="text-lg font-bold mb-2">Wallet Connection Required</p>
              <p className="text-muted-foreground">Connect your wallet to burn tokens</p>
            </BrutalCardContent>
          </BrutalCard> : <>
            <div className="bg-destructive/10 border-2 border-destructive p-4 mb-4">
              <p className="font-bold text-destructive">⚠️ Warning: Burning tokens is irreversible and you get nothing back!</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[3, 4, 5, 6].map(tokenId => {
            const balance = balances[tokenId] || 0;
            return <BrutalCard key={tokenId}>
                    <BrutalCardHeader>
                      <BrutalCardTitle className="flex items-center justify-between">
                        <span>Token {tokenId}</span>
                        <span className="text-xs font-mono bg-accent text-accent-foreground px-2 py-1">
                          {balance}
                        </span>
                      </BrutalCardTitle>
                    </BrutalCardHeader>
                    <BrutalCardContent className="space-y-3">
                      <div className="flex gap-2">
                        <BrutalInput type="number" min={1} max={balance} value={burnAmounts[tokenId] || 1} onChange={e => setBurnAmounts(prev => ({
                    ...prev,
                    [tokenId]: Math.max(1, Math.min(balance, parseInt(e.target.value) || 1))
                  }))} className="w-16" disabled={balance === 0} />
                        <BrutalButton onClick={() => handleBurnTop(tokenId)} disabled={tradeLoading === tokenId || !isApproved || balance === 0} className="flex-1" variant="destructive">
                          {tradeLoading === tokenId ? "Burning..." : !isApproved ? "Approve" : balance === 0 ? "No Tokens" : "Burn"}
                        </BrutalButton>
                      </div>
                    </BrutalCardContent>
                  </BrutalCard>;
          })}
            </div>
          </>}
      </div>

      {/* Trade Tokens */}
      <div>
        <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
          <span className="bg-secondary text-secondary-foreground px-3 py-1">Trade Tokens</span>
          <span className="text-muted-foreground text-sm">Any Token → 0, 1, or 2</span>
        </h3>

        {!isWalletConnected ? <BrutalCard>
            <BrutalCardContent className="py-6 text-center">
              <p className="text-lg font-bold mb-2">Wallet Connection Required</p>
              <p className="text-muted-foreground">Connect your wallet to trade tokens</p>
            </BrutalCardContent>
          </BrutalCard> : <BrutalCard>
            <BrutalCardContent className="py-6 space-y-4">
              <div className="bg-muted border-2 border-border p-4">
                <p className="font-bold mb-2">Trading Rules:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Trade any token for Token 0, 1, or 2</li>
                  <li>• Exchange rate set by admin</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[0, 1, 2].map(tokenId => {
              const balance = balances[tokenId] || 0;
              return <BrutalCard key={tokenId}>
                      <BrutalCardHeader>
                        <BrutalCardTitle className="flex items-center justify-between">
                          <span>Token {tokenId}</span>
                          <span className="text-xs font-mono bg-accent text-accent-foreground px-2 py-1">{balance}</span>
                        </BrutalCardTitle>
                      </BrutalCardHeader>
                      <BrutalCardContent className="space-y-3">
                        {balance > 0 ? selectedTradeToken === tokenId ? <div className="space-y-2">
                              <BrutalInput type="number" min={1} max={balance} value={tradeAmounts[tokenId] || 1} onChange={e => setTradeAmounts(prev => ({
                      ...prev,
                      [tokenId]: Math.max(1, Math.min(balance, parseInt(e.target.value) || 1))
                    }))} className="w-full" />
                              <div className="text-xs font-bold uppercase text-muted-foreground">Receive:</div>
                              {[0, 1, 2].filter(receiveId => receiveId !== tokenId).map(receiveId => {
                                const rate = exchangeRates[`${tokenId}-${receiveId}`];
                                const amount = tradeAmounts[tokenId] || 1;
                                const receiveAmount = rate ? amount * rate : null;
                                return (
                                  <BrutalButton 
                                    key={receiveId} 
                                    onClick={() => handleTrade(tokenId, receiveId)} 
                                    disabled={!isApproved || tradeLoading === `trade-${tokenId}`} 
                                    className="w-full flex justify-between items-center" 
                                    size="sm"
                                  >
                                    <span>{tradeLoading === `trade-${tokenId}` ? "Trading..." : `Token ${receiveId}`}</span>
                                    {receiveAmount !== null && (
                                      <span className="text-xs opacity-75">→ {receiveAmount}x</span>
                                    )}
                                  </BrutalButton>
                                );
                              })}
                              <BrutalButton onClick={() => setSelectedTradeToken(null)} variant="outline" className="w-full" size="sm">
                                Cancel
                              </BrutalButton>
                            </div> : <BrutalButton onClick={async () => {
                    setSelectedTradeToken(tokenId);
                    setTradeAmounts(prev => ({
                      ...prev,
                      [tokenId]: 1
                    }));
                    // Fetch exchange rates
                    const rates: { [key: string]: number } = {};
                    for (const receiveId of [0, 1, 2].filter(id => id !== tokenId)) {
                      const rate = await getExchangeRate(tokenId, receiveId);
                      rates[`${tokenId}-${receiveId}`] = rate;
                    }
                    setExchangeRates(prev => ({ ...prev, ...rates }));
                  }} disabled={!isApproved} className="w-full" variant="secondary">
                              {!isApproved ? "Approve First" : "Trade"}
                            </BrutalButton> : <div className="text-center text-sm text-muted-foreground p-2 bg-muted border-2 border-border">No tokens</div>}
                      </BrutalCardContent>
                    </BrutalCard>;
            })}
              </div>
            </BrutalCardContent>
          </BrutalCard>}
      </div>
    </div>;
};