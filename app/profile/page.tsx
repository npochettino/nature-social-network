"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Settings, Grid3X3, Heart, Camera, Users, Award, LogOut, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface UserPost {
  id: string
  imageUrl: string
  species: {
    name: string
    category: "bird" | "animal" | "plant"
  }
  likes: number
  createdAt: string
}

interface UserStats {
  posts: number
  followers: number
  following: number
  speciesDiscovered: number
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [userPosts, setUserPosts] = useState<UserPost[]>([])
  const [stats, setStats] = useState<UserStats>({
    posts: 0,
    followers: 0,
    following: 0,
    speciesDiscovered: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setUserPosts([
        {
          id: "1",
          imageUrl: "/placeholder.svg?height=300&width=300",
          species: {
            name: "Northern Cardinal",
            category: "bird",
          },
          likes: 24,
          createdAt: "2 hours ago",
        },
        {
          id: "7",
          imageUrl: "/placeholder.svg?height=300&width=300",
          species: {
            name: "White Oak",
            category: "plant",
          },
          likes: 15,
          createdAt: "1 day ago",
        },
        {
          id: "8",
          imageUrl: "/placeholder.svg?height=300&width=300",
          species: {
            name: "Eastern Gray Squirrel",
            category: "animal",
          },
          likes: 32,
          createdAt: "3 days ago",
        },
      ])

      setStats({
        posts: 12,
        followers: 156,
        following: 89,
        speciesDiscovered: 28,
      })

      setLoading(false)
    }, 1000)
  }, [])

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

  if (!user) return null

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

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{user.username}</h2>
                <p className="text-gray-600 mb-4">Nature enthusiast & wildlife photographer</p>

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
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Award className="w-3 h-3" />
                    <span>Bird Spotter</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Camera className="w-3 h-3" />
                    <span>Nature Photographer</span>
                  </Badge>
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
              <span>Posts</span>
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Liked</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Following</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : userPosts.length === 0 ? (
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
                          src={post.imageUrl || "/placeholder.svg"}
                          alt={post.species.name}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={
                              post.species.category === "bird"
                                ? "default"
                                : post.species.category === "animal"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {post.species.category}
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                            <Heart className="w-3 h-3 text-white" />
                            <span className="text-xs text-white">{post.likes}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm text-gray-800 truncate">{post.species.name}</h3>
                        <p className="text-xs text-gray-500">{post.createdAt}</p>
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
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No liked posts</h3>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
