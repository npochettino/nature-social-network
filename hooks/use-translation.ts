"use client"

import { useState, useCallback } from "react"
import { translateText, translatePostContent } from "@/lib/translation-service"
import { useAuth } from "./use-auth"
import { getUserPreferredLanguage } from "@/lib/language-utils"

interface UseTranslationReturn {
  translate: (text: string, targetLanguage?: string) => Promise<string | null>
  translatePost: (post: any, targetLanguage?: string) => Promise<any>
  isTranslating: boolean
  error: string | null
  preferredLanguage: string
}

export const useTranslation = (): UseTranslationReturn => {
  const { getAccessToken } = useAuth()
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const translate = useCallback(
    async (text: string, targetLanguage?: string): Promise<string | null> => {
      setIsTranslating(true)
      setError(null)

      try {
        const accessToken = getAccessToken()
        const result = await translateText(text, targetLanguage, "auto", accessToken)
        return result?.translatedText || null
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Translation failed"

        // Don't show error for fallback translations (mock translations)
        if (errorMessage.includes("Mock translation") || errorMessage.includes("Untranslated")) {
          setError(null)
        } else {
          setError("Translation service temporarily unavailable. Showing fallback translation.")
        }

        return null
      } finally {
        setIsTranslating(false)
      }
    },
    [getAccessToken],
  )

  const translatePost = useCallback(
    async (post: any, targetLanguage?: string) => {
      setIsTranslating(true)
      setError(null)

      try {
        const accessToken = getAccessToken()
        const translations = await translatePostContent(post, targetLanguage, accessToken)
        return translations ? { ...post, ...translations } : post
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Translation failed"

        // Don't show error for fallback translations
        if (errorMessage.includes("Mock translation") || errorMessage.includes("Untranslated")) {
          setError(null)
        } else {
          setError("Translation service temporarily unavailable. Some content may show fallback translations.")
        }

        return post
      } finally {
        setIsTranslating(false)
      }
    },
    [getAccessToken],
  )

  const preferredLanguage = getUserPreferredLanguage()

  return {
    translate,
    translatePost,
    isTranslating,
    error,
    preferredLanguage,
  }
}
