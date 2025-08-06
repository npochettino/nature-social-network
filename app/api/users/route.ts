import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const currentUserId = searchParams.get("currentUserId")

    console.log("Fetching users:", { search, page, limit, currentUserId })

    // Build the query
    let query = supabase
      .from("profiles")
      .select(`
        id,
        username,
        full_name,
        bio,
        avatar_url,
        created_at
      `)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    // Apply search filter
    if (search) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    // Exclude current user
    if (currentUserId) {
      query = query.neq("id", currentUserId)
    }

    const { data: users, error } = await query

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Get user stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get post count
        const { count: postsCount } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Get followers count
        const { count: followersCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", user.id)

        // Get following count
        const { count: followingCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", user.id)

        // Get unique species count
        const { data: speciesData } = await supabase
          .from("posts")
          .select("species_name")
          .eq("user_id", user.id)

        const uniqueSpecies = new Set(speciesData?.map((post) => post.species_name) || [])

        // Check if current user is following this user
        let isFollowing = false
        if (currentUserId) {
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", currentUserId)
            .eq("following_id", user.id)
            .single()

          isFollowing = !!followData
        }

        return {
          ...user,
          stats: {
            posts: postsCount || 0,
            followers: followersCount || 0,
            following: followingCount || 0,
            speciesDiscovered: uniqueSpecies.size,
          },
          isFollowing,
        }
      })
    )

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total: usersWithStats.length,
      },
    })
  } catch (error) {
    console.error("Error in users API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
