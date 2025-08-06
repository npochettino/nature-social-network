"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Grid3X3, Heart, Camera, Users, Award, UserPlus, UserMinus, AlertCircle, Loader2, Calendar } from 'lucide-react'
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface UserPost {
  id: string
  image_url: string
  species_name: string
  scientific_name: string
  category: "bird" | "animal" | "plant"
  habitat: string
  description: string
  conservation_status?: string
  confidence: number
  caption?: string
  likes_count: number
  comments_count: number
  created_at: string
}

interface UserStats {
  posts: number
  followers: number
  following: number
  speciesDiscovered: number
}

interface ProfileData {
  id: string
  username: string
  full_name?: string
  bio?: string
  avatar_url?: string
  created_at: string
}

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.userId as string
  const { user, getAccessToken, isAuthenticated } = useAuth()
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [userPosts, setUserPosts] = useState<UserPost[]>([])
  const [stats, setStats] = useState<UserStats>({
    posts: 0,
    followers: 0,
    following: 0,
    speciesDiscovered: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isFollowing, setIsFollowing] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
    }
  }, [userId, user])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams()
      if (user) params.append("currentUserId", user.id)

      const response = await fetch(`/api/users/${userId}?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch user profile")
      }

      const data = await response.json()
      setProfileData(data.profile)
      setUserPosts(data.posts)
      setStats(data.stats)
      setIsFollowing(data.isFollowing)
      setIsOwnProfile(data.isOwnProfile)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setError(error instanceof Error ? error.message : "Failed to load user profile")
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!user || !profileData) return

    const accessToken = getAccessToken()
    if (!accessToken) {
      setError("Authentication required")
      return
    }

    try {
      const response = await fetch(`/api/users/${profileData.id}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        setIsFollowing(result.following)
        setStats((prev) => ({
          ...prev,
          followers: result.following ? prev.followers + 1 : prev.followers - 1,
        }))
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
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return `${Math.floor(diffInDays / 7)}w ago`
  }

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long" 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
            <Link href="/explore">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
            <Link href="/explore">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "User not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/explore">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-green-800">{profileData.username}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileData.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">
                  {profileData.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
                  <h2 className="text-2xl font-bold text-gray-800">{profileData.username}</h2>
                  {profileData.full_name && (
                    <p className="text-lg text-gray-600">({profileData.full_name})</p>
                  )}
                </div>

                {profileData.bio && <p className="text-gray-600 mb-4">{profileData.bio}</p>}

                <div className="flex items-center justify-center md:justify-start text-sm text-gray-500 mb-4">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Joined {formatJoinDate(profileData.created_at)}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.posts}</div>
                    <div className="text-sm text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.followers}</div>
                    <div className="text-sm text-gray-500">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.following}</div>
                    <div className="text-sm text-gray-500">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.speciesDiscovered}</div>
                    <div className="text-sm text-gray-500">Species</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  {stats.posts >= 10 && (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Camera className="w-3 h-3" />
                      <span>Active Contributor</span>
                    </Badge>
                  )}
                  {stats.speciesDiscovered >= 5 && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Award className="w-3 h-3" />
                      <span>Species Explorer</span>
                    </Badge>
                  )}
                  {stats.followers >= 50 && (
                    <Badge variant="default" className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Community Leader</span>
                    </Badge>
                  )}
                </div>

                {/* Follow Button */}
                {isAuthenticated && !isOwnProfile && (
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className={`${
                      isFollowing
                        ? "hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isFollowing ? (
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

                {isOwnProfile && (
                  <Link href="/profile">
                    <Button variant="outline">
                      Edit Profile
                    </Button>
                  </Link>
                )}

                {!isAuthenticated && (
                  <Link href="/auth/signin">
                    <Button variant="outline">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Sign in to Follow
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Grid */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Grid3X3 className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Posts ({stats.posts})</h3>
            </div>

            {userPosts.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts yet</h3>
                <p className="text-gray-500">
                  {isOwnProfile 
                    ? "Share your first nature discovery with the community" 
                    : `${profileData.username} hasn't shared any posts yet`}
                </p>
                {isOwnProfile && (
                  <Link href="/upload">
                    <Button className="mt-4 bg-green-600 hover:bg-green-700">
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={post.image_url || "/placeholder.svg"}
                          alt={post.species_name}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={
                              post.category === "bird"
                                ? "default"
                                : post.category === "animal"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {post.category}
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                            <Heart className="w-3 h-3 text-white" />
                            <span className="text-xs text-white">{post.likes_count}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm text-gray-800 truncate">{post.species_name}</h3>
                        <p className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
