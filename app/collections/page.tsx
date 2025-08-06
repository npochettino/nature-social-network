"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowLeft, Grid3X3, Bookmark, Search, Filter, MoreVertical, Trash2, ExternalLink, Heart, MessageCircle, Calendar, User, AlertCircle, Loader2 } from 'lucide-react'
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

interface CollectionItem {
  id: string
  savedAt: string
  post: {
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
    author: {
      username: string
      avatar_url?: string
    }
  }
}

interface CategoryCounts {
  all: number
  bird: number
  animal: number
  plant: number
}

export default function CollectionsPage() {
  const { user, getAccessToken, isAuthenticated, loading: authLoading } = useAuth()
  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({
    all: 0,
    bird: 0,
    animal: 0,
    plant: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchCollections()
    }
  }, [authLoading, isAuthenticated, selectedCategory, searchQuery])

  const fetchCollections = async () => {
    if (!user) return

    const accessToken = getAccessToken()
    if (!accessToken) {
      setError("Authentication required")
      return
    }

    try {
      setLoading(true)
      setError("")

      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.append("category", selectedCategory)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/collections?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch collections")
      }

      const data = await response.json()
      setCollections(data.collections)
      setCategoryCounts(data.categoryCounts)
    } catch (error) {
      console.error("Error fetching collections:", error)
      setError(error instanceof Error ? error.message : "Failed to load collections")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromCollection = async (collectionId: string) => {
    const accessToken = getAccessToken()
    if (!accessToken) return

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        setCollections((prev) => prev.filter((item) => item.id !== collectionId))
        // Update category counts
        setCategoryCounts((prev) => ({
          ...prev,
          all: prev.all - 1,
        }))
      }
    } catch (error) {
      console.error("Error removing from collection:", error)
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
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`
    return `${Math.floor(diffInWeeks / 4)}mo ago`
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Sign in to view collections</h2>
            <p className="text-gray-500 mb-6">You need to be signed in to see your saved posts</p>
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
              <h1 className="text-xl font-bold text-green-800">My Collections</h1>
              <p className="text-sm text-gray-600">{categoryCounts.all} saved discoveries</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
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

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search your collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <span>All ({categoryCounts.all})</span>
            </TabsTrigger>
            <TabsTrigger value="bird" className="flex items-center space-x-2">
              <span>Birds ({categoryCounts.bird})</span>
            </TabsTrigger>
            <TabsTrigger value="animal" className="flex items-center space-x-2">
              <span>Animals ({categoryCounts.animal})</span>
            </TabsTrigger>
            <TabsTrigger value="plant" className="flex items-center space-x-2">
              <span>Plants ({categoryCounts.plant})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="bg-gray-200 aspect-square rounded-t-lg mb-4"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Bookmark className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-600 mb-3">
                {searchQuery || selectedCategory !== "all" ? "No matching collections" : "No saved posts yet"}
              </h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : "Start exploring and save posts to build your nature collection. Saved posts will appear here."}
              </p>
              {!searchQuery && selectedCategory === "all" && (
                <Link href="/">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Search className="w-4 h-4 mr-2" />
                    Explore Feed
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collections.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={item.post.image_url || "/placeholder.svg"}
                      alt={item.post.species_name}
                      className="w-full aspect-square object-cover"
                    />
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant={
                          item.post.category === "bird"
                            ? "default"
                            : item.post.category === "animal"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {item.post.category}
                      </Badge>
                    </div>

                    {/* Actions Menu */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/post/${item.post.id}`} className="cursor-pointer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Post
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveFromCollection(item.id)}
                            className="text-red-600 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Saved indicator */}
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-blue-500 rounded-full p-1.5">
                        <Bookmark className="w-3 h-3 text-white fill-current" />
                      </div>
                    </div>

                    {/* Post stats */}
                    <div className="absolute bottom-3 left-3 flex items-center space-x-3">
                      <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                        <Heart className="w-3 h-3 text-white" />
                        <span className="text-xs text-white">{item.post.likes_count}</span>
                      </div>
                      <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3 text-white" />
                        <span className="text-xs text-white">{item.post.comments_count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Post Info */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">
                        {item.post.species_name}
                      </h3>
                      <p className="text-sm italic text-gray-600 mb-2">{item.post.scientific_name}</p>
                      
                      {item.post.conservation_status && (
                        <Badge
                          variant={item.post.conservation_status === "Endangered" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {item.post.conservation_status}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">{item.post.description}</p>

                    {/* Author and Date */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={item.post.author.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{item.post.author.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>by {item.post.author.username}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Saved {formatTimeAgo(item.savedAt)}</span>
                      </div>
                    </div>

                    {item.post.caption && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600 italic">"{item.post.caption}"</p>
                      </div>
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
