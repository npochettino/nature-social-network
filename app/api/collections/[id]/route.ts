import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const savedPostId = params.id

    // Delete the saved post
    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("id", savedPostId)
      .eq("user_id", user.id) // Ensure user can only delete their own saved posts

    if (error) {
      console.error("Error removing from collection:", error)
      return NextResponse.json({ error: "Failed to remove from collection" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in remove collection API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
