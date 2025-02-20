import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

// Server-side Pusher instance
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

// Client-side Pusher instance
let pusherClient: PusherClient | undefined

if (typeof window !== 'undefined') {
  pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    enabledTransports: ['ws', 'wss'],
    forceTLS: true,
    authEndpoint: '/api/pusher/auth'
  })

  // Only set these in browser environment
  if (process.env.NODE_ENV === 'development') {
    pusherClient.config.enabledTransports = ['ws', 'wss']
  }
}

export { pusherClient } 