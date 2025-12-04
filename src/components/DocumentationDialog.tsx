import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { BrutalButton } from "./ui/brutal-button";
import { ScrollArea } from "./ui/scroll-area";
import { BookOpen } from "lucide-react";
import { CONTRACT_ADDRESS } from "@/lib/contractABI";
import { TRADE_CONTRACT_ADDRESS } from "@/lib/tradeContractABI";

export const DocumentationDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <BrutalButton variant="outline" size="sm" className="gap-2">
          <BookOpen className="w-4 h-4" />
          Documentation
        </BrutalButton>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b-2 border-border">
          <DialogTitle className="text-2xl font-black uppercase">Documentation</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 py-4">
          <div className="space-y-8 pb-6">
            {/* Overview */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-primary text-primary-foreground px-3 py-1 inline-block">
                Overview
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This dApp allows you to interact with an ERC1155 token collection on Polygon Mainnet. 
                The collection consists of 7 tokens (IDs 0-6) with unique minting and forging mechanics.
              </p>
            </section>

            {/* Contract Addresses */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-secondary px-3 py-1 inline-block">
                Contract Addresses
              </h3>
              <div className="space-y-3 text-sm">
                <div className="bg-muted p-3 border-2 border-border">
                  <div className="font-bold uppercase text-xs text-muted-foreground mb-1">ERC1155 Token Contract</div>
                  <code className="font-mono text-xs break-all">{CONTRACT_ADDRESS}</code>
                </div>
                <div className="bg-muted p-3 border-2 border-border">
                  <div className="font-bold uppercase text-xs text-muted-foreground mb-1">Trade Contract</div>
                  <code className="font-mono text-xs break-all">{TRADE_CONTRACT_ADDRESS}</code>
                </div>
              </div>
            </section>

            {/* Token System */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-accent px-3 py-1 inline-block">
                Token System
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-bold mb-2">Base Tokens (0-2)</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Freely mintable by anyone (gas only, no token cost)</li>
                    <li>60-second cooldown between mints per wallet</li>
                    <li>No supply limits</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Forged Tokens (3-6)</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Token 3:</strong> Forge by burning Token 0 + Token 1</li>
                    <li><strong>Token 4:</strong> Forge by burning Token 1 + Token 2</li>
                    <li><strong>Token 5:</strong> Forge by burning Token 0 + Token 2</li>
                    <li><strong>Token 6:</strong> Forge by burning Token 0 + Token 1 + Token 2</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Trade Contract Functions */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-primary text-primary-foreground px-3 py-1 inline-block">
                Trade Contract Functions
              </h3>
              <div className="space-y-4 text-sm">
                <div className="bg-muted p-4 border-2 border-border">
                  <code className="font-mono font-bold">mintBase(uint256 id, uint256 amount)</code>
                  <p className="text-muted-foreground mt-2">
                    Mint base tokens (0-2). Subject to 60-second cooldown between mints per user.
                  </p>
                </div>
                <div className="bg-muted p-4 border-2 border-border">
                  <code className="font-mono font-bold">forge(uint256 targetId)</code>
                  <p className="text-muted-foreground mt-2">
                    Create tokens 3-6 by burning specific combinations of base tokens. 
                    The contract automatically burns the required tokens.
                  </p>
                </div>
                <div className="bg-muted p-4 border-2 border-border">
                  <code className="font-mono font-bold">burnTop(uint256 id, uint256 amount)</code>
                  <p className="text-muted-foreground mt-2">
                    Burn tokens 3-6 permanently. This is a destructive operation with no reward.
                  </p>
                </div>
                <div className="bg-muted p-4 border-2 border-border">
                  <code className="font-mono font-bold">tradeForBase(uint256 giveId, uint256 giveAmount, uint256 receiveId)</code>
                  <p className="text-muted-foreground mt-2">
                    Exchange any token for base tokens (0-2) at admin-configured exchange rates.
                  </p>
                </div>
              </div>
            </section>

            {/* Approval Flow */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-destructive text-destructive-foreground px-3 py-1 inline-block">
                Approval Required
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                Before performing any write operations (forging, burning, trading), you must approve 
                the Trade Contract as an operator on the ERC1155 contract via <code className="font-mono bg-muted px-1">setApprovalForAll</code>.
              </p>
              <div className="bg-destructive/10 border-2 border-destructive p-3 text-sm">
                <strong>Important:</strong> You can revoke approval at any time if you no longer want 
                the Trade Contract to manage your tokens.
              </div>
            </section>

            {/* How to Use */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-secondary px-3 py-1 inline-block">
                How to Use
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Connect your MetaMask wallet</li>
                <li>Ensure you're on Polygon Mainnet</li>
                <li>Approve the Trade Contract (one-time)</li>
                <li>Mint base tokens (0-2) - free with 60s cooldown</li>
                <li>Forge higher tier tokens by burning base tokens</li>
                <li>Trade tokens at configured exchange rates</li>
              </ol>
            </section>

            {/* Network Info */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-muted px-3 py-1 inline-block">
                Network Information
              </h3>
              <div className="text-sm space-y-2 text-muted-foreground">
                <p><strong>Network:</strong> Polygon Mainnet (Chain ID: 0x89)</p>
                <p><strong>Currency:</strong> MATIC (for gas fees)</p>
                <p><strong>RPC:</strong> https://polygon-rpc.com</p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
