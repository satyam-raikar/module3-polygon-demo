import { useState } from "react";
import { ethers } from "ethers";
import { BrutalCard, BrutalCardContent, BrutalCardHeader, BrutalCardTitle } from "./ui/brutal-card";
import { BrutalButton } from "./ui/brutal-button";
import { BrutalInput } from "./ui/brutal-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { CONTRACT_ABI, POLYGON_RPC_URL } from "@/lib/contractABI";
import { CustomMintingWorkflows } from "./CustomMintingWorkflows";

interface ContractInteractionProps {
  contractAddress: string;
  isWalletConnected: boolean;
}

export const ContractInteraction = ({
  contractAddress,
  isWalletConnected,
}: ContractInteractionProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<{ [key: string]: any }>({});

  // Input states for view functions
  const [balanceOfAddress, setBalanceOfAddress] = useState("");
  const [balanceOfTokenId, setBalanceOfTokenId] = useState("");
  const [existsTokenId, setExistsTokenId] = useState("");
  const [totalSupplyId, setTotalSupplyId] = useState("");
  const [maxSupplyId, setMaxSupplyId] = useState("");
  const [uriTokenId, setUriTokenId] = useState("");
  const [isApprovedAccount, setIsApprovedAccount] = useState("");
  const [isApprovedOperator, setIsApprovedOperator] = useState("");
  const [supportsInterfaceId, setSupportsInterfaceId] = useState("");

  // Write function states
  const [mintToAddress, setMintToAddress] = useState("");
  const [mintTokenId, setMintTokenId] = useState("");
  const [burnAddress, setBurnAddress] = useState("");
  const [burnTokenId, setBurnTokenId] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [setApprovalOperator, setSetApprovalOperator] = useState("");
  const [setApprovalBool, setSetApprovalBool] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferTokenId, setTransferTokenId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

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

  const handleViewFunction = async (functionName: string, args: any[] = []) => {
    setLoading(functionName);
    try {
      const contract = getContract();
      const result = await contract[functionName](...args);
      
      // Handle array results
      if (Array.isArray(result)) {
        setResults({ ...results, [functionName]: result.join(", ") });
      } else {
        setResults({ ...results, [functionName]: result.toString() });
      }
      toast.success(`${functionName} executed successfully`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Failed to execute ${functionName}`);
    } finally {
      setLoading(null);
    }
  };

  const handleWriteFunction = async (functionName: string, args: any[]) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet to execute write functions");
      return;
    }

    setLoading(functionName);
    try {
      const contract = await getContract(true);
      const tx = await contract[functionName](...args);
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      toast.success(`${functionName} executed successfully!`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Failed to execute ${functionName}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Tabs defaultValue="default" className="w-full">
      <TabsList className="grid w-full grid-cols-2 border-thick border-border shadow-brutal h-auto">
        <TabsTrigger
          value="default"
          className="font-bold uppercase text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border-r-thick border-border"
        >
          1155 Contract Functions
        </TabsTrigger>
        <TabsTrigger
          value="custom"
          className="font-bold uppercase text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Trade Contract
        </TabsTrigger>
      </TabsList>

      <TabsContent value="default" className="space-y-6 mt-6">
        {/* Contract Info */}
        <BrutalCard>
          <BrutalCardHeader>
            <BrutalCardTitle>Contract Information</BrutalCardTitle>
          </BrutalCardHeader>
          <BrutalCardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <BrutalButton
                  onClick={() => handleViewFunction("contractURI")}
                  disabled={loading === "contractURI"}
                  size="sm"
                  variant="secondary"
                  className="w-full"
                >
                  {loading === "contractURI" ? "Loading..." : "Contract URI"}
                </BrutalButton>
                {results.contractURI && (
                  <div className="mt-2 p-3 bg-muted border-2 border-border font-mono text-xs break-all">
                    {results.contractURI}
                  </div>
                )}
              </div>
              <div>
                <BrutalButton
                  onClick={() => handleViewFunction("owner")}
                  disabled={loading === "owner"}
                  size="sm"
                  variant="secondary"
                  className="w-full"
                >
                  {loading === "owner" ? "Loading..." : "Get Owner"}
                </BrutalButton>
                {results.owner && (
                  <div className="mt-2 p-3 bg-muted border-2 border-border font-mono text-xs break-all">
                    {results.owner}
                  </div>
                )}
              </div>
              <div>
                <BrutalButton
                  onClick={() => handleViewFunction("marketplaceAddr")}
                  disabled={loading === "marketplaceAddr"}
                  size="sm"
                  variant="secondary"
                  className="w-full"
                >
                  {loading === "marketplaceAddr" ? "Loading..." : "Marketplace"}
                </BrutalButton>
                {results.marketplaceAddr && (
                  <div className="mt-2 p-3 bg-muted border-2 border-border font-mono text-xs break-all">
                    {results.marketplaceAddr}
                  </div>
                )}
              </div>
            </div>
          </BrutalCardContent>
        </BrutalCard>

        {/* View Functions */}
        <BrutalCard>
          <BrutalCardHeader>
            <BrutalCardTitle>View Functions</BrutalCardTitle>
          </BrutalCardHeader>
          <BrutalCardContent className="space-y-6">
            {/* Balance Of */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Balance Of</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="Account address"
                  value={balanceOfAddress}
                  onChange={(e) => setBalanceOfAddress(e.target.value)}
                />
                <BrutalInput
                  placeholder="Token ID"
                  type="number"
                  value={balanceOfTokenId}
                  onChange={(e) => setBalanceOfTokenId(e.target.value)}
                />
                <BrutalButton
                  onClick={() =>
                    handleViewFunction("balanceOf", [balanceOfAddress, balanceOfTokenId])
                  }
                  disabled={loading === "balanceOf" || !balanceOfAddress || !balanceOfTokenId}
                  size="sm"
                >
                  Query
                </BrutalButton>
              </div>
              {results.balanceOf && (
                <div className="p-3 bg-muted border-2 border-border font-mono text-sm">
                  Balance: {results.balanceOf}
                </div>
              )}
            </div>

            {/* Token Exists */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Token Exists</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="Token ID"
                  type="number"
                  value={existsTokenId}
                  onChange={(e) => setExistsTokenId(e.target.value)}
                />
                <BrutalButton
                  onClick={() => handleViewFunction("exists", [existsTokenId])}
                  disabled={loading === "exists" || !existsTokenId}
                  size="sm"
                >
                  Query
                </BrutalButton>
              </div>
              {results.exists !== undefined && (
                <div className="p-3 bg-muted border-2 border-border font-mono text-sm">
                  Exists: {results.exists}
                </div>
              )}
            </div>

            {/* Total Supply */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Total Supply</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="Token ID"
                  type="number"
                  value={totalSupplyId}
                  onChange={(e) => setTotalSupplyId(e.target.value)}
                />
                <BrutalButton
                  onClick={() => handleViewFunction("totalSupply", [totalSupplyId])}
                  disabled={loading === "totalSupply" || !totalSupplyId}
                  size="sm"
                >
                  Query
                </BrutalButton>
              </div>
              {results.totalSupply && (
                <div className="p-3 bg-muted border-2 border-border font-mono text-sm">
                  Total Supply: {results.totalSupply}
                </div>
              )}
            </div>

            {/* Max Supply */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Max Supply</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="Token ID"
                  type="number"
                  value={maxSupplyId}
                  onChange={(e) => setMaxSupplyId(e.target.value)}
                />
                <BrutalButton
                  onClick={() => handleViewFunction("maxSupply", [maxSupplyId])}
                  disabled={loading === "maxSupply" || !maxSupplyId}
                  size="sm"
                >
                  Query
                </BrutalButton>
              </div>
              {results.maxSupply && (
                <div className="p-3 bg-muted border-2 border-border font-mono text-sm">
                  Max Supply: {results.maxSupply}
                </div>
              )}
            </div>

            {/* Token URI */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Token URI</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="Token ID"
                  type="number"
                  value={uriTokenId}
                  onChange={(e) => setUriTokenId(e.target.value)}
                />
                <BrutalButton
                  onClick={() => handleViewFunction("uri", [uriTokenId])}
                  disabled={loading === "uri" || !uriTokenId}
                  size="sm"
                >
                  Query
                </BrutalButton>
              </div>
              {results.uri && (
                <div className="p-3 bg-muted border-2 border-border font-mono text-sm break-all">
                  URI: {results.uri}
                </div>
              )}
            </div>

            {/* Is Approved For All */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Is Approved For All</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="Account address"
                  value={isApprovedAccount}
                  onChange={(e) => setIsApprovedAccount(e.target.value)}
                />
                <BrutalInput
                  placeholder="Operator address"
                  value={isApprovedOperator}
                  onChange={(e) => setIsApprovedOperator(e.target.value)}
                />
                <BrutalButton
                  onClick={() =>
                    handleViewFunction("isApprovedForAll", [
                      isApprovedAccount,
                      isApprovedOperator,
                    ])
                  }
                  disabled={
                    loading === "isApprovedForAll" ||
                    !isApprovedAccount ||
                    !isApprovedOperator
                  }
                  size="sm"
                >
                  Query
                </BrutalButton>
              </div>
              {results.isApprovedForAll !== undefined && (
                <div className="p-3 bg-muted border-2 border-border font-mono text-sm">
                  Approved: {results.isApprovedForAll.toString()}
                </div>
              )}
            </div>

            {/* Supports Interface */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Supports Interface</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="Interface ID (bytes4)"
                  value={supportsInterfaceId}
                  onChange={(e) => setSupportsInterfaceId(e.target.value)}
                />
                <BrutalButton
                  onClick={() => handleViewFunction("supportsInterface", [supportsInterfaceId])}
                  disabled={loading === "supportsInterface" || !supportsInterfaceId}
                  size="sm"
                >
                  Query
                </BrutalButton>
              </div>
              {results.supportsInterface !== undefined && (
                <div className="p-3 bg-muted border-2 border-border font-mono text-sm">
                  Supported: {results.supportsInterface.toString()}
                </div>
              )}
            </div>
          </BrutalCardContent>
        </BrutalCard>

        {/* Write Functions */}
        <BrutalCard>
          <BrutalCardHeader>
            <BrutalCardTitle>Write Functions</BrutalCardTitle>
          </BrutalCardHeader>
          <BrutalCardContent className="space-y-6">
            {/* Mint */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Mint Token</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="Recipient address"
                  value={mintToAddress}
                  onChange={(e) => setMintToAddress(e.target.value)}
                />
                <BrutalInput
                  placeholder="Token ID"
                  type="number"
                  value={mintTokenId}
                  onChange={(e) => setMintTokenId(e.target.value)}
                />
                <BrutalButton
                  onClick={() => handleWriteFunction("mint", [mintToAddress, mintTokenId])}
                  disabled={loading === "mint" || !mintToAddress || !mintTokenId}
                  size="sm"
                  variant="destructive"
                >
                  Execute
                </BrutalButton>
              </div>
            </div>

            {/* Burn */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Burn Token</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="Account address"
                  value={burnAddress}
                  onChange={(e) => setBurnAddress(e.target.value)}
                />
                <BrutalInput
                  placeholder="Token ID"
                  type="number"
                  value={burnTokenId}
                  onChange={(e) => setBurnTokenId(e.target.value)}
                />
                <BrutalInput
                  placeholder="Amount"
                  type="number"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                />
                <BrutalButton
                  onClick={() =>
                    handleWriteFunction("burn", [burnAddress, burnTokenId, burnAmount])
                  }
                  disabled={loading === "burn" || !burnAddress || !burnTokenId || !burnAmount}
                  size="sm"
                  variant="destructive"
                >
                  Execute
                </BrutalButton>
              </div>
            </div>

            {/* Set Approval For All */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Set Approval For All</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="Operator address"
                  value={setApprovalOperator}
                  onChange={(e) => setSetApprovalOperator(e.target.value)}
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-muted border-2 border-border">
                  <input
                    type="checkbox"
                    checked={setApprovalBool}
                    onChange={(e) => setSetApprovalBool(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-bold">Approved</span>
                </div>
                <BrutalButton
                  onClick={() =>
                    handleWriteFunction("setApprovalForAll", [setApprovalOperator, setApprovalBool])
                  }
                  disabled={loading === "setApprovalForAll" || !setApprovalOperator}
                  size="sm"
                  variant="destructive"
                >
                  Execute
                </BrutalButton>
              </div>
            </div>

            {/* Safe Transfer From */}
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Safe Transfer From</label>
              <div className="flex gap-2">
                <BrutalInput
                  placeholder="From address"
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                />
                <BrutalInput
                  placeholder="To address"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                />
                <BrutalInput
                  placeholder="Token ID"
                  type="number"
                  value={transferTokenId}
                  onChange={(e) => setTransferTokenId(e.target.value)}
                />
                <BrutalInput
                  placeholder="Amount"
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                />
                <BrutalButton
                  onClick={() =>
                    handleWriteFunction("safeTransferFrom", [
                      transferFrom,
                      transferTo,
                      transferTokenId,
                      transferAmount,
                      "0x",
                    ])
                  }
                  disabled={
                    loading === "safeTransferFrom" ||
                    !transferFrom ||
                    !transferTo ||
                    !transferTokenId ||
                    !transferAmount
                  }
                  size="sm"
                  variant="destructive"
                >
                  Execute
                </BrutalButton>
              </div>
            </div>
          </BrutalCardContent>
        </BrutalCard>
      </TabsContent>

      <TabsContent value="custom" className="space-y-6 mt-6">
        <CustomMintingWorkflows
          contractAddress={contractAddress}
          isWalletConnected={isWalletConnected}
        />
      </TabsContent>
    </Tabs>
  );
};
