import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth, { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from 'bcrypt'

/**
 * NextAuth Configuration
 * This handler sets up authentication endpoints at /api/auth/*
 * 
 * Available routes:
 * - /api/auth/signin - Displays sign in options
 * - /api/auth/signout - Handles sign out
 * - /api/auth/session - Gets current session data
 * - /api/auth/callback/google - Handles Google OAuth callback
 * - /api/auth/callback/github - Handles GitHub OAuth callback
 * 
 * Environment variables needed:
 * - AUTH_GOOGLE_ID: OAuth client ID from Google Cloud Console
 * - AUTH_GOOGLE_SECRET: OAuth client secret from Google Cloud Console
 * - AUTH_GITHUB_ID: OAuth client ID from GitHub Developer Settings
 * - AUTH_GITHUB_SECRET: OAuth client secret from GitHub Developer Settings
 * - NEXTAUTH_SECRET: Random string for JWT encryption
 * - NEXTAUTH_URL: Your website URL (http://localhost:3000 for development)
 */
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!passwordMatch) {
          return null
        }

        return user
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
  pages: {
    signIn: '/', // Use our custom sign in modal
    error: '/', // Handle errors in our UI
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
