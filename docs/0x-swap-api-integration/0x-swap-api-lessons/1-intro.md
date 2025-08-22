# Token Swapping in Farcaster Mini Apps on Monad

## Intro

Have you ever wondered how trading applications find the best prices for token swaps across different liquidity sources? In this tutorial, we'll build token swapping functionality into a Farcaster Mini App using Monad's high-performance EVM-compatible blockchain.

![Matcha screenshot for token swap](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/3b98c278-8132-46f1-9e9d-8c123ae6ae50)

_Screenshot from [Matcha.xyz](https://matcha.xyz/), a trading dApp that aggregates liquidity_

Token swapping in modern DeFi applications is powered by [liquidity aggregators](https://0x.org/post/what-is-a-dex-aggregator), which solve the critical problem of liquidity fragmentation across the decentralized ecosystem.

![DeFi ecosystem: liquidity fragmentation](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/23b06ab3-2df4-4d48-8b94-231294962cb3)

Liquidity aggregators source prices across **off-chain** (Market Makers, Orderbooks) and **on-chain** (DEXs, AMMs) sources to **find the best price for users**. It's similar to how Google Flights aggregates airline data to show the best routes.

In this tutorial, we'll learn how to integrate the **[0x Swap API](https://0x.org/docs/0x-swap-api/introduction)** into a Farcaster Mini App running on **Monad Testnet**. We'll adapt the 0x API for Monad's EVM-compatible environment while leveraging Farcaster's social context and Mini App SDK.

![Swap modal example](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/4a7497c9-11d9-4758-86fc-f041d5f2c2dd)

![Swap API aggregator diagram](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/6d6edabb-8314-43b6-a8e8-fdc79102d124)

The 0x Swap API powers swaps in major wallets like MetaMask, Coinbase wallet, and [many more](https://0x.org/docs/introduction/introduction-to-0x#the-0x-ecosystem). While Monad testnet has limited direct 0x support, we'll show how to adapt the API patterns for new EVM chains.

![Swap API stack](https://github.com/jlin27/token-swap-dapp-course/assets/8042156/73aae476-cdbd-4105-8a57-84798a8900cc)

## What you will learn

By the end of this module, you will learn the following:

- Understand **Liquidity Aggregation** in the context of new EVM chains
- Create and manage **Monad Testnet token lists**
- Adapt **0x Swap API patterns** for new blockchain networks
- Handle **Token Allowances** and **Permit2 signatures**
- Build a **Farcaster Mini App** with swap functionality
- Integrate **Monad chain** with wagmi and Farcaster SDK

## What you will build

We'll build a complete token swapping interface integrated into a Farcaster Mini App on Monad Testnet. The interface includes token selection, real-time pricing (with fallback calculations), approval handling, and transaction execution.

**Key Features:**
- 🔄 Token swapping with 5+ Monad testnet tokens
- 💰 Real-time price fetching with API fallbacks
- 🔗 Chain switching and validation
- 📱 Mobile-optimized Farcaster Mini App interface
- 🔐 Secure token approvals using Permit2
- ⚡ High-performance transactions on Monad

## Pre-requisites

Before diving into this walk-through, ensure you have familiarity with:

**Core Technologies:**
- [React](https://react.dev/) and [Next.js 14](https://nextjs.org/)
- [wagmi v2](https://wagmi.sh/) and [viem](https://viem.sh/)
- [Farcaster Mini App SDK](https://docs.farcaster.xyz/developers/frames/v2/mini-apps)

**Blockchain Knowledge:**
- EVM-compatible blockchains
- ERC20 tokens and approvals
- DEX and token swapping concepts

We'll be building on **[Monad Testnet](https://docs.monad.xyz/)** (Chain ID: 10143), a high-performance EVM-compatible L1 blockchain designed for speed and efficiency.

Let's get started!
