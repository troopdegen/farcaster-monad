'use client'

import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import { NotificationActions } from './NotificationActions'
import CustomOGImageAction from './CustomOGImageAction'
import { Haptics } from './Haptics'
import SwapErc20Modal from '@/components/swap/swap-erc20-modal'
import WrapMonModal from '@/components/wrap/wrap-mon-modal'
import { useAccount } from 'wagmi'

export function MonadDemo() {
  const { address } = useAccount()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center">
        Monad Farcaster Mini App
      </h1>
      <div className="w-full max-w-4xl space-y-6">
        <User />
        <FarcasterActions />
        <NotificationActions />
        <WalletActions />
        <div className="space-y-4 border border-[#333] rounded-md p-4">
          <h2 className="text-xl font-bold text-left">Token Operations</h2>
          <div className="flex flex-row space-x-4 justify-start items-start">
            <SwapErc20Modal userAddress={address} />
            <WrapMonModal userAddress={address} />
          </div>
        </div>
        <CustomOGImageAction />
        <Haptics />
      </div>
    </div>
  )
}
