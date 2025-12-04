import { useState } from "react";
import { ethers } from "ethers";
import { TRADE_CONTRACT_ABI, TRADE_CONTRACT_ADDRESS } from "@/lib/tradeContractABI";

interface UseTradeContractProps {
  onSuccess?: () => void;
}

export const useTradeContract = ({ onSuccess }: UseTradeContractProps = {}) => {
  const [loading, setLoading] = useState<number | string | null>(null);

  // Get contract instance with signer
  const getContract = async () => {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(
      TRADE_CONTRACT_ADDRESS,
      TRADE_CONTRACT_ABI,
      signer
    );
  };

  // Get read-only contract instance
  const getReadContract = () => {
    const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
    return new ethers.Contract(
      TRADE_CONTRACT_ADDRESS,
      TRADE_CONTRACT_ABI,
      provider
    );
  };

  // Check if user can mint base tokens (cooldown check)
  const canMintBase = async (userAddress: string): Promise<boolean> => {
    try {
      const contract = getReadContract();
      return await contract.canMintBase(userAddress);
    } catch (error) {
      console.error("Error checking mint cooldown:", error);
      return false;
    }
  };

  // Mint a base token (0-2) via trade contract
  const mintToken = async (tokenId: number, amount: number = 1) => {
    try {
      setLoading(tokenId);
      const contract = await getContract();
      
      const tx = await contract.mintBase(tokenId, amount);
      await tx.wait();

      onSuccess?.();
      return { success: true };
    } catch (error: any) {
      console.error("Error minting token:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(null);
    }
  };

  // Forge a token (3-6) - contract handles burning automatically
  const forgeToken = async (targetId: number) => {
    try {
      setLoading(targetId);
      const contract = await getContract();

      const tx = await contract.forge(targetId);
      await tx.wait();

      onSuccess?.();
      return { success: true };
    } catch (error: any) {
      console.error("Error forging token:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(null);
    }
  };

  // Burn a token 3-6 (get nothing back)
  const burnToken = async (tokenId: number, amount: number = 1) => {
    try {
      setLoading(tokenId);
      const contract = await getContract();

      const tx = await contract.burnTop(tokenId, amount);
      await tx.wait();

      onSuccess?.();
      return { success: true };
    } catch (error: any) {
      console.error("Error burning token:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(null);
    }
  };

  // Trade a token for a base token (0-2)
  const tradeToken = async (
    giveId: number,
    giveAmount: number,
    receiveId: number
  ) => {
    try {
      setLoading(`trade-${giveId}`);
      const contract = await getContract();

      const tx = await contract.tradeForBase(giveId, giveAmount, receiveId);
      await tx.wait();

      onSuccess?.();
      return { success: true };
    } catch (error: any) {
      console.error("Error trading token:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(null);
    }
  };

  // Get exchange rate for trading
  const getExchangeRate = async (
    giveId: number,
    receiveId: number
  ): Promise<number> => {
    try {
      const contract = getReadContract();
      const rate = await contract.getExchangeRate(giveId, receiveId);
      return Number(rate);
    } catch (error) {
      console.error("Error getting exchange rate:", error);
      return 0;
    }
  };

  return {
    loading,
    mintToken,
    forgeToken,
    burnToken,
    tradeToken,
    canMintBase,
    getExchangeRate,
    contractAddress: TRADE_CONTRACT_ADDRESS,
  };
};
