# Ticket #2: Configure Monad Chain Integration

## Overview
Update the wagmi configuration to properly support Monad testnet, ensuring wallet connections and blockchain interactions work correctly.

## Description
Configure Monad testnet chain settings in the wallet provider, including RPC endpoints, chain metadata, and ensuring compatibility with the Farcaster Mini App wallet connector.

## Acceptance Criteria
- [ ] Monad testnet chain configuration added to wagmi
- [ ] Can connect wallet to Monad testnet
- [ ] Chain switching works from other networks
- [ ] RPC endpoint configured and working
- [ ] Block explorer links configured

## Implementation Steps

### 1. Define Monad Chain Configuration
```typescript
// lib/chains/monad.ts
import { defineChain } from 'viem';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet.monad.xyz'],
    },
    public: {
      http: ['https://testnet.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Monad Explorer', 
      url: 'https://explorer.testnet.monad.xyz' 
    },
  },
  testnet: true,
});
```

### 2. Update Wallet Provider Configuration
```typescript
// components/wallet-provider.tsx
'use client';

import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConnector } from '@farcaster/miniapp-wagmi-connector';
import { monadTestnet } from '@/lib/chains/monad';
import { createPublicClient, http } from 'viem';

const queryClient = new QueryClient();

// Create wagmi config with Monad testnet
const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    createConnector({
      id: 'farcaster',
      name: 'Farcaster',
    }),
  ],
  transports: {
    [monadTestnet.id]: http(monadTestnet.rpcUrls.default.http[0]),
  },
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 3. Create Chain Switching Component
```typescript
// components/swap/ChainSwitcher.tsx
import { useChainId, useSwitchChain } from 'wagmi';
import { monadTestnet } from '@/lib/chains/monad';
import { Button } from '@/components/ui/button';

export function ChainSwitcher() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (chainId === monadTestnet.id) {
    return null; // Already on correct chain
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <p className="text-sm text-yellow-800 mb-2">
        Please switch to Monad Testnet to use the swap feature
      </p>
      <Button
        onClick={() => switchChain({ chainId: monadTestnet.id })}
        disabled={isPending}
      >
        {isPending ? 'Switching...' : 'Switch to Monad Testnet'}
      </Button>
    </div>
  );
}
```

### 4. Add Environment Variables
```bash
# .env.local
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet.monad.xyz
```

### 5. Update Chain Utilities
```typescript
// lib/utils/chain.ts
import { monadTestnet } from '@/lib/chains/monad';

export function isMonadChain(chainId: number): boolean {
  return chainId === monadTestnet.id;
}

export function getExplorerUrl(txHash: string, chainId: number): string {
  if (chainId === monadTestnet.id) {
    return `${monadTestnet.blockExplorers.default.url}/tx/${txHash}`;
  }
  return '#';
}

export function getExplorerAddressUrl(address: string, chainId: number): string {
  if (chainId === monadTestnet.id) {
    return `${monadTestnet.blockExplorers.default.url}/address/${address}`;
  }
  return '#';
}
```

## Testing Steps

### 1. Verify Chain Connection
```typescript
// Test component
import { useAccount, useChainId } from 'wagmi';

function TestConnection() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  console.log('Connected:', isConnected);
  console.log('Chain ID:', chainId); // Should be 10143
  console.log('Address:', address);
}
```

### 2. Test Chain Switching
1. Connect wallet on different chain
2. Click "Switch to Monad Testnet" button
3. Verify wallet prompts for chain switch
4. Confirm chain ID updates to 10143

### 3. Test RPC Connection
```typescript
import { usePublicClient } from 'wagmi';

function TestRPC() {
  const client = usePublicClient();
  
  // Get latest block
  const block = await client.getBlockNumber();
  console.log('Latest block:', block);
}
```

### 4. Verify Block Explorer Links
- Click on transaction hash link
- Should open Monad explorer with correct transaction
- Test address links as well

## Dependencies
- Ticket #1: Token Constants (for chain ID consistency)

## Notes
- RPC URL may need adjustment based on Monad's testnet endpoints
- Consider adding fallback RPC endpoints for reliability
- May need custom gas estimation for Monad
- Ensure compatibility with Farcaster's embedded wallet

## Estimated Time
1 hour

## Related Files
- `/lib/chains/monad.ts` - Chain definition
- `/components/wallet-provider.tsx` - Wagmi configuration
- `/components/swap/ChainSwitcher.tsx` - Chain switching UI
- `/.env.local` - Environment variables

## Next Steps
After completion, proceed to:
- Ticket #3: Create Type Definitions
- Test wallet connection in swap interface