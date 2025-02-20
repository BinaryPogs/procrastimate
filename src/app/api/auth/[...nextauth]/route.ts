import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

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

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
