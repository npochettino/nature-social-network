"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Settings, Globe } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
]

const detectBrowserLanguage = (): string => {
  if (typeof window === "undefined") return "en"

  const browserLang = navigator.language || navigator.languages?.[0] || "en"
  const langCode = browserLang.split("-")[0].toLowerCase()

  // Check if detected language is supported
  const isSupported = SUPPORTED_LANGUAGES.some((lang) => lang.code === langCode)
  return isSupported ? langCode : "en"
}

export default function SettingsPage() {
  const { user, getAccessToken } = useAuth()
  const [useMockAI, setUseMockAI] = useState(false)
  const [preferredLanguage, setPreferredLanguage] = useState("en")
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("naturespot_use_mock_ai")
    setUseMockAI(stored === "true")

    if (user?.preferred_language) {
      setPreferredLanguage(user.preferred_language)
    } else {
      const detectedLang = detectBrowserLanguage()
      setPreferredLanguage(detectedLang)
    }
  }, [user])

  const handleToggleMockAI = (checked: boolean) => {
    setUseMockAI(checked)
    localStorage.setItem("naturespot_use_mock_ai", checked.toString())
  }

  const handleLanguageChange = async (languageCode: string) => {
    if (!user) return

    setIsUpdatingLanguage(true)
    try {
      const accessToken = getAccessToken()
      if (!accessToken) return

      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          preferred_language: languageCode,
        }),
      })

      if (response.ok) {
        setPreferredLanguage(languageCode)
        // Store in localStorage for immediate use
        localStorage.setItem("naturespot_preferred_language", languageCode)
      }
    } catch (error) {
      console.error("Error updating language preference:", error)
    } finally {
      setIsUpdatingLanguage(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-green-800">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Language Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="language-select">Preferred Language</Label>
              <Select value={preferredLanguage} onValueChange={handleLanguageChange} disabled={isUpdatingLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.nativeName}</span>
                        <span className="text-sm text-gray-500">({lang.name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Posts will be automatically translated to your preferred language when available
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Translation Feature</h3>
              <p className="text-sm text-blue-700">
                When enabled, post content will be automatically translated to{" "}
                {SUPPORTED_LANGUAGES.find((l) => l.code === preferredLanguage)?.name || "your preferred language"}.
                Original text will always be available.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>AI Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="mock-ai">Use Mock AI (for testing)</Label>
                <p className="text-sm text-gray-500">
                  Enable this to use mock species identification instead of real AI
                </p>
              </div>
              <Switch id="mock-ai" checked={useMockAI} onCheckedChange={handleToggleMockAI} />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">AI Configuration</h3>
              <p className="text-sm text-blue-700">
                {useMockAI
                  ? "Currently using mock AI responses for testing. Toggle off to use real Google Gemini AI."
                  : "Using Google Gemini AI for species identification. Make sure GOOGLE_GENERATIVE_AI_API_KEY is set in your environment variables."}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
