'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FaUserPlus, FaCheck, FaTimes } from "react-icons/fa"
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { pusherClient } from '@/lib/pusher'
import { Badge } from "@/components/ui/badge"
import { useDebounce } from '@/hooks/useDebounce'
import { Loader2 } from 'lucide-react'
import FriendSearchFilters, { SearchFilter } from '@/components/social/FriendSearchFilters'
import AuthOptions from "@/components/auth/AuthOptions"

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  isGuest: boolean
}

interface Friendship {
  id: string
  requesterId: string
  receiverId: string
  status: string
  requester: User
  receiver: User
}

interface OnlineUser {
  user_id: string
  user_info: {
    name: string | null
    email: string | null
    image: string | null
  }
}

interface PusherMembers {
  each: (callback: (member: OnlineUser) => void) => void
}

interface PusherEvent {
  type: string
  friendship: Friendship
}

interface PusherChannel {
  bind(event: 'pusher:subscription_succeeded', callback: (members: PusherMembers) => void): void;
  bind(event: 'pusher:member_added' | 'pusher:member_removed', callback: (member: OnlineUser) => void): void;
  bind(event: string, callback: (data: PusherEvent) => void): void;
  unbind_all: () => void;
  unsubscribe: () => void;
}

export default function FriendsList() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all')

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const handleSearch = useCallback(async (query: string) => {
    if (!session?.user?.id) {
      toast.error('Please sign in to search users')
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/friends/search?q=${encodeURIComponent(query)}&filter=${searchFilter}`
      )
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Search failed')
      }
      const data = await response.json()
      
      setSearchResults(data.users.filter((user: User) => {
        const isExistingFriend = friendships.some(
          f => f.requesterId === user.id || f.receiverId === user.id
        )
        const isPendingRequest = friendships.some(
          f => f.requesterId === user.id || f.receiverId === user.id
        )
        return !isExistingFriend && !isPendingRequest
      }))
    } catch (error: unknown) {
      const err = error as Error
      console.error('Failed to search users:', err)
      toast.error(err.message || 'Failed to search users')
    } finally {
      setIsSearching(false)
    }
  }, [session?.user?.id, searchFilter, friendships])

  useEffect(() => {
    if (debouncedSearchQuery && session?.user?.id) {
      handleSearch(debouncedSearchQuery)
    } else {
      setSearchResults([])
    }
  }, [debouncedSearchQuery, searchFilter, session?.user?.id, handleSearch])

  useEffect(() => {
    if (session?.user?.id) {
      fetchFriendships()

      const channel = pusherClient.subscribe(`user-${session.user.id}`)
      const presenceChannel = pusherClient.subscribe('presence-online') as PusherChannel

      presenceChannel.bind('pusher:subscription_succeeded', (members: PusherMembers) => {
        const onlineUserIds = new Set<string>()
        members.each((member: OnlineUser) => {
          onlineUserIds.add(member.user_id)
        })
        setOnlineUsers(onlineUserIds)
      })

      presenceChannel.bind('pusher:member_added', (member: OnlineUser) => {
        setOnlineUsers(prev => new Set(prev).add(member.user_id))
      })

      presenceChannel.bind('pusher:member_removed', (member: OnlineUser) => {
        setOnlineUsers(prev => {
          const next = new Set(prev)
          next.delete(member.user_id)
          return next
        })
      })

      channel.bind('friend-request', (data: { type: string, friendship: Friendship }) => {
        if (data.type === 'NEW_REQUEST') {
          setFriendships(prev => [...prev, data.friendship])
          toast.info(`New friend request from ${data.friendship.requester.name}`)
        }
      })

      channel.bind('friend-request-update', (data: { type: string, friendship: Friendship }) => {
        if (data.type === 'REQUEST_ACCEPTED') {
          setFriendships(prev => prev.map(f => 
            f.id === data.friendship.id ? data.friendship : f
          ))
          toast.success(`Friend request accepted by ${data.friendship.receiver.name}`)
        } else if (data.type === 'REQUEST_REJECTED') {
          setFriendships(prev => prev.filter(f => f.id !== data.friendship.id))
          toast.info(`Friend request declined by ${data.friendship.receiver.name}`)
        }
      })

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
        presenceChannel.unbind_all()
        presenceChannel.unsubscribe()
      }
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user?.id) {
      handleSearch('')
    }
  }, [session?.user?.id, handleSearch])

  const fetchFriendships = async () => {
    try {
      const response = await fetch('/api/friends/request')
      if (!response.ok) throw new Error('Failed to fetch friendships')
      const data = await response.json()
      setFriendships(data)
    } catch (error: unknown) {
      const err = error as Error
      console.error('Failed to load friends:', err)
      toast.error('Failed to load friends')
    } finally {
      setIsLoading(false)
    }
  }

  const sendFriendRequest = async (userId: string) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send friend request')
      }
      
      toast.success('Friend request sent!')
      fetchFriendships()
    } catch (error: unknown) {
      const err = error as Error
      console.error('Failed to send friend request:', err)
      toast.error(err.message || 'Failed to send friend request')
    }
  }

  const handleFriendRequest = async (friendshipId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, status }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update friend request')
      }
      
      toast.success(status === 'ACCEPTED' ? 'Friend request accepted!' : 'Friend request rejected')
      fetchFriendships()
    } catch (error: unknown) {
      const err = error as Error
      console.error('Failed to update friend request:', err)
      toast.error(err.message || 'Failed to update friend request')
    }
  }

  const pendingRequests = friendships.filter(f => f.status === 'PENDING' && f.receiverId === session?.user?.id)
  const friends = friendships.filter(f => f.status === 'ACCEPTED')

  const getFriendRequestStatus = (userId: string) => {
    const request = friendships.find(f => 
      (f.requesterId === session?.user?.id && f.receiverId === userId) ||
      (f.receiverId === session?.user?.id && f.requesterId === userId)
    )
    
    if (!request) return null
    return {
      status: request.status,
      isOutgoing: request.requesterId === session?.user?.id
    }
  }

  if (!session) {
    return (
      <Card className="h-full">
        <CardHeader>
          <h2 className="text-xl font-semibold">Friends</h2>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Sign in to connect with friends and see who&apos;s online
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  Sign In
                </Button>
              </DialogTrigger>
              <DialogContent>
                <AuthOptions />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">Friends</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <FaUserPlus className="h-4 w-4" />
              <span className="sr-only">Add Friend</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Friend</DialogTitle>
              <DialogDescription>
                Search for users or choose from recommendations below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
                />
                <FriendSearchFilters
                  currentFilter={searchFilter}
                  onFilterChange={setSearchFilter}
                />
              </div>
              {isSearching && (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {searchResults.length > 0 ? (
                  <>
                    {!searchQuery && (
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Recommended Users
                      </h3>
                    )}
                    {searchResults.map((user) => (
                      <div 
                        key={user.id} 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={user.image ?? undefined} />
                            <AvatarFallback>{user.name?.[0] ?? 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{user.name}</p>
                              {user.isGuest && (
                                <Badge variant="secondary" className="text-xs">
                                  Guest
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const requestStatus = getFriendRequestStatus(user.id)
                            
                            if (requestStatus?.status === 'PENDING') {
                              return requestStatus.isOutgoing ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled
                                >
                                  Request Sent
                                </Button>
                              ) : (
                                <div className="flex gap-1">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleFriendRequest(user.id, 'ACCEPTED')}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleFriendRequest(user.id, 'REJECTED')}
                                  >
                                    Decline
                                  </Button>
                                </div>
                              )
                            }

                            if (requestStatus?.status === 'ACCEPTED') {
                              return (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled
                                >
                                  Friends
                                </Button>
                              )
                            }

                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendFriendRequest(user.id)}
                              >
                                Add Friend
                              </Button>
                            )
                          })()}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    {searchQuery ? 'No users found' : 'No recommendations available'}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="friends">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" data-count={pendingRequests.length}>
              Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : friends.length > 0 ? (
              friends.map((friendship) => {
                const friend = friendship.requesterId === session?.user?.id
                  ? friendship.receiver
                  : friendship.requester
                return (
                  <div key={friendship.id} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={friend.image ?? undefined} />
                          <AvatarFallback>{friend.name?.[0] ?? 'U'}</AvatarFallback>
                        </Avatar>
                        <span 
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                            onlineUsers.has(friend.id) ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{friend.name}</p>
                          {onlineUsers.has(friend.id) && (
                            <Badge variant="secondary" className="text-xs">
                              Online
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{friend.email}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-center text-gray-500">No friends yet</p>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={request.requester.image ?? undefined} />
                      <AvatarFallback>{request.requester.name?.[0] ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.requester.name}</p>
                      <p className="text-sm text-gray-500">{request.requester.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFriendRequest(request.id, 'ACCEPTED')}
                    >
                      <FaCheck className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFriendRequest(request.id, 'REJECTED')}
                    >
                      <FaTimes className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No pending requests</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 