import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI } from "@/lib/contractABI";

interface UseERC1155ContractProps {
  contractAddress: string;
  isWalletConnected: boolean;
}

interface TokenBalances {
  [key: number]: number;
}

export const useERC1155Contract = ({
  contractAddress,
  isWalletConnected,
}: UseERC1155ContractProps) => {
  const [balances, setBalances] = useState<TokenBalances>({});
  const [maticBalance, setMaticBalance] = useState<string>("0");
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [checkingApproval, setCheckingApproval] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Get contract instance for read operations
  const getReadContract = () => {
    const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
    return new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
  };

  // Get contract instance with signer for write operations
  const getWriteContract = async () => {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
  };

  // Load balances and approval status
  const loadBalancesAndApproval = async (tradeContractAddress: string) => {
    if (!isWalletConnected || typeof window.ethereum === "undefined") return;

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Get MATIC balance
      const maticBal = await provider.getBalance(userAddress);
      setMaticBalance(ethers.formatEther(maticBal));

      // Get contract instance
      const contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        provider
      );

      // Get balances for all tokens (0-6)
      const balancePromises = [0, 1, 2, 3, 4, 5, 6].map((tokenId) =>
        contract.balanceOf(userAddress, tokenId)
      );

      const balanceResults = await Promise.all(balancePromises);
      const newBalances: TokenBalances = {};
      balanceResults.forEach((balance, index) => {
        newBalances[index] = Number(balance);
      });

      setBalances(newBalances);

      // Check if contract is approved
      const approved = await contract.isApprovedForAll(
        userAddress,
        tradeContractAddress
      );
      setIsApproved(approved);
    } catch (error) {
      console.error("Error loading balances and approval:", error);
    } finally {
      setLoading(false);
    }
  };

  // Approve contract for burning tokens
  const handleApproval = async (tradeContractAddress: string) => {
    if (!isWalletConnected) return { success: false, error: "Wallet not connected" };

    try {
      setCheckingApproval(true);
      const contract = await getWriteContract();
      const tx = await contract.setApprovalForAll(tradeContractAddress, true);
      await tx.wait();
      setIsApproved(true);
      return { success: true };
    } catch (error: any) {
      console.error("Error approving contract:", error);
      return { success: false, error: error.message };
    } finally {
      setCheckingApproval(false);
    }
  };

  // Revoke contract approval
  const handleRevoke = async (tradeContractAddress: string) => {
    if (!isWalletConnected) return { success: false, error: "Wallet not connected" };

    try {
      setCheckingApproval(true);
      const contract = await getWriteContract();
      const tx = await contract.setApprovalForAll(tradeContractAddress, false);
      await tx.wait();
      setIsApproved(false);
      return { success: true };
    } catch (error: any) {
      console.error("Error revoking approval:", error);
      return { success: false, error: error.message };
    } finally {
      setCheckingApproval(false);
    }
  };

  // Reload balances when wallet connection changes
  useEffect(() => {
    if (isWalletConnected) {
      // Will be called from the component with trade contract address
    }
  }, [isWalletConnected]);

  return {
    balances,
    maticBalance,
    isApproved,
    checkingApproval,
    loading,
    loadBalancesAndApproval,
    handleApproval,
    handleRevoke,
    getReadContract,
    getWriteContract,
  };
};
