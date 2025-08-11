"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Languages, RotateCcw } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

interface FeaturedPostCardProps {
  post: any
  formatTimeAgo: (dateString: string) => string
}

export function FeaturedPostCard({ post, formatTimeAgo }: FeaturedPostCardProps) {
  const { translatePost, isTranslating } = useTranslation()
  const [translatedPost, setTranslatedPost] = useState<any>(null)
  const [showTranslation, setShowTranslation] = useState(false)

  const handleTranslate = async () => {
    if (showTranslation) {
      setShowTranslation(false)
      return
    }

    if (!translatedPost) {
      const translated = await translatePost(post)
      setTranslatedPost(translated)
    }
    setShowTranslation(true)
  }

  const displayPost = showTranslation && translatedPost ? translatedPost : post

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-0">
        <div className="relative overflow-hidden">
          <img
            src={post.image_url || "/placeholder.svg"}
            alt={displayPost.species_name}
            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 flex items-center space-x-2">
            <Badge
              variant={post.category === "bird" ? "default" : post.category === "animal" ? "secondary" : "outline"}
              className="bg-white/90 backdrop-blur-sm"
            >
              {post.category}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTranslate}
              disabled={isTranslating}
              className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-green-600 h-6 w-6 p-0"
            >
              {showTranslation ? <RotateCcw className="w-3 h-3" /> : <Languages className="w-3 h-3" />}
            </Button>
          </div>
          {showTranslation && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                <Languages className="w-3 h-3 mr-1" />
                Translated
              </Badge>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
              <h3 className="font-bold text-lg mb-1">{displayPost.species_name}</h3>
              <p className="text-sm italic opacity-90">{displayPost.scientific_name}</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={post.profiles.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{post.profiles.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700">{post.profiles.username}</span>
            </div>
            <span className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{displayPost.description}</p>

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
  )
}
