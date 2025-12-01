import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrutalCard, BrutalCardContent, BrutalCardHeader, BrutalCardTitle } from "./ui/brutal-card";
import { BrutalButton } from "./ui/brutal-button";
import { toast } from "sonner";
import { CONTRACT_ABI, POLYGON_RPC_URL } from "@/lib/contractABI";

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
    description: "Mint by burning Token 0 & 1",
    isMintable: false,
  },
  {
    id: 4,
    name: "Token 4",
    description: "Mint by burning Token 1 & 2",
    isMintable: false,
  },
  {
    id: 5,
    name: "Token 5",
    description: "Mint by burning Token 0 & 2",
    isMintable: false,
  },
  {
    id: 6,
    name: "Token 6",
    description: "Mint by burning Token 0, 1 & 2",
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

export const CustomMintingWorkflows = ({
  contractAddress,
  isWalletConnected,
}: CustomMintingWorkflowsProps) => {
  const [loading, setLoading] = useState<number | null>(null);
  const [cooldowns, setCooldowns] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState<{ [key: number]: number }>({});
  const [balances, setBalances] = useState<{ [key: number]: number }>({});
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [checkingApproval, setCheckingApproval] = useState<boolean>(false);

  useEffect(() => {
    // Load cooldowns from localStorage
    const loadedCooldowns: { [key: number]: number } = {};
    TOKEN_INFO.forEach((token) => {
      if (token.isMintable) {
        const cooldownEnd = localStorage.getItem(`${COOLDOWN_KEY_PREFIX}${token.id}`);
        if (cooldownEnd) {
          const endTime = parseInt(cooldownEnd);
          if (endTime > Date.now()) {
            loadedCooldowns[token.id] = endTime;
          } else {
            // Expired cooldown, remove it
            localStorage.removeItem(`${COOLDOWN_KEY_PREFIX}${token.id}`);
          }
        }
      }
    });
    setCooldowns(loadedCooldowns);
  }, []);

  useEffect(() => {
    // Load balances and approval status when wallet is connected
    if (isWalletConnected) {
      loadBalancesAndApproval();
    }
  }, [isWalletConnected]);

  const loadBalancesAndApproval = async () => {
    if (!isWalletConnected || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

      // Load balances for tokens 0-2
      const newBalances: { [key: number]: number } = {};
      for (let i = 0; i <= 2; i++) {
        const balance = await contract.balanceOf(userAddress, i);
        newBalances[i] = Number(balance);
      }
      setBalances(newBalances);

      // Check approval status
      const approved = await contract.isApprovedForAll(userAddress, contractAddress);
      setIsApproved(approved);
    } catch (error) {
      console.error("Error loading balances and approval:", error);
    }
  };

  useEffect(() => {
    // Update time remaining every second
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: number]: number } = {};
      Object.keys(cooldowns).forEach((tokenId) => {
        const id = parseInt(tokenId);
        const endTime = cooldowns[id];
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        
        if (remaining > 0) {
          newTimeRemaining[id] = remaining;
        } else {
          // Cooldown expired, remove it
          localStorage.removeItem(`${COOLDOWN_KEY_PREFIX}${id}`);
          setCooldowns((prev) => {
            const newCooldowns = { ...prev };
            delete newCooldowns[id];
            return newCooldowns;
          });
        }
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldowns]);

  const getContract = (needsSigner = false) => {
    if (!needsSigner && !isWalletConnected) {
      const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
      return new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    }

    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);

    if (needsSigner) {
      return provider.getSigner().then((signer) =>
        new ethers.Contract(contractAddress, CONTRACT_ABI, signer)
      );
    }

    return new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const handleMint = async (tokenId: number) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet to mint");
      return;
    }

    // Check cooldown
    if (cooldowns[tokenId] && cooldowns[tokenId] > Date.now()) {
      toast.error(`Please wait ${formatTime(timeRemaining[tokenId])} before minting again`);
      return;
    }

    setLoading(tokenId);
    try {
      const contract = await getContract(true);
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      toast.info(`Minting Token ${tokenId}...`);
      const tx = await contract.mint(userAddress, tokenId);
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      
      toast.success(`Successfully minted Token ${tokenId}!`);

      // Set cooldown
      const tokenInfo = TOKEN_INFO.find((t) => t.id === tokenId);
      if (tokenInfo?.cooldownMinutes) {
        const cooldownEnd = Date.now() + tokenInfo.cooldownMinutes * 60 * 1000;
        localStorage.setItem(`${COOLDOWN_KEY_PREFIX}${tokenId}`, cooldownEnd.toString());
        setCooldowns((prev) => ({ ...prev, [tokenId]: cooldownEnd }));
      }

      // Reload balances
      await loadBalancesAndApproval();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Failed to mint Token ${tokenId}`);
    } finally {
      setLoading(null);
    }
  };

  const isCooldownActive = (tokenId: number): boolean => {
    return cooldowns[tokenId] && cooldowns[tokenId] > Date.now();
  };

  const handleApproval = async () => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    setCheckingApproval(true);
    try {
      const contract = await getContract(true);
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();

      toast.info("Requesting approval...");
      const tx = await contract.setApprovalForAll(contractAddress, true);
      toast.info("Approval transaction submitted. Waiting for confirmation...");
      await tx.wait();

      setIsApproved(true);
      toast.success("Approval granted! You can now mint special tokens.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to approve");
    } finally {
      setCheckingApproval(false);
    }
  };

  const canMintBurnToken = (tokenId: number): boolean => {
    const recipe = BURN_RECIPES[tokenId];
    if (!recipe || !isApproved) return false;

    return recipe.tokensToBurn.every((burnTokenId) => 
      balances[burnTokenId] && balances[burnTokenId] >= 1
    );
  };

  const handleBurnAndMint = async (tokenId: number) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!isApproved) {
      toast.error("Please approve the contract first");
      return;
    }

    const recipe = BURN_RECIPES[tokenId];
    if (!recipe) return;

    if (!canMintBurnToken(tokenId)) {
      toast.error("You don't have the required tokens to mint this");
      return;
    }

    setLoading(tokenId);
    try {
      const contract = await getContract(true);
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Burn required tokens
      toast.info(`Burning required tokens...`);
      for (const burnTokenId of recipe.tokensToBurn) {
        const burnTx = await contract.burn(userAddress, burnTokenId, 1);
        await burnTx.wait();
      }

      // Mint new token
      toast.info(`Minting Token ${tokenId}...`);
      const mintTx = await contract.mint(userAddress, tokenId);
      await mintTx.wait();

      toast.success(`Successfully minted Token ${tokenId}!`);

      // Reload balances
      await loadBalancesAndApproval();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Failed to mint Token ${tokenId}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <BrutalCard>
        <BrutalCardContent className="py-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold uppercase">Collection Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-muted border-2 border-border p-4">
                <div className="font-bold uppercase text-xs text-muted-foreground mb-1">
                  Total Tokens
                </div>
                <div className="text-2xl font-black">7 Types</div>
                <div className="text-xs text-muted-foreground mt-1">IDs: 0-6</div>
              </div>
              <div className="bg-muted border-2 border-border p-4">
                <div className="font-bold uppercase text-xs text-muted-foreground mb-1">
                  Free Mint
                </div>
                <div className="text-2xl font-black">Tokens 0-2</div>
                <div className="text-xs text-muted-foreground mt-1">1-minute cooldown</div>
              </div>
              <div className="bg-muted border-2 border-border p-4">
                <div className="font-bold uppercase text-xs text-muted-foreground mb-1">
                  Supply Limit
                </div>
                <div className="text-2xl font-black">Unlimited</div>
                <div className="text-xs text-muted-foreground mt-1">No max supply</div>
              </div>
            </div>
          </div>
        </BrutalCardContent>
      </BrutalCard>

      {!isWalletConnected && (
        <BrutalCard>
          <BrutalCardContent className="py-6">
            <div className="text-center">
              <p className="text-lg font-bold mb-2">Wallet Connection Required</p>
              <p className="text-muted-foreground">
                Connect your wallet to mint free tokens (0-2)
              </p>
            </div>
          </BrutalCardContent>
        </BrutalCard>
      )}

      {/* Free Mint Tokens */}
      <div>
        <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
          <span className="bg-primary text-primary-foreground px-3 py-1">Free Mint</span>
          <span className="text-muted-foreground text-sm">Tokens 0-2</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOKEN_INFO.filter((t) => t.isMintable).map((token) => (
            <BrutalCard key={token.id}>
              <BrutalCardHeader>
                <BrutalCardTitle className="flex items-center justify-between">
                  <span>{token.name}</span>
                  <span className="text-xs font-mono bg-accent text-accent-foreground px-2 py-1">
                    ID: {token.id}
                  </span>
                </BrutalCardTitle>
              </BrutalCardHeader>
              <BrutalCardContent className="space-y-4">
                <div className="bg-muted border-2 border-border p-3 text-sm">
                  {token.description}
                </div>

                <div className="space-y-2">
                  {isCooldownActive(token.id) ? (
                    <div className="bg-destructive/10 border-2 border-destructive p-3 text-center">
                      <div className="text-xs font-bold uppercase text-destructive mb-1">
                        Cooldown Active
                      </div>
                      <div className="text-2xl font-black font-mono">
                        {formatTime(timeRemaining[token.id] || 0)}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-accent/10 border-2 border-accent p-3 text-center">
                      <div className="text-xs font-bold uppercase text-muted-foreground mb-1">
                        Ready to Mint
                      </div>
                      <div className="text-lg font-bold">Free (+ Gas)</div>
                    </div>
                  )}

                  <BrutalButton
                    onClick={() => handleMint(token.id)}
                    disabled={
                      loading === token.id ||
                      !isWalletConnected ||
                      isCooldownActive(token.id)
                    }
                    className="w-full"
                    variant={isCooldownActive(token.id) ? "outline" : "default"}
                  >
                    {loading === token.id
                      ? "Minting..."
                      : isCooldownActive(token.id)
                      ? "Cooldown Active"
                      : "Mint Now"}
                  </BrutalButton>
                </div>

                <div className="text-xs text-muted-foreground bg-background border-2 border-border p-2">
                  <span className="font-bold">Cooldown:</span> {token.cooldownMinutes} minute
                  between mints
                </div>
              </BrutalCardContent>
            </BrutalCard>
          ))}
        </div>
      </div>

      {/* Burn to Mint Tokens */}
      <div>
        <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
          <span className="bg-accent text-accent-foreground px-3 py-1">Burn to Mint</span>
          <span className="text-muted-foreground text-sm">Tokens 3-6</span>
        </h3>

        {!isWalletConnected && (
          <BrutalCard>
            <BrutalCardContent className="py-6">
              <div className="text-center">
                <p className="text-lg font-bold mb-2">Wallet Connection Required</p>
                <p className="text-muted-foreground">
                  Connect your wallet to mint special tokens by burning base tokens
                </p>
              </div>
            </BrutalCardContent>
          </BrutalCard>
        )}

        {isWalletConnected && !isApproved && (
          <BrutalCard className="mb-4">
            <BrutalCardContent className="py-6">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-lg font-bold mb-2">Approval Required</p>
                  <p className="text-muted-foreground mb-4">
                    Before minting special tokens, you need to approve the contract to burn your tokens
                  </p>
                </div>
                <div className="bg-muted border-2 border-border p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">1️⃣</span>
                    <div>
                      <p className="font-bold">Click Approve</p>
                      <p className="text-sm text-muted-foreground">Grant permission to the contract</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">2️⃣</span>
                    <div>
                      <p className="font-bold">Confirm Transaction</p>
                      <p className="text-sm text-muted-foreground">Approve in your wallet</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">3️⃣</span>
                    <div>
                      <p className="font-bold">Start Minting</p>
                      <p className="text-sm text-muted-foreground">Once approved, mint special tokens</p>
                    </div>
                  </div>
                </div>
                <BrutalButton
                  onClick={handleApproval}
                  disabled={checkingApproval}
                  className="w-full"
                >
                  {checkingApproval ? "Approving..." : "Approve Contract"}
                </BrutalButton>
              </div>
            </BrutalCardContent>
          </BrutalCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOKEN_INFO.filter((t) => !t.isMintable).map((token) => {
            const recipe = BURN_RECIPES[token.id];
            const canMint = canMintBurnToken(token.id);

            return (
              <BrutalCard key={token.id}>
                <BrutalCardHeader>
                  <BrutalCardTitle className="flex items-center justify-between">
                    <span>{token.name}</span>
                    <span className="text-xs font-mono bg-accent text-accent-foreground px-2 py-1">
                      ID: {token.id}
                    </span>
                  </BrutalCardTitle>
                </BrutalCardHeader>
                <BrutalCardContent className="space-y-4">
                  <div className="bg-muted border-2 border-border p-3 text-sm">
                    {token.description}
                  </div>

                  {recipe && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase text-muted-foreground">
                        Required Tokens:
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {recipe.tokensToBurn.map((burnTokenId) => {
                          const balance = balances[burnTokenId] || 0;
                          const hasEnough = balance >= 1;

                          return (
                            <div
                              key={burnTokenId}
                              className={`flex items-center justify-between p-2 border-2 ${
                                hasEnough
                                  ? "bg-accent/10 border-accent"
                                  : "bg-destructive/10 border-destructive"
                              }`}
                            >
                              <span className="font-bold">Token {burnTokenId}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Balance: {balance}</span>
                                {hasEnough ? (
                                  <span className="text-accent">✓</span>
                                ) : (
                                  <span className="text-destructive">✗</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <BrutalButton
                    onClick={() => handleBurnAndMint(token.id)}
                    disabled={
                      loading === token.id ||
                      !isWalletConnected ||
                      !isApproved ||
                      !canMint
                    }
                    className="w-full"
                    variant={canMint && isApproved ? "default" : "outline"}
                  >
                    {loading === token.id
                      ? "Minting..."
                      : !isApproved
                      ? "Approval Required"
                      : !canMint
                      ? "Insufficient Tokens"
                      : "Burn & Mint"}
                  </BrutalButton>

                  {isApproved && !canMint && (
                    <div className="text-xs text-muted-foreground bg-background border-2 border-border p-2">
                      You need to mint the required tokens first before you can create this token.
                    </div>
                  )}
                </BrutalCardContent>
              </BrutalCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
