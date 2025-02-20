'use client'

import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import AuthOptions from "./AuthOptions"

export default function AuthButtons() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <Button disabled>Loading...</Button>
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={session.user?.image ?? ''} />
          <AvatarFallback>{session.user?.name?.[0] ?? '?'}</AvatarFallback>
        </Avatar>
        <Button variant="outline" onClick={() => signOut()}>
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Sign In</Button>
      </DialogTrigger>
      <DialogContent>
        <AuthOptions />
      </DialogContent>
    </Dialog>
  )
} 