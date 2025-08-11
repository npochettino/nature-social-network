"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Camera,
  Search,
  Users,
  Sparkles,
  Eye,
  Zap,
  Globe,
  ArrowRight,
  Star,
  CheckCircle,
} from "lucide-react"
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

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="text-center hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardContent>
    </Card>
  )
}

function LandingPage() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedPosts()
  }, [])

  const fetchFeaturedPosts = async () => {
    try {
      setLoading(true)

      // Fetch some popular posts to showcase
      const { data: postsData, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .order("likes_count", { ascending: false })
        .limit(6)

      if (error) {
        console.error("Error fetching featured posts:", error)
        return
      }

      setFeaturedPosts(postsData || [])
    } catch (error) {
      console.error("Error in fetchFeaturedPosts:", error)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                NatureSpot
              </h1>
              <p className="text-xs text-gray-500">Discover • Share • Explore</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-gray-600 hover:text-green-600">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-3xl transform -translate-y-1/2"></div>
        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-green-200">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">AI-Powered Species Identification</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Discover the
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent block">
              Wonders of Nature
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join a community of nature enthusiasts. Share your discoveries, identify species with AI, and explore the
            incredible biodiversity around us.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl px-8 py-3 text-lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Exploring
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                size="lg"
                className="border-green-200 text-green-700 hover:bg-green-50 px-8 py-3 text-lg bg-transparent"
              >
                Learn More
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">10K+</div>
              <div className="text-sm text-gray-500">Species Identified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">50K+</div>
              <div className="text-sm text-gray-500">Photos Shared</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">5K+</div>
              <div className="text-sm text-gray-500">Nature Lovers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">95%</div>
              <div className="text-sm text-gray-500">AI Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Everything You Need to Explore Nature</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools and features designed to enhance your nature discovery journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-green-600" />}
              title="AI Species Identification"
              description="Upload any photo and get instant, accurate species identification powered by advanced AI technology."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-green-600" />}
              title="Community Driven"
              description="Connect with fellow nature enthusiasts, share discoveries, and learn from a passionate community."
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6 text-green-600" />}
              title="Global Database"
              description="Access information about species from around the world with detailed habitat and conservation data."
            />
            <FeatureCard
              icon={<Eye className="w-6 h-6 text-green-600" />}
              title="Beautiful Gallery"
              description="Showcase your nature photography in a stunning, organized gallery that highlights your discoveries."
            />
            <FeatureCard
              icon={<Bookmark className="w-6 h-6 text-green-600" />}
              title="Personal Collections"
              description="Save and organize your favorite discoveries into personal collections for easy reference."
            />
            <FeatureCard
              icon={<Star className="w-6 h-6 text-green-600" />}
              title="Achievement System"
              description="Earn badges and recognition as you contribute to the community and make new discoveries."
            />
          </div>
        </div>
      </section>

      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Recent Discoveries</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                See what our community has been discovering and sharing
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-0">
                      <div className="bg-gray-200 aspect-square rounded-t-lg"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden">
                        <img
                          src={post.image_url || "/placeholder.svg"}
                          alt={post.species_name}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge
                            variant={
                              post.category === "bird"
                                ? "default"
                                : post.category === "animal"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="bg-white/90 backdrop-blur-sm"
                          >
                            {post.category}
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
                            <h3 className="font-bold text-lg mb-1">{post.species_name}</h3>
                            <p className="text-sm italic opacity-90">{post.scientific_name}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={post.profiles.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {post.profiles.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-700">{post.profiles.username}</span>
                          </div>
                          <span className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</span>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.description}</p>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{post.likes_count}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.comments_count}</span>
                            </div>
                          </div>
                          {post.conservation_status && (
                            <Badge
                              variant={post.conservation_status === "Endangered" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {post.conservation_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                >
                  Join to See More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in just three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">1. Capture</h3>
              <p className="text-gray-600">Take a photo of any bird, animal, or plant you encounter in nature</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">2. Identify</h3>
              <p className="text-gray-600">Our AI instantly identifies the species and provides detailed information</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">3. Share</h3>
              <p className="text-gray-600">
                Share your discovery with the community and connect with fellow nature lovers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Nature Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of nature enthusiasts who are already discovering and sharing the wonders of our natural
            world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/auth/signup">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              >
                <Camera className="w-5 h-5 mr-2" />
                Create Free Account
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg bg-transparent"
              >
                Sign In
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-sm opacity-75">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Free to use</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>No ads</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Privacy focused</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Community driven</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">NatureSpot</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Connecting nature enthusiasts worldwide through AI-powered species identification and community sharing.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                  <span className="text-xs">f</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                  <span className="text-xs">t</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                  <span className="text-xs">in</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/auth/signup" className="hover:text-white transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">Mobile App</span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">API</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">Help Center</span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">Community</span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">Contact Us</span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NatureSpot. Made with ❤️ for nature lovers worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function AuthenticatedFeed() {
  const { user, isAuthenticated, loading: authLoading, getAccessToken } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPosts()
    }
  }, [authLoading, user, isAuthenticated])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && !authLoading) {
        fetchPosts()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Also listen for focus events as a fallback
    const handleFocus = () => {
      if (isAuthenticated && !authLoading) {
        fetchPosts()
      }
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [isAuthenticated, authLoading])

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

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return <LandingPage />
  }

  // Show authenticated user feed
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

export default function HomePage() {
  return <AuthenticatedFeed />
}
