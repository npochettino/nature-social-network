import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const supabase = createServerClient()
    const userId = params.userId

    console.log("Fetching profile for user:", userId)

    // Get user profile with better error handling
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    console.log("Profile found:", profile)

    // Get user's posts with error handling
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(`
        id,
        image_url,
        species_name,
        category,
        likes_count,
        comments_count,
        created_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (postsError) {
      console.error("Posts error:", postsError)
      // Don't fail the whole request, just return empty posts
    }

    console.log("Posts found:", posts?.length || 0)

    // Get user stats with individual error handling
    let postsCount = 0
    let followersCount = 0
    let followingCount = 0
    let uniqueSpeciesCount = 0

    try {
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
      postsCount = count || 0
    } catch (error) {
      console.error("Error counting posts:", error)
    }

    try {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId)
      followersCount = count || 0
    } catch (error) {
      console.error("Error counting followers:", error)
    }

    try {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId)
      followingCount = count || 0
    } catch (error) {
      console.error("Error counting following:", error)
    }

    try {
      const { data: speciesData } = await supabase
        .from("posts")
        .select("species_name")
        .eq("user_id", userId)

      const uniqueSpecies = new Set(speciesData?.map((post) => post.species_name) || [])
      uniqueSpeciesCount = uniqueSpecies.size
    } catch (error) {
      console.error("Error counting species:", error)
    }

    const result = {
      profile,
      posts: posts || [],
      stats: {
        posts: postsCount,
        followers: followersCount,
        following: followingCount,
        speciesDiscovered: uniqueSpeciesCount,
      },
    }

    console.log("Returning profile data:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}
