# Get Price

Now for the fun part! Let's fetch a live price using the [0x Swap's `/swap/permit2/price` endpoint](https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getPrice) 🙌

In our app, we want to dynamically surface the amount of buy token a user can get whenever they input a sell token amount.

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

## Fetch price

Fetching a price with the [`/swap/permit2/price`](https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getPrice) endpoint is a straight-forward HTTP GET request. We then need to display the price data accordingly to our users.

### What do we need to do

Now we will surface the amount of buy token a user can swap when they input a sell amount.

We will need to complete the following:

- plug the `/swap/permit2/price` endpoint into our PriceView
- automatically fetch a new price whenever the inputs change (e.g. new sell amount, new sell token selected)
- format the user inputted amounts so the API can read it, and format response from the API so it is human-readable

### Get a 0x API key

Every call to a 0x API must include a 0x API secret key. [Create a 0x account](https://dashboard.0x.org/) and get a live API key. See the [guide here](https://0x.org/docs/introduction/getting-started) to get setup.

### Our new modal component: SwapErc20Modal

`SwapErc20Modal` is the component where users can browse for a price without committing to a swap, aka, get the indicative price. Recall that an indicative price is used when users just want to check the price they could receive on a swap, for this we will use the [`/swap/permit2/price`](https://0x.org/docs/api#tag/Swap/operation/swap::permit2::getPrice) endpoint.

Currently, when a user inputs a `sellAmount`, the corresponding amount they can buy doesn't automatically appear in the UI. We want the `buyAmount` to populate with the price we get from `/swap/permit2/price`.

## Fetch price from PriceView

In the previous lesson, we saw how to fetch a price using `/swap/permit2/price`. Now we need to plug it into the UI.

### Step 1. Wrap price API request

To do this in Next, we will need to wrap our API request is wrapped behind `/app/api/price/route.ts` using [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers).

Why wrap? To protect our API keys.

Wrapping our API key protects it because all API requests are viewable by if someone inspects the browser, but we don’t want them inspecting an finding our keys. Instead, when the user queries for an indicative price, it pings our API setup in `/app/api/price/route.ts` and that pings the 0x Swap API using the API key in the header.

`/app/api/price/route.ts`

```
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  try {
    const res = await fetch(
      `https://api.0x.org/swap/permit2/price?${searchParams}`,
      {
        headers: {
          '0x-api-key': process.env.NEXT_PUBLIC_ZEROEX_API_KEY as string,
          '0x-version': 'v2',
        },
      }
    );
    const data = await res.json();

    console.log(
      'price api',
      `https://api.0x.org/swap/permit2/price?${searchParams}`
    );

    console.log('price data', data);

    return Response.json(data);
  } catch (error) {
    console.log(error);
  }
}
```

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
