import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
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

    const targetUserId = params.userId

    if (user.id === targetUserId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", targetUserId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .single()

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)

      if (error) {
        console.error("Unfollow error:", error)
        return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 })
      }

      return NextResponse.json({ following: false, message: "Unfollowed successfully" })
    } else {
      // Follow
      const { error } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: targetUserId,
      })

      if (error) {
        console.error("Follow error:", error)
        return NextResponse.json({ error: "Failed to follow user" }, { status: 500 })
      }

      return NextResponse.json({ following: true, message: "Followed successfully" })
    }
  } catch (error) {
    console.error("Error in follow/unfollow:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
