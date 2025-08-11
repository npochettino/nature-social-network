import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sourceText = searchParams.get("text")
    const sourceLang = searchParams.get("source") || "auto"
    const targetLang = searchParams.get("target")

    if (!sourceText || !targetLang) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Look for cached translation
    const { data: cached, error } = await supabase
      .from("translation_cache")
      .select("*")
      .eq("source_text", sourceText)
      .eq("source_language", sourceLang)
      .eq("target_language", targetLang)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Cache lookup error:", error)
      return NextResponse.json({ error: "Cache lookup failed" }, { status: 500 })
    }

    if (cached) {
      // Update usage count
      await supabase
        .from("translation_cache")
        .update({
          usage_count: cached.usage_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cached.id)

      return NextResponse.json({
        translatedText: cached.translated_text,
        sourceLanguage: cached.source_language,
        targetLanguage: cached.target_language,
        originalText: cached.source_text,
        cached: true,
      })
    }

    return NextResponse.json({ cached: false }, { status: 404 })
  } catch (error) {
    console.error("Translation cache error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sourceText, sourceLanguage, targetLanguage, translatedText } = await request.json()

    if (!sourceText || !targetLanguage || !translatedText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Store translation in cache
    const { data, error } = await supabase
      .from("translation_cache")
      .upsert(
        {
          source_text: sourceText,
          source_language: sourceLanguage || "auto",
          target_language: targetLanguage,
          translated_text: translatedText,
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        },
        {
          onConflict: "source_text,source_language,target_language",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Cache storage error:", error)
      return NextResponse.json({ error: "Failed to cache translation" }, { status: 500 })
    }

    return NextResponse.json({ success: true, cached: data })
  } catch (error) {
    console.error("Translation cache storage error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Clean up expired translations
export async function DELETE() {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.from("translation_cache").delete().lt("expires_at", new Date().toISOString())

    if (error) {
      console.error("Cache cleanup error:", error)
      return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Expired translations cleaned up" })
  } catch (error) {
    console.error("Translation cache cleanup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
