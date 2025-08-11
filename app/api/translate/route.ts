import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Mock translations for development/fallback
const mockTranslations: Record<string, Record<string, string>> = {
  en: {
    es: "This is a mock Spanish translation",
    fr: "This is a mock French translation",
    de: "This is a mock German translation",
    it: "This is a mock Italian translation",
    pt: "This is a mock Portuguese translation",
    ru: "This is a mock Russian translation",
    ja: "This is a mock Japanese translation",
    ko: "This is a mock Korean translation",
    zh: "This is a mock Chinese translation",
    ar: "This is a mock Arabic translation",
    hi: "This is a mock Hindi translation",
  },
}

const chunkText = (text: string, maxLength = 400): string[] => {
  if (text.length <= maxLength) {
    return [text]
  }

  const chunks: string[] = []
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)

  let currentChunk = ""

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()
    if (currentChunk.length + trimmedSentence.length + 1 <= maxLength) {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + ".")
        currentChunk = trimmedSentence
      } else {
        // If single sentence is too long, split by words
        const words = trimmedSentence.split(" ")
        let wordChunk = ""
        for (const word of words) {
          if (wordChunk.length + word.length + 1 <= maxLength) {
            wordChunk += (wordChunk ? " " : "") + word
          } else {
            if (wordChunk) chunks.push(wordChunk)
            wordChunk = word
          }
        }
        if (wordChunk) currentChunk = wordChunk
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + ".")
  }

  return chunks
}

const translateWithMyMemory = async (text: string, targetLanguage: string, sourceLanguage = "en"): Promise<string> => {
  const actualSourceLanguage = "en"

  // Check if text exceeds MyMemory's limit and chunk if necessary
  const chunks = chunkText(text, 400) // MyMemory limit is 500, use 400 for safety

  if (chunks.length === 1) {
    // Single chunk, translate normally
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${actualSourceLanguage}|${targetLanguage}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "NatureSpot-App",
        },
        signal: AbortSignal.timeout(10000),
      },
    )

    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText
    }

    throw new Error(`MyMemory translation failed: ${data.responseDetails || "Unknown error"}`)
  } else {
    // Multiple chunks, translate each and combine
    const translatedChunks: string[] = []

    for (const chunk of chunks) {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${actualSourceLanguage}|${targetLanguage}`,
        {
          method: "GET",
          headers: {
            "User-Agent": "NatureSpot-App",
          },
          signal: AbortSignal.timeout(10000),
        },
      )

      if (!response.ok) {
        throw new Error(`MyMemory API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        translatedChunks.push(data.responseData.translatedText)
      } else {
        throw new Error(`MyMemory translation failed: ${data.responseDetails || "Unknown error"}`)
      }

      // Add small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return translatedChunks.join(" ")
  }
}

const translateWithLibreTranslate = async (
  text: string,
  targetLanguage: string,
  sourceLanguage = "en",
): Promise<string> => {
  const actualSourceLanguage = "en"

  // Using the correct LibreTranslate endpoint
  const response = await fetch("https://libretranslate.com/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: actualSourceLanguage,
      target: targetLanguage,
      format: "text",
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error(`LibreTranslate API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.translatedText) {
    return data.translatedText
  }

  throw new Error("LibreTranslate translation failed")
}

const getMockTranslation = (text: string, targetLanguage: string, sourceLanguage = "en"): string => {
  const translations = mockTranslations[sourceLanguage]
  if (translations && translations[targetLanguage]) {
    return `[${targetLanguage.toUpperCase()}] ${text} (Mock translation)`
  }
  return `[${targetLanguage.toUpperCase()}] ${text} (Untranslated)`
}

const translateText = async (text: string, targetLanguage: string, sourceLanguage = "en"): Promise<string> => {
  // If text is too short, don't translate
  if (text.length < 3) {
    return text
  }

  const actualSourceLanguage = "en"

  // Try to get from cache first
  try {
    const supabase = createServerClient()
    const { data: cachedTranslation } = await supabase
      .from("translation_cache")
      .select("translated_text, usage_count")
      .eq("source_text", text)
      .eq("source_language", actualSourceLanguage)
      .eq("target_language", targetLanguage)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (cachedTranslation) {
      // Update usage count
      await supabase
        .from("translation_cache")
        .update({
          usage_count: cachedTranslation.usage_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("source_text", text)
        .eq("source_language", actualSourceLanguage)
        .eq("target_language", targetLanguage)

      console.log("Using cached translation")
      return cachedTranslation.translated_text
    }
  } catch (error) {
    console.warn("Cache lookup failed:", error)
  }

  // Try multiple translation services with fallbacks
  const translationServices = [
    { name: "MyMemory", fn: translateWithMyMemory },
    { name: "LibreTranslate", fn: translateWithLibreTranslate },
  ]

  let lastError: Error | null = null
  let translatedText: string | null = null

  for (const service of translationServices) {
    try {
      console.log(`Attempting translation with ${service.name}...`)
      translatedText = await service.fn(text, targetLanguage, actualSourceLanguage)
      console.log(`Translation successful with ${service.name}`)
      break
    } catch (error) {
      console.warn(`${service.name} translation failed:`, error)
      lastError = error as Error
      continue
    }
  }

  // If all services fail, use mock translation
  if (!translatedText) {
    console.log("All translation services failed, using mock translation")
    translatedText = getMockTranslation(text, targetLanguage, actualSourceLanguage)
  }

  // Store in cache (only if it's not a mock translation)
  if (translatedText && !translatedText.includes("Mock translation")) {
    try {
      const supabase = createServerClient()
      await supabase.from("translation_cache").upsert(
        {
          source_text: text,
          source_language: actualSourceLanguage,
          target_language: targetLanguage,
          translated_text: translatedText,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          usage_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "source_text,source_language,target_language",
        },
      )
    } catch (error) {
      console.warn("Cache storage error:", error)
    }
  }

  return translatedText
}

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

    const { text, targetLanguage, sourceLanguage } = await request.json()

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: "Text and target language are required" }, { status: 400 })
    }

    const finalSourceLanguage = "en"

    // Check if target language is the same as source, no need to translate
    if (finalSourceLanguage === targetLanguage) {
      return NextResponse.json({
        translatedText: text,
        sourceLanguage: finalSourceLanguage,
        targetLanguage,
        originalText: text,
        cached: false,
        service: "none",
      })
    }

    // Translate the text
    const translatedText = await translateText(text, targetLanguage, finalSourceLanguage)

    return NextResponse.json({
      translatedText,
      sourceLanguage: finalSourceLanguage,
      targetLanguage,
      originalText: text,
      cached: false,
      service: "translation-api",
    })
  } catch (error) {
    console.error("Translation API error:", error)

    // Return a more user-friendly error message
    const errorMessage = error instanceof Error ? error.message : "Translation service temporarily unavailable"

    return NextResponse.json(
      {
        error: errorMessage,
        translatedText: null,
        fallback: true,
      },
      { status: 500 },
    )
  }
}
