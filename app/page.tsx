import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/dad.jpg`,
  button: {
    title: 'Entrar a la App',
    action: {
      type: 'launch_frame',
      name: 'Mini App Monad x Frutero Club',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: '#f7f7f7',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Mini App Monad x Frutero Club',
    openGraph: {
      title: 'Mini App Monad x Frutero Club',
      description: 'Plantilla creada por Monad para Mini Apps - complementada por Frutero Club',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}
