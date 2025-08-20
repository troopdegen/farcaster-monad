import { Address } from 'viem';

export interface SafeAreaInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface PriceResponse {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  allowanceTarget: string;
  price: string;
  grossPrice: string;
  estimatedPriceImpact: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
  buyTokenToEthRate: string;
  sellTokenToEthRate: string;
  expectedSlippage: string;
  issues: {
    allowance: {
      spender: Address;
      allowance: string;
    } | null;
  };
  tokenMetadata?: {
    sellToken: {
      buyTaxBps: string;
      sellTaxBps: string;
    };
    buyToken: {
      buyTaxBps: string;
      sellTaxBps: string;
    };
  };
  validationErrors?: Array<{
    field: string;
    code: string;
    reason: string;
  }>;
}

export interface QuoteResponse extends PriceResponse {
  transaction: {
    to: Address;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
  permit2?: {
    eip712: {
      types: any;
      primaryType: string;
      domain: any;
      message: any;
    };
  };
}
