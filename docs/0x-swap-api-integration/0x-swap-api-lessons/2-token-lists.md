# Create and Manage Monad Testnet Token Lists

Our Farcaster Mini App features token selection dropdowns for both _sellToken_ and _buyToken_ in the swap interface.

![Select field showing available tokens to swap](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/1b3f00c2-ba1c-474c-b437-e0e8e2818718)

For established chains, we can leverage curated [Token Lists](https://tokenlists.org/) that standardize ERC20 token metadata to filter out legitimate tokens from scams and duplicates. However, for new chains like Monad Testnet, we need to create our own curated token lists.

Since Monad Testnet is a newer chain, we'll create a custom token list with carefully selected tokens for our swap functionality. This approach gives us full control over supported tokens and ensures a high-quality user experience.

Let's learn how to create and manage a token list for Monad Testnet tokens in our Farcaster Mini App.

## Code

In our implementation, we've created a curated token list specifically for Monad Testnet in [`/lib/tokens.ts`](../../lib/tokens.ts).

> **Production Best Practice:** Maintaining a curated token list is standard for production apps since not all applications support every available token.

> **Multi-chain Support:** While we focus on Monad Testnet, this pattern can easily be extended for multi-chain support.

Our token interface includes essential metadata:

```typescript
// lib/tokens.ts - Token Interface
export interface Token {
  name: string;
  address: Address;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
}
```

## Monad Testnet Token Configuration

Our tokens are organized in the `MONAD_TESTNET_TOKENS` array and made accessible via optimized lookup objects:

```typescript
// Efficient access patterns
export const MONAD_TESTNET_TOKENS_BY_SYMBOL: Record<string, Token>
export const MONAD_TESTNET_TOKENS_BY_ADDRESS: Record<string, Token>

// Helper functions
export function getTokenBySymbol(symbol: string): Token | undefined
export function getTokenByAddress(address: string): Token | undefined
```

**Current Monad Testnet Token List:**
- **WMON** (Wrapped Monad) - `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701`
- **WETH** (Wrapped Ether) - `0xB5a30b0FDc42e3E9760Cb8449Fb37`
- **WBTC** (Wrapped Bitcoin) - `0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d`
- **USDC** (USD Coin) - `0xf817257fed379853cDe0fa4F97AB987181B1E5Ea`
- **LINK** (ChainLink) - `0x6C6A73cb3549c8480F08420EE2e5DFaf9d2D4CDb`

The token lists are integrated into our swap component via shadcn/ui's Select component:

```typescript
// components/swap/swap-erc20-modal.tsx - Simplified view
import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  MONAD_TESTNET_TOKENS,
  MONAD_TESTNET_TOKENS_BY_SYMBOL,
  Token,
  DEFAULT_SELL_TOKEN,
  DEFAULT_BUY_TOKEN,
} from '@/lib/tokens'

type SwapErc20ModalProps = {
  userAddress: `0x${string}` | undefined
}

export default function SwapErc20Modal({ userAddress }: SwapErc20ModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [sellToken, setSellToken] = useState(DEFAULT_SELL_TOKEN.toLowerCase())
  const [sellAmount, setSellAmount] = useState('')
  const [buyToken, setBuyToken] = useState(DEFAULT_BUY_TOKEN.toLowerCase())
  const [buyAmount, setBuyAmount] = useState('')

  // Get token objects from our Monad token list
  const sellTokenObject = MONAD_TESTNET_TOKENS_BY_SYMBOL[sellToken]
  const buyTokenObject = MONAD_TESTNET_TOKENS_BY_SYMBOL[buyToken]

  const handleSellTokenChange = (value: string) => {
    setSellToken(value)
  }

  const handleBuyTokenChange = (value: string) => {
    setBuyToken(value)
  }

  const handleSwap = (event: React.FormEvent) => {
    event?.preventDefault()
    console.log('Swap functionality will be implemented next')
  }

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
  }, [isMounted])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Swap Tokens
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Token Swap on Monad</DialogTitle>
          <DialogDescription>
            Swap tokens on Monad Testnet with real-time pricing
          </DialogDescription>
        </DialogHeader>
        {isMounted ? (
          <div className="space-y-4">
            {/* Sell Token Selection */}
            <div className="flex items-center space-x-2">
              <Image
                alt={sellTokenObject.symbol}
                className="h-8 w-8 rounded-md"
                src={sellTokenObject.logoURI}
                width={32}
                height={32}
              />
              <Select onValueChange={handleSellTokenChange} defaultValue={DEFAULT_SELL_TOKEN.toLowerCase()}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONAD_TESTNET_TOKENS.map((token: Token) => (
                    <SelectItem key={token.address} value={token.symbol.toLowerCase()}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0.0"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Buy Token Selection */}
            <div className="flex items-center space-x-2">
              <Image
                alt={buyTokenObject.symbol}
                className="h-8 w-8 rounded-md"
                src={buyTokenObject.logoURI}
                width={32}
                height={32}
              />
              <Select onValueChange={handleBuyTokenChange} defaultValue={DEFAULT_BUY_TOKEN.toLowerCase()}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONAD_TESTNET_TOKENS.map((token: Token) => (
                    <SelectItem key={token.address} value={token.symbol.toLowerCase()}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0.0"
                value={buyAmount}
                disabled
                className="flex-1"
              />
            </div>

            <Button onClick={handleSwap} className="w-full">
              Swap Tokens
            </Button>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Code Review:**
- Import Monad-specific token constants from our `lib/tokens.ts`
- Use `DEFAULT_SELL_TOKEN` and `DEFAULT_BUY_TOKEN` for initial state
- Map through `MONAD_TESTNET_TOKENS` for dropdown options
- Display token logos using the `logoURI` from our token metadata
- Set up state management for swap amounts and selected tokens

## Token List Best Practices for New Chains

When building for newer chains like Monad, consider these approaches:

**1. Curated Lists (Our Approach):**
- Full control over supported tokens
- Ensures high-quality user experience
- Easier to maintain for smaller token sets

**2. API-Driven Lists:**
- Dynamic token discovery
- Automatic updates for new tokens
- Requires reliable token data providers

**3. Hybrid Approach:**
- Start with curated list
- Gradually add API integration
- Fallback to curated tokens if API fails

## Adding New Tokens to Monad List

To add a new token to our Monad testnet list, you'll need:

```typescript
// Example: Adding a new DEX token
{
  chainId: 10143,
  name: "MonadSwap Token",
  symbol: "MSWAP",
  decimals: 18,
  address: "0x..." // Contract address on Monad testnet
  logoURI: "https://..." // Token logo URL
}
```

Add it to the `MONAD_TESTNET_TOKENS` array in `/lib/tokens.ts`, and it will automatically be available in all lookup objects and UI components.

## Future Token Sources for Monad

As Monad ecosystem grows, potential token list sources:

- **Monad Foundation** - Official token registries
- **DeFi Protocols** - DEX-specific token lists  
- **Community Lists** - Community-maintained registries
- **Bridge Protocols** - Cross-chain token mappings

## Recap

In this lesson, we created a comprehensive token management system for Monad Testnet:

- ✅ Defined standardized token interface
- ✅ Created curated Monad testnet token list  
- ✅ Built efficient lookup systems
- ✅ Integrated tokens into swap UI components
- ✅ Established patterns for adding new tokens

![Final modal showing the available tokens to be swapped](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/a5992263-0839-4ed0-9132-75d7b741aac8)
