# Ticket #3: Create Type Definitions

## Overview
Define all TypeScript interfaces and types needed for the swap functionality, ensuring type safety throughout the implementation.

## Description
Create comprehensive type definitions for API responses, swap transactions, UI state, and all swap-related data structures.

## Acceptance Criteria
- [ ] All swap-related types defined in `/types/swap.ts`
- [ ] API response types match expected formats
- [ ] No TypeScript errors in type definitions
- [ ] Types are exportable and reusable
- [ ] JSDoc comments for complex types

## Implementation Steps

### 1. Create Main Types File
```typescript
// types/swap.ts

import { Address } from 'viem';

// Token type (if not already defined)
export interface Token {
  chainId: number;
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

// Price API Request
export interface PriceRequest {
  chainId: number;
  sellToken: Address;
  buyToken: Address;
  sellAmount?: string;
  buyAmount?: string;
  taker?: Address;
  swapFeeRecipient?: Address;
  swapFeeBps?: number;
  swapFeeToken?: Address;
  tradeSurplusRecipient?: Address;
}

// Price API Response
export interface PriceResponse {
  chainId: number;
  price: string;
  estimatedPriceImpact: string;
  value: string;
  gasPrice: string;
  gas: string;
  estimatedGas: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyAmount: string;
  buyTokenAddress: Address;
  sellAmount: string;
  sellTokenAddress: Address;
  sources: Source[];
  allowanceTarget: Address;
  sellTokenToEthRate: string;
  buyTokenToEthRate: string;
  expectedSlippage: string | null;
  route?: Route;
  tokenMetadata?: TokenMetadata;
  validationErrors?: ValidationError[];
  warnings?: Warning[];
}

// Quote API Response (extends Price)
export interface QuoteResponse extends PriceResponse {
  to: Address;
  data: `0x${string}`;
  value: string;
  gasless?: GaslessSwap;
  permit2?: Permit2Data;
}

// Supporting Types
export interface Source {
  name: string;
  proportion: string;
  intermediateToken?: string;
  hops?: string[];
}

export interface Route {
  fills: Fill[];
  tokens: TokenRoute[];
}

export interface Fill {
  source: string;
  from: Address;
  to: Address;
  proportionBps: string;
}

export interface TokenRoute {
  token: Address;
  tokenType: string;
  amount: string;
  priceImpact?: string;
}

export interface TokenMetadata {
  buyToken: TokenTax;
  sellToken: TokenTax;
}

export interface TokenTax {
  buyTaxBps: string;
  sellTaxBps: string;
}

export interface ValidationError {
  field: string;
  code: number;
  reason: string;
  description?: string;
}

export interface Warning {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// Permit2 Types
export interface Permit2Data {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: Address;
  };
  types: Record<string, TypedDataField[]>;
  primaryType: string;
  message: Record<string, any>;
}

export interface TypedDataField {
  name: string;
  type: string;
}

// Gasless Swap
export interface GaslessSwap {
  enabled: boolean;
  approvalNeeded: boolean;
  feeToken?: Address;
  feeAmount?: string;
}

// UI State Types
export interface SwapState {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  isLoading: boolean;
  error: string | null;
  priceData: PriceResponse | null;
  quoteData: QuoteResponse | null;
  slippage: number;
  deadline: number;
}

export interface SwapFormData {
  sellToken: Token;
  buyToken: Token;
  sellAmount: string;
  buyAmount: string;
  tradeDirection: 'sell' | 'buy';
}

// Transaction Types
export interface SwapTransaction {
  hash: `0x${string}`;
  from: Address;
  to: Address;
  sellToken: Token;
  buyToken: Token;
  sellAmount: string;
  buyAmount: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

// Approval Types
export interface TokenApproval {
  token: Address;
  spender: Address;
  amount: string;
  owner: Address;
}

export interface ApprovalState {
  isApproved: boolean;
  isApproving: boolean;
  currentAllowance: string;
  requiredAllowance: string;
}

// Settings Types
export interface SwapSettings {
  slippageTolerance: number; // in basis points (e.g., 50 = 0.5%)
  transactionDeadline: number; // in minutes
  gasPrice?: string;
  expertMode: boolean;
  multihop: boolean;
  recipient?: Address;
}

// Constants
export const DEFAULT_SLIPPAGE = 50; // 0.5%
export const DEFAULT_DEADLINE = 30; // 30 minutes
export const MAX_SLIPPAGE = 5000; // 50%
export const MIN_SLIPPAGE = 1; // 0.01%

// Type Guards
export function isPriceResponse(data: any): data is PriceResponse {
  return data && 
    typeof data.buyAmount === 'string' && 
    typeof data.sellAmount === 'string';
}

export function isQuoteResponse(data: any): data is QuoteResponse {
  return isPriceResponse(data) && 
    typeof data.to === 'string' && 
    typeof data.data === 'string';
}

export function hasValidationErrors(response: PriceResponse): boolean {
  return response.validationErrors !== undefined && 
    response.validationErrors.length > 0;
}

// Utility Types
export type SwapDirection = 'sell' | 'buy';
export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';
export type ApprovalStatus = 'unknown' | 'required' | 'approving' | 'approved';

// Error Types
export interface SwapError {
  code: string;
  message: string;
  details?: any;
}

export enum SwapErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  PRICE_IMPACT_TOO_HIGH = 'PRICE_IMPACT_TOO_HIGH',
  NETWORK_ERROR = 'NETWORK_ERROR',
  USER_REJECTED = 'USER_REJECTED',
  UNKNOWN = 'UNKNOWN',
}
```

### 2. Create API Types File
```typescript
// types/api.ts

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

### 3. Create Hook Types
```typescript
// types/hooks.ts

import { PriceResponse, QuoteResponse, SwapSettings } from './swap';

export interface UsePriceResult {
  price: PriceResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseQuoteResult {
  quote: QuoteResponse | null;
  isLoading: boolean;
  error: Error | null;
  getQuote: () => Promise<void>;
}

export interface UseSwapResult {
  swap: () => Promise<void>;
  isSwapping: boolean;
  txHash: string | null;
  error: Error | null;
}

export interface UseTokenBalanceResult {
  balance: string;
  formatted: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

## Testing Steps

### 1. Type Compilation
```bash
# Run TypeScript compiler
npx tsc --noEmit

# Should show no errors
```

### 2. Type Import Test
```typescript
// Test file
import { 
  PriceResponse, 
  QuoteResponse, 
  Token,
  isPriceResponse 
} from '@/types/swap';

// Should have autocomplete and no errors
const testToken: Token = {
  chainId: 10143,
  address: '0x...',
  name: 'Test',
  symbol: 'TEST',
  decimals: 18,
  logoURI: 'test.png'
};
```

### 3. Type Guard Test
```typescript
const response = await fetch('/api/price');
const data = await response.json();

if (isPriceResponse(data)) {
  // TypeScript should know data is PriceResponse
  console.log(data.buyAmount);
}
```

## Dependencies
- Ticket #1: Token type consistency
- viem for Address type

## Notes
- Types based on 0x Swap API v2 specification
- May need adjustment based on actual Monad DEX API
- Consider generating types from OpenAPI spec if available
- Add more type guards as needed

## Estimated Time
1 hour

## Related Files
- `/types/swap.ts` - Main swap types
- `/types/api.ts` - API response types
- `/types/hooks.ts` - React hook types

## Next Steps
After completion, proceed to:
- Ticket #4: Research Monad DEX Options
- Use these types throughout the implementation