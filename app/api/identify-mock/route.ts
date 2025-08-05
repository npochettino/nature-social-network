import { type NextRequest, NextResponse } from "next/server"

// Mock identification service for testing
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock responses based on common scenarios
    const mockIdentifications = [
      {
        success: true,
        name: "American Robin",
        scientificName: "Turdus migratorius",
        category: "bird",
        habitat:
          "Gardens, parks, yards, golf courses, fields, and pastures. Prefers areas with short grass for foraging and nearby trees for nesting.",
        description:
          "A large songbird with a round belly, long legs, and fairly long tail. American Robins are gray-brown birds with warm orange underparts and dark heads. In flight, a white patch on the lower belly and under the tail can be conspicuous. Males are more vibrant than females.",
        conservationStatus: "Least Concern",
        confidence: 0.92,
      },
      {
        success: true,
        name: "Monarch Butterfly",
        scientificName: "Danaus plexippus",
        category: "animal",
        habitat:
          "Open areas including meadows, fields, roadsides, and gardens. Requires milkweed plants for reproduction.",
        description:
          "Large butterfly with distinctive orange wings marked by black veins and borders. Males have distinctive black scent patches on their hindwings. Famous for their incredible multi-generational migration spanning thousands of miles.",
        conservationStatus: "Endangered",
        confidence: 0.88,
      },
      {
        success: true,
        name: "Eastern Red Oak",
        scientificName: "Quercus rubra",
        category: "plant",
        habitat:
          "Mixed and deciduous forests, particularly in well-drained soils. Common in eastern North America from southern Maine to Georgia.",
        description:
          "Large deciduous tree reaching 60-75 feet tall. Leaves have 7-11 pointed lobes with bristle tips. Acorns mature in two years and are important food source for wildlife. Fall foliage ranges from brown to red.",
        conservationStatus: "Least Concern",
        confidence: 0.85,
      },
      {
        success: true,
        name: "Red-tailed Hawk",
        scientificName: "Buteo jamaicensis",
        category: "bird",
        habitat:
          "Open woodlands, prairie groves, mountains, plains, roadsides, parks, and broken woodland. One of the most adaptable hawks in North America.",
        description:
          "Large hawk with broad, rounded wings and short, wide tail. Adults have distinctive rusty-red tail visible from above. Excellent eyesight allows them to spot prey from great distances. Known for their distinctive screaming call.",
        conservationStatus: "Least Concern",
        confidence: 0.9,
      },
    ]

    // Return a random mock identification
    const randomIndex = Math.floor(Math.random() * mockIdentifications.length)
    return NextResponse.json(mockIdentifications[randomIndex])
  } catch (error) {
    console.error("Mock identification error:", error)
    return NextResponse.json(
      {
        error: "Failed to identify species",
      },
      { status: 500 },
    )
  }
}
