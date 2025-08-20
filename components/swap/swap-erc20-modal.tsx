'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  useBalance,
  useChainId,
  useReadContract,
  useSimulateContract,
  useSendTransaction,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from 'wagmi'
import {
  Address,
  concat,
  erc20Abi,
  formatUnits,
  Hex,
  numberToHex,
  parseUnits,
  size,
  zeroAddress,
} from 'viem'
import qs from 'qs'

import { PriceResponse, QuoteResponse } from '@/types'
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
  AFFILIATE_FEE,
  FEE_RECIPIENT,
  MAX_ALLOWANCE,
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
  const [price, setPrice] = useState<PriceResponse | undefined>()
  const [quote, setQuote] = useState<QuoteResponse | undefined>()
  const [finalize, setFinalize] = useState(false)
  const [tradeDirection, setTradeDirection] = useState('sell')
  const [error, setError] = useState<any[]>([])
  const [buyTokenTax, setBuyTokenTax] = useState({
    buyTaxBps: '0',
    sellTaxBps: '0',
  })
  const [sellTokenTax, setSellTokenTax] = useState({
    buyTaxBps: '0',
    sellTaxBps: '0',
  })

  const chainId = useChainId() || 10143 // Default to Monad testnet

  const tokensByChain = (chainId: number) => {
    if (chainId === 10143) {
      return MONAD_TESTNET_TOKENS_BY_SYMBOL
    }
    return MONAD_TESTNET_TOKENS_BY_SYMBOL
  }

  const sellTokenObject = tokensByChain(chainId)[sellToken]
  const buyTokenObject = tokensByChain(chainId)[buyToken]

  const sellTokenDecimals = sellTokenObject.decimals
  const buyTokenDecimals = buyTokenObject.decimals

  const parsedSellAmount =
    sellAmount && tradeDirection === 'sell'
      ? parseUnits(sellAmount, sellTokenDecimals).toString()
      : undefined

  const parsedBuyAmount =
    buyAmount && tradeDirection === 'buy'
      ? parseUnits(buyAmount, buyTokenDecimals).toString()
      : undefined

  const handleSellTokenChange = (value: string) => {
    setSellToken(value)
  }

  function handleBuyTokenChange(value: string) {
    setBuyToken(value)
  }

  function handleSwap(event: React.FormEvent) {
    event?.preventDefault()
    console.log('Swap functionality to be implemented')
  }

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)
    }
  }, [isMounted])

  useEffect(() => {
    const params = {
      chainId: '10143', // Monad testnet
      sellToken: sellTokenObject.address,
      buyToken: buyTokenObject.address,
      sellAmount: parsedSellAmount,
      buyAmount: parsedBuyAmount,
      taker: userAddress,
      swapFeeRecipient: FEE_RECIPIENT,
      swapFeeBps: AFFILIATE_FEE,
      swapFeeToken: buyTokenObject.address,
      tradeSurplusRecipient: FEE_RECIPIENT,
    }

    async function main() {
      try {
        const response = await fetch(`/api/price?${qs.stringify(params)}`)
        const data = await response.json()
        console.log('Full price API response:', data)
        console.log('Response status:', response.status)

        // Check if API returned an error
        if (!response.ok) {
          console.error('API Error:', data)
          setError([{ field: 'api', code: 'API_ERROR', reason: `API Error: ${data.error || 'Unknown error'}` }])
          return
        }

        if (data?.validationErrors?.length > 0) {
          console.log('Validation errors:', data.validationErrors)
          setError(data.validationErrors)
        } else {
          setError([])
        }
        
        if (data.buyAmount) {
          setBuyAmount(formatUnits(data.buyAmount, buyTokenObject.decimals))
          setPrice(data)
          console.log('Price set:', data.price, 'Buy amount:', data.buyAmount)
        } else {
          console.log('No buyAmount in response')
          setError([{ field: 'price', code: 'NO_PRICE', reason: 'No price available for this pair' }])
        }
        
        if (data?.tokenMetadata) {
          setBuyTokenTax(data.tokenMetadata.buyToken)
          setSellTokenTax(data.tokenMetadata.sellToken)
        }
      } catch (error) {
        console.error('Error fetching price:', error)
        setError([{ field: 'general', code: 'FETCH_ERROR', reason: 'Failed to fetch price' }])
      }
    }

    if (sellAmount !== '' && userAddress) {
      main()
    }
  }, [
    sellTokenObject.address,
    buyTokenObject.address,
    parsedSellAmount,
    parsedBuyAmount,
    chainId,
    sellToken,
    sellAmount,
    userAddress,
  ])

  // Hook for fetching balance information for specified token
  const { data: balance, isError, isLoading } = useBalance({
    address: userAddress,
    token: sellTokenObject.address as `0x${string}`,
  })

  console.log('taker sellToken balance: ', balance)

  const insufficientBalance =
    balance && sellAmount
      ? parseUnits(sellAmount, sellTokenDecimals) > balance.value
      : true

  // Helper function to format tax basis points to percentage
  const formatTax = (taxBps: string) => (parseFloat(taxBps) / 100).toFixed(2)

  return (
    <Dialog>
      <DialogTrigger asChild className="w-full">
        <Button>Swap ERC20</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Swap ERC20</DialogTitle>
          <DialogDescription>
            The amount entered will be swapped for the amount of tokens
            displayed in the second row
          </DialogDescription>
        </DialogHeader>
        {isMounted ? (
          <div className="w-full">
            <form
              className="flex flex-col w-full gap-y-8"
              onSubmit={handleSwap}
            >
              <div className="w-full flex flex-col gap-y-4">
                {/* Sell Token Row */}
                <div className="w-full flex items-center gap-1.5">
                  <Image
                    alt={sellToken}
                    className="h-9 w-9 mr-2 rounded-md"
                    src={MONAD_TESTNET_TOKENS_BY_SYMBOL[sellToken].logoURI}
                    width={36}
                    height={36}
                  />
                  <Select
                    onValueChange={handleSellTokenChange}
                    defaultValue={DEFAULT_SELL_TOKEN.toLowerCase()}
                  >
                    <SelectTrigger className="w-1/4">
                      <SelectValue placeholder="Sell" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONAD_TESTNET_TOKENS.map((token: Token) => {
                        return (
                          <SelectItem
                            key={token.address}
                            value={token.symbol.toLowerCase()}
                          >
                            {token.symbol}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <Input
                    className="w-3/4"
                    type="number"
                    name="sell-amount"
                    id="sell-amount"
                    placeholder="Enter amount..."
                    value={sellAmount}
                    onChange={(event) => {
                      setTradeDirection('sell')
                      setSellAmount(event.target.value)
                    }}
                  />
                </div>
                
                {/* Buy Token Row */}
                <div className="w-full flex items-center gap-1.5">
                  <Image
                    alt={buyToken}
                    className="h-9 w-9 mr-2 rounded-md"
                    src={MONAD_TESTNET_TOKENS_BY_SYMBOL[buyToken].logoURI}
                    width={36}
                    height={36}
                  />
                  <Select
                    onValueChange={handleBuyTokenChange}
                    defaultValue={DEFAULT_BUY_TOKEN.toLowerCase()}
                  >
                    <SelectTrigger className="w-1/4">
                      <SelectValue placeholder="Buy" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONAD_TESTNET_TOKENS.map((token: Token) => {
                        return (
                          <SelectItem
                            key={token.address}
                            value={token.symbol.toLowerCase()}
                          >
                            {token.symbol}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <Input
                    className="w-3/4"
                    type="number"
                    id="buy-amount"
                    name="buy-amount"
                    value={buyAmount}
                    placeholder="Amount received..."
                    disabled
                  />
                </div>
              </div>

              {/* Error Display */}
              {error.length > 0 && (
                <div className="text-red-500 text-sm">
                  {error.map((err, index) => (
                    <div key={index}>{err.reason}</div>
                  ))}
                </div>
              )}

              {/* Price Information */}
              {price && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {(() => {
                    // Calculate unit price from sellAmount and buyAmount if price field is empty
                    let unitPrice = 'N/A'
                    if (price.price) {
                      unitPrice = parseFloat(price.price).toFixed(6)
                    } else if (price.sellAmount && price.buyAmount) {
                      const sellAmountFormatted = parseFloat(formatUnits(BigInt(price.sellAmount), sellTokenObject.decimals))
                      const buyAmountFormatted = parseFloat(formatUnits(BigInt(price.buyAmount), buyTokenObject.decimals))
                      if (sellAmountFormatted > 0) {
                        unitPrice = (buyAmountFormatted / sellAmountFormatted).toFixed(6)
                      }
                    }
                    return <div>Price: 1 {sellTokenObject.symbol} = {unitPrice} {buyTokenObject.symbol}</div>
                  })()}
                  {price.estimatedPriceImpact && (
                    <div>Price Impact: {(parseFloat(price.estimatedPriceImpact) * 100).toFixed(2)}%</div>
                  )}
                  {price.expectedSlippage && (
                    <div>Expected Slippage: {(parseFloat(price.expectedSlippage) * 100).toFixed(2)}%</div>
                  )}
                </div>
              )}

              {finalize && price ? (
                <ConfirmSwapButton
                  userAddress={userAddress as Address}
                  price={price}
                  quote={quote}
                  setQuote={setQuote}
                  setFinalize={setFinalize}
                />
              ) : (
                <ApproveOrReviewButton
                  sellTokenAddress={MONAD_TESTNET_TOKENS_BY_SYMBOL[sellToken].address as Address}
                  userAddress={userAddress as Address}
                  onClick={() => setFinalize(true)}
                  disabled={insufficientBalance || !sellAmount || error.length > 0}
                  price={price}
                />
              )}
            </form>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ApproveOrReviewButton component
function ApproveOrReviewButton({
  userAddress,
  onClick,
  sellTokenAddress,
  disabled,
  price,
}: {
  userAddress: Address;
  onClick: () => void;
  sellTokenAddress: Address;
  disabled?: boolean;
  price: PriceResponse | undefined;
}) {
  if (!userAddress || !price) {
    return (
      <Button disabled={true}>
        Connect Wallet
      </Button>
    )
  }

  // Determine the spender from price.issues.allowance
  const spender = (price?.issues?.allowance?.spender ?? zeroAddress) as Address

  // 1. Read from erc20, check approval for the determined spender to spend sellToken
  const { data: allowance, refetch } = useReadContract({
    address: sellTokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [userAddress, spender],
  })

  // 2. (only if no allowance): write to erc20, approve token allowance for the determined spender
  const { data } = useSimulateContract({
    address: sellTokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, MAX_ALLOWANCE],
  })

  // Define useWriteContract for the 'approve' operation
  const {
    data: writeContractResult,
    writeContractAsync,
    error,
  } = useWriteContract()

  // useWaitForTransactionReceipt to wait for the approval transaction to complete
  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: writeContractResult,
  })

  async function onClickHandler(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault()

    try {
      await writeContractAsync({
        abi: erc20Abi,
        address: sellTokenAddress,
        functionName: 'approve',
        args: [spender, MAX_ALLOWANCE],
      })
      refetch()
    } catch (error) {
      console.error('Approval error:', error)
    }
  }

  // Call `refetch` when the transaction succeeds
  useEffect(() => {
    if (data) {
      refetch()
    }
  }, [data, refetch])

  // If price.issues.allowance is null, show the Review Trade button
  if (price?.issues?.allowance === null) {
    return (
      <Button
        disabled={disabled}
        onClick={() => {
          onClick()
        }}
      >
        {disabled ? 'Insufficient Balance' : 'Review Trade'}
      </Button>
    )
  }

  if (error) {
    return <div className="text-red-500 text-sm">Approval error: {error.message}</div>
  }

  if (allowance === BigInt(0) && !disabled) {
    return (
      <Button onClick={onClickHandler} disabled={isApproving}>
        {isApproving ? 'Approving…' : 'Approve'}
      </Button>
    )
  }

  return (
    <Button
      disabled={disabled}
      onClick={() => {
        onClick()
      }}
    >
      {disabled ? 'Insufficient Balance' : 'Review Trade'}
    </Button>
  )
}

// ConfirmSwapButton component
function ConfirmSwapButton({
  userAddress,
  price,
  quote,
  setQuote,
  setFinalize,
}: {
  userAddress: Address | undefined;
  price: PriceResponse;
  quote: QuoteResponse | undefined;
  setQuote: (quote: QuoteResponse) => void;
  setFinalize: (value: boolean) => void;
}) {
  const { signTypedDataAsync } = useSignTypedData()
  const { data: walletClient } = useWalletClient()

  // Fetch quote data
  useEffect(() => {
    const params = {
      chainId: 10143, // Monad testnet
      sellToken: price.sellToken,
      buyToken: price.buyToken,
      sellAmount: price.sellAmount,
      taker: userAddress,
      swapFeeRecipient: FEE_RECIPIENT,
      swapFeeBps: AFFILIATE_FEE,
      swapFeeToken: price.buyToken,
      tradeSurplusRecipient: FEE_RECIPIENT,
    }

    async function main() {
      try {
        const response = await fetch(`/api/quote?${qs.stringify(params)}`)
        const data = await response.json()
        console.log('Quote data:', data)
        setQuote(data)
      } catch (error) {
        console.error('Error fetching quote:', error)
      }
    }
    main()
  }, [
    price.sellToken,
    price.buyToken,
    price.sellAmount,
    userAddress,
    setQuote,
  ])

  const { data: hash, isPending, sendTransaction } = useSendTransaction()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  if (!quote) {
    return <div className="text-center py-4">Getting best quote...</div>
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Button
        variant="ghost"
        onClick={(event) => {
          event.preventDefault()
          setFinalize(false)
        }}
      >
        Modify swap
      </Button>
      <Button
        disabled={isPending}
        onClick={async (event) => {
          event.preventDefault()

          console.log('submitting quote to blockchain')
          console.log('to', quote.transaction.to)
          console.log('value', quote.transaction.value)

          // On click, (1) Sign the Permit2 EIP-712 message returned from quote
          if (quote.permit2?.eip712) {
            let signature: Hex | undefined
            try {
              signature = await signTypedDataAsync(quote.permit2.eip712)
              console.log('Signed permit2 message from quote response')
            } catch (error) {
              console.error('Error signing permit2 coupon:', error)
              return
            }

            // (2) Append signature length and signature data to calldata
            if (signature && quote?.transaction?.data) {
              const signatureLengthInHex = numberToHex(size(signature), {
                signed: false,
                size: 32,
              })

              const transactionData = quote.transaction.data as Hex
              const sigLengthHex = signatureLengthInHex as Hex
              const sig = signature as Hex

              quote.transaction.data = concat([
                transactionData,
                sigLengthHex,
                sig,
              ])
            } else {
              console.error('Failed to obtain signature or transaction data')
              return
            }
          }

          // (3) Submit the transaction with Permit2 signature
          if (sendTransaction) {
            sendTransaction({
              account: walletClient?.account.address,
              gas: !!quote?.transaction.gas
                ? BigInt(quote?.transaction.gas)
                : undefined,
              to: quote?.transaction.to,
              data: quote.transaction.data as Hex,
              value: quote?.transaction.value
                ? BigInt(quote.transaction.value)
                : undefined,
              chainId: 10143, // Monad testnet
            })
          }
        }}
      >
        {isPending ? 'Confirming...' : 'Place Order'}
      </Button>
      {hash && (
        <div className="pt-4 flex flex-col items-center">
          <a
            className="hover:text-accent flex items-center gap-x-1.5 text-blue-500 hover:underline"
            href={`https://testnet.monadexplorer.com/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View tx on explorer
          </a>
          {isConfirming && <div className="text-sm text-muted-foreground">Waiting for confirmation...</div>}
          {isConfirmed && <div className="text-sm text-green-600">Transaction confirmed!</div>}
        </div>
      )}
    </div>
  )
}