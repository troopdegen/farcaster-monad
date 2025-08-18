import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/dad.jpg`,
  button: {
    title: 'Dad Jokes',
    action: {
      type: 'launch_frame',
      name: 'Monad Dad Jokes App',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: '#f7f7f7',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Dad Jokes',
    openGraph: {
      title: 'Dad Jokes',
      description: 'A dad joke app',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}
