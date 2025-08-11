"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Languages, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/hooks/use-translation"
import { SUPPORTED_LANGUAGES } from "@/lib/language-utils"

const TEST_POSTS = [
  {
    species_name: "American Robin",
    description: "A common bird found throughout North America, known for its distinctive red breast and melodic song.",
    caption: "Spotted this beautiful robin in my backyard this morning!",
    habitat: "Gardens, parks, and woodlands",
  },
  {
    species_name: "Monarch Butterfly",
    description: "Famous for their incredible migration journey spanning thousands of miles across North America.",
    caption: "Amazing to see these butterflies during their migration season.",
    habitat: "Meadows, fields, and gardens with milkweed plants",
  },
  {
    species_name: "Red Oak Tree",
    description: "A large deciduous tree native to eastern North America, valued for its wood and autumn foliage.",
    caption: "This magnificent oak has been standing here for over 100 years.",
    habitat: "Forests, parks, and urban areas",
  },
]

export default function TestTranslationPage() {
  const { translate, translatePost, isTranslating, error, preferredLanguage } = useTranslation()
  const [testText, setTestText] = useState("")
  const [targetLanguage, setTargetLanguage] = useState(preferredLanguage)
  const [translationResult, setTranslationResult] = useState<string | null>(null)
  const [selectedTestPost, setSelectedTestPost] = useState(0)
  const [translatedTestPost, setTranslatedTestPost] = useState<any>(null)
  const [testResults, setTestResults] = useState<Array<{ test: string; status: "success" | "error"; message: string }>>(
    [],
  )

  const handleTextTranslation = async () => {
    if (!testText.trim()) return

    const result = await translate(testText, targetLanguage)
    setTranslationResult(result)
  }

  const handlePostTranslation = async () => {
    const result = await translatePost(TEST_POSTS[selectedTestPost], targetLanguage)
    setTranslatedTestPost(result)
  }

  const runAllTests = async () => {
    setTestResults([])
    const results: Array<{ test: string; status: "success" | "error"; message: string }> = []

    // Test 1: Simple text translation
    try {
      const result = await translate("Hello, world!", "es")
      results.push({
        test: "Simple Text Translation",
        status: result ? "success" : "error",
        message: result ? `Translated to: "${result}"` : "Translation failed",
      })
    } catch (err) {
      results.push({
        test: "Simple Text Translation",
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      })
    }

    // Test 2: Post content translation
    try {
      const result = await translatePost(TEST_POSTS[0], "fr")
      results.push({
        test: "Post Content Translation",
        status: result ? "success" : "error",
        message: result ? "Post translated successfully" : "Post translation failed",
      })
    } catch (err) {
      results.push({
        test: "Post Content Translation",
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      })
    }

    // Test 3: Multiple language support
    const testLanguages = ["es", "fr", "de", "ja"]
    for (const lang of testLanguages) {
      try {
        const result = await translate("Nature is beautiful", lang)
        results.push({
          test: `Translation to ${SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.name}`,
          status: result ? "success" : "error",
          message: result ? `Result: "${result}"` : "Translation failed",
        })
      } catch (err) {
        results.push({
          test: `Translation to ${SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.name}`,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    setTestResults(results)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-green-800">Translation Testing</h1>
          </div>
          <Badge variant="secondary">
            <Languages className="w-4 h-4 mr-1" />
            Preferred: {SUPPORTED_LANGUAGES.find((l) => l.code === preferredLanguage)?.name}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Manual Text Translation Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Languages className="w-5 h-5" />
              <span>Manual Text Translation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-text">Text to Translate</Label>
              <Textarea
                id="test-text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to translate..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-language">Target Language</Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleTextTranslation} disabled={isTranslating || !testText.trim()}>
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4 mr-2" />
                  Translate Text
                </>
              )}
            </Button>

            {translationResult && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Translation Result:</h4>
                <p className="text-green-700">{translationResult}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Post Translation Test */}
        <Card>
          <CardHeader>
            <CardTitle>Post Content Translation Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-post">Test Post</Label>
              <Select
                value={selectedTestPost.toString()}
                onValueChange={(value) => setSelectedTestPost(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEST_POSTS.map((post, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {post.species_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Original Post</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Species:</strong> {TEST_POSTS[selectedTestPost].species_name}
                  </p>
                  <p>
                    <strong>Description:</strong> {TEST_POSTS[selectedTestPost].description}
                  </p>
                  <p>
                    <strong>Caption:</strong> {TEST_POSTS[selectedTestPost].caption}
                  </p>
                  <p>
                    <strong>Habitat:</strong> {TEST_POSTS[selectedTestPost].habitat}
                  </p>
                </div>
              </div>

              {translatedTestPost && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Translated Post</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Species:</strong> {translatedTestPost.species_name}
                    </p>
                    <p>
                      <strong>Description:</strong> {translatedTestPost.description}
                    </p>
                    <p>
                      <strong>Caption:</strong> {translatedTestPost.caption}
                    </p>
                    <p>
                      <strong>Habitat:</strong> {translatedTestPost.habitat}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handlePostTranslation} disabled={isTranslating}>
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Translating Post...
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4 mr-2" />
                  Translate Post
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Automated Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Automated Translation Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runAllTests} disabled={isTranslating}>
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>

            {testResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Test Results:</h4>
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.status === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {result.status === "success" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium">{result.test}</span>
                      <Badge variant={result.status === "success" ? "default" : "destructive"}>{result.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use Translation Feature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">1. Set Your Language Preference</h4>
                <p className="text-blue-700">
                  Go to Settings → Language Settings to choose your preferred language. Posts will be automatically
                  translated to this language when you click the translate button.
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">2. Translate Posts</h4>
                <p className="text-green-700">
                  On any post in your feed, click the language icon (🌐) in the top-right corner to translate the
                  content. Click the rotate icon to switch back to the original.
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">3. Cached Translations</h4>
                <p className="text-purple-700">
                  Translations are cached for 30 days to improve performance. The same content won't need to be
                  translated again during this period.
                </p>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">4. Supported Languages</h4>
                <p className="text-orange-700">
                  We support {SUPPORTED_LANGUAGES.length} languages including English, Spanish, French, German, Italian,
                  Portuguese, Russian, Japanese, Korean, Chinese, Arabic, and Hindi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
