import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString("base64")

    // Use Google Gemini to identify the species with improved prompt
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert naturalist and biologist. Analyze this image carefully and identify any bird, animal, or plant species visible.

IMPORTANT: Only respond with valid JSON in exactly this format:

For successful identification:
{
  "success": true,
  "name": "Common English name",
  "scientificName": "Genus species",
  "category": "bird" | "animal" | "plant",
  "habitat": "Detailed habitat description",
  "description": "Detailed description including key identifying features, behavior, and interesting facts",
  "conservationStatus": "Conservation status (e.g., Least Concern, Near Threatened, Vulnerable, Endangered, Critically Endangered, or null if unknown)",
  "confidence": 0.85
}

For failed identification:
{
  "success": false,
  "error": "Cannot identify species in this image"
}

Guidelines:
- Be very specific about species identification
- Include confidence level (0.0 to 1.0)
- Only identify if you're reasonably confident (>0.6)
- Focus on the most prominent species in the image
- Provide rich, educational information
- If multiple species are visible, identify the most prominent one`,
            },
            {
              type: "image",
              image: base64Image,
              mimeType: file.type,
            },
          ],
        },
      ],
      maxTokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent responses
    })

    console.log("AI Response:", text)

    // Clean and parse the AI response
    let cleanedText = text.trim()

    // Remove any markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "")

    // Try to extract JSON if there's extra text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedText = jsonMatch[0]
    }

    let identification
    try {
      identification = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError)
      console.error("Raw AI Response:", text)
      return NextResponse.json(
        {
          error: "AI response could not be parsed. Please try again.",
        },
        { status: 500 },
      )
    }

    // Validate response structure
    if (!identification.success) {
      return NextResponse.json(
        {
          error: identification.error || "Could not identify species in this image",
        },
        { status: 400 },
      )
    }

    // Validate required fields
    const requiredFields = ["name", "scientificName", "category", "habitat", "description", "confidence"]
    for (const field of requiredFields) {
      if (!identification[field]) {
        return NextResponse.json(
          {
            error: `Invalid AI response: missing ${field}`,
          },
          { status: 500 },
        )
      }
    }

    // Validate category
    if (!["bird", "animal", "plant"].includes(identification.category)) {
      return NextResponse.json(
        {
          error: "Invalid species category",
        },
        { status: 500 },
      )
    }

    // Validate confidence
    if (
      typeof identification.confidence !== "number" ||
      identification.confidence < 0 ||
      identification.confidence > 1
    ) {
      identification.confidence = 0.7 // Default confidence
    }

    return NextResponse.json(identification)
  } catch (error) {
    console.error("Species identification error:", error)
    return NextResponse.json(
      {
        error: "Failed to identify species. Please try again.",
      },
      { status: 500 },
    )
  }
}
