import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await request.json()
    const postId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await supabase.from("likes").delete().eq("user_id", userId).eq("post_id", postId)

      if (error) {
        return NextResponse.json({ error: "Failed to unlike post" }, { status: 500 })
      }

      return NextResponse.json({ liked: false })
    } else {
      // Like
      const { error } = await supabase.from("likes").insert({ user_id: userId, post_id: postId })

      if (error) {
        return NextResponse.json({ error: "Failed to like post" }, { status: 500 })
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Error in like/unlike:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
