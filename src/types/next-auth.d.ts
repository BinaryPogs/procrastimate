import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    isGuest?: boolean
  }
  
  interface Session {
    user?: User & {
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}