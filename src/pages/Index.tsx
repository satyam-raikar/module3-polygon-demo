import { useSDK } from "@metamask/sdk-react";
import { WalletConnect } from "@/components/WalletConnect";
import { ContractInteraction } from "@/components/ContractInteraction";
import { BrutalCard, BrutalCardContent, BrutalCardHeader, BrutalCardTitle } from "@/components/ui/brutal-card";
import { POLYGON_MAINNET_CHAIN_ID, CONTRACT_ADDRESS } from "@/lib/contractABI";

const Index = () => {
  const { connected, chainId } = useSDK();
  const isPolygonNetwork = chainId === POLYGON_MAINNET_CHAIN_ID;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-thick border-border bg-card shadow-brutal">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tight">
                Module 3 Demo
              </h1>
              <p className="text-sm font-bold text-muted-foreground mt-1">
                ERC1155 contract and Trade contract interaction
              </p>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Contract Info Card */}
          <BrutalCard>
            <BrutalCardHeader>
              <BrutalCardTitle>Contract Address</BrutalCardTitle>
            </BrutalCardHeader>
            <BrutalCardContent>
                <div className="p-4 bg-muted border-2 border-border">
                <div className="text-xs font-bold uppercase text-muted-foreground mb-2">
                  ERC1155 Contract on Polygon Mainnet
                </div>
                <div className="font-mono text-sm break-all">{CONTRACT_ADDRESS}</div>
              </div>
              {!connected && (
                <div className="mt-4 p-4 bg-accent/10 border-2 border-accent text-sm font-medium">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-foreground"></div>
                    <span className="font-bold">Read-Only Mode</span>
                  </div>
                  <p className="text-muted-foreground">
                    You can query read functions without connecting. Connect wallet for write operations.
                  </p>
                </div>
              )}
              {connected && !isPolygonNetwork && (
                <div className="mt-4 p-4 bg-destructive/10 border-2 border-destructive text-sm font-bold">
                  ⚠ Please switch to Polygon Mainnet for write operations
                </div>
              )}
            </BrutalCardContent>
          </BrutalCard>

          {/* Contract Interaction */}
          <ContractInteraction 
            contractAddress={CONTRACT_ADDRESS} 
            isWalletConnected={connected && isPolygonNetwork}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-thick border-border bg-card mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-bold text-muted-foreground uppercase">
            :)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
