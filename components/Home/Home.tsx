'use client'

import { User } from '@/components/Home/User'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function Home() {
  const router = useRouter()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center">
        Monad Farcaster Mini App
      </h1>
      <div className="w-full max-w-4xl space-y-6">
        <User />
      </div>
      <div className="w-full max-w-4xl space-y-6">
        <Button onClick={() => {
          router.push('/demo')
        }}>
          Check Demo
        </Button>
      </div>
    </div>
  )
}
