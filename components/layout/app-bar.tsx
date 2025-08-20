"use client"

import { TrophyIcon, UserIcon, VoteIcon } from "lucide-react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function AppBar() {
  const router = useRouter()

  const pathname = usePathname()

  const isActive = (path: string) => pathname === path
  return (

    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-4 pt-0 px-4 md:hidden h-20">
      <div className="max-w-screen-xl mx-auto flex justify-center items-center gap-x-0">
        <div className="w-1/4 flex flex-col items-center gap-1 px-2">
          <Button
            className={cn("flex flex-col items-center gap-1 p-2", isActive("/") && "text-primary")}
            onClick={() => router.push("/home")}
          >

            <Image src="/images/regen-logo-128x128.png" alt="Reggie's Avatar" width={32} height={32} className="h-10 w-10" />
          </Button>
        </div>
        <div className="w-1/4 flex flex-col items-center gap-1 px-2">
          <Button
            className={cn("flex flex-col items-center gap-1 px-2 hover:text-primary transition-colors", isActive("/mini-apps/degen-or-regen") && "text-primary")}
            onClick={() => router.push("/mini-apps/degen-or-regen")}
          >
            <VoteIcon className={`w-[36px] h-[36px]`} />
          </Button>
        </div>
        <div className="w-1/4 flex flex-col items-center gap-1 px-2">
          <Button
            className={cn("flex flex-col items-center gap-1 px-2 hover:text-primary transition-colors", isActive("/leaderboard") && "text-primary")}
            onClick={() => router.push("/leaderboard")}
          >
            <TrophyIcon className={cn("w-8 h-8", isActive("/leaderboard") && "text-primary")} />
          </Button>
        </div>
        <div className="w-1/4 flex flex-col items-center gap-1 px-2">
          <Button
            className={cn("flex flex-col items-center gap-1 px-2 hover:text-primary transition-colors", isActive("/profile") && "text-primary")}
            onClick={() => router.push("/profile")}
          >
            <UserIcon className="w-8 h-8" />
          </Button>
        </div>
      </div>
    </nav>
  )
}