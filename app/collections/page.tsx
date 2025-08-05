"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Grid3X3, Bookmark } from "lucide-react"
import Link from "next/link"

interface SavedPost {
  id: string
  imageUrl: string
  species: {
    name: string
    category: "bird" | "animal" | "plant"
  }
  savedAt: string
}

export default function CollectionsPage() {
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading saved posts
    setTimeout(() => {
      setSavedPosts([
        {
          id: "2",
          imageUrl: "/placeholder.svg?height=300&width=300",
          species: {
            name: "Monarch Butterfly",
            category: "animal",
          },
          savedAt: "2 days ago",
        },
        {
          id: "4",
          imageUrl: "/placeholder.svg?height=300&width=300",
          species: {
            name: "Blue Jay",
            category: "bird",
          },
          savedAt: "1 week ago",
        },
        {
          id: "5",
          imageUrl: "/placeholder.svg?height=300&width=300",
          species: {
            name: "Common Sunflower",
            category: "plant",
          },
          savedAt: "2 weeks ago",
        },
        {
          id: "6",
          imageUrl: "/placeholder.svg?height=300&width=300",
          species: {
            name: "Red Fox",
            category: "animal",
          },
          savedAt: "3 weeks ago",
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

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
            <h1 className="text-xl font-bold text-green-800">My Collections</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : savedPosts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">No saved posts yet</h2>
              <p className="text-gray-500 mb-6">Start exploring and save posts to build your nature collection</p>
              <Link href="/">
                <Button className="bg-green-600 hover:bg-green-700">Explore Feed</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Saved Posts</h2>
                <p className="text-gray-600">{savedPosts.length} discoveries saved</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Grid View
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedPosts.map((post) => (
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
                      <div className="absolute bottom-2 right-2">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-1">
                          <Bookmark className="w-4 h-4 text-blue-500 fill-current" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-gray-800 truncate">{post.species.name}</h3>
                      <p className="text-xs text-gray-500">Saved {post.savedAt}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
