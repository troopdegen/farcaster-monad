'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  useBalance,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import {
  formatEther,
  parseEther,
} from 'viem'

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
import {
  MONAD_TESTNET_TOKENS_BY_SYMBOL,
} from '@/lib/tokens'

type WrapMonModalProps = {
  userAddress: `0x${string}` | undefined
}

// WMON contract ABI for deposit function
const WMON_ABI = [
  {
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

export default function WrapMonModal({ userAddress }: WrapMonModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [wrapAmount, setWrapAmount] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const chainId = useChainId() || 10143 // Default to Monad testnet
  const wmonToken = MONAD_TESTNET_TOKENS_BY_SYMBOL['wmon'] || MONAD_TESTNET_TOKENS_BY_SYMBOL['WMON']

  // Get native MON balance
  const { data: monBalance, isError: monBalanceError, isLoading: monBalanceLoading, refetch: refetchMonBalance } = useBalance({
    address: userAddress,
  })

  // Get WMON token balance
  const { data: wmonBalance, isError: wmonBalanceError, isLoading: wmonBalanceLoading, refetch: refetchWmonBalance } = useBalance({
    address: userAddress,
    token: wmonToken?.address,
  })

  // Contract write for wrapping
  const { writeContractAsync, error: writeError, isPending: isWritePending } = useWriteContract()

  // State for transaction hash
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
  }, [isMounted])

  // Refetch balances after successful transaction
  useEffect(() => {
    if (isConfirmed) {
      refetchMonBalance()
      refetchWmonBalance()
      setWrapAmount('')
      setIsOpen(false)
    }
  }, [isConfirmed, refetchMonBalance, refetchWmonBalance])

  const handleWrapAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWrapAmount(event.target.value)
  }

  const handleMaxClick = () => {
    if (monBalance) {
      // Leave a small amount for gas fees (0.01 MON)
      const maxAmount = monBalance.value - parseEther('0.01')
      if (maxAmount > BigInt(0)) {
        setWrapAmount(formatEther(maxAmount))
      }
    }
  }

  const handleWrap = async () => {
    if (!wrapAmount || !userAddress || !wmonToken) return

    try {
      const amount = parseEther(wrapAmount)
      
      // Check if user has enough balance
      if (monBalance && amount > monBalance.value) {
        console.error('Insufficient balance')
        return
      }
      
      const hash = await writeContractAsync({
        address: wmonToken.address,
        abi: WMON_ABI,
        functionName: 'deposit',
        value: amount,
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
      return amount > BigInt(0) && amount <= monBalance.value
    } catch {
      return false
    }
  }

  if (!isMounted) {
    return null
  }

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
            Convert your native MON tokens to WMON tokens in a 1:1 ratio
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* MON Balance Display */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">MON Balance:</span>
              <span className="text-sm">
                {monBalanceLoading ? 'Loading...' : 
                 monBalanceError ? 'Error' :
                 monBalance ? `${parseFloat(formatEther(monBalance.value)).toFixed(4)} MON` : '0 MON'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">WMON Balance:</span>
              <span className="text-sm">
                {wmonBalanceLoading ? 'Loading...' : 
                 wmonBalanceError ? 'Error' :
                 wmonBalance ? `${parseFloat(formatEther(wmonBalance.value)).toFixed(4)} WMON` : '0 WMON'}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount to wrap</label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={wrapAmount}
                  onChange={handleWrapAmountChange}
                  className="pr-16"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  MON
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMaxClick}
                disabled={!monBalance || monBalance.value <= parseEther('0.01')}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Output Display */}
          {wrapAmount && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">You will receive:</div>
              <div className="text-lg font-medium">{wrapAmount} WMON</div>
              <div className="text-xs text-gray-500">1:1 ratio</div>
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

          {/* Chain Warning */}
          {chainId !== 10143 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm text-yellow-600">
                Please switch to Monad Testnet to wrap tokens
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