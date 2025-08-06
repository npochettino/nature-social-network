"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Bookmark, Share2, Camera, Search, Users } from 'lucide-react'
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { UserMenu } from "@/components/user-menu"

interface Post {
  id: string
  user_id: string
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
  profiles: {
    username: string
    avatar_url?: string
  }
  is_liked?: boolean
  is_saved?: boolean
}

export default function HomePage() {
  const { user, isAuthenticated, loading: authLoading, getAccessToken } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      fetchPosts()
    }
  }, [authLoading, user])

  const fetchPosts = async () => {
    try {
      setLoading(true)

      const query = supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20)

      const { data: postsData, error } = await query

      if (error) {
        console.error("Error fetching posts:", error)
        return
      }

      // If user is authenticated, check likes and saves
      if (user && postsData) {
        const postIds = postsData.map((post) => post.id)

        // Get user's likes
        const { data: likes } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds)

        // Get user's saves
        const { data: saves } = await supabase
          .from("saved_posts")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds)

        const likedPostIds = new Set(likes?.map((like) => like.post_id) || [])
        const savedPostIds = new Set(saves?.map((save) => save.post_id) || [])

        const postsWithUserData = postsData.map((post) => ({
          ...post,
          is_liked: likedPostIds.has(post.id),
          is_saved: savedPostIds.has(post.id),
        }))

        setPosts(postsWithUserData)
      } else {
        setPosts(postsData || [])
      }
    } catch (error) {
      console.error("Error in fetchPosts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    if (!user) return

    const accessToken = getAccessToken()
    if (!accessToken) {
      console.error("No access token available")
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const { liked } = await response.json()

      if (response.ok) {
        setPosts(
          posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  is_liked: liked,
                  likes_count: liked ? post.likes_count + 1 : post.likes_count - 1,
                }
              : post,
          ),
        )
      }
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const handleSave = async (postId: string) => {
    if (!user) return

    const accessToken = getAccessToken()
    if (!accessToken) {
      console.error("No access token available")
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const { saved } = await response.json()

      if (response.ok) {
        setPosts(posts.map((post) => (post.id === postId ? { ...post, is_saved: saved } : post)))
      }
    } catch (error) {
      console.error("Error saving post:", error)
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">NatureSpot</CardTitle>
            <p className="text-gray-600">Discover and share the wonders of nature</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/signin">
              <Button className="w-full bg-green-600 hover:bg-green-700">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" className="w-full bg-transparent">
                Create Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-8 h-8 text-green-600" />
            <h1 className="text-xl font-bold text-green-800">NatureSpot</h1>
          </div>

          <nav className="flex items-center space-x-4">
            <Link href="/upload">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Camera className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="ghost" size="sm">
                <Users className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="ghost" size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">No posts yet</h2>
              <p className="text-gray-500 mb-6">Be the first to share a nature discovery!</p>
              <Link href="/upload">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Link href={`/users/${post.user_id}`}>
                        <Avatar className="cursor-pointer hover:ring-2 hover:ring-green-500 transition-all">
                          <AvatarImage src={post.profiles.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{post.profiles.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <Link href={`/users/${post.user_id}`}>
                          <p className="font-semibold text-sm hover:text-green-600 transition-colors cursor-pointer">
                            {post.profiles.username}
                          </p>
                        </Link>
                        <p className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        post.category === "bird" ? "default" : post.category === "animal" ? "secondary" : "outline"
                      }
                    >
                      {post.category}
                    </Badge>
                  </div>

                  {/* Post Image */}
                  <div className="relative">
                    <img
                      src={post.image_url || "/placeholder.svg"}
                      alt={post.species_name}
                      className="w-full h-64 sm:h-80 object-cover"
                    />
                  </div>

                  {/* Species Information */}
                  <div className="p-4 bg-green-50 border-t">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-green-800">{post.species_name}</h3>
                        <p className="text-sm italic text-green-600">{post.scientific_name}</p>
                      </div>
                      {post.conservation_status && (
                        <Badge variant={post.conservation_status === "Endangered" ? "destructive" : "secondary"}>
                          {post.conservation_status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{post.description}</p>
                    <p className="text-xs text-gray-600">
                      <strong>Habitat:</strong> {post.habitat}
                    </p>
                  </div>

                  {/* Post Actions */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={post.is_liked ? "text-red-500" : ""}
                        >
                          <Heart className={`w-5 h-5 mr-1 ${post.is_liked ? "fill-current" : ""}`} />
                          {post.likes_count}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-5 h-5 mr-1" />
                          {post.comments_count}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-5 h-5" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSave(post.id)}
                        className={post.is_saved ? "text-blue-500" : ""}
                      >
                        <Bookmark className={`w-5 h-5 ${post.is_saved ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                    {post.caption && <p className="text-sm">{post.caption}</p>}
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
