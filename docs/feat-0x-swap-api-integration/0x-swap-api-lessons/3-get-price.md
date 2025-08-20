# Get Price for Monad Testnet Swaps

Now for the exciting part! Let's implement real-time price fetching for our Monad testnet tokens using the [0x Swap API](https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getPrice) pattern, adapted for new EVM chains 🚀

Our goal is to dynamically display the buyToken amount when users input a sellToken amount, providing real-time pricing feedback in our Farcaster Mini App.

![Modal showing a swap from WMATIC to USDC](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/5285ebcb-36c7-4a0b-ae20-7256d1c79a49)

## Price vs Quote

Before we make a call, let's discuss the difference between _price vs quote_.

The [`/swap/permit2/price`](https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getPrice) endpoint helps us get an _indicative price_.

An indicative price is used when users are just _browsing_ and want to check the price they could receive on a swap. They are not ready for a firm quote yet.

Later, when the user is actually ready to make a swap, we will ping [`/swap/permit2/quote`](https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getQuote) which returns an order that is ready to submitted on-chain.

`/price` is nearly identical to `/quote`, but with a few key differences:

- `/price` does not return a order that can be submitted on-chain; it simply provides us the same information
- Think of it as the "read-only" version of `/quote"`

It is important to ping `/quote` only when the user is ready to submit the order because Market Makers must commit their assets to settle that swap when they provide the quote. So if we ping `/quote` too much when we really are just asking for a price and not ready to submit an order, then this can clog up the system!

## Monad Testnet Price Strategy

For new chains like Monad Testnet, we need a hybrid approach since direct 0x API support may be limited:

### Our Multi-Layer Price Strategy:

1. **Primary**: 0x API with Monad testnet parameters
2. **Fallback**: Calculate price from available buyAmount/sellAmount data
3. **Error Handling**: Graceful degradation with user feedback

### What we need to implement:

- Wrap the `/swap/permit2/price` endpoint behind our Next.js API route
- Handle Monad testnet-specific parameters (Chain ID: 10143)
- Implement fallback price calculation when API responses are incomplete
- Format amounts for both API consumption and human-readable display
- Auto-fetch prices when inputs change

### Get a 0x API Key

Every call to the 0x API requires an API key. [Create a 0x account](https://dashboard.0x.org/) and get your API key from the [dashboard](https://dashboard.0x.org/).

Add your API key to `.env.local`:
```bash
NEXT_PUBLIC_ZEROEX_API_KEY=your_api_key_here
```

### Understanding Price Response Handling

Our `SwapErc20Modal` displays indicative prices to users browsing swap options. Since Monad testnet has limited 0x support, we've implemented robust fallback logic:

**When 0x API returns complete data:**
- Use the `price` field directly

**When 0x API returns partial data:**
- Calculate unit price from `buyAmount` and `sellAmount`
- Display calculated exchange rate to users

This ensures consistent pricing display regardless of API response completeness.

## Fetch price from PriceView

In the previous lesson, we saw how to fetch a price using `/swap/permit2/price`. Now we need to plug it into the UI.

### Step 1. Create Protected API Route

We wrap our 0x API calls behind a Next.js API route to protect our API keys and handle Monad-specific parameters.

**Why wrap?** Browser requests expose API keys, but server-side routes keep them secure. Our frontend calls `/api/price`, which then calls the 0x API with protected credentials.

`/app/api/price/route.ts`

```typescript
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  try {
    const res = await fetch(
      `https://api.0x.org/swap/permit2/price?${searchParams}`,
      {
        headers: {
          '0x-api-key': process.env.NEXT_PUBLIC_ZEROEX_API_KEY as string,
          '0x-version': 'v2',
        },
      }
    )
    const data = await res.json()

    console.log('0x API URL:', `https://api.0x.org/swap/permit2/price?${searchParams}`)
    console.log('0x API Response:', data)

    return Response.json(data)
  } catch (error) {
    console.error('Price API Error:', error)
    return Response.json({ error: 'Failed to fetch price' }, { status: 500 })
  }
}
```

**Key Features:**
- Secure API key handling via environment variables
- Error handling with proper HTTP status codes
- Logging for debugging Monad testnet integration
- Direct passthrough of search parameters to 0x API

### Step 2. Automatically fetch price with useEffect hook

Now we need to hook it up to the front-end and trigger a price change anytime the sellAmount updates.

In `SwapErc20Modal`, we use the Next.js App Router's built-in data fetching pattern and the useEffect hook to fetch a price and automatically update the UI will quickly to respond to any changes, such as when the user inputs a new sellAmount.

An overview to our `SwapErc20Modal` component needed updates:

- Install `qs` package via `npm i qs`
- Install qs types via `npm i --save-dev @types/qs`
- Create a file where we will create our API response types: `types/index.ts`. Copy and paste [this file's content](https://github.com/dablclub/etherstart/blob/main/next-app/types/index.ts), which include both the Price and Quote response interfaces, so we can better handle the integration of the Swap API with our code.
- Import dependencies:
  - `qs` library and `PriceResponse` interface, which we just added to our project
  - useChainId wagmi hook to detect the user's current connected network
  - `formatUnits` and `parseUnits`, a couple of utilities from Viem
- A couple of new state variables to handle the swap direction (needed for the API call) and to handle the Price response
- Functions to handle the selected tokens data, along with parsing of the tokens (we'll explore this in a bit)

For the API call, we ask useEffect to monitor a list of params (sellToken, buyToken, etc), and if ever any of these params change value, then the main() function is executed. In this function, we fetch a new /price with the updated param values.

`/src/components/web3/swapErc20Modal`

```
import { useEffect, useState } from 'react';
import Image from 'next/image';

import { PriceResponse } from '../../types/index';
import { useBalance, useChainId } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import qs from 'qs';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  AFFILIATE_FEE,
  FEE_RECIPIENT,
  POLYGON_TOKENS,
  POLYGON_TOKENS_BY_SYMBOL,
  Token,
} from '@/lib/constants';
import { toast } from 'sonner';

type SendErc20ModalProps = {
  userAddress: `0x${string}` | undefined;
};

export default function SwapErc20Modal({ userAddress }: SendErc20ModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [sellToken, setSellToken] = useState('wmatic');
  const [sellAmount, setSellAmount] = useState('');
  const [buyToken, setBuyToken] = useState('usdc');
  const [buyAmount, setBuyAmount] = useState('');
  const [price, setPrice] = useState<PriceResponse | undefined>();
  const [finalize, setFinalize] = useState(false);
  const [tradeDirection, setSwapDirection] = useState('sell');
  const [error, setError] = useState([]);
  const [buyTokenTax, setBuyTokenTax] = useState({
    buyTaxBps: '0',
    sellTaxBps: '0',
  });
  const [sellTokenTax, setSellTokenTax] = useState({
    buyTaxBps: '0',
    sellTaxBps: '0',
  });

  const chainId = useChainId() || 137;

  const tokensByChain = (chainId: number) => {
    if (chainId === 137) {
      return POLYGON_TOKENS_BY_SYMBOL;
    }
    return POLYGON_TOKENS_BY_SYMBOL;
  };

  const sellTokenObject = tokensByChain(chainId)[sellToken];
  const buyTokenObject = tokensByChain(chainId)[buyToken];

  const sellTokenDecimals = sellTokenObject.decimals;
  const buyTokenDecimals = buyTokenObject.decimals;

  const parsedSellAmount =
    sellAmount && tradeDirection === 'sell'
      ? parseUnits(sellAmount, sellTokenDecimals).toString()
      : undefined;

  const parsedBuyAmount =
    buyAmount && tradeDirection === 'buy'
      ? parseUnits(buyAmount, buyTokenDecimals).toString()
      : undefined;

  const handleSellTokenChange = (value: string) => {
    setSellToken(value);
  };

  function handleBuyTokenChange(value: string) {
    setBuyToken(value);
  }

  function handleSwap() {
    event?.preventDefault();
    toast.warning('connect swap functionality');
  }

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
    }
  }, [isMounted]);

  useEffect(() => {
    const params = {
      chainId: '137',
      sellToken: sellTokenObject.address,
      buyToken: buyTokenObject.address,
      sellAmount: parsedSellAmount,
      buyAmount: parsedBuyAmount,
      taker: userAddress,
      swapFeeRecipient: FEE_RECIPIENT,
      swapFeeBps: AFFILIATE_FEE,
      swapFeeToken: buyTokenObject.address,
      tradeSurplusRecipient: FEE_RECIPIENT,
    };

    async function main() {
      const response = await fetch(`/api/price?${qs.stringify(params)}`);
      const data = await response.json();
      console.log(data);

      if (data?.validationErrors?.length > 0) {
        // error for sellAmount too low
        setError(data.validationErrors);
      } else {
        setError([]);
      }
      if (data.buyAmount) {
        setBuyAmount(formatUnits(data.buyAmount, buyTokenObject.decimals));
        setPrice(data);
      }
      // Set token tax information
      if (data?.tokenMetadata) {
        setBuyTokenTax(data.tokenMetadata.buyToken);
        setSellTokenTax(data.tokenMetadata.sellToken);
      }
    }

    if (sellAmount !== '') {
      main();
    }
  }, [
    sellTokenObject.address,
    buyTokenObject.address,
    parsedSellAmount,
    parsedBuyAmount,
    chainId,
    sellToken,
    sellAmount,
    setPrice,
    userAddress,
    FEE_RECIPIENT,
    AFFILIATE_FEE,
  ]);

  // Hook for fetching balance information for specified token for a specific taker address
  const { data, isError, isLoading } = useBalance({
    address: userAddress,
    token: sellTokenObject.address,
  });

  console.log('taker sellToken balance: ', data);

  const inSufficientBalance =
    data && sellAmount
      ? parseUnits(sellAmount, sellTokenDecimals) > data.value
      : true;

  // Helper function to format tax basis points to percentage
  const formatTax = (taxBps: string) => (parseFloat(taxBps) / 100).toFixed(2);

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
                <div className="w-full flex items-center gap-1.5">
                  <Image
                    alt={buyToken}
                    className="h-9 w-9 mr-2 rounded-md"
                    src={POLYGON_TOKENS_BY_SYMBOL[sellToken].logoURI}
                    width={6}
                    height={6}
                  />
                  <Select
                    onValueChange={handleSellTokenChange}
                    defaultValue="wmatic"
                  >
                    <SelectTrigger className="w-1/4">
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {POLYGON_TOKENS.map((token: Token) => {
                        return (
                          <SelectItem
                            key={token.address}
                            value={token.symbol.toLowerCase()}
                          >
                            {token.symbol}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Input
                    className="w-3/4"
                    type="number"
                    name="sell-amount"
                    id="sell-amount"
                    placeholder="Enter amount..."
                    required
                    onChange={(event) => {
                      setSwapDirection('sell');
                      setSellAmount(event.target.value);
                    }}
                  />
                </div>
                <div className="w-full flex items-center gap-1.5">
                  <Image
                    alt={buyToken}
                    className="h-9 w-9 mr-2 rounded-md"
                    src={POLYGON_TOKENS_BY_SYMBOL[buyToken].logoURI}
                    width={6}
                    height={6}
                  />
                  <Select
                    onValueChange={handleBuyTokenChange}
                    defaultValue="usdc"
                  >
                    <SelectTrigger className="w-1/4">
                      <SelectValue placeholder="Buy..." />
                    </SelectTrigger>
                    <SelectContent>
                      {POLYGON_TOKENS.map((token: Token) => {
                        return (
                          <SelectItem
                            key={token.address}
                            value={token.symbol.toLowerCase()}
                          >
                            {token.symbol}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Input
                    className="w-3/4"
                    type="number"
                    id="buy-amount"
                    name="buy-amount"
                    value={buyAmount}
                    placeholder="Enter amount..."
                    disabled
                    onChange={(event) => {
                      setSwapDirection('buy');
                      setSellAmount(event.target.value);
                    }}
                  />
                </div>
              </div>
              <Button>Swap</Button>
            </form>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Format and Parse `sellAmount` and `buyAmount`

Recall that the inputted `sellAmount` and `buyAmounts` each have their own decimal values. We will need to parse the number that the user inputs to be usable for the API request as well as format the number that is returned by the API request to be easily human readable. To do so, we will use the following methods from `viem`:

- [`parseUnits`](https://viem.sh/docs/utilities/parseUnits) - Parses a string representing ether, such as the string 1.1 into a BigNumber in wei. This is useful to convert a user inputted value into a BigNumber that is usable for API requests.
- [`formatUnits`](https://viem.sh/docs/utilities/formatUnits) - This one does the opposite of parseUnits. It formats a BigNumberish into a string, which is useful when displaying a balance or displaying a BigNumerish value returned from an API response as a string in the UI.

## Improving the UX

Since the API endpoint we are using only supports Polygon PoS, we need to make sure that connected to that specific chain. Otherwise, we will have trouble getting the correct data and we will be unable to send the correct transaction data to execute the swap.

We can achieve this by creating a `SwitchChainModal` component, which will be shown IF the user is NOT connected to Polygon PoS chain (id: 137). IF the user IS connected, we display the `SwapErc20Modal`.

`/src/components/web3/switchChainModal.tsx`

```
'use client';

import { useEffect, useState } from 'react';
import { useSwitchChain } from 'wagmi';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export default function SwitchChainModal({
  buttonText,
  requiredChainId,
}: {
  buttonText: string;
  requiredChainId: number;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const { chains, switchChain } = useSwitchChain({
    mutation: {
      onSuccess(data) {
        console.log(data);
        toast.success(`Changed to ${data.name} chain`);
        return null;
      },
    },
  });
  const [selectedChain] = chains.filter(
    (chain) => chain.id === requiredChainId
  );

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
    }
  }, [isMounted]);

  function handleSwitchChain() {
    switchChain({ chainId: selectedChain.id });
    toast.info(`Accept change to ${selectedChain.name} chain`);
  }

  return (
    <Dialog>
      <DialogTrigger asChild className="w-full">
        <Button>{buttonText}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Switch Chain</DialogTitle>
          <DialogDescription>
            {`This action is only enabled for ${selectedChain.name}. You need to switch chain`}
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleSwitchChain}>
          {`Switch to ${selectedChain.name}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

And on our `Account` component, we just do a conditional render

`src/components/web3/account.tsx`

```
  // change is located in the return statement
  return (
    <div className="flex flex-col items-center text-center gap-y-4">
      {ensAvatar && ensName && isMounted && (
        ...
      )}
      {address && isMounted && (
        ...
      )}
      <div className="flex flex-col gap-y-2">
        ...
      </div>
      <div className="flex justify-center gap-x-3 px-4">
        <div className="w-1/3">
          {chainId === 2442 ? (
            <SendEthModal />
          ) : (
            <SwitchNetworkModal buttonText="Send ETH" requiredChainId={2442} />
          )}
        </div>
        <div className="w-1/3">
          {chainId === 2442 ? (
            <SendErc20Modal userAddress={address} />
          ) : (
            <SwitchNetworkModal
              buttonText="Send ERC20"
              requiredChainId={2442}
            />
          )}
        </div>
        <div className="w-1/3">
          {chainId === 137 ? (
            <SwapErc20Modal userAddress={address} />
          ) : (
            <SwitchNetworkModal buttonText="Swap ERC20" requiredChainId={137} />
          )}
        </div>
      </div>
    </div>
  );
```

Now, we will have a better user experience, requesting the chain switch when the user wants to swap.

## Summary

Fetch [`/swap/permit2/price`](https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getPrice) is wrapped behind `app/api/price/route.ts` and triggered in the UI by `useEffect` in `/app/components/price.tsx`

Your app should now look like this:

![Modal showing token prices obtained from API and properly formatted](https://react-to-web3-bootcamp.vercel.app/content/module-4/L3/1-swap-modal-price.png)
