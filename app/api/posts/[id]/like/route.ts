import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const supabase = createServerClient()

    // Verify the user with the provided token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const postId = params.id

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId)

      if (error) {
        return NextResponse.json({ error: "Failed to unlike post" }, { status: 500 })
      }

      return NextResponse.json({ liked: false })
    } else {
      // Like
      const { error } = await supabase.from("likes").insert({ user_id: user.id, post_id: postId })

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
