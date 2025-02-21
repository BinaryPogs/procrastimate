import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import type { User } from "@/types"

interface FriendRequestCardProps {
  user: User
  requestId?: string
  isPending?: boolean
  showActions?: boolean
  onAccept?: () => void
  onReject?: () => void
  onRemove?: () => void
}

export function FriendRequestCard({
  user,
  isPending,
  showActions = false,
  onAccept,
  onReject,
  onRemove
}: FriendRequestCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.image || ''} alt={user.name || ''} />
          <AvatarFallback>{user.name?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      
      {showActions ? (
        <div className="flex gap-2">
          <Button
            onClick={onAccept}
            disabled={isPending}
            size="sm"
          >
            Accept
          </Button>
          <Button
            onClick={onReject}
            disabled={isPending}
            variant="outline"
            size="sm"
          >
            Reject
          </Button>
        </div>
      ) : onRemove && (
        <Button
          onClick={onRemove}
          disabled={isPending}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash className="h-4 w-4" />
          <span className="sr-only">Remove Friend</span>
        </Button>
      )}
    </div>
  )
} 