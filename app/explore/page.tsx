"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Search, Users, UserPlus, UserMinus, Camera, Award, Loader2, AlertCircle } from 'lucide-react'
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

interface User {
  id: string
  username: string
  full_name?: string
  bio?: string
  avatar_url?: string
  created_at: string
  stats: {
    posts: number
    followers: number
    following: number
    speciesDiscovered: number
  }
  isFollowing: boolean
}

export default function ExplorePage() {
  const { user, getAccessToken, isAuthenticated, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!authLoading) {
      fetchUsers()
    }
  }, [authLoading, searchQuery])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (user) params.append("currentUserId", user.id)

      const response = await fetch(`/api/users?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users)
      
      // Track following status
      const following = new Set(data.users.filter((u: User) => u.isFollowing).map((u: User) => u.id))
      setFollowingUsers(following)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError(error instanceof Error ? error.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (targetUserId: string) => {
    if (!user) return

    const accessToken = getAccessToken()
    if (!accessToken) {
      setError("Authentication required")
      return
    }

    try {
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        // Update local state
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === targetUserId
              ? {
                  ...u,
                  isFollowing: result.following,
                  stats: {
                    ...u.stats,
                    followers: result.following ? u.stats.followers + 1 : u.stats.followers - 1,
                  },
                }
              : u
          )
        )

        // Update following set
        setFollowingUsers((prev) => {
          const newSet = new Set(prev)
          if (result.following) {
            newSet.add(targetUserId)
          } else {
            newSet.delete(targetUserId)
          }
          return newSet
        })
      } else {
        setError(result.error || "Failed to update follow status")
      }
    } catch (error) {
      console.error("Error following user:", error)
      setError("Failed to update follow status")
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays < 1) return "Joined today"
    if (diffInDays < 7) return `Joined ${diffInDays}d ago`
    if (diffInDays < 30) return `Joined ${Math.floor(diffInDays / 7)}w ago`
    if (diffInDays < 365) return `Joined ${Math.floor(diffInDays / 30)}mo ago`
    return `Joined ${Math.floor(diffInDays / 365)}y ago`
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-green-800">Explore Users</h1>
              <p className="text-sm text-gray-600">Discover nature enthusiasts</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="grid grid-cols-2 gap-4 w-full mb-4">
                      <div className="text-center">
                        <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                      </div>
                      <div className="text-center">
                        <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                      </div>
                    </div>
                    <div className="h-9 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-600 mb-3">
                {searchQuery ? "No users found" : "No users to explore"}
              </h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search to find other nature enthusiasts."
                  : "Be the first to join this nature community!"}
              </p>
              {!isAuthenticated && (
                <Link href="/auth/signup">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Community
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((profileUser) => (
              <Card key={profileUser.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <Link href={`/users/${profileUser.id}`}>
                      <Avatar className="w-20 h-20 mb-4 cursor-pointer hover:ring-2 hover:ring-green-500 transition-all">
                        <AvatarImage src={profileUser.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="text-lg">
                          {profileUser.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    {/* User Info */}
                    <div className="mb-4">
                      <Link href={`/users/${profileUser.id}`}>
                        <h3 className="font-bold text-lg text-gray-800 hover:text-green-600 transition-colors cursor-pointer">
                          {profileUser.username}
                        </h3>
                      </Link>
                      {profileUser.full_name && (
                        <p className="text-sm text-gray-600 mb-2">{profileUser.full_name}</p>
                      )}
                      {profileUser.bio && (
                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">{profileUser.bio}</p>
                      )}
                      <p className="text-xs text-gray-500">{formatTimeAgo(profileUser.created_at)}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 w-full mb-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">{profileUser.stats.posts}</div>
                        <div className="text-xs text-gray-500">Posts</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{profileUser.stats.followers}</div>
                        <div className="text-xs text-gray-500">Followers</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{profileUser.stats.following}</div>
                        <div className="text-xs text-gray-500">Following</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{profileUser.stats.speciesDiscovered}</div>
                        <div className="text-xs text-gray-500">Species</div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                      {profileUser.stats.posts >= 10 && (
                        <Badge variant="secondary" className="text-xs">
                          <Camera className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {profileUser.stats.speciesDiscovered >= 5 && (
                        <Badge variant="outline" className="text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          Explorer
                        </Badge>
                      )}
                      {profileUser.stats.followers >= 50 && (
                        <Badge variant="default" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>

                    {/* Follow Button */}
                    {isAuthenticated && user && user.id !== profileUser.id && (
                      <Button
                        onClick={() => handleFollow(profileUser.id)}
                        variant={profileUser.isFollowing ? "outline" : "default"}
                        size="sm"
                        className={`w-full ${
                          profileUser.isFollowing
                            ? "hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {profileUser.isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}

                    {!isAuthenticated && (
                      <Link href="/auth/signin" className="w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Sign in to Follow
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
