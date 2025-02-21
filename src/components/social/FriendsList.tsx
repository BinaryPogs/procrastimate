'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FriendRequestCard } from '@/components/social/FriendRequestCard'
import { UserPlus, RefreshCw } from "lucide-react"
import AuthOptions from "@/components/auth/AuthOptions"
import type { FriendRequest, User } from "@/types"
import { LoadingState } from "@/components/ui/loading-state"
import { Input } from "@/components/ui/input"
import { useDebounce } from '@/hooks/useDebounce'
import FriendSearchFilters, { SearchFilter } from '@/components/social/FriendSearchFilters'
import { UserCard } from '@/components/social/UserCard'
import { pusherClient } from "@/lib/pusher"

// Add proper error type
interface ApiError extends Error {
  status?: number;
  code?: string;
}

// Add at the top with other interfaces
interface FriendRequestEvent {
  type: 'NEW_REQUEST';
  friendRequest: FriendRequest;
  message: string;
  soundEnabled: boolean;
}

export default function FriendsList() {
  const { data: session } = useSession()
  const [friends, setFriends] = useState<{ friendshipId: string, user: User }[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [recommendations, setRecommendations] = useState<User[]>([])
  const [sentRequests, setSentRequests] = useState<Map<string, FriendRequest>>(new Map())
  const [activeTab, setActiveTab] = useState('friends')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [receivedRequests, setReceivedRequests] = useState<Set<string>>(new Set())

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends')
      if (!response.ok) throw new Error('Failed to fetch friends')
      const data = await response.json()
      setFriends(data)
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('Failed to load friends:', apiError.message)
      toast.error(`Failed to load friends: ${apiError.message}`)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/friends/requests')
      if (!response.ok) throw new Error('Failed to fetch requests')
      const data = await response.json()
      setRequests(data)
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('Failed to load requests:', apiError.message)
      toast.error(`Failed to load friend requests: ${apiError.message}`)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      Promise.all([fetchFriends(), fetchRequests()])
        .finally(() => setIsLoading(false))
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id || !pusherClient) return;

    const channel = pusherClient.subscribe(`user-${session.user.id}`);
    
    channel.bind('friend-request', (data: FriendRequestEvent) => {
      console.log('Received friend request notification:', data);

      if (data.soundEnabled) {
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(console.error);
        } catch (error: unknown) {
          const apiError = error as ApiError
          console.error('Error playing notification sound:', apiError.message);
        }
      }

      toast.success(data.message, {
        description: 'Click to view request',
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => setActiveTab('requests')
        }
      });

      fetchRequests();
    });

    return () => {
      if (session?.user?.id) {
        channel.unbind_all();
        pusherClient.unsubscribe(`user-${session.user.id}`);
      }
    };
  }, [session?.user?.id]);

  const loadRequests = async () => {
    try {
      const [sentResponse, receivedResponse] = await Promise.all([
        fetch('/api/friends/requests/sent'),
        fetch('/api/friends/requests')
      ]);
      
      if (sentResponse.ok && receivedResponse.ok) {
        const sentData = await sentResponse.json();
        const receivedData = await receivedResponse.json();
        
        // Clear existing state
        setSentRequests(new Map());
        setReceivedRequests(new Set());
        
        // Update sent requests
        setSentRequests(new Map(sentData.map((req: FriendRequest) => [req.receiverId, req])));
        
        // Update received requests
        setReceivedRequests(new Set(receivedData.map((req: FriendRequest) => req.senderId)));
        
        // Update requests list
        setRequests(receivedData);
      }
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('Failed to load requests:', apiError.message)
      toast.error(`Failed to load requests: ${apiError.message}`)
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (pendingActions.has(friendshipId)) return
    setPendingActions(prev => new Set(prev).add(friendshipId))

    // Optimistically remove friend from UI
    setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId))
    
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to remove friend')
      toast.success('Friend removed')
    } catch (error: unknown) {
      // Don't revert the UI change even on error
      const apiError = error as ApiError
      console.error('Failed to remove friend:', apiError.message)
    } finally {
      setPendingActions(prev => {
        const next = new Set(prev)
        next.delete(friendshipId)
        return next
      })
    }
  }

  // Fix the data usage and error typing
  const handleFriendRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (pendingActions.has(requestId)) return
    setPendingActions(prev => new Set(prev).add(requestId))

    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Failed to update request')
      
      // Remove request from list
      setRequests(prev => prev.filter(r => r.id !== requestId))
      
      // If accepted, refresh friends list
      if (status === 'ACCEPTED') {
        await fetchFriends()
      }

      toast.success(
        status === 'ACCEPTED' 
          ? 'Friend request accepted!' 
          : 'Friend request rejected'
      )
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('Failed to handle request:', apiError.message)
      toast.error('Failed to handle friend request')
      await refreshAll()
    } finally {
      setPendingActions(prev => {
        const next = new Set(prev)
        next.delete(requestId)
        return next
      })
    }
  }

  // Memoize handleSearch to prevent infinite loops
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}&filter=${searchFilter}`)
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setSearchResults(data)
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('Search error:', apiError.message)
      toast.error(`Search failed: ${apiError.message}`)
    } finally {
      setIsSearching(false)
    }
  }, [searchFilter])

  // Fix the useEffect dependency
  useEffect(() => {
    const search = async () => {
      await handleSearch(debouncedSearch)
    }
    search()
  }, [debouncedSearch, searchFilter, handleSearch])

  const handleSendFriendRequest = async (userId: string) => {
    if (pendingActions.has(userId)) return
    setPendingActions(prev => new Set(prev).add(userId))

    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId }),
      })

      if (response.status === 400) {
        // If request already exists or they're already friends
        const error = await response.json()
        toast.info(error.error)
        
        // Refresh all states to get the latest data
        await loadRequests()
        
        // Remove user from search results
        setSearchResults(prev => prev.filter(user => user.id !== userId))
        setRecommendations(prev => prev.filter(user => user.id !== userId))
        return
      }

      if (!response.ok) throw new Error('Failed to send friend request')
      
      const friendRequest = await response.json()
      setSentRequests(prev => new Map(prev).set(userId, friendRequest))
      
      // Remove user from search results and recommendations
      setSearchResults(prev => prev.filter(user => user.id !== userId))
      setRecommendations(prev => prev.filter(user => user.id !== userId))
      
      toast.success('Friend request sent!')
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('Failed to send friend request:', apiError.message)
      toast.error('Failed to send friend request')
      await refreshAll() // Refresh all states on error
    } finally {
      setPendingActions(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const handleCancelRequest = async (userId: string) => {
    if (pendingActions.has(userId)) return
    setPendingActions(prev => new Set(prev).add(userId))

    const request = sentRequests.get(userId)
    if (!request) return

    try {
      const response = await fetch(`/api/friends/requests/${request.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to cancel request')
      
      // Remove from sent requests
      setSentRequests(prev => {
        const next = new Map(prev)
        next.delete(userId)
        return next
      })
      toast.success('Friend request cancelled')
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('Failed to cancel request:', apiError.message)
      toast.error('Failed to cancel friend request')
    } finally {
      setPendingActions(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/friends/recommendations')
      if (!response.ok) throw new Error('Failed to fetch recommendations')
      const data = await response.json()
      setRecommendations(data)
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('Failed to fetch recommendations:', apiError.message)
    }
  }

  const handleDialogOpen = (open: boolean) => {
    if (open) {
      fetchRecommendations()
    }
  }

  const refreshAll = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchFriends(),
        loadRequests()
      ])
    } finally {
      setIsRefreshing(false)
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
                <Button>Sign In</Button>
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
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Friends</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshAll}
            disabled={isRefreshing}
            className={isRefreshing ? 'animate-spin' : ''}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        <Dialog onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <UserPlus className="h-5 w-5" />
              <span className="sr-only">Add Friend</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="flex flex-row items-center justify-between">
              <div>
                <DialogTitle>Add Friend</DialogTitle>
                <DialogDescription>
                  Search for users or choose from recommendations
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  setSearchQuery('');
                  setSearchResults([]);
                  await Promise.all([
                    fetchRecommendations(),
                    loadRequests()
                  ]);
                }}
                disabled={isSearching || isRefreshing}
                className={isRefreshing ? 'animate-spin' : ''}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh Recommendations</span>
              </Button>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FriendSearchFilters
                currentFilter={searchFilter}
                onFilterChange={setSearchFilter}
              />
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {isSearching ? (
                  <LoadingState text="Searching..." size="sm" />
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onAdd={() => handleSendFriendRequest(user.id)}
                      onCancel={() => handleCancelRequest(user.id)}
                      isPending={pendingActions.has(user.id)}
                      isSent={sentRequests.has(user.id)}
                      hasReceivedRequest={receivedRequests.has(user.id)}
                    />
                  ))
                ) : searchQuery ? (
                  <p className="text-center text-muted-foreground py-4">
                    No users found
                  </p>
                ) : recommendations.length > 0 ? (
                  <>
                    <h4 className="text-sm font-medium mb-2">Recommended Friends</h4>
                    {recommendations.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onAdd={() => handleSendFriendRequest(user.id)}
                        onCancel={() => handleCancelRequest(user.id)}
                        isPending={pendingActions.has(user.id)}
                        isSent={sentRequests.has(user.id)}
                        hasReceivedRequest={receivedRequests.has(user.id)}
                      />
                    ))}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No recommendations available
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({requests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            {isLoading ? (
              <LoadingState text="Loading friends..." />
            ) : friends.length > 0 ? (
              friends.map(({ friendshipId, user }) => (
                <FriendRequestCard
                  key={friendshipId}
                  user={user}
                  onRemove={() => handleRemoveFriend(friendshipId)}
                  isPending={pendingActions.has(friendshipId)}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No friends yet. Try adding some!
              </p>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {isLoading ? (
              <LoadingState text="Loading requests..." />
            ) : requests.length > 0 ? (
              requests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  user={request.sender}
                  requestId={request.id}
                  showActions
                  onAccept={() => handleFriendRequest(request.id, 'ACCEPTED')}
                  onReject={() => handleFriendRequest(request.id, 'REJECTED')}
                  isPending={pendingActions.has(request.id)}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No pending friend requests
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 