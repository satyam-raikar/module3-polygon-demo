import { useState, useEffect } from "react";
import { BrutalCard, BrutalCardContent, BrutalCardHeader, BrutalCardTitle } from "./ui/brutal-card";
import { BrutalButton } from "./ui/brutal-button";
import { toast } from "sonner";
import { ExternalLink, Coins } from "lucide-react";
import { useERC1155Contract } from "@/hooks/useERC1155Contract";
import { useTradeContract } from "@/hooks/useTradeContract";

interface CustomMintingWorkflowsProps {
  contractAddress: string;
  isWalletConnected: boolean;
}

interface TokenInfo {
  id: number;
  name: string;
  description: string;
  isMintable: boolean;
  cooldownMinutes?: number;
}

interface BurnRecipe {
  tokensToBurn: number[];
}

const TOKEN_INFO: TokenInfo[] = [
  {
    id: 0,
    name: "Token 0",
    description: "Free mint with 1-minute cooldown",
    isMintable: true,
    cooldownMinutes: 1,
  },
  {
    id: 1,
    name: "Token 1",
    description: "Free mint with 1-minute cooldown",
    isMintable: true,
    cooldownMinutes: 1,
  },
  {
    id: 2,
    name: "Token 2",
    description: "Free mint with 1-minute cooldown",
    isMintable: true,
    cooldownMinutes: 1,
  },
  {
    id: 3,
    name: "Token 3",
    description: "Forge by burning Token 0 & 1",
    isMintable: false,
  },
  {
    id: 4,
    name: "Token 4",
    description: "Forge by burning Token 1 & 2",
    isMintable: false,
  },
  {
    id: 5,
    name: "Token 5",
    description: "Forge by burning Token 0 & 2",
    isMintable: false,
  },
  {
    id: 6,
    name: "Token 6",
    description: "Forge by burning Token 0, 1 & 2",
    isMintable: false,
  },
];

const BURN_RECIPES: { [key: number]: BurnRecipe } = {
  3: { tokensToBurn: [0, 1] },
  4: { tokensToBurn: [1, 2] },
  5: { tokensToBurn: [0, 2] },
  6: { tokensToBurn: [0, 1, 2] },
};

const COOLDOWN_KEY_PREFIX = "mint_cooldown_token_";
const OPENSEA_COLLECTION_URL = "https://opensea.io/collection/your-collection-slug";

export const CustomMintingWorkflows = ({
  contractAddress,
  isWalletConnected,
}: CustomMintingWorkflowsProps) => {
  const [cooldowns, setCooldowns] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState<{ [key: number]: number }>({});
  const [selectedTradeToken, setSelectedTradeToken] = useState<number | null>(null);

  // Use custom hooks
  const {
    balances,
    maticBalance,
    isApproved,
    checkingApproval,
    loadBalancesAndApproval,
    handleApproval: handleERC1155Approval,
    handleRevoke: handleERC1155Revoke,
  } = useERC1155Contract({
    contractAddress,
    isWalletConnected,
  });

  const {
    loading: tradeLoading,
    mintToken,
    forgeToken,
    burnToken,
    tradeToken,
    contractAddress: tradeContractAddress,
  } = useTradeContract({
    onSuccess: () => {
      loadBalancesAndApproval(tradeContractAddress);
    },
  });

  useEffect(() => {
    // Load cooldowns from localStorage
    const loadedCooldowns: { [key: number]: number } = {};
    TOKEN_INFO.forEach((token) => {
      if (token.isMintable) {
        const cooldownStr = localStorage.getItem(
          `${COOLDOWN_KEY_PREFIX}${token.id}`
        );
        if (cooldownStr) {
          const cooldownEnd = parseInt(cooldownStr);
          if (cooldownEnd > Date.now()) {
            loadedCooldowns[token.id] = cooldownEnd;
          } else {
            localStorage.removeItem(`${COOLDOWN_KEY_PREFIX}${token.id}`);
          }
        }
      }
    });
    setCooldowns(loadedCooldowns);
  }, []);

  useEffect(() => {
    if (isWalletConnected) {
      loadBalancesAndApproval(tradeContractAddress);
    }
  }, [isWalletConnected, tradeContractAddress]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newTimeRemaining: { [key: number]: number } = {};
      let hasActiveCooldowns = false;

      Object.entries(cooldowns).forEach(([tokenId, endTime]) => {
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        if (remaining > 0) {
          newTimeRemaining[parseInt(tokenId)] = remaining;
          hasActiveCooldowns = true;
        } else {
          localStorage.removeItem(
            `${COOLDOWN_KEY_PREFIX}${tokenId}`
          );
        }
      });

      setTimeRemaining(newTimeRemaining);

      if (!hasActiveCooldowns && Object.keys(cooldowns).length > 0) {
        setCooldowns({});
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldowns]);

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

    if (isCooldownActive(tokenId)) {
      toast.error("Token is still on cooldown");
      return;
    }

    const result = await mintToken(tokenId);
    
    if (result.success) {
      toast.success(`Successfully minted Token ${tokenId}!`);
      
      // Set cooldown
      const token = TOKEN_INFO.find((t) => t.id === tokenId);
      if (token?.cooldownMinutes) {
        const cooldownEnd = Date.now() + token.cooldownMinutes * 60 * 1000;
        setCooldowns((prev) => ({ ...prev, [tokenId]: cooldownEnd }));
        localStorage.setItem(
          `${COOLDOWN_KEY_PREFIX}${tokenId}`,
          cooldownEnd.toString()
        );
      }
    } else {
      toast.error(`Failed to mint: ${result.error}`);
    }
  };

  const isCooldownActive = (tokenId: number): boolean => {
    return cooldowns[tokenId] > Date.now();
  };

  const handleApproval = async () => {
    const result = await handleERC1155Approval(tradeContractAddress);
    if (result.success) {
      toast.success("Contract approved! You can now forge, burn, and trade tokens.");
    } else {
      toast.error(`Failed to approve contract: ${result.error}`);
    }
  };

  const handleRevoke = async () => {
    const result = await handleERC1155Revoke(tradeContractAddress);
    if (result.success) {
      toast.success("Contract approval revoked successfully.");
    } else {
      toast.error(`Failed to revoke approval: ${result.error}`);
    }
  };

  const canMintBurnToken = (tokenId: number): boolean => {
    const recipe = BURN_RECIPES[tokenId];
    if (!recipe) return false;

    return recipe.tokensToBurn.every((burnTokenId) => {
      return (balances[burnTokenId] || 0) >= 1;
    });
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

    const recipe = BURN_RECIPES[tokenId];
    if (!recipe) {
      toast.error("Invalid token for forging");
      return;
    }

    if (!canMintBurnToken(tokenId)) {
      toast.error("You don't have the required tokens to forge this token");
      return;
    }

    const burnAmounts = recipe.tokensToBurn.map(() => 1);
    const result = await forgeToken(tokenId, recipe.tokensToBurn, burnAmounts);

    if (result.success) {
      toast.success(`Successfully forged Token ${tokenId}!`);
    } else {
      toast.error(`Failed to forge: ${result.error}`);
    }
  };

  const handleBurn = async (tokenId: number) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!isApproved) {
      toast.error("Please approve the contract first");
      return;
    }

    const result = await burnToken(tokenId);
    
    if (result.success) {
      toast.success(`Successfully burned Token ${tokenId}!`);
    } else {
      toast.error(`Failed to burn: ${result.error}`);
    }
  };

  const handleTrade = async (burnTokenId: number, receiveTokenId: number) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!isApproved) {
      toast.error("Please approve the contract first");
      return;
    }

    const result = await tradeToken(burnTokenId, receiveTokenId);
    
    if (result.success) {
      toast.success(
        `Successfully traded Token ${burnTokenId} for Token ${receiveTokenId}!`
      );
      setSelectedTradeToken(null);
    } else {
      toast.error(`Failed to trade: ${result.error}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Collection Overview */}
      <div className="bg-secondary border-4 border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold uppercase flex items-center gap-2">
            <Coins className="w-6 h-6" />
            Your Collection
          </h2>
          <a
            href={OPENSEA_COLLECTION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold uppercase bg-primary text-primary-foreground px-4 py-2 border-2 border-border hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            View on OpenSea
          </a>
        </div>

        {isWalletConnected ? (
          <div className="space-y-4">
            <div className="bg-background border-2 border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold uppercase text-muted-foreground">
                  MATIC Balance
                </span>
                <span className="text-lg font-mono font-bold">
                  {parseFloat(maticBalance).toFixed(4)} MATIC
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TOKEN_INFO.map((token) => (
                <div
                  key={token.id}
                  className="bg-background border-2 border-border p-3"
                >
                  <div className="text-xs font-bold uppercase text-muted-foreground mb-1">
                    Token {token.id}
                  </div>
                  <div className="text-2xl font-mono font-bold">
                    {balances[token.id] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-background border-2 border-border">
            <p className="text-muted-foreground">
              Connect your wallet to view your collection
            </p>
          </div>
        )}
      </div>

      {/* Free Mint Tokens */}
      <div>
        <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
          <span className="bg-primary text-primary-foreground px-3 py-1">Free Mint</span>
          <span className="text-muted-foreground text-sm">Tokens 0, 1, 2</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOKEN_INFO.filter((t) => t.isMintable).map((token) => {
            const onCooldown = isCooldownActive(token.id);
            const remainingTime = timeRemaining[token.id] || 0;

            return (
              <BrutalCard key={token.id}>
                <BrutalCardHeader>
                  <BrutalCardTitle className="flex items-center justify-between">
                    <span>{token.name}</span>
                    <span className="text-xs font-mono bg-accent text-accent-foreground px-2 py-1">
                      Balance: {balances[token.id] || 0}
                    </span>
                  </BrutalCardTitle>
                </BrutalCardHeader>
                <BrutalCardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {token.description}
                  </p>

                  {onCooldown && (
                    <div className="bg-destructive/10 border-2 border-destructive p-3">
                      <div className="text-xs font-bold uppercase text-destructive mb-1">
                        Cooldown Active
                      </div>
                      <div className="text-lg font-mono font-bold text-destructive">
                        {formatTime(remainingTime)}
                      </div>
                    </div>
                  )}

                  <BrutalButton
                    onClick={() => handleMint(token.id)}
                    disabled={tradeLoading === token.id || !isWalletConnected || onCooldown}
                    className="w-full"
                  >
                    {tradeLoading === token.id
                      ? "Minting..."
                      : onCooldown
                      ? `Cooldown: ${formatTime(remainingTime)}`
                      : "Mint (Free)"}
                  </BrutalButton>

                  {!isWalletConnected && (
                    <div className="text-xs text-center text-muted-foreground">
                      Connect wallet to mint
                    </div>
                  )}
                </BrutalCardContent>
              </BrutalCard>
            );
          })}
        </div>
      </div>

      {/* Forge Tokens */}
      <div>
        <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
          <span className="bg-accent text-accent-foreground px-3 py-1">Forge Tokens</span>
          <span className="text-muted-foreground text-sm">Tokens 3, 4, 5, 6</span>
        </h3>

        {!isWalletConnected && (
          <BrutalCard>
            <BrutalCardContent className="py-6">
              <div className="text-center">
                <p className="text-lg font-bold mb-2">Wallet Connection Required</p>
                <p className="text-muted-foreground">
                  Connect your wallet to forge tokens
                </p>
              </div>
            </BrutalCardContent>
          </BrutalCard>
        )}

        {isWalletConnected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Approve Contract Card */}
            <BrutalCard>
              <BrutalCardContent className="py-6">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-lg font-bold mb-2">
                      {isApproved ? "✓ Contract Approved" : "Approval Required"}
                    </p>
                    <p className="text-muted-foreground">
                      {isApproved 
                        ? "Contract is currently approved for trading" 
                        : "Approve the contract to forge, burn, and trade tokens"}
                    </p>
                  </div>

                  {!isApproved && (
                    <div className="bg-muted border-2 border-border p-4">
                      <p className="font-bold mb-2">How Approval Works:</p>
                      <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                        <li>Click "Approve Contract" below</li>
                        <li>Confirm the transaction in MetaMask</li>
                        <li>Wait for transaction confirmation</li>
                        <li>Start forging, burning, and trading!</li>
                      </ol>
                    </div>
                  )}

                  <BrutalButton
                    onClick={handleApproval}
                    disabled={checkingApproval || isApproved}
                    className="w-full"
                    size="lg"
                  >
                    {checkingApproval ? "Approving..." : isApproved ? "Already Approved" : "Approve Contract"}
                  </BrutalButton>
                </div>
              </BrutalCardContent>
            </BrutalCard>

            {/* Revoke Approval Card */}
            <BrutalCard>
              <BrutalCardContent className="py-6">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-lg font-bold mb-2">Revoke Approval</p>
                    <p className="text-muted-foreground">
                      {isApproved 
                        ? "Remove contract permissions to prevent token operations" 
                        : "Approval must be granted before it can be revoked"}
                    </p>
                  </div>

                  <div className="bg-muted border-2 border-border p-4">
                    <p className="font-bold mb-2">What Revoking Does:</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Removes contract's permission to move your tokens</li>
                      <li>• Prevents forging, burning, and trading operations</li>
                      <li>• Can be re-approved at any time</li>
                      <li>• Increases security when not actively trading</li>
                    </ul>
                  </div>

                  <BrutalButton
                    onClick={handleRevoke}
                    disabled={checkingApproval || !isApproved}
                    className="w-full"
                    variant="destructive"
                    size="lg"
                  >
                    {checkingApproval ? "Revoking..." : !isApproved ? "Not Approved Yet" : "Revoke Approval"}
                  </BrutalButton>
                </div>
              </BrutalCardContent>
            </BrutalCard>
          </div>
        )}

        {isWalletConnected && isApproved && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TOKEN_INFO.filter((t) => !t.isMintable).map((token) => {
              const recipe = BURN_RECIPES[token.id];
              const canMint = canMintBurnToken(token.id);

              return (
                <BrutalCard key={token.id}>
                  <BrutalCardHeader>
                    <BrutalCardTitle className="flex items-center justify-between">
                      <span>{token.name}</span>
                      <span className="text-xs font-mono bg-accent text-accent-foreground px-2 py-1">
                        Balance: {balances[token.id] || 0}
                      </span>
                    </BrutalCardTitle>
                  </BrutalCardHeader>
                  <BrutalCardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {token.description}
                    </p>

                    {recipe && (
                      <div className="bg-muted border-2 border-border p-3">
                        <div className="text-xs font-bold uppercase text-muted-foreground mb-2">
                          Required to Forge:
                        </div>
                        {recipe.tokensToBurn.map((burnTokenId) => (
                          <div
                            key={burnTokenId}
                            className="flex items-center justify-between text-sm mb-1"
                          >
                            <span>Token {burnTokenId}</span>
                            <span
                              className={
                                (balances[burnTokenId] || 0) >= 1
                                  ? "text-primary font-bold"
                                  : "text-destructive"
                              }
                            >
                              {balances[burnTokenId] || 0} / 1
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <BrutalButton
                        onClick={() => handleForge(token.id)}
                        disabled={
                          tradeLoading === token.id ||
                          !isWalletConnected ||
                          !isApproved ||
                          !canMint
                        }
                        className="w-full"
                        variant={canMint && isApproved ? "default" : "outline"}
                      >
                        {tradeLoading === token.id
                          ? "Forging..."
                          : !isApproved
                          ? "Approval Required"
                          : !canMint
                          ? "Insufficient Tokens"
                          : "Forge"}
                      </BrutalButton>

                      {isApproved && balances[token.id] > 0 && (
                        <BrutalButton
                          onClick={() => handleBurn(token.id)}
                          disabled={tradeLoading === token.id}
                          className="w-full"
                          variant="destructive"
                        >
                          {tradeLoading === token.id ? "Burning..." : "Burn (Get Nothing)"}
                        </BrutalButton>
                      )}
                    </div>

                    {isApproved && !canMint && (
                      <div className="text-xs text-muted-foreground bg-background border-2 border-border p-2">
                        You need to mint the required tokens first before you can forge this token.
                      </div>
                    )}
                  </BrutalCardContent>
                </BrutalCard>
              );
            })}
          </div>
          </>
        )}
      </div>

      {/* Trade Tokens */}
      <div>
        <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
          <span className="bg-secondary text-secondary-foreground px-3 py-1">Trade Tokens</span>
          <span className="text-muted-foreground text-sm">Any Token → 0, 1, or 2</span>
        </h3>

        {!isWalletConnected && (
          <BrutalCard>
            <BrutalCardContent className="py-6">
              <div className="text-center">
                <p className="text-lg font-bold mb-2">Wallet Connection Required</p>
                <p className="text-muted-foreground">
                  Connect your wallet to trade tokens
                </p>
              </div>
            </BrutalCardContent>
          </BrutalCard>
        )}

        {isWalletConnected && (
          <BrutalCard>
            <BrutalCardContent className="py-6">
              <div className="space-y-4">
                <div className="bg-muted border-2 border-border p-4">
                  <p className="font-bold mb-2">Trading Rules:</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Burn 1 token → Receive 1 token from [0, 1, or 2]</li>
                    <li>• 1:1 ratio for all trades</li>
                    <li>• Choose which token you want to receive</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[0, 1, 2, 3, 4, 5, 6].map((tokenId) => {
                    const balance = balances[tokenId] || 0;
                    return (
                      <BrutalCard key={tokenId}>
                        <BrutalCardHeader>
                          <BrutalCardTitle className="flex items-center justify-between">
                            <span>Token {tokenId}</span>
                            <span className="text-xs font-mono bg-accent text-accent-foreground px-2 py-1">
                              Balance: {balance}
                            </span>
                          </BrutalCardTitle>
                        </BrutalCardHeader>
                        <BrutalCardContent className="space-y-3">
                          {balance > 0 ? (
                            <>
                              {selectedTradeToken === tokenId ? (
                                <div className="space-y-2">
                                  <div className="text-xs font-bold uppercase text-muted-foreground mb-2">
                                    Select token to receive:
                                  </div>
                                  {[0, 1, 2].map((receiveId) => (
                                    <BrutalButton
                                      key={receiveId}
                                      onClick={() => handleTrade(tokenId, receiveId)}
                                      disabled={!isApproved || tradeLoading === tokenId}
                                      className="w-full"
                                      size="sm"
                                    >
                                      {tradeLoading === tokenId ? "Trading..." : `Get Token ${receiveId}`}
                                    </BrutalButton>
                                  ))}
                                  <BrutalButton
                                    onClick={() => setSelectedTradeToken(null)}
                                    variant="outline"
                                    className="w-full"
                                    size="sm"
                                  >
                                    Cancel
                                  </BrutalButton>
                                </div>
                              ) : (
                                <BrutalButton
                                  onClick={() => setSelectedTradeToken(tokenId)}
                                  disabled={!isApproved}
                                  className="w-full"
                                  variant="secondary"
                                >
                                  Trade This
                                </BrutalButton>
                              )}
                            </>
                          ) : (
                            <div className="text-center text-sm text-muted-foreground p-2 bg-muted border-2 border-border">
                              No tokens to trade
                            </div>
                          )}
                        </BrutalCardContent>
                      </BrutalCard>
                    );
                  })}
                </div>
              </div>
            </BrutalCardContent>
          </BrutalCard>
        )}
      </div>
    </div>
  );
};
