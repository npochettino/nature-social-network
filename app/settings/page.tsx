"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [useMockAI, setUseMockAI] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("naturespot_use_mock_ai")
    setUseMockAI(stored === "true")
  }, [])

  const handleToggleMockAI = (checked: boolean) => {
    setUseMockAI(checked)
    localStorage.setItem("naturespot_use_mock_ai", checked.toString())
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

      <main className="max-w-2xl mx-auto px-4 py-6">
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
