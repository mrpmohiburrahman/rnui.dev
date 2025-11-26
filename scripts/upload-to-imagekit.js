const ImageKit = require("imagekit");
const fs = require('fs').promises;
const path = require('path');

// Initialize ImageKit
// These will be populated from environment variables or passed directly
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function findVideoFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const subFiles = await findVideoFiles(fullPath);
            files.push(...subFiles);
        } else if (entry.name.toLowerCase().endsWith('.mp4')) {
            files.push(fullPath);
        }
    }
    return files;
}

async function uploadToImageKit(filePath) {
    try {
        const fileName = path.basename(filePath);
        // Create a folder path relative to public/
        // e.g., /Users/.../public/demo/buttons/btn.mp4 -> demo/buttons/
        const relativePath = path.relative(path.join(__dirname, '../public'), path.dirname(filePath));
        
        console.log(`Uploading ${fileName} to folder /${relativePath}...`);

        const fileBuffer = await fs.readFile(filePath);

        return new Promise((resolve, reject) => {
            imagekit.upload({
                file: fileBuffer, // required
                fileName: fileName, // required
                folder: relativePath, // optional
                useUniqueFileName: false, // Keep original names
                tags: ["demo-video"]
            }, function(error, result) {
                if(error) {
                    console.error(`❌ Failed to upload ${fileName}:`, error.message);
                    resolve({ success: false, file: filePath, error: error });
                } else {
                    console.log(`✅ Uploaded ${fileName}: ${result.url}`);
                    resolve({ success: true, file: filePath, url: result.url, result: result });
                }
            });
        });

    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return { success: false, file: filePath, error: error };
    }
}

async function main() {
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
        console.error("❌ Missing ImageKit credentials. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables.");
        process.exit(1);
    }

    const demoDir = path.join(__dirname, '../public/demo');
    console.log('🔍 Finding video files...');
    const videoFiles = await findVideoFiles(demoDir);
    console.log(`📁 Found ${videoFiles.length} video files\n`);

    const results = [];
    // Process in chunks to avoid overwhelming the API/network
    const CHUNK_SIZE = 5;
    for (let i = 0; i < videoFiles.length; i += CHUNK_SIZE) {
        const chunk = videoFiles.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(chunk.map(file => uploadToImageKit(file)));
        results.push(...chunkResults);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n📊 Summary:');
    console.log(`✓ Successfully uploaded: ${successful}`);
    if (failed > 0) {
        console.log(`✗ Failed: ${failed}`);
    }
}

main().catch(console.error);
