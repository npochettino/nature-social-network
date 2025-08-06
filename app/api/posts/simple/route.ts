import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const speciesDataString = formData.get("species") as string
    const caption = formData.get("caption") as string
    const userId = formData.get("userId") as string

    console.log("Received form data:", {
      hasImage: !!imageFile,
      hasSpecies: !!speciesDataString,
      hasUserId: !!userId,
      imageType: imageFile?.type,
      imageSize: imageFile?.size,
    })

    if (!imageFile || !speciesDataString || !userId) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          received: {
            image: !!imageFile,
            species: !!speciesDataString,
            userId: !!userId,
          },
        },
        { status: 400 },
      )
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
      user_id: userId,
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
    console.error("Error in POST /api/posts/simple:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
