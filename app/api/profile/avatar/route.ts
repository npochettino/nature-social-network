import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const avatarFile = formData.get("avatar") as File

    if (!avatarFile) {
      return NextResponse.json({ error: "No avatar file provided" }, { status: 400 })
    }

    // Validate file type
    if (!avatarFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (avatarFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Delete old avatar if exists
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()

    if (currentProfile?.avatar_url) {
      // Extract file path from URL
      const urlParts = currentProfile.avatar_url.split("/")
      const fileName = urlParts[urlParts.length - 1]
      if (fileName && fileName !== "placeholder.svg") {
        await supabase.storage.from("avatars").remove([`${user.id}/${fileName}`])
      }
    }

    // Upload new avatar
    const fileExt = avatarFile.name.split(".").pop() || "jpg"
    const fileName = `avatar-${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    console.log("Uploading avatar:", { fileName, filePath, fileSize: avatarFile.size })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Avatar upload error:", uploadError)
      return NextResponse.json(
        {
          error: `Failed to upload avatar: ${uploadError.message}`,
        },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath)

    console.log("Avatar uploaded successfully, public URL:", publicUrl)

    // Update profile with new avatar URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Profile update error:", updateError)
      // Clean up uploaded file if profile update fails
      await supabase.storage.from("avatars").remove([filePath])
      return NextResponse.json(
        {
          error: `Failed to update profile: ${updateError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      avatar_url: publicUrl,
      profile: updatedProfile,
    })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
