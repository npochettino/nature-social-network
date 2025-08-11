"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Bookmark, Languages, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/hooks/use-translation"

interface PostCardProps {
  post: any
  onLike?: (postId: string) => void
  onSave?: (postId: string) => void
  formatTimeAgo: (dateString: string) => string
}

export function PostCard({ post, onLike, onSave, formatTimeAgo }: PostCardProps) {
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
    <Card className="overflow-hidden">
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
          <div className="flex items-center space-x-2">
            <Badge
              variant={post.category === "bird" ? "default" : post.category === "animal" ? "secondary" : "outline"}
            >
              {post.category}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTranslate}
              disabled={isTranslating}
              className="text-gray-500 hover:text-green-600"
            >
              {showTranslation ? <RotateCcw className="w-4 h-4" /> : <Languages className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Post Image */}
        <div className="relative">
          <img
            src={post.image_url || "/placeholder.svg"}
            alt={displayPost.species_name}
            className="w-full h-64 sm:h-80 object-cover"
          />
          {showTranslation && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                <Languages className="w-3 h-3 mr-1" />
                Translated
              </Badge>
            </div>
          )}
        </div>

        {/* Species Information */}
        <div className="p-4 bg-green-50 border-t">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-green-800">{displayPost.species_name}</h3>
              <p className="text-sm italic text-green-600">{displayPost.scientific_name}</p>
            </div>
            {post.conservation_status && (
              <Badge variant={post.conservation_status === "Endangered" ? "destructive" : "secondary"}>
                {post.conservation_status}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-700 mb-2">{displayPost.description}</p>
          <p className="text-xs text-gray-600">
            <strong>Habitat:</strong> {displayPost.habitat}
          </p>
        </div>

        {/* Post Actions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike?.(post.id)}
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
              onClick={() => onSave?.(post.id)}
              className={post.is_saved ? "text-blue-500" : ""}
            >
              <Bookmark className={`w-5 h-5 ${post.is_saved ? "fill-current" : ""}`} />
            </Button>
          </div>
          {displayPost.caption && <p className="text-sm">{displayPost.caption}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
