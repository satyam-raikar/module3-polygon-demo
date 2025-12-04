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
              <p className="text-sm leading-relaxed text-muted-foreground mb-3">
                This dApp interacts with an ERC1155 token collection on Polygon Mainnet through a dedicated Trade Contract. 
                The collection consists of 7 tokens (IDs 0-6) with unique minting, forging, burning, and trading mechanics.
              </p>
              <div className="bg-muted p-3 border-2 border-border text-sm">
                <strong>Key Concept:</strong> The Trade Contract acts as an intermediary that has minter and burner roles 
                on the ERC1155 contract, enabling complex token operations like forging and trading.
              </div>
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
                  <p className="text-xs text-muted-foreground mt-2">Holds all token balances and metadata</p>
                </div>
                <div className="bg-muted p-3 border-2 border-border">
                  <div className="font-bold uppercase text-xs text-muted-foreground mb-1">Trade Contract</div>
                  <code className="font-mono text-xs break-all">{TRADE_CONTRACT_ADDRESS}</code>
                  <p className="text-xs text-muted-foreground mt-2">Handles minting, forging, burning, and trading logic</p>
                </div>
              </div>
            </section>

            {/* Approval System */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-destructive text-destructive-foreground px-3 py-1 inline-block">
                Approval System (Required First)
              </h3>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Before performing <strong>any</strong> write operations, you must approve the Trade Contract as an operator.
                </p>
                <div className="bg-muted p-4 border-2 border-border">
                  <div className="font-bold mb-2">Why is approval needed?</div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                    <li>The Trade Contract needs permission to burn your tokens during forging</li>
                    <li>Trading requires the contract to transfer tokens on your behalf</li>
                    <li>This is a standard ERC1155 security feature</li>
                  </ul>
                </div>
                <div className="bg-muted p-4 border-2 border-border">
                  <div className="font-bold mb-2">How approval works:</div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                    <li>Call <code className="bg-background px-1">setApprovalForAll(tradeContract, true)</code> on the ERC1155 contract</li>
                    <li>This is a one-time operation per wallet</li>
                    <li>You can revoke approval anytime by setting it to <code className="bg-background px-1">false</code></li>
                    <li>Approval status is shown in the UI before each operation</li>
                  </ul>
                </div>
                <div className="bg-destructive/10 border-2 border-destructive p-3">
                  <strong>Note:</strong> Minting base tokens (0-2) does NOT require approval since it creates new tokens rather than moving existing ones.
                </div>
              </div>
            </section>

            {/* MINTING Section */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-accent px-3 py-1 inline-block">
                1. Minting Base Tokens
              </h3>
              <div className="space-y-4 text-sm">
                <div className="bg-muted p-4 border-2 border-border">
                  <code className="font-mono font-bold text-base">mintBase(uint256 id, uint256 amount)</code>
                </div>
                
                <div>
                  <div className="font-bold mb-2">Eligible Tokens:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-background border-2 border-border p-2 text-center">
                      <div className="font-bold">Token 0</div>
                      <div className="text-xs text-muted-foreground">Base</div>
                    </div>
                    <div className="bg-background border-2 border-border p-2 text-center">
                      <div className="font-bold">Token 1</div>
                      <div className="text-xs text-muted-foreground">Base</div>
                    </div>
                    <div className="bg-background border-2 border-border p-2 text-center">
                      <div className="font-bold">Token 2</div>
                      <div className="text-xs text-muted-foreground">Base</div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 border-2 border-border">
                  <div className="font-bold mb-2">Conditions & Rules:</div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground px-2 py-0.5 text-xs font-bold">FREE</span>
                      <span>No token cost - only gas fees required</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-secondary px-2 py-0.5 text-xs font-bold">COOLDOWN</span>
                      <span>60-second cooldown between mints per wallet address</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-accent px-2 py-0.5 text-xs font-bold">UNLIMITED</span>
                      <span>No maximum supply - mint as many as you want</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-muted-foreground text-background px-2 py-0.5 text-xs font-bold">NO APPROVAL</span>
                      <span>Does not require contract approval</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/10 border-2 border-primary p-3">
                  <div className="font-bold mb-1">Cooldown Check:</div>
                  <p className="text-xs text-muted-foreground">
                    Use <code className="bg-muted px-1">canMintBase(address)</code> to check if cooldown has expired.
                    Use <code className="bg-muted px-1">lastBaseMintTimestamp(address)</code> to see when the user last minted.
                  </p>
                </div>
              </div>
            </section>

            {/* FORGING Section */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-primary text-primary-foreground px-3 py-1 inline-block">
                2. Forging (Burn-to-Mint)
              </h3>
              <div className="space-y-4 text-sm">
                <div className="bg-muted p-4 border-2 border-border">
                  <code className="font-mono font-bold text-base">forge(uint256 targetId)</code>
                </div>

                <p className="text-muted-foreground">
                  Forging creates higher-tier tokens (3-6) by permanently burning specific combinations of base tokens (0-2). 
                  The contract automatically handles the burning process.
                </p>

                <div>
                  <div className="font-bold mb-3">Forging Recipes:</div>
                  <div className="space-y-3">
                    <div className="bg-background border-2 border-border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold">Token 3</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-accent px-2 py-1 border border-border">Token 0</span>
                          <span>+</span>
                          <span className="bg-accent px-2 py-1 border border-border">Token 1</span>
                          <span>→</span>
                          <span className="bg-primary text-primary-foreground px-2 py-1">Token 3</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-background border-2 border-border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold">Token 4</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-accent px-2 py-1 border border-border">Token 1</span>
                          <span>+</span>
                          <span className="bg-accent px-2 py-1 border border-border">Token 2</span>
                          <span>→</span>
                          <span className="bg-primary text-primary-foreground px-2 py-1">Token 4</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-background border-2 border-border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold">Token 5</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-accent px-2 py-1 border border-border">Token 0</span>
                          <span>+</span>
                          <span className="bg-accent px-2 py-1 border border-border">Token 2</span>
                          <span>→</span>
                          <span className="bg-primary text-primary-foreground px-2 py-1">Token 5</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-background border-2 border-border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold">Token 6</span>
                          <span className="text-xs text-muted-foreground ml-2">(requires all 3)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-accent px-2 py-1 border border-border">0</span>
                          <span>+</span>
                          <span className="bg-accent px-2 py-1 border border-border">1</span>
                          <span>+</span>
                          <span className="bg-accent px-2 py-1 border border-border">2</span>
                          <span>→</span>
                          <span className="bg-primary text-primary-foreground px-2 py-1">Token 6</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 border-2 border-border">
                  <div className="font-bold mb-2">Conditions & Rules:</div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="bg-destructive text-destructive-foreground px-2 py-0.5 text-xs font-bold">APPROVAL</span>
                      <span>Requires Trade Contract approval (setApprovalForAll)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-secondary px-2 py-0.5 text-xs font-bold">BALANCE</span>
                      <span>Must have at least 1 of each required base token</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-accent px-2 py-0.5 text-xs font-bold">BURN</span>
                      <span>Base tokens are permanently burned in the process</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground px-2 py-0.5 text-xs font-bold">1:1</span>
                      <span>Each forge creates exactly 1 token of the target type</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-destructive/10 border-2 border-destructive p-3">
                  <strong>Important:</strong> Forged tokens (3-6) cannot be forged into other tokens. 
                  They can only be burned (destroyed) or traded for base tokens.
                </div>
              </div>
            </section>

            {/* BURNING Section */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-destructive text-destructive-foreground px-3 py-1 inline-block">
                3. Burning Tokens
              </h3>
              <div className="space-y-4 text-sm">
                <div className="bg-muted p-4 border-2 border-border">
                  <code className="font-mono font-bold text-base">burnTop(uint256 id, uint256 amount)</code>
                </div>

                <p className="text-muted-foreground">
                  Burning permanently destroys tokens with <strong>no reward or output</strong>. 
                  This is a purely destructive operation.
                </p>

                <div>
                  <div className="font-bold mb-2">Burnable Tokens:</div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-destructive/20 border-2 border-destructive p-2 text-center">
                      <div className="font-bold">Token 3</div>
                    </div>
                    <div className="bg-destructive/20 border-2 border-destructive p-2 text-center">
                      <div className="font-bold">Token 4</div>
                    </div>
                    <div className="bg-destructive/20 border-2 border-destructive p-2 text-center">
                      <div className="font-bold">Token 5</div>
                    </div>
                    <div className="bg-destructive/20 border-2 border-destructive p-2 text-center">
                      <div className="font-bold">Token 6</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: Base tokens (0-2) cannot be burned directly through this function.
                  </p>
                </div>

                <div className="bg-muted p-4 border-2 border-border">
                  <div className="font-bold mb-2">Conditions & Rules:</div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="bg-destructive text-destructive-foreground px-2 py-0.5 text-xs font-bold">APPROVAL</span>
                      <span>Requires Trade Contract approval</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-secondary px-2 py-0.5 text-xs font-bold">BALANCE</span>
                      <span>Must have sufficient token balance to burn</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-destructive text-destructive-foreground px-2 py-0.5 text-xs font-bold">NO REWARD</span>
                      <span>You receive nothing in return - tokens are simply destroyed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-muted-foreground text-background px-2 py-0.5 text-xs font-bold">IRREVERSIBLE</span>
                      <span>Cannot be undone - burned tokens are gone forever</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-destructive/10 border-2 border-destructive p-3">
                  <strong>Warning:</strong> This is different from forging! Burning gives you nothing back. 
                  Only use this if you intentionally want to destroy tokens.
                </div>
              </div>
            </section>

            {/* TRADING Section */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-secondary px-3 py-1 inline-block">
                4. Trading Tokens
              </h3>
              <div className="space-y-4 text-sm">
                <div className="bg-muted p-4 border-2 border-border">
                  <code className="font-mono font-bold text-base">tradeForBase(uint256 giveId, uint256 giveAmount, uint256 receiveId)</code>
                </div>

                <p className="text-muted-foreground">
                  Trading allows you to exchange any token (0-6) for base tokens (0-2) at admin-configured exchange rates.
                </p>

                <div className="bg-muted p-4 border-2 border-border">
                  <div className="font-bold mb-2">How Trading Works:</div>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Select a token to give (any token 0-6)</li>
                    <li>Choose the amount you want to trade</li>
                    <li>Select which base token (0, 1, or 2) you want to receive</li>
                    <li>The exchange rate determines how many tokens you receive</li>
                    <li>Your given tokens are burned, and new base tokens are minted to you</li>
                  </ol>
                </div>

                <div className="bg-background border-2 border-border p-4">
                  <div className="font-bold mb-2">Exchange Rates:</div>
                  <p className="text-muted-foreground text-xs mb-2">
                    Rates are configured by the contract admin and can vary between token pairs.
                    Use <code className="bg-muted px-1">getExchangeRate(giveId, receiveId)</code> to check current rates.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Example: If rate is 2, trading 1 Token gives you 2 of the receive token.
                  </div>
                </div>

                <div className="bg-muted p-4 border-2 border-border">
                  <div className="font-bold mb-2">Conditions & Rules:</div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="bg-destructive text-destructive-foreground px-2 py-0.5 text-xs font-bold">APPROVAL</span>
                      <span>Requires Trade Contract approval</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-secondary px-2 py-0.5 text-xs font-bold">BALANCE</span>
                      <span>Must have sufficient balance of the token you're giving</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-accent px-2 py-0.5 text-xs font-bold">RECEIVE</span>
                      <span>Can only receive base tokens (0, 1, or 2)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground px-2 py-0.5 text-xs font-bold">RATE</span>
                      <span>Exchange rate is determined by contract configuration</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/10 border-2 border-primary p-3">
                  <strong>Tip:</strong> Check the exchange rate before trading! Higher-tier tokens (3-6) 
                  may have favorable rates when trading for base tokens.
                </div>
              </div>
            </section>

            {/* Quick Reference */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-muted px-3 py-1 inline-block">
                Quick Reference Table
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-2 border-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="border-2 border-border p-2 text-left">Operation</th>
                      <th className="border-2 border-border p-2 text-left">Approval?</th>
                      <th className="border-2 border-border p-2 text-left">Cooldown?</th>
                      <th className="border-2 border-border p-2 text-left">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-2 border-border p-2 font-bold">Mint (0-2)</td>
                      <td className="border-2 border-border p-2 text-green-600">No</td>
                      <td className="border-2 border-border p-2">60 seconds</td>
                      <td className="border-2 border-border p-2">Gas only</td>
                    </tr>
                    <tr>
                      <td className="border-2 border-border p-2 font-bold">Forge (3-6)</td>
                      <td className="border-2 border-border p-2 text-destructive">Yes</td>
                      <td className="border-2 border-border p-2">No</td>
                      <td className="border-2 border-border p-2">Burns base tokens</td>
                    </tr>
                    <tr>
                      <td className="border-2 border-border p-2 font-bold">Burn (3-6)</td>
                      <td className="border-2 border-border p-2 text-destructive">Yes</td>
                      <td className="border-2 border-border p-2">No</td>
                      <td className="border-2 border-border p-2">Token destroyed</td>
                    </tr>
                    <tr>
                      <td className="border-2 border-border p-2 font-bold">Trade (any)</td>
                      <td className="border-2 border-border p-2 text-destructive">Yes</td>
                      <td className="border-2 border-border p-2">No</td>
                      <td className="border-2 border-border p-2">Token exchanged</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Network Info */}
            <section>
              <h3 className="text-xl font-bold uppercase mb-3 bg-accent px-3 py-1 inline-block">
                Network Information
              </h3>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted p-3 border-2 border-border">
                    <div className="font-bold text-foreground">Network</div>
                    <div>Polygon Mainnet</div>
                  </div>
                  <div className="bg-muted p-3 border-2 border-border">
                    <div className="font-bold text-foreground">Chain ID</div>
                    <div>137 (0x89)</div>
                  </div>
                  <div className="bg-muted p-3 border-2 border-border">
                    <div className="font-bold text-foreground">Currency</div>
                    <div>MATIC (for gas)</div>
                  </div>
                  <div className="bg-muted p-3 border-2 border-border">
                    <div className="font-bold text-foreground">RPC</div>
                    <div className="text-xs">polygon-rpc.com</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
