import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const supabase = createServerClient()
    const userId = params.userId
    const { searchParams } = new URL(request.url)
    const currentUserId = searchParams.get("currentUserId")

    console.log("Fetching user profile:", userId)

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's posts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(`
        id,
        image_url,
        species_name,
        scientific_name,
        category,
        habitat,
        description,
        conservation_status,
        confidence,
        caption,
        likes_count,
        comments_count,
        created_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12)

    if (postsError) {
      console.error("Posts error:", postsError)
    }

    // Get user stats
    const { count: postsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    const { count: followersCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId)

    const { count: followingCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId)

    // Get unique species count
    const { data: speciesData } = await supabase
      .from("posts")
      .select("species_name")
      .eq("user_id", userId)

    const uniqueSpecies = new Set(speciesData?.map((post) => post.species_name) || [])

    // Check if current user is following this user
    let isFollowing = false
    if (currentUserId && currentUserId !== userId) {
      const { data: followData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", userId)
        .single()

      isFollowing = !!followData
    }

    return NextResponse.json({
      profile,
      posts: posts || [],
      stats: {
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0,
        speciesDiscovered: uniqueSpecies.size,
      },
      isFollowing,
      isOwnProfile: currentUserId === userId,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
