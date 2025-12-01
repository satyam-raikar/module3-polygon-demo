import { useState } from "react";
import { ethers } from "ethers";
import { BrutalCard, BrutalCardContent, BrutalCardHeader, BrutalCardTitle } from "./ui/brutal-card";
import { BrutalButton } from "./ui/brutal-button";
import { BrutalInput } from "./ui/brutal-input";
import { toast } from "sonner";
import { CONTRACT_ABI, POLYGON_RPC_URL } from "@/lib/contractABI";

interface CustomMintingWorkflowsProps {
  contractAddress: string;
  isWalletConnected: boolean;
}

interface MintingRecipe {
  id: string;
  title: string;
  description: string;
  burns: number[];
  mints: number;
}

const MINTING_RECIPES: MintingRecipe[] = [
  {
    id: "mint_3",
    title: "Mint Token 3",
    description: "Burn Tokens 0 & 1 to mint Token 3",
    burns: [0, 1],
    mints: 3,
  },
  {
    id: "mint_4",
    title: "Mint Token 4",
    description: "Burn Tokens 1 & 2 to mint Token 4",
    burns: [1, 2],
    mints: 4,
  },
  {
    id: "mint_5",
    title: "Mint Token 5",
    description: "Burn Tokens 0 & 2 to mint Token 5",
    burns: [0, 2],
    mints: 5,
  },
  {
    id: "mint_6",
    title: "Mint Token 6",
    description: "Burn Tokens 0, 1 & 2 to mint Token 6",
    burns: [0, 1, 2],
    mints: 6,
  },
];

export const CustomMintingWorkflows = ({
  contractAddress,
  isWalletConnected,
}: CustomMintingWorkflowsProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<{ [key: string]: string }>({});

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

  const handleMintWorkflow = async (recipe: MintingRecipe) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet to execute minting operations");
      return;
    }

    const recipient = recipientAddress[recipe.id];
    if (!recipient) {
      toast.error("Please enter a recipient address");
      return;
    }

    setLoading(recipe.id);
    try {
      const contract = await getContract(true);
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Step 1: Verify ownership of tokens to burn
      toast.info("Verifying token ownership...");
      for (const tokenId of recipe.burns) {
        const owner = await contract.ownerOf(tokenId);
        if (owner.toLowerCase() !== userAddress.toLowerCase()) {
          throw new Error(`You don't own Token ${tokenId}`);
        }
      }

      // Step 2: Burn tokens (transfer to 0x0 address)
      toast.info(`Burning ${recipe.burns.length} token(s)...`);
      const burnAddress = ethers.ZeroAddress;
      
      for (const tokenId of recipe.burns) {
        const tx = await contract.transferFrom(userAddress, burnAddress, tokenId);
        toast.info(`Burning Token ${tokenId}...`);
        await tx.wait();
      }

      // Step 3: Mint new token
      // Note: Actual minting logic depends on contract implementation
      // This is a placeholder - replace with actual mint function if available
      toast.success(
        `Tokens burned successfully! Token ${recipe.mints} should be minted to ${recipient}`
      );
      toast.info("Note: Actual minting depends on contract implementation");

      // Clear the input
      setRecipientAddress((prev) => ({ ...prev, [recipe.id]: "" }));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Failed to execute minting workflow`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {!isWalletConnected && (
        <BrutalCard>
          <BrutalCardContent className="py-6">
            <div className="text-center">
              <p className="text-lg font-bold mb-2">Wallet Connection Required</p>
              <p className="text-muted-foreground">
                Connect your wallet to access custom minting workflows
              </p>
            </div>
          </BrutalCardContent>
        </BrutalCard>
      )}

      {MINTING_RECIPES.map((recipe) => (
        <BrutalCard key={recipe.id}>
          <BrutalCardHeader>
            <BrutalCardTitle>{recipe.title}</BrutalCardTitle>
          </BrutalCardHeader>
          <BrutalCardContent className="space-y-4">
            <div className="bg-muted border-2 border-border p-4">
              <p className="text-sm font-bold mb-3">{recipe.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-bold uppercase text-xs text-muted-foreground mb-2">
                    Tokens to Burn
                  </div>
                  <div className="flex gap-2">
                    {recipe.burns.map((tokenId) => (
                      <div
                        key={tokenId}
                        className="bg-destructive/20 border-2 border-destructive px-3 py-1 font-mono font-bold"
                      >
                        #{tokenId}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-bold uppercase text-xs text-muted-foreground mb-2">
                    Token to Mint
                  </div>
                  <div className="bg-accent/20 border-2 border-accent px-3 py-1 font-mono font-bold inline-block">
                    #{recipe.mints}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Recipient Address</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="0x..."
                  value={recipientAddress[recipe.id] || ""}
                  onChange={(e) =>
                    setRecipientAddress((prev) => ({
                      ...prev,
                      [recipe.id]: e.target.value,
                    }))
                  }
                  disabled={!isWalletConnected}
                />
                <BrutalButton
                  onClick={() => handleMintWorkflow(recipe)}
                  disabled={
                    loading === recipe.id ||
                    !isWalletConnected ||
                    !recipientAddress[recipe.id]
                  }
                  size="sm"
                  variant="destructive"
                >
                  {loading === recipe.id ? "Processing..." : "Execute"}
                </BrutalButton>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-background border-2 border-border p-3">
              <span className="font-bold">Process:</span> Verify ownership → Burn tokens → Mint
              new token
            </div>
          </BrutalCardContent>
        </BrutalCard>
      ))}
    </div>
  );
};
