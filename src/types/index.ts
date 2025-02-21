export interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export interface Friendship {
  id: string
  user1Id: string
  user2Id: string
  createdAt: Date
  user1: User
  user2: User
}

export interface FriendRequest {
  id: string
  senderId: string
  receiverId: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: Date
  sender: User
  receiver: User
}

export interface OptimisticFriendship extends Friendship {
  isOptimistic?: boolean
} 