import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface UserCardProps {
  user: User
  onAdd: () => void
  onCancel?: () => void
  isPending?: boolean
  isSent?: boolean
  hasReceivedRequest?: boolean
}

export function UserCard({ 
  user, 
  onAdd, 
  onCancel, 
  isPending, 
  isSent,
  hasReceivedRequest 
}: UserCardProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-card border rounded-lg">
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
      
      {hasReceivedRequest ? (
        <p className="text-sm text-muted-foreground">Pending Response</p>
      ) : isSent ? (
        <Button
          onClick={onCancel}
          disabled={isPending}
          size="sm"
          variant="outline"
          className="text-muted-foreground hover:text-destructive"
        >
          Cancel Request
        </Button>
      ) : (
        <Button
          onClick={onAdd}
          disabled={isPending}
          size="sm"
        >
          {isPending ? <LoadingSpinner className="h-4 w-4" /> : "Add Friend"}
        </Button>
      )}
    </div>
  )
} 