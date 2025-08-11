"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Upload, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface SpeciesIdentification {
  name: string
  scientificName: string
  category: "bird" | "animal" | "plant"
  habitat: string
  description: string
  conservationStatus?: string
  confidence: number
}

export default function UploadPage() {
  const { user, getAccessToken } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [caption, setCaption] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [identification, setIdentification] = useState<SpeciesIdentification | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    return () => {
      // Cleanup preview URL to prevent memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      // Reset loading states when component unmounts
      setIsAnalyzing(false)
      setIsUploading(false)
    }
  }, [previewUrl])

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      return "Please select an image file (JPG, PNG, GIF, etc.)"
    }

    // Check file size (max 10MB for mobile compatibility)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return "File size must be less than 10MB"
    }

    // Check if file is corrupted (basic check)
    if (file.size === 0) {
      return "Selected file appears to be empty or corrupted"
    }

    return null
  }, [])

  const processFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      // Clean up previous preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      try {
        // Create new preview URL
        const url = URL.createObjectURL(file)

        // Test if the URL is valid by creating an image element
        const testImage = new Image()
        testImage.onload = () => {
          // Image loaded successfully, set the preview
          setSelectedFile(file)
          setPreviewUrl(url)
          setIdentification(null)
          setError("")
        }
        testImage.onerror = () => {
          // Image failed to load, show error
          URL.revokeObjectURL(url)
          setError("Unable to process the selected image. Please try a different file.")
        }
        testImage.src = url
      } catch (err) {
        console.error("Error processing file:", err)
        setError("Failed to process the selected image. Please try again.")
      }
    },
    [previewUrl, validateFile],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
      if (e.target) {
        e.target.value = ""
      }
    },
    [processFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleChangePhoto = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl("")
    setIdentification(null)
    setError("")
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [previewUrl])

  const analyzeImage = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)

      // Check if we should use mock AI
      const useMockAI = localStorage.getItem("naturespot_use_mock_ai") === "true"
      const endpoint = useMockAI ? "/api/identify-mock" : "/api/identify"

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to identify species")
      }

      setIdentification({
        name: data.name,
        scientificName: data.scientificName,
        category: data.category,
        habitat: data.habitat,
        description: data.description,
        conservationStatus: data.conservationStatus,
        confidence: data.confidence,
      })
    } catch (error) {
      console.error("Identification error:", error)
      setError(error instanceof Error ? error.message : "Failed to identify species. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !identification || !user) return

    const accessToken = getAccessToken()
    if (!accessToken) {
      setError("Authentication required. Please sign in again.")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)
      formData.append("species", JSON.stringify(identification))
      formData.append("caption", caption)

      console.log("Uploading with access token:", {
        hasImage: !!selectedFile,
        imageSize: selectedFile.size,
        imageType: selectedFile.type,
        species: identification.name,
        userId: user.id,
        hasToken: !!accessToken,
      })

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      const result = await response.json()
      console.log("Upload response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to create post")
      }

      console.log("Post created successfully:", result)
      setUploadSuccess(true)

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      // Redirect to home after success
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      console.error("Upload error:", error)
      setError(error instanceof Error ? error.message : "Failed to upload post. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Post Shared!</h2>
            <p className="text-gray-600 mb-4">Your nature discovery has been added to the community feed.</p>
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700">View Feed</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-green-800">Share Your Discovery</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>Upload Photo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!previewUrl ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Drop your photo here or click to browse</p>
                  <p className="text-sm text-gray-500">
                    Upload photos of birds, animals, or plants for AI identification
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                      onError={() => {
                        setError("Failed to display image preview. Please try a different file.")
                        handleChangePhoto()
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleChangePhoto}
                    >
                      Change Photo
                    </Button>
                  </div>

                  {!identification && (
                    <Button
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        "Identify Species"
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Identification Results */}
          {identification && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Species Identified</span>
                  <Badge variant="secondary">{Math.round(identification.confidence * 100)}% confident</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-green-800 text-lg">{identification.name}</h3>
                      <p className="text-sm italic text-green-600">{identification.scientificName}</p>
                    </div>
                    <Badge
                      variant={
                        identification.category === "bird"
                          ? "default"
                          : identification.category === "animal"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {identification.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{identification.description}</p>
                  <p className="text-xs text-gray-600">
                    <strong>Habitat:</strong> {identification.habitat}
                  </p>
                  {identification.conservationStatus && (
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Conservation Status:</strong> {identification.conservationStatus}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Caption */}
          {identification && (
            <Card>
              <CardHeader>
                <CardTitle>Add Caption</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Share your experience or thoughts about this discovery..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          )}

          {/* Upload Button */}
          {identification && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-green-600 hover:bg-green-700 py-3"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing Post...
                </>
              ) : (
                "Share with Community"
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
