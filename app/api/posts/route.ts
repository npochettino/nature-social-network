import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const userId = searchParams.get("userId")

    let query = supabase
      .from("posts")
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (category) {
      query = query.eq("category", category)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Error in GET /api/posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Create Supabase client with the user's token
    const supabase = createServerClient()

    // Verify the user with the provided token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    console.log("Authenticated user:", user.id)

    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const speciesDataString = formData.get("species") as string
    const caption = formData.get("caption") as string

    console.log("Received form data:", {
      hasImage: !!imageFile,
      hasSpecies: !!speciesDataString,
      imageType: imageFile?.type,
      imageSize: imageFile?.size,
    })

    if (!imageFile || !speciesDataString) {
      return NextResponse.json({ error: "Missing required fields: image and species data" }, { status: 400 })
    }

    let speciesData
    try {
      speciesData = JSON.parse(speciesDataString)
    } catch (parseError) {
      console.error("Species data parse error:", parseError)
      return NextResponse.json({ error: "Invalid species data format" }, { status: 400 })
    }

    // Validate image file
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Upload image to Supabase Storage
    const fileExt = imageFile.name.split(".").pop() || "jpg"
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `posts/${fileName}`

    console.log("Uploading image:", { fileName, filePath, fileSize: imageFile.size })

    const { data: uploadData, error: uploadError } = await supabase.storage.from("images").upload(filePath, imageFile, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        {
          error: `Failed to upload image: ${uploadError.message}`,
          details: uploadError,
        },
        { status: 500 },
      )
    }

    console.log("Image uploaded successfully:", uploadData)

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath)
    console.log("Public URL:", publicUrl)

    // Create post record
    const postData = {
      user_id: user.id,
      image_url: publicUrl,
      image_path: filePath,
      species_name: speciesData.name,
      scientific_name: speciesData.scientificName,
      category: speciesData.category,
      habitat: speciesData.habitat,
      description: speciesData.description,
      conservation_status: speciesData.conservationStatus || null,
      confidence: Number(speciesData.confidence) || 0.5,
      caption: caption || null,
    }

    console.log("Creating post with data:", postData)

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert(postData)
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .single()

    if (postError) {
      console.error("Post creation error:", postError)
      // Clean up uploaded image if post creation fails
      await supabase.storage.from("images").remove([filePath])
      return NextResponse.json(
        {
          error: `Failed to create post: ${postError.message}`,
          details: postError,
        },
        { status: 500 },
      )
    }

    console.log("Post created successfully:", post)
    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error in POST /api/posts:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
