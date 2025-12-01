import { useState, useEffect } from "react";
import { useSDK } from "@metamask/sdk-react";
import { BrutalButton } from "./ui/brutal-button";
import { toast } from "sonner";
import { POLYGON_MAINNET_CHAIN_ID } from "@/lib/contractABI";
import { ethers } from "ethers";

export const WalletConnect = () => {
  const { sdk, connected, connecting, account, chainId } = useSDK();
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [maticBalance, setMaticBalance] = useState<string>("0");

  useEffect(() => {
    setIsCorrectNetwork(chainId === POLYGON_MAINNET_CHAIN_ID);
  }, [chainId]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && account && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(account);
          setMaticBalance(ethers.formatEther(balance));
        } catch (error) {
          console.error("Failed to fetch balance:", error);
        }
      }
    };

    fetchBalance();
    
    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [connected, account]);

  const connect = async () => {
    try {
      await sdk?.connect();
      toast.success("Wallet connected successfully!");
    } catch (err: any) {
      console.error("Failed to connect:", err);
      toast.error(err.message || "Failed to connect wallet");
    }
  };

  const switchToPolygon = async () => {
    try {
      await window.ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_MAINNET_CHAIN_ID }],
      });
      toast.success("Switched to Polygon Mainnet");
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: POLYGON_MAINNET_CHAIN_ID,
                chainName: "Polygon Mainnet",
                rpcUrls: ["https://polygon-rpc.com/"],
                nativeCurrency: {
                  name: "MATIC",
                  symbol: "MATIC",
                  decimals: 18,
                },
                blockExplorerUrls: ["https://polygonscan.com/"],
              },
            ],
          });
          toast.success("Polygon network added and switched");
        } catch (addError: any) {
          console.error("Failed to add network:", addError);
          toast.error("Failed to add Polygon network");
        }
      } else {
        console.error("Failed to switch network:", switchError);
        toast.error("Failed to switch network");
      }
    }
  };

  const disconnect = () => {
    if (sdk) {
      sdk.terminate();
      toast.info("Wallet disconnected");
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = () => {
    switch (chainId) {
      case "0x1":
        return "Ethereum";
      case "0x89":
        return "Polygon";
      default:
        return "Unknown";
    }
  };

  if (connected && account) {
    return (
      <div className="flex items-center gap-3">
        <BrutalButton size="sm" variant="outline" className="flex flex-col items-start gap-1 h-auto py-2">
          <div className="text-xs font-bold uppercase text-muted-foreground">
            {getNetworkName()} • {parseFloat(maticBalance).toFixed(4)} MATIC
          </div>
          <div className="text-sm font-bold">{formatAddress(account)}</div>
        </BrutalButton>
        {!isCorrectNetwork && (
          <BrutalButton size="sm" variant="destructive" onClick={switchToPolygon}>
            Switch to Polygon
          </BrutalButton>
        )}
        <BrutalButton size="sm" variant="outline" onClick={disconnect} className="h-auto py-3">
          Disconnect
        </BrutalButton>
      </div>
    );
  }

  return (
    <BrutalButton onClick={connect} disabled={connecting}>
      {connecting ? "Connecting..." : "Connect Wallet"}
    </BrutalButton>
  );
};
