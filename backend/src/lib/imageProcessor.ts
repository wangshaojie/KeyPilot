import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
// __dirname is src/lib when running with tsx, so go up two levels to reach project root
const PROJECT_ROOT = join(__dirname, '../..')
const IMAGE_DIR = join(PROJECT_ROOT, 'public/images')

// Ensure image directory exists
mkdirSync(IMAGE_DIR, { recursive: true })

export interface ProcessedImage {
  localUrl: string
  originalUrl: string
}

/**
 * Download image from URL, convert to webp, delete original, return local webp path
 */
export async function downloadAndConvertToWebp(imageUrl: string): Promise<ProcessedImage> {
  const id = uuidv4()
  const webpPath = join(IMAGE_DIR, `${id}.webp`)

  console.log(`[ImageProcessor] Downloading image from: ${imageUrl}`)

  try {
    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    const inputBuffer = Buffer.from(buffer)

    // Convert to webp and save
    await sharp(inputBuffer)
      .webp({ quality: 85 })
      .toFile(webpPath)

    console.log(`[ImageProcessor] Saved webp to: ${webpPath}`)

    // Return the public URL path (relative)
    const localUrl = `/images/${id}.webp`

    return {
      localUrl,
      originalUrl: imageUrl,
    }
  } catch (error) {
    console.error(`[ImageProcessor] Error processing image:`, error)
    throw error
  }
}

/**
 * Process multiple images and return local URLs
 */
export async function processImages(imageUrls: string[]): Promise<string[]> {
  const processedImages = await Promise.all(
    imageUrls.map(url => downloadAndConvertToWebp(url))
  )

  // Delete original URLs (they expire in 1 hour anyway)
  for (const img of processedImages) {
    console.log(`[ImageProcessor] Original image can be deleted: ${img.originalUrl}`)
    // Note: we can't actually delete the remote image, but we don't use it anymore
  }

  return processedImages.map(img => img.localUrl)
}
