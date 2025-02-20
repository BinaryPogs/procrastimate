import type { Metadata } from "next";
import { Combo } from 'next/font/google'
import "./globals.css";
import { Providers } from "./providers"

const combo = Combo({ 
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "ProcrastiMATE",
  description: "ProcrastiMATE is a social todo list app that helps you get things done.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${combo.className} bg-[#FFFBE3]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
