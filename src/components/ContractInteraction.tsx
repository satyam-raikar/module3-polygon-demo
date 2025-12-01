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

export const ContractInteraction = ({ contractAddress, isWalletConnected }: ContractInteractionProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<{ [key: string]: any }>({});

  // Input states for different functions
  const [balanceOfAddress, setBalanceOfAddress] = useState("");
  const [ownerOfTokenId, setOwnerOfTokenId] = useState("");
  const [getApprovedTokenId, setGetApprovedTokenId] = useState("");
  const [isApprovedOwner, setIsApprovedOwner] = useState("");
  const [isApprovedOperator, setIsApprovedOperator] = useState("");
  const [tokenURIId, setTokenURIId] = useState("");
  const [supportsInterfaceId, setSupportsInterfaceId] = useState("");

  // Write function states
  const [approveAddress, setApproveAddress] = useState("");
  const [approveTokenId, setApproveTokenId] = useState("");
  const [setApprovalOperator, setSetApprovalOperator] = useState("");
  const [setApprovalBool, setSetApprovalBool] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferTokenId, setTransferTokenId] = useState("");
  const [safeTransferFrom, setSafeTransferFrom] = useState("");
  const [safeTransferTo, setSafeTransferTo] = useState("");
  const [safeTransferTokenId, setSafeTransferTokenId] = useState("");

  const getContract = (needsSigner = false) => {
    // For read operations, use public RPC if wallet not connected
    if (!needsSigner && !isWalletConnected) {
      const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
      return new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    }
    
    // For wallet-connected operations
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    if (needsSigner) {
      return provider.getSigner().then(signer => 
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
      setResults({ ...results, [functionName]: result.toString() });
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
          Contract Functions
        </TabsTrigger>
        <TabsTrigger 
          value="custom" 
          className="font-bold uppercase text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Minting Workflows
        </TabsTrigger>
      </TabsList>

      <TabsContent value="default" className="space-y-6 mt-6">
        {/* Contract Info */}
        <BrutalCard>
          <BrutalCardHeader>
            <BrutalCardTitle>Contract Information</BrutalCardTitle>
          </BrutalCardHeader>
          <BrutalCardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <BrutalButton
                  onClick={() => handleViewFunction("name")}
                  disabled={loading === "name"}
                  size="sm"
                  variant="secondary"
                  className="w-full"
                >
                  {loading === "name" ? "Loading..." : "Get Name"}
                </BrutalButton>
                {results.name && (
                  <div className="mt-2 p-3 bg-muted border-2 border-border font-mono text-sm">
                    {results.name}
                  </div>
                )}
              </div>
              <div>
                <BrutalButton
                  onClick={() => handleViewFunction("symbol")}
                  disabled={loading === "symbol"}
                  size="sm"
                  variant="secondary"
                  className="w-full"
                >
                  {loading === "symbol" ? "Loading..." : "Get Symbol"}
                </BrutalButton>
                {results.symbol && (
                  <div className="mt-2 p-3 bg-muted border-2 border-border font-mono text-sm">
                    {results.symbol}
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
                placeholder="Owner address"
                value={balanceOfAddress}
                onChange={(e) => setBalanceOfAddress(e.target.value)}
              />
              <BrutalButton
                onClick={() => handleViewFunction("balanceOf", [balanceOfAddress])}
                disabled={loading === "balanceOf" || !balanceOfAddress}
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

          {/* Owner Of */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase">Owner Of Token</label>
            <div className="flex gap-2">
              <BrutalInput
                placeholder="Token ID"
                type="number"
                value={ownerOfTokenId}
                onChange={(e) => setOwnerOfTokenId(e.target.value)}
              />
              <BrutalButton
                onClick={() => handleViewFunction("ownerOf", [ownerOfTokenId])}
                disabled={loading === "ownerOf" || !ownerOfTokenId}
                size="sm"
              >
                Query
              </BrutalButton>
            </div>
            {results.ownerOf && (
              <div className="p-3 bg-muted border-2 border-border font-mono text-sm break-all">
                Owner: {results.ownerOf}
              </div>
            )}
          </div>

          {/* Get Approved */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase">Get Approved</label>
            <div className="flex gap-2">
              <BrutalInput
                placeholder="Token ID"
                type="number"
                value={getApprovedTokenId}
                onChange={(e) => setGetApprovedTokenId(e.target.value)}
              />
              <BrutalButton
                onClick={() => handleViewFunction("getApproved", [getApprovedTokenId])}
                disabled={loading === "getApproved" || !getApprovedTokenId}
                size="sm"
              >
                Query
              </BrutalButton>
            </div>
            {results.getApproved && (
              <div className="p-3 bg-muted border-2 border-border font-mono text-sm break-all">
                Approved: {results.getApproved}
              </div>
            )}
          </div>

          {/* Is Approved For All */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase">Is Approved For All</label>
            <div className="flex gap-2">
              <BrutalInput
                placeholder="Owner address"
                value={isApprovedOwner}
                onChange={(e) => setIsApprovedOwner(e.target.value)}
              />
              <BrutalInput
                placeholder="Operator address"
                value={isApprovedOperator}
                onChange={(e) => setIsApprovedOperator(e.target.value)}
              />
              <BrutalButton
                onClick={() => handleViewFunction("isApprovedForAll", [isApprovedOwner, isApprovedOperator])}
                disabled={loading === "isApprovedForAll" || !isApprovedOwner || !isApprovedOperator}
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

          {/* Token URI */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase">Token URI</label>
            <div className="flex gap-2">
              <BrutalInput
                placeholder="Token ID"
                type="number"
                value={tokenURIId}
                onChange={(e) => setTokenURIId(e.target.value)}
              />
              <BrutalButton
                onClick={() => handleViewFunction("tokenURI", [tokenURIId])}
                disabled={loading === "tokenURI" || !tokenURIId}
                size="sm"
              >
                Query
              </BrutalButton>
            </div>
            {results.tokenURI && (
              <div className="p-3 bg-muted border-2 border-border font-mono text-sm break-all">
                URI: {results.tokenURI}
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
          {/* Approve */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase">Approve</label>
            <div className="flex gap-2">
              <BrutalInput
                placeholder="Approved address"
                value={approveAddress}
                onChange={(e) => setApproveAddress(e.target.value)}
              />
              <BrutalInput
                placeholder="Token ID"
                type="number"
                value={approveTokenId}
                onChange={(e) => setApproveTokenId(e.target.value)}
              />
              <BrutalButton
                onClick={() => handleWriteFunction("approve", [approveAddress, approveTokenId])}
                disabled={loading === "approve" || !approveAddress || !approveTokenId}
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
                onClick={() => handleWriteFunction("setApprovalForAll", [setApprovalOperator, setApprovalBool])}
                disabled={loading === "setApprovalForAll" || !setApprovalOperator}
                size="sm"
                variant="destructive"
              >
                Execute
              </BrutalButton>
            </div>
          </div>

          {/* Transfer From */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase">Transfer From</label>
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
              <BrutalButton
                onClick={() => handleWriteFunction("transferFrom", [transferFrom, transferTo, transferTokenId])}
                disabled={loading === "transferFrom" || !transferFrom || !transferTo || !transferTokenId}
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
                value={safeTransferFrom}
                onChange={(e) => setSafeTransferFrom(e.target.value)}
              />
              <BrutalInput
                placeholder="To address"
                value={safeTransferTo}
                onChange={(e) => setSafeTransferTo(e.target.value)}
              />
              <BrutalInput
                placeholder="Token ID"
                type="number"
                value={safeTransferTokenId}
                onChange={(e) => setSafeTransferTokenId(e.target.value)}
              />
              <BrutalButton
                onClick={() => handleWriteFunction("safeTransferFrom", [safeTransferFrom, safeTransferTo, safeTransferTokenId])}
                disabled={loading === "safeTransferFrom" || !safeTransferFrom || !safeTransferTo || !safeTransferTokenId}
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
