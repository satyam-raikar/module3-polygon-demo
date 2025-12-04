import { useSDK } from "@metamask/sdk-react";
import { useEffect } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import { ContractInteraction } from "@/components/ContractInteraction";
import { BrutalCard, BrutalCardContent, BrutalCardHeader, BrutalCardTitle } from "@/components/ui/brutal-card";
import { POLYGON_MAINNET_CHAIN_ID, CONTRACT_ADDRESS } from "@/lib/contractABI";
import { useERC1155Contract } from "@/hooks/useERC1155Contract";
import { useTradeContract } from "@/hooks/useTradeContract";
import { Coins, ExternalLink } from "lucide-react";

const TOKEN_INFO = [
  { id: 0, name: "Token 0" },
  { id: 1, name: "Token 1" },
  { id: 2, name: "Token 2" },
  { id: 3, name: "Token 3" },
  { id: 4, name: "Token 4" },
  { id: 5, name: "Token 5" },
  { id: 6, name: "Token 6" },
];

const OPENSEA_COLLECTION_URL = "https://opensea.io/collection/your-collection-slug";

const Index = () => {
  const { connected, chainId } = useSDK();
  const isPolygonNetwork = chainId === POLYGON_MAINNET_CHAIN_ID;

  const {
    balances,
    maticBalance,
    loadBalancesAndApproval,
  } = useERC1155Contract({
    contractAddress: CONTRACT_ADDRESS,
    isWalletConnected: connected && isPolygonNetwork,
  });

  const { contractAddress: tradeContractAddress } = useTradeContract({
    onSuccess: () => {
      loadBalancesAndApproval();
    },
  });

  // Load balances when wallet is connected
  useEffect(() => {
    if (connected && isPolygonNetwork) {
      loadBalancesAndApproval();
    }
  }, [connected, isPolygonNetwork]);

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

            {/* Contract Details Section */}
            <div className="mb-4 p-4 bg-muted border-2 border-border space-y-3">
              <div>
                <div className="text-xs font-bold uppercase text-muted-foreground mb-1">
                  ERC1155 Token Contract (Polygon)
                </div>
                <div className="font-mono text-sm break-all">{CONTRACT_ADDRESS}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-primary mb-1">
                  Trade Contract (Polygon)
                </div>
                <div className="font-mono text-sm break-all">{tradeContractAddress}</div>
              </div>
              {CONTRACT_ADDRESS === tradeContractAddress && (
                <div className="text-xs text-destructive font-bold bg-destructive/10 p-2 border border-destructive">
                  ⚠️ Warning: Both contracts have the same address. The Trade Contract should be a separate address!
                </div>
              )}
            </div>

            {!connected ? (
              <div className="p-4 bg-accent/10 border-2 border-accent text-sm font-medium">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-foreground"></div>
                  <span className="font-bold">Read-Only Mode</span>
                </div>
                <p className="text-muted-foreground">
                  You can query read functions without connecting. Connect wallet for write operations.
                </p>
              </div>
            ) : (
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
            )}

            {/* Network Warning */}
            {connected && !isPolygonNetwork && (
              <div className="p-4 bg-destructive/10 border-2 border-destructive text-sm font-bold">
                ⚠ Please switch to Polygon Mainnet for write operations
              </div>
            )}
          </div>

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
