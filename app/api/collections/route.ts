import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    console.log("Fetching collections for user:", user.id, { category, search, page, limit })

    // Build the query
    let query = supabase
      .from("saved_posts")
      .select(`
        id,
        created_at,
        posts (
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
          created_at,
          profiles:user_id (
            username,
            avatar_url
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    const { data: savedPosts, error } = await query

    if (error) {
      console.error("Error fetching saved posts:", error)
      return NextResponse.json({ error: "Failed to fetch saved posts" }, { status: 500 })
    }

    // Filter and transform the data
    let collections = savedPosts
      ?.filter((item) => item.posts) // Only include items with valid posts
      .map((item) => ({
        id: item.id,
        savedAt: item.created_at,
        post: {
          id: item.posts.id,
          image_url: item.posts.image_url,
          species_name: item.posts.species_name,
          scientific_name: item.posts.scientific_name,
          category: item.posts.category,
          habitat: item.posts.habitat,
          description: item.posts.description,
          conservation_status: item.posts.conservation_status,
          confidence: item.posts.confidence,
          caption: item.posts.caption,
          likes_count: item.posts.likes_count,
          comments_count: item.posts.comments_count,
          created_at: item.posts.created_at,
          author: {
            username: item.posts.profiles?.username || "Unknown",
            avatar_url: item.posts.profiles?.avatar_url,
          },
        },
      })) || []

    // Apply client-side filtering
    if (category && category !== "all") {
      collections = collections.filter((item) => item.post.category === category)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      collections = collections.filter(
        (item) =>
          item.post.species_name.toLowerCase().includes(searchLower) ||
          item.post.scientific_name.toLowerCase().includes(searchLower) ||
          item.post.habitat.toLowerCase().includes(searchLower)
      )
    }

    // Get category counts
    const { data: categoryData } = await supabase
      .from("saved_posts")
      .select(`
        posts (category)
      `)
      .eq("user_id", user.id)

    const categoryCounts = {
      all: categoryData?.length || 0,
      bird: categoryData?.filter((item) => item.posts?.category === "bird").length || 0,
      animal: categoryData?.filter((item) => item.posts?.category === "animal").length || 0,
      plant: categoryData?.filter((item) => item.posts?.category === "plant").length || 0,
    }

    return NextResponse.json({
      collections,
      categoryCounts,
      pagination: {
        page,
        limit,
        total: collections.length,
      },
    })
  } catch (error) {
    console.error("Error in collections API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
