export const SUPPORTED_LANGUAGES = [
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

export const detectBrowserLanguage = (): string => {
  if (typeof window === "undefined") return "en"

  const browserLang = navigator.language || navigator.languages?.[0] || "en"
  const langCode = browserLang.split("-")[0].toLowerCase()

  // Check if detected language is supported
  const isSupported = SUPPORTED_LANGUAGES.some((lang) => lang.code === langCode)
  return isSupported ? langCode : "en"
}

export const getUserPreferredLanguage = (): string => {
  // Check localStorage first
  const stored = localStorage.getItem("naturespot_preferred_language")
  if (stored && SUPPORTED_LANGUAGES.some((lang) => lang.code === stored)) {
    return stored
  }

  // Fall back to browser detection
  return detectBrowserLanguage()
}

export const getLanguageName = (code: string): string => {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code)
  return lang?.nativeName || "English"
}
