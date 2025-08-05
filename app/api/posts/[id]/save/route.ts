import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await request.json()
    const postId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Check if already saved
    const { data: existingSave } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single()

    if (existingSave) {
      // Unsave
      const { error } = await supabase.from("saved_posts").delete().eq("user_id", userId).eq("post_id", postId)

      if (error) {
        return NextResponse.json({ error: "Failed to unsave post" }, { status: 500 })
      }

      return NextResponse.json({ saved: false })
    } else {
      // Save
      const { error } = await supabase.from("saved_posts").insert({ user_id: userId, post_id: postId })

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
