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

  // Mint a free token (0-2)
  const mintToken = async (tokenId: number) => {
    try {
      setLoading(tokenId);
      const contract = await getContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const tx = await contract.mint(userAddress, tokenId, 1, "0x");
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

  // Forge a token by burning required tokens (3-6)
  const forgeToken = async (
    tokenId: number,
    burnTokenIds: number[],
    burnAmounts: number[]
  ) => {
    try {
      setLoading(tokenId);
      const contract = await getContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // First burn the required tokens
      for (let i = 0; i < burnTokenIds.length; i++) {
        const burnTx = await contract.burn(
          userAddress,
          burnTokenIds[i],
          burnAmounts[i]
        );
        await burnTx.wait();
      }

      // Then mint the new token
      const mintTx = await contract.mint(userAddress, tokenId, 1, "0x");
      await mintTx.wait();

      onSuccess?.();
      return { success: true };
    } catch (error: any) {
      console.error("Error forging token:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(null);
    }
  };

  // Burn a token (get nothing back)
  const burnToken = async (tokenId: number) => {
    try {
      setLoading(tokenId);
      const contract = await getContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const tx = await contract.burn(userAddress, tokenId, 1);
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

  // Trade a token for one of [0-2]
  const tradeToken = async (burnTokenId: number, receiveTokenId: number) => {
    try {
      setLoading(burnTokenId);
      const contract = await getContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Burn the token
      const burnTx = await contract.burn(userAddress, burnTokenId, 1);
      await burnTx.wait();

      // Mint the new token
      const mintTx = await contract.mint(userAddress, receiveTokenId, 1, "0x");
      await mintTx.wait();

      onSuccess?.();
      return { success: true };
    } catch (error: any) {
      console.error("Error trading token:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(null);
    }
  };

  return {
    loading,
    mintToken,
    forgeToken,
    burnToken,
    tradeToken,
    contractAddress: TRADE_CONTRACT_ADDRESS,
  };
};
