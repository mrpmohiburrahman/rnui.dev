// scripts/generateThumbnails.ts

const fs = require("fs-extra")
const path = require("path")
const { exec } = require("child_process")
const util = require("util")

const execPromise = util.promisify(exec)

// Define paths
const DEMO_DIR = path.join(__dirname, "..", "public", "demo")
const THUMBNAILS_DIR = path.join(__dirname, "..", "public", "thumbnails")

// Supported video extensions
const VIDEO_EXTENSIONS: string[] = [".mp4", ".mov", ".avi", ".mkv", ".webm"]

/**
 * Recursively traverse a directory and return all video file paths
 * @param dir - Directory to traverse
 * @returns Array of video file paths
 */
async function getAllVideoFiles(dir: string): Promise<string[]> {
  let files: string[] = []

  const items = await fs.readdir(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)

    if (item.isDirectory()) {
      const subFiles = await getAllVideoFiles(fullPath)
      files = files.concat(subFiles)
    } else if (
      item.isFile() &&
      VIDEO_EXTENSIONS.includes(path.extname(item.name).toLowerCase())
    ) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Generate thumbnail for a single video file
 * @param videoPath - Full path to the video file
 * @param thumbnailPath - Full path where the thumbnail will be saved
 */
async function generateThumbnail(
  videoPath: string,
  thumbnailPath: string
): Promise<void> {
  // Ensure the directory exists
  await fs.ensureDir(path.dirname(thumbnailPath))

  // FFmpeg command to take a screenshot at 2 seconds
  const command = `ffmpeg -ss 00:00:02 -i "${videoPath}" -frames:v 1 -q:v 2 "${thumbnailPath}"`

  try {
    await execPromise(command)
    console.log(`Thumbnail created: ${thumbnailPath}`)
  } catch (error) {
    console.error(`Error creating thumbnail for ${videoPath}:`, error)
  }
}

/**
 * Main function to generate thumbnails
 */
async function main(): Promise<void> {
  try {
    const videoFiles = await getAllVideoFiles(DEMO_DIR)

    console.log(`Found ${videoFiles.length} video(s).`)

    for (const videoPath of videoFiles) {
      // Determine the relative path from DEMO_DIR
      const relativePath = path.relative(DEMO_DIR, videoPath)

      // Change the extension to .jpg for the thumbnail
      const thumbnailRelativePath = relativePath.replace(
        path.extname(relativePath),
        ".jpg"
      )

      const thumbnailFullPath = path.join(THUMBNAILS_DIR, thumbnailRelativePath)

      await generateThumbnail(videoPath, thumbnailFullPath)
    }

    console.log("All thumbnails have been generated successfully.")
  } catch (error) {
    console.error("An error occurred:", error)
  }
}

// Execute the main function
main()
