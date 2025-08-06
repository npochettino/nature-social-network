"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Settings, Grid3X3, Heart, Camera, Users, Award, LogOut, AlertCircle, Edit, UserPlus, UserMinus } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ProfileEditModal } from "@/components/profile-edit-modal"
import { AvatarUpload } from "@/components/avatar-upload"

interface UserPost {
  id: string
  image_url: string
  species_name: string
  category: "bird" | "animal" | "plant"
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
}

export default function ProfilePage() {
  const { user, signOut, getAccessToken } = useAuth()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [userPosts, setUserPosts] = useState<UserPost[]>([])
  const [likedPosts, setLikedPosts] = useState<UserPost[]>([])
  const [stats, setStats] = useState<UserStats>({
    posts: 0,
    followers: 0,
    following: 0,
    speciesDiscovered: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAvatarUploadOpen, setIsAvatarUploadOpen] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchProfileData()
    }
  }, [user])

  const fetchProfileData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError("")
      
      console.log("Fetching profile data for user:", user.id)
      
      const response = await fetch(`/api/profile/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log("Profile API response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Profile API error response:", errorText)
        
        // Try to parse as JSON, fallback to text
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Profile data received:", data)

      setProfileData(data.profile)
      setUserPosts(data.posts)
      setStats(data.stats)
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError(error instanceof Error ? error.message : "Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  const fetchLikedPosts = async () => {
    if (!user) return

    try {
      const accessToken = getAccessToken()
      if (!accessToken) return

      // This would need a separate API endpoint for liked posts
      // For now, we'll show a placeholder
      setLikedPosts([])
    } catch (error) {
      console.error("Error fetching liked posts:", error)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      setError("")
      await signOut()
      router.push("/auth/signin")
    } catch (error) {
      console.error("Logout error:", error)
      setError("Failed to sign out. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleProfileUpdated = (updatedProfile: ProfileData) => {
    setProfileData(updatedProfile)
    // Also update the user context if needed
  }

  const handleAvatarUpdated = (avatarUrl: string) => {
    setProfileData(prev => prev ? { ...prev, avatar_url: avatarUrl } : null)
    // Optionally refresh the entire profile data
    fetchProfileData()
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Please sign in</h2>
            <p className="text-gray-500 mb-6">You need to be signed in to view your profile</p>
            <Link href="/auth/signin">
              <Button className="bg-green-600 hover:bg-green-700">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-green-800">Profile</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64 mb-4"></div>
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="text-center">
                          <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : error && !profileData ? (
          <div className="text-center py-12">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry Loading
            </Button>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profileData?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-2xl">
                        {profileData?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-green-600 hover:bg-green-700"
                      onClick={() => setIsAvatarUploadOpen(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
                      <h2 className="text-2xl font-bold text-gray-800">{profileData?.username}</h2>
                      {profileData?.full_name && (
                        <p className="text-lg text-gray-600">({profileData.full_name})</p>
                      )}
                    </div>

                    {profileData?.bio && <p className="text-gray-600 mb-4">{profileData.bio}</p>}

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

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="posts" className="flex items-center space-x-2">
                  <Grid3X3 className="w-4 h-4" />
                  <span>Posts ({stats.posts})</span>
                </TabsTrigger>
                <TabsTrigger value="liked" className="flex items-center space-x-2" onClick={fetchLikedPosts}>
                  <Heart className="w-4 h-4" />
                  <span>Liked</span>
                </TabsTrigger>
                <TabsTrigger value="following" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Following ({stats.following})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-6">
                {userPosts.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts yet</h3>
                      <p className="text-gray-500 mb-6">Share your first nature discovery with the community</p>
                      <Link href="/upload">
                        <Button className="bg-green-600 hover:bg-green-700">
                          <Camera className="w-4 h-4 mr-2" />
                          Upload Photo
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
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
              </TabsContent>

              <TabsContent value="liked" className="mt-6">
                <Card className="text-center py-12">
                  <CardContent>
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No liked posts yet</h3>
                    <p className="text-gray-500">Posts you like will appear here</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="following" className="mt-6">
                <Card className="text-center py-12">
                  <CardContent>
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Following {stats.following} users</h3>
                    <p className="text-gray-500">Discover more nature enthusiasts to follow</p>
                    <Link href="/explore">
                      <Button className="mt-4 bg-green-600 hover:bg-green-700">Explore Users</Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Avatar Upload Modal */}
      <AvatarUpload
        isOpen={isAvatarUploadOpen}
        onClose={() => setIsAvatarUploadOpen(false)}
        onAvatarUpdated={handleAvatarUpdated}
        currentAvatarUrl={profileData?.avatar_url}
      />
    </div>
  )
}
