import { useState } from "react";
import { useSDK } from "@metamask/sdk-react";
import { WalletConnect } from "@/components/WalletConnect";
import { ContractInteraction } from "@/components/ContractInteraction";
import { BrutalCard, BrutalCardContent, BrutalCardHeader, BrutalCardTitle } from "@/components/ui/brutal-card";
import { BrutalInput } from "@/components/ui/brutal-input";
import { BrutalButton } from "@/components/ui/brutal-button";
import { POLYGON_MAINNET_CHAIN_ID } from "@/lib/contractABI";

const Index = () => {
  const { connected, chainId } = useSDK();
  const [contractAddress, setContractAddress] = useState("");
  const [activeContract, setActiveContract] = useState("");

  const isPolygonNetwork = chainId === POLYGON_MAINNET_CHAIN_ID;

  const handleSetContract = () => {
    if (contractAddress) {
      setActiveContract(contractAddress);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-thick border-border bg-card shadow-brutal">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tight">
                Web3 Dashboard
              </h1>
              <p className="text-sm font-bold text-muted-foreground mt-1">
                ERC721 CONTRACT INTERACTION
              </p>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!connected ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <BrutalCard className="max-w-md w-full">
              <BrutalCardHeader>
                <BrutalCardTitle>Connect Your Wallet</BrutalCardTitle>
              </BrutalCardHeader>
              <BrutalCardContent>
                <p className="text-muted-foreground mb-6">
                  Connect your MetaMask wallet to interact with the contract. Make sure you're on
                  Polygon Mainnet network.
                </p>
                <div className="bg-muted border-2 border-border p-4 text-sm font-medium">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-foreground"></div>
                    <span className="font-bold">Required Network:</span>
                  </div>
                  <div className="ml-5">Polygon Mainnet (Chain ID: 137)</div>
                </div>
              </BrutalCardContent>
            </BrutalCard>
          </div>
        ) : !isPolygonNetwork ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <BrutalCard className="max-w-md w-full">
              <BrutalCardHeader>
                <BrutalCardTitle>Wrong Network</BrutalCardTitle>
              </BrutalCardHeader>
              <BrutalCardContent>
                <p className="text-muted-foreground mb-6">
                  Please switch to Polygon Mainnet to interact with the contract. Use the "Switch
                  to Polygon" button in the top right corner.
                </p>
                <div className="bg-destructive/10 border-2 border-destructive p-4 text-sm font-bold">
                  ⚠ Contract interactions require Polygon Mainnet
                </div>
              </BrutalCardContent>
            </BrutalCard>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contract Address Input */}
            <BrutalCard>
              <BrutalCardHeader>
                <BrutalCardTitle>Contract Address</BrutalCardTitle>
              </BrutalCardHeader>
              <BrutalCardContent>
                <div className="flex gap-4">
                  <BrutalInput
                    placeholder="Enter contract address (0x...)"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className="flex-1"
                  />
                  <BrutalButton onClick={handleSetContract} disabled={!contractAddress}>
                    Load Contract
                  </BrutalButton>
                </div>
                {activeContract && (
                  <div className="mt-4 p-4 bg-muted border-2 border-border">
                    <div className="text-xs font-bold uppercase text-muted-foreground mb-1">
                      Active Contract
                    </div>
                    <div className="font-mono text-sm break-all">{activeContract}</div>
                  </div>
                )}
              </BrutalCardContent>
            </BrutalCard>

            {/* Contract Interaction */}
            {activeContract && <ContractInteraction contractAddress={activeContract} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-thick border-border bg-card mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-bold text-muted-foreground uppercase">
            Neo-Brutalist Web3 Dashboard
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
