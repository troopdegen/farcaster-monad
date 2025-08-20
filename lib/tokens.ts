import { Address } from "viem";

export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

export const MAGIC_CALLDATA_STRING = "f".repeat(130); // used when signing the eip712 message

export const AFFILIATE_FEE = 100; // 1% affiliate fee. Denoted in Bps.
export const FEE_RECIPIENT = "0x75A94931B81d81C7a62b76DC0FcFAC77FbE1e917"; // The ETH address that should receive affiliate fees

export const MAX_ALLOWANCE = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

export interface Token {
  name: string;
  address: Address;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
}

export const MONAD_TESTNET_TOKENS: Token[] = [
  {
    chainId: 10143,
    name: "Wrapped Monad",
    symbol: "WMON",
    decimals: 18,
    address: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
    logoURI:
      "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/I_t8rg_V_400x400.jpg/public",
  },
  {
    chainId: 10143,
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    address: "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37",
    logoURI: "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/weth.jpg/public",
  },
  {
    chainId: 10143,
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
    address: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d",
    logoURI: "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/wbtc.png/public",
  },
  {
    chainId: 10143,
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
    logoURI: "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/usdc.png/public",
  },
  {
    chainId: 10143,
    name: "ChainLink",
    symbol: "LINK",
    decimals: 18,
    address: "0x6C6A73cb3549c8480F08420EE2e5DFaf9d2D4CDb",
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png",
  },
];

// Create lookup objects for efficient access
export const MONAD_TESTNET_TOKENS_BY_SYMBOL: Record<string, Token> =
  MONAD_TESTNET_TOKENS.reduce((acc, token) => {
    acc[token.symbol.toLowerCase()] = token;
    return acc;
  }, {} as Record<string, Token>);

export const MONAD_TESTNET_TOKENS_BY_ADDRESS: Record<string, Token> =
  MONAD_TESTNET_TOKENS.reduce((acc, token) => {
    acc[token.address.toLowerCase()] = token;
    return acc;
  }, {} as Record<string, Token>);

// Helper functions
export function getTokenBySymbol(symbol: string): Token | undefined {
  return MONAD_TESTNET_TOKENS_BY_SYMBOL[symbol.toLowerCase()];
}

export function getTokenByAddress(address: string): Token | undefined {
  return MONAD_TESTNET_TOKENS_BY_ADDRESS[address.toLowerCase()];
}

// Default token pairs for quick selection
export const DEFAULT_SELL_TOKEN = "WMON";
export const DEFAULT_BUY_TOKEN = "USDC";
