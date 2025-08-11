import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: stats, error } = await supabase.rpc("get_translation_stats")

    if (error) {
      console.error("Translation stats error:", error)
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }

    // Get total cache size
    const { count: totalTranslations } = await supabase
      .from("translation_cache")
      .select("*", { count: "exact", head: true })

    // Get expired translations count
    const { count: expiredTranslations } = await supabase
      .from("translation_cache")
      .select("*", { count: "exact", head: true })
      .lt("expires_at", new Date().toISOString())

    return NextResponse.json({
      languageStats: stats || [],
      totalTranslations: totalTranslations || 0,
      expiredTranslations: expiredTranslations || 0,
      activeTranslations: (totalTranslations || 0) - (expiredTranslations || 0),
    })
  } catch (error) {
    console.error("Translation stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
