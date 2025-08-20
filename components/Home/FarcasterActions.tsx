import { useFrame } from '@/components/farcaster-provider'
import { APP_URL } from '@/lib/constants'
import { useMutation } from '@tanstack/react-query'
import { Button } from '../ui/button'

export function FarcasterActions() {
  const { actions } = useFrame()

  return (
    <div className="space-y-4 border border-[#333] rounded-md p-4">
      <h2 className="text-xl font-bold text-left">sdk.actions</h2>
      <div className="flex flex-row space-x-4 justify-start items-start">
        {actions ? (
          <div className="flex flex-col space-y-4 justify-start">
            <Button
              type="button"

              onClick={() => actions?.addMiniApp()}
            >
              Add this app to your home screen
            </Button>
            <Button
              type="button"

              onClick={() => actions?.close()}
            >
              close
            </Button>
            <Button
              type="button"

              onClick={() =>
                actions?.composeCast({
                  text: 'Check out this Monad Farcaster MiniApp Template!',// todo: add joke here
                  embeds: [`${APP_URL}/images/dad.jpg`],
                })
              }
            >
              Share this Joke
            </Button>
            {/* <Button
              type="button"
               
              onClick={() => actions?.openUrl('https://docs.monad.xyz')}
            >
              openUrl
            </Button> */}
            {/* <Button
              type="button"
               
              onClick={() =>
                actions?.signIn({ nonce: '1201', acceptAuthAddress: true })
              }
            >
              signIn
            </Button> */}
            {/* <Button
              type="button"
               
              onClick={() => actions?.viewProfile({ fid: 17979 })}
            >
              viewProfile
            </Button> */}
          </div>
        ) : (
          <p className="text-sm text-left">Actions not available</p>
        )}
      </div>
    </div>
  )
}
