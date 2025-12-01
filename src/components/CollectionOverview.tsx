import { useEffect } from "react";
import { Coins, ExternalLink } from "lucide-react";
import { useERC1155Contract } from "@/hooks/useERC1155Contract";
import { TRADE_CONTRACT_ADDRESS } from "@/lib/tradeContractABI";

interface CollectionOverviewProps {
  contractAddress: string;
  isWalletConnected: boolean;
}

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

export const CollectionOverview = ({
  contractAddress,
  isWalletConnected,
}: CollectionOverviewProps) => {
  const {
    balances,
    maticBalance,
    loadBalancesAndApproval,
  } = useERC1155Contract({
    contractAddress,
    isWalletConnected,
  });

  useEffect(() => {
    if (isWalletConnected) {
      loadBalancesAndApproval(TRADE_CONTRACT_ADDRESS);
    }
  }, [isWalletConnected]);

  return (
    <div className="bg-secondary border-4 border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold uppercase flex items-center gap-2">
          <Coins className="w-6 h-6" />
          {isWalletConnected ? "Your Collection" : "Collection Info"}
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
        <div className="space-y-4">
          <div className="bg-background border-2 border-border p-4">
            <div className="mb-4">
              <p className="text-lg font-bold mb-2">Read-Only Mode</p>
              <p className="text-sm text-muted-foreground">
                Connect your wallet to view your balances and perform write operations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TOKEN_INFO.map((token) => (
              <div
                key={token.id}
                className="bg-background border-2 border-border p-3 opacity-60"
              >
                <div className="text-xs font-bold uppercase text-muted-foreground mb-1">
                  Token {token.id}
                </div>
                <div className="text-2xl font-mono font-bold text-muted-foreground">
                  --
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
