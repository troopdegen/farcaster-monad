# Ticket #1: Setup Monad Token Constants

## Overview
Create the token list infrastructure for Monad testnet, establishing the foundation for token selection and display in the swap interface.

## Description
Set up a constants file with Monad testnet token metadata including addresses, symbols, decimals, and logos. This will be the source of truth for all available tokens in the swap feature.

## Acceptance Criteria
- [ ] Token constants file created at `/lib/constants/monad-tokens.ts`
- [ ] At least 5 tokens configured with complete metadata
- [ ] Export utilities for token lookup by symbol and address
- [ ] TypeScript types properly defined
- [ ] Token logos accessible (either URLs or local assets)

## Implementation Steps

### 1. Create Token Type Definition
```typescript
// lib/types/token.ts
export interface Token {
  chainId: number;
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}
```

### 2. Create Token Constants File
```typescript
// lib/constants/monad-tokens.ts
import { Token } from '@/lib/types/token';

export const MONAD_CHAIN_ID = 10143;

export const MONAD_TOKENS: Token[] = [
  {
    chainId: MONAD_CHAIN_ID,
    address: '0x...', // Wrapped Monad
    name: 'Wrapped Monad',
    symbol: 'WMON',
    decimals: 18,
    logoURI: '/tokens/wmon.png'
  },
  {
    chainId: MONAD_CHAIN_ID,
    address: '0x...',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    logoURI: '/tokens/usdc.png'
  },
  {
    chainId: MONAD_CHAIN_ID,
    address: '0x...',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    logoURI: '/tokens/usdt.png'
  },
  {
    chainId: MONAD_CHAIN_ID,
    address: '0x...',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    logoURI: '/tokens/dai.png'
  },
  {
    chainId: MONAD_CHAIN_ID,
    address: '0x...',
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    decimals: 8,
    logoURI: '/tokens/wbtc.png'
  }
];

// Create lookup objects for efficient access
export const MONAD_TOKENS_BY_SYMBOL: Record<string, Token> = 
  MONAD_TOKENS.reduce((acc, token) => {
    acc[token.symbol.toLowerCase()] = token;
    return acc;
  }, {} as Record<string, Token>);

export const MONAD_TOKENS_BY_ADDRESS: Record<string, Token> = 
  MONAD_TOKENS.reduce((acc, token) => {
    acc[token.address.toLowerCase()] = token;
    return acc;
  }, {} as Record<string, Token>);

// Helper functions
export function getTokenBySymbol(symbol: string): Token | undefined {
  return MONAD_TOKENS_BY_SYMBOL[symbol.toLowerCase()];
}

export function getTokenByAddress(address: string): Token | undefined {
  return MONAD_TOKENS_BY_ADDRESS[address.toLowerCase()];
}

// Default token pairs for quick selection
export const DEFAULT_SELL_TOKEN = 'WMON';
export const DEFAULT_BUY_TOKEN = 'USDC';
```

### 3. Add Token Logo Assets
Create a `public/tokens/` directory and add token logo files:
- `wmon.png`
- `usdc.png`
- `usdt.png`
- `dai.png`
- `wbtc.png`

Alternatively, use CDN URLs for logos:
```typescript
logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
```

## Testing Steps

### 1. Verify Token Import
```typescript
import { MONAD_TOKENS, getTokenBySymbol } from '@/lib/constants/monad-tokens';

// Should return array with 5+ tokens
console.log(MONAD_TOKENS.length);

// Should return USDC token object
const usdc = getTokenBySymbol('USDC');
console.log(usdc);
```

### 2. Verify TypeScript Types
- No TypeScript errors in the constants file
- Autocomplete works for token properties
- Type safety when accessing token data

### 3. Verify Token Logos
- All logo URLs are accessible
- Images load correctly in browser
- Fallback handling for missing logos

## Dependencies
- None (first ticket in the sequence)

## Notes
- Token addresses will need to be updated with actual Monad testnet addresses
- Consider adding more tokens as they become available on Monad
- May need to implement token list fetching from external source later
- Consider implementing a token list validator

## Estimated Time
2 hours

## Related Files
- `/lib/types/token.ts` - Token type definition
- `/lib/constants/monad-tokens.ts` - Main constants file
- `/public/tokens/` - Token logo assets

## Next Steps
After completion, proceed to:
- Ticket #2: Configure Monad Chain Integration
- Use these constants in Token Selector component (Ticket #7)