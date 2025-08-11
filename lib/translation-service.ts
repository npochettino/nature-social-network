import { getUserPreferredLanguage } from "./language-utils"

interface TranslationResult {
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  originalText: string
}

interface TranslationCache {
  [key: string]: {
    result: TranslationResult
    timestamp: number
  }
}

// In-memory cache for translations (fallback for database cache)
const translationCache: TranslationCache = {}
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

const getCacheKey = (text: string, targetLang: string, sourceLang = "auto"): string => {
  return `${sourceLang}-${targetLang}-${text.substring(0, 100)}`
}

const checkDatabaseCache = async (
  text: string,
  targetLanguage: string,
  sourceLanguage = "auto",
): Promise<TranslationResult | null> => {
  try {
    const response = await fetch(
      `/api/translations/cache?text=${encodeURIComponent(text)}&source=${sourceLanguage}&target=${targetLanguage}`,
    )

    if (response.ok) {
      const data = await response.json()
      if (data.cached) {
        return data
      }
    }
    return null
  } catch (error) {
    console.error("Database cache check error:", error)
    return null
  }
}

const storeDatabaseCache = async (
  sourceText: string,
  sourceLanguage: string,
  targetLanguage: string,
  translatedText: string,
): Promise<void> => {
  try {
    await fetch("/api/translations/cache", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceText,
        sourceLanguage,
        targetLanguage,
        translatedText,
      }),
    })
  } catch (error) {
    console.error("Database cache storage error:", error)
  }
}

export const translateText = async (
  text: string,
  targetLanguage?: string,
  sourceLanguage = "auto",
  accessToken?: string,
): Promise<TranslationResult | null> => {
  try {
    // Use user's preferred language if not specified
    const finalTargetLanguage = targetLanguage || getUserPreferredLanguage()

    // Don't translate if target is English and no source specified (assume English)
    if (finalTargetLanguage === "en" && sourceLanguage === "auto") {
      return null
    }

    // Check in-memory cache first
    const cacheKey = getCacheKey(text, finalTargetLanguage, sourceLanguage)
    const cached = translationCache[cacheKey]

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.result
    }

    // Check database cache
    const dbCached = await checkDatabaseCache(text, finalTargetLanguage, sourceLanguage)
    if (dbCached) {
      // Store in memory cache for faster access
      translationCache[cacheKey] = {
        result: dbCached,
        timestamp: Date.now(),
      }
      return dbCached
    }

    // Make API request
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({
        text,
        targetLanguage: finalTargetLanguage,
        sourceLanguage,
      }),
    })

    if (!response.ok) {
      throw new Error("Translation request failed")
    }

    const result: TranslationResult = await response.json()

    // Cache the result in memory
    translationCache[cacheKey] = {
      result,
      timestamp: Date.now(),
    }

    // Store in database cache (async, don't wait)
    storeDatabaseCache(text, sourceLanguage, finalTargetLanguage, result.translatedText)

    return result
  } catch (error) {
    console.error("Translation service error:", error)
    return null
  }
}

export const translatePostContent = async (
  post: {
    species_name: string
    description: string
    caption?: string
  },
  targetLanguage?: string,
  accessToken?: string,
): Promise<{
  species_name?: string
  description?: string
  caption?: string
} | null> => {
  try {
    const translations: any = {}

    // Translate species name
    if (post.species_name) {
      const result = await translateText(post.species_name, targetLanguage, "auto", accessToken)
      if (result) {
        translations.species_name = result.translatedText
      }
    }

    // Translate description
    if (post.description) {
      const result = await translateText(post.description, targetLanguage, "auto", accessToken)
      if (result) {
        translations.description = result.translatedText
      }
    }

    // Translate caption if exists
    if (post.caption) {
      const result = await translateText(post.caption, targetLanguage, "auto", accessToken)
      if (result) {
        translations.caption = result.translatedText
      }
    }

    return Object.keys(translations).length > 0 ? translations : null
  } catch (error) {
    console.error("Post translation error:", error)
    return null
  }
}

// Clear old cache entries periodically
export const clearOldTranslations = () => {
  const now = Date.now()
  Object.keys(translationCache).forEach((key) => {
    if (now - translationCache[key].timestamp > CACHE_DURATION) {
      delete translationCache[key]
    }
  })
}

export const cleanupDatabaseCache = async (): Promise<void> => {
  try {
    await fetch("/api/translations/cache", {
      method: "DELETE",
    })
  } catch (error) {
    console.error("Database cache cleanup error:", error)
  }
}

// Auto-clear cache every hour
if (typeof window === "undefined") {
  setInterval(clearOldTranslations, 60 * 60 * 1000)
  // Clean database cache daily
  setInterval(cleanupDatabaseCache, 24 * 60 * 60 * 1000)
}
