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

    // Check if already saved
    const { data: existingSave } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single()

    if (existingSave) {
      // Unsave
      const { error } = await supabase.from("saved_posts").delete().eq("user_id", user.id).eq("post_id", postId)

      if (error) {
        return NextResponse.json({ error: "Failed to unsave post" }, { status: 500 })
      }

      return NextResponse.json({ saved: false })
    } else {
      // Save
      const { error } = await supabase.from("saved_posts").insert({ user_id: user.id, post_id: postId })

      if (error) {
        return NextResponse.json({ error: "Failed to save post" }, { status: 500 })
      }

      return NextResponse.json({ saved: true })
    }
  } catch (error) {
    console.error("Error in save/unsave:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
