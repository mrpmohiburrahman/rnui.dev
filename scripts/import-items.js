#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { ulid } = require('ulid');
const sharp = require('sharp');

// Configuration
const AUTHOR = "Enzo Manuel Mangano ( Reactiive )";
const TWITTER_ID = "reactiive_";
const LINKEDIN_ID = "enzomanuelmangano";
const GITHUB_ID = "enzomanuelmangano";
const SOURCE_BASE = "https://github.com/enzomanuelmangano/demos/tree/main/src/animations";

// Existing categories
const CATEGORIES = [
  'Accordions', 'Arcsliders', 'Bottom Sheets', 'Buttons', 'Carousels', 
  'Charts', 'Circular-progress-bars', 'Dropdowns', 'Fullapps', 'Headers',
  'Lists', 'Loaders', 'Onboardings', 'Parallaxes', 'Pickers', 'Sliders',
  'Tabbars', 'Misc'
];

function formatCaption(folderName) {
  // Remove hyphens and capitalize first letter of each word
  return folderName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function determineCategory(folderName) {
  const lowerName = folderName.toLowerCase();
  
  // Button categories
  if (lowerName.includes('button') || lowerName.includes('fab')) {
    return 'Buttons';
  }
  
  // Carousel categories
  if (lowerName.includes('carousel')) {
    return 'Carousels';
  }
  
  // List categories
  if (lowerName.includes('list') || lowerName.includes('drag-to-sort') || lowerName.includes('stack')) {
    return 'Lists';
  }
  
  // Chart categories
  if (lowerName.includes('chart') || lowerName.includes('graph')) {
    return 'Charts';
  }
  
  // Tab bar categories
  if (lowerName.includes('tab') || lowerName.includes('bar') && !lowerName.includes('slider')) {
    return 'Tabbars';
  }
  
  // Slider/Picker categories
  if (lowerName.includes('slider') || lowerName.includes('picker')) {
    return 'Sliders';
  }
    
  // Scroll categories
  if (lowerName.includes('scroll') && !lowerName.includes('carousel')) {
    return 'Sliders';
  }
  
  // Onboarding categories
  if (lowerName.includes('onboarding')) {
    return 'Onboardings';
  }
  
  // Parallax categories
  if (lowerName.includes('parallax') || lowerName.includes('3d')) {
    return 'Parallaxes';
  }
  
  // Loader/Animation categories
  if (lowerName.includes('loader') || lowerName.includes('loading')) {
    return 'Loaders';
  }
  
  // Bottom sheet categories
  if (lowerName.includes('sheet') || lowerName.includes('modal') || lowerName.includes('drawer')) {
    return 'Bottom Sheets';
  }
  
  // Default to Misc
  return 'Misc';
}

async function convertWebpToAvif(webpPath, avifPath) {
  await sharp(webpPath)
    .avif({ quality: 80, effort: 6 })
    .toFile(avifPath);
}

async function processItem(folderName, index, baseTime) {
  const downloadsPath = path.join(__dirname, '../downloads', folderName);
  const videoPath = path.join(downloadsPath, 'video.mp4');
  const posterPath = path.join(downloadsPath, 'poster.webp');
  
  // Check if files exist
  try {
    await fs.access(videoPath);
    await fs.access(posterPath);
  } catch (error) {
    console.log(`⚠️  Skipping ${folderName}: missing video.mp4 or poster.webp`);
    return null;
  }
  
  const category = determineCategory(folderName);
  const caption = formatCaption(folderName);
  const categoryLower = category.toLowerCase();
  const id = ulid();
  
  // Create timestamp incremented by index
  const created_at = new Date(baseTime.getTime() + (index * 1000)).toISOString();
  
  // Define destination paths
  const videoDestPath = path.join(__dirname, '../public/demo', categoryLower, `${folderName}_enzo_manuel_mangano_reactiive.mp4`);
  const thumbnailDestPath = path.join(__dirname, '../public/thumbnails', categoryLower, `${folderName}_enzo_manuel_mangano_reactiive.avif`);
  
  // Ensure directories exist
  await fs.mkdir(path.dirname(videoDestPath), { recursive: true });
  await fs.mkdir(path.dirname(thumbnailDestPath), { recursive: true });
  
  // Copy video
  await fs.copyFile(videoPath, videoDestPath);
  console.log(`✓ Copied video: ${folderName}`);
  
  // Convert and copy thumbnail
  await convertWebpToAvif(posterPath, thumbnailDestPath);
  console.log(`✓ Converted thumbnail: ${folderName}`);
  
  // Generate item object
  const item = {
    id,
    caption,
    videoSrc: `demo/${categoryLower}/${folderName}_enzo_manuel_mangano_reactiive.mp4`,
    thumbnailSrc: `thumbnails/${categoryLower}/${folderName}_enzo_manuel_mangano_reactiive.avif`,
    author: AUTHOR,
    source: `${SOURCE_BASE}/${folderName}`,
    twitterId: TWITTER_ID,
    linkedInId: LINKEDIN_ID,
    githubId: GITHUB_ID,
    category,
    created_at,
  };
  
  return { item, category };
}

async function main() {
  const downloadsDir = path.join(__dirname, '../downloads');
  const folders = await fs.readdir(downloadsDir);
  
  // Filter out .DS_Store and other non-directory files
  const foldersToProcess = [];
  for (const folder of folders) {
    const folderPath = path.join(downloadsDir, folder);
    const stats = await fs.stat(folderPath);
    if (stats.isDirectory()) {
      foldersToProcess.push(folder);
    }
  }
  
  console.log(`📁 Processing ${foldersToProcess.length} items...\n`);
  
  // Base time for created_at timestamps
  const baseTime = new Date('2025-11-26T01:53:57+06:00');
  
  const results = {};
  
  for (let i = 0; i < foldersToProcess.length; i++) {
    const folderName = foldersToProcess[i];
    console.log(`[${i+1}/${foldersToProcess.length}] Processing: ${folderName}`);
    
    const result = await processItem(folderName, i, baseTime);
    
    if (result) {
      const { item, category } = result;
      if (!results[category]) {
        results[category] = [];
      }
      results[category].push(item);
    }
    
    console.log('');
  }
  
  // Generate TypeScript code for each category
  console.log('\n📝 Generated entries by category:\n');
  
  for (const [category, items] of Object.entries(results)) {
    console.log(`\n=== ${category} ===`);
    console.log(`Add these ${items.length} item(s) to data/${category.toLowerCase()}.ts:\n`);
    
    items.forEach((item, index) => {
      const itemCode = `  {
    id: "${item.id}",
    caption: "${item.caption}",
    videoSrc: "${item.videoSrc}",
    thumbnailSrc: "${item.thumbnailSrc}",
    author: "${item.author}",
    source: "${item.source}",
    twitterId: "${item.twitterId}",
    linkedInId: "${item.linkedInId}",
    githubId: "${item.githubId}",
    category: "${item.category}",
    created_at: "${item.created_at}",
  },`;
      
      console.log(itemCode);
      if (index < items.length - 1) console.log('');
    });
  }
  
  console.log('\n✅ Processing complete!');
  console.log('\n📋 Summary by category:');
  for (const [category, items] of Object.entries(results)) {
    console.log(`  - ${category}: ${items.length} item(s)`);
  }
}

main().catch(console.error);
