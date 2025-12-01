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
    description: "Special token - Not directly mintable",
    isMintable: false,
  },
  {
    id: 4,
    name: "Token 4",
    description: "Special token - Not directly mintable",
    isMintable: false,
  },
  {
    id: 5,
    name: "Token 5",
    description: "Special token - Not directly mintable",
    isMintable: false,
  },
  {
    id: 6,
    name: "Token 6",
    description: "Special token - Not directly mintable",
    isMintable: false,
  },
];

const COOLDOWN_KEY_PREFIX = "mint_cooldown_token_";

export const CustomMintingWorkflows = ({
  contractAddress,
  isWalletConnected,
}: CustomMintingWorkflowsProps) => {
  const [loading, setLoading] = useState<number | null>(null);
  const [cooldowns, setCooldowns] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState<{ [key: number]: number }>({});

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

      {/* Special Tokens */}
      <div>
        <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
          <span className="bg-accent text-accent-foreground px-3 py-1">Special Tokens</span>
          <span className="text-muted-foreground text-sm">Tokens 3-6</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {TOKEN_INFO.filter((t) => !t.isMintable).map((token) => (
            <BrutalCard key={token.id}>
              <BrutalCardHeader>
                <BrutalCardTitle className="text-center">
                  <div className="text-xs font-mono bg-muted px-2 py-1 inline-block mb-2">
                    ID: {token.id}
                  </div>
                  <div>{token.name}</div>
                </BrutalCardTitle>
              </BrutalCardHeader>
              <BrutalCardContent>
                <div className="bg-muted border-2 border-border p-3 text-sm text-center">
                  {token.description}
                </div>
              </BrutalCardContent>
            </BrutalCard>
          ))}
        </div>
      </div>
    </div>
  );
};
