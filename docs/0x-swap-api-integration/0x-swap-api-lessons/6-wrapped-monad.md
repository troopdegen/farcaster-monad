# Wrapped Monad Token Integration

In addition to token swapping, many DeFi applications need the ability to wrap native tokens into their ERC20 equivalents. This is essential for interoperability with smart contracts that expect ERC20 interfaces.

In this lesson, we'll implement a wrapper for native MON tokens, converting them to WMON (Wrapped Monad) tokens in a simple 1:1 ratio.

## Why Wrap Native Tokens?

Native blockchain tokens (like ETH, MON) don't follow the ERC20 standard, which can create compatibility issues:

- **Smart Contract Integration**: Many DeFi protocols only work with ERC20 tokens
- **Uniform Interface**: Wrapped tokens provide consistent approval and transfer patterns
- **DeFi Composability**: Enables use in DEXs, lending protocols, and other DeFi applications

WMON provides the same value as native MON but with full ERC20 compatibility.

## Wrapped Token Pattern

The wrapped token pattern is simple and battle-tested:

```solidity
// Wrapping: User sends native MON → Receives WMON tokens
function deposit() public payable {
    balanceOf[msg.sender] += msg.value;
    emit Deposit(msg.sender, msg.value);
}

// Unwrapping: User burns WMON tokens → Receives native MON
function withdraw(uint256 wad) public {
    require(balanceOf[msg.sender] >= wad);
    balanceOf[msg.sender] -= wad;
    payable(msg.sender).transfer(wad);
    emit Withdrawal(msg.sender, wad);
}
```

This pattern maintains a 1:1 backing ratio where every WMON token is backed by exactly 1 MON token held in the contract.

## WMON Contract Details

Our Monad testnet uses the standard Wrapped Ether pattern:

**Contract Address**: `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701`

**Key Functions**:
- `deposit()` - Wrap native MON to WMON (payable)
- `withdraw(uint256)` - Unwrap WMON to native MON
- Standard ERC20 functions (transfer, approve, etc.)

## Implementation

Let's create a simple wrapper modal that allows users to convert native MON to WMON.

### Step 1: Create Wrapper Component

```typescript
// components/wrap/wrap-mon-modal.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  useBalance,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { formatEther, parseEther } from 'viem'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MONAD_TESTNET_TOKENS_BY_SYMBOL } from '@/lib/tokens'

// WMON contract ABI - only need deposit function
const WMON_ABI = [
  {
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

type WrapMonModalProps = {
  userAddress: `0x${string}` | undefined
}

export default function WrapMonModal({ userAddress }: WrapMonModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [wrapAmount, setWrapAmount] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const chainId = useChainId() || 10143
  const wmonToken = MONAD_TESTNET_TOKENS_BY_SYMBOL['wmon']

  // Get native MON balance
  const { data: monBalance, refetch: refetchMonBalance } = useBalance({
    address: userAddress,
  })

  // Get WMON token balance
  const { data: wmonBalance, refetch: refetchWmonBalance } = useBalance({
    address: userAddress,
    token: wmonToken?.address,
  })

  // Contract interaction
  const { writeContractAsync, error: writeError, isPending: isWritePending } = useWriteContract()

  // Transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
  }, [isMounted])

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed) {
      refetchMonBalance()
      refetchWmonBalance()
      setWrapAmount('')
      setIsOpen(false)
      setTxHash(undefined)
    }
  }, [isConfirmed, refetchMonBalance, refetchWmonBalance])

  const handleMaxClick = () => {
    if (monBalance) {
      // Leave small amount for gas fees
      const maxAmount = monBalance.value - parseEther('0.01')
      if (maxAmount > 0n) {
        setWrapAmount(formatEther(maxAmount))
      }
    }
  }

  const handleWrap = async () => {
    if (!wrapAmount || !userAddress || !wmonToken) return

    try {
      const amount = parseEther(wrapAmount)
      
      const hash = await writeContractAsync({
        address: wmonToken.address,
        abi: WMON_ABI,
        functionName: 'deposit',
        value: amount, // Send native MON with the transaction
      })
      setTxHash(hash)
    } catch (error) {
      console.error('Wrap error:', error)
    }
  }

  const isValidAmount = () => {
    if (!wrapAmount || !monBalance) return false
    try {
      const amount = parseEther(wrapAmount)
      return amount > 0n && amount <= monBalance.value
    } catch {
      return false
    }
  }

  if (!isMounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Wrap MON
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wrap MON to WMON</DialogTitle>
          <DialogDescription>
            Convert native MON tokens to WMON tokens (1:1 ratio)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Balance Display */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">MON Balance:</span>
              <span className="text-sm">
                {monBalance ? `${parseFloat(formatEther(monBalance.value)).toFixed(4)} MON` : '0 MON'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">WMON Balance:</span>
              <span className="text-sm">
                {wmonBalance ? `${parseFloat(formatEther(wmonBalance.value)).toFixed(4)} WMON` : '0 WMON'}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount to wrap</label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="0.0"
                value={wrapAmount}
                onChange={(e) => setWrapAmount(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleMaxClick}>
                Max
              </Button>
            </div>
          </div>

          {/* Output Display */}
          {wrapAmount && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">You will receive:</div>
              <div className="text-lg font-medium">{wrapAmount} WMON</div>
              <div className="text-xs text-gray-500">1:1 ratio guaranteed</div>
            </div>
          )}

          {/* Chain Warning */}
          {chainId !== 10143 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-600">
                Please switch to Monad Testnet to wrap tokens
              </div>
            </div>
          )}

          {/* Error Display */}
          {writeError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-600">
                Error: {writeError.message}
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {txHash && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-600">
                {isConfirming ? 'Confirming transaction...' : 
                 isConfirmed ? 'Transaction confirmed!' : 
                 'Transaction submitted'}
              </div>
            </div>
          )}

          {/* Wrap Button */}
          <Button
            onClick={handleWrap}
            disabled={!isValidAmount() || isWritePending || isConfirming || !userAddress || chainId !== 10143}
            className="w-full"
          >
            {chainId !== 10143 ? 'Switch to Monad Testnet' :
             isWritePending ? 'Wrapping...' :
             isConfirming ? 'Confirming...' :
             'Wrap MON'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 2: Integration with Main App

Add the wrapper to your main demo component alongside the swap functionality:

```typescript
// components/Home/MonadDemo.tsx
import WrapMonModal from '@/components/wrap/wrap-mon-modal'

export function MonadDemo() {
  const { address } = useAccount()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
      {/* ... other components */}
      
      <div className="space-y-4 border border-[#333] rounded-md p-4">
        <h2 className="text-xl font-bold text-left">Token Operations</h2>
        <div className="flex flex-row space-x-4 justify-start items-start">
          <SwapErc20Modal userAddress={address} />
          <WrapMonModal userAddress={address} />
        </div>
      </div>
      
      {/* ... rest of components */}
    </div>
  )
}
```

## Key Implementation Details

### 1. **Native Token Handling**
```typescript
// Query native MON balance (no token address specified)
const { data: monBalance } = useBalance({
  address: userAddress,
})

// Query WMON ERC20 balance
const { data: wmonBalance } = useBalance({
  address: userAddress,
  token: wmonToken?.address,
})
```

### 2. **Contract Interaction**
```typescript
// Call deposit() function with native MON value
await writeContractAsync({
  address: wmonToken.address,
  abi: WMON_ABI,
  functionName: 'deposit',
  value: amount, // This sends native MON
})
```

### 3. **User Experience Features**
- **Max Button**: Automatically calculates maximum wrappable amount (minus gas)
- **Real-time Balances**: Shows both MON and WMON balances
- **Chain Validation**: Ensures user is on Monad Testnet
- **Transaction Feedback**: Real-time status updates

## Use Cases for WMON

Once users have WMON tokens, they can:

1. **Trade on DEXs**: Use WMON in our swap interface
2. **DeFi Protocols**: Provide liquidity, lending, borrowing
3. **Smart Contracts**: Interact with any ERC20-compatible contract
4. **Cross-chain Bridges**: Bridge to other networks (if supported)

## Error Handling

The implementation includes comprehensive error handling:

- **Insufficient Balance**: Validates against available MON
- **Network Validation**: Ensures Monad Testnet connection
- **Transaction Failures**: Displays user-friendly error messages
- **Gas Estimation**: Reserves MON for transaction fees

## Security Considerations

- **1:1 Backing**: Every WMON is backed by real MON in the contract
- **No Slippage**: Wrapping is always 1:1, no price impact
- **Instant Conversion**: No waiting periods or cooldowns
- **Reversible**: Can always unwrap WMON back to MON

## Recap

In this lesson, we've implemented a complete MON wrapping interface that:

- ✅ Converts native MON to ERC20-compatible WMON
- ✅ Provides intuitive user interface with balance displays  
- ✅ Handles errors and edge cases gracefully
- ✅ Integrates seamlessly with existing swap functionality
- ✅ Maintains security through validated contract interactions

The wrapped token functionality complements our swap interface, giving users full flexibility to work with both native and ERC20 tokens in the Monad ecosystem!

**Next Steps**: Users can now wrap MON to WMON and immediately use those WMON tokens in the swap interface we built in previous lessons. This creates a complete token operations suite for Farcaster Mini Apps on Monad Testnet.