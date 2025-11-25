#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

async function findJpgFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await findJpgFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.name.toLowerCase().endsWith('.jpg') || entry.name.toLowerCase().endsWith('.jpeg')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function convertToAvif(jpgPath) {
  const avifPath = jpgPath.replace(/\.jpe?g$/i, '.avif');
  
  try {
    // THIS IS ACTUAL IMAGE CONVERSION USING SHARP LIBRARY, NOT RENAMING!
    await sharp(jpgPath)
      .avif({ quality: 80, effort: 6 })
      .toFile(avifPath);
    
    const jpgStats = await fs.stat(jpgPath);
    const avifStats = await fs.stat(avifPath);
    const savings = ((jpgStats.size - avifStats.size) / jpgStats.size * 100).toFixed(1);
    
    console.log(`✓ ${path.basename(jpgPath)} → ${path.basename(avifPath)} (${savings}% smaller)`);
    return { success: true, jpgPath, avifPath, savings };
  } catch (error) {
    console.error(`✗ Failed to convert ${jpgPath}: ${error.message}`);
    return { success: false, jpgPath, error: error.message };
  }
}

async function main() {
  const thumbnailsDir = path.join(__dirname, '../public/thumbnails');
  
  console.log('🔍 Finding JPG files...');
  const jpgFiles = await findJpgFiles(thumbnailsDir);
  console.log(`📁 Found ${jpgFiles.length} JPG files\n`);

  if (jpgFiles.length === 0) {
    console.log('No JPG files found. Nothing to convert.');
    return;
  }

  console.log('🔄 Converting to AVIF using Sharp library...\n');
  const results = [];
  
  for (const jpgFile of jpgFiles) {
    const result = await convertToAvif(jpgFile);
    results.push(result);
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n📊 Summary:');
  console.log(`✓ Successfully converted: ${successful}`);
  if (failed > 0) {
    console.log(`✗ Failed: ${failed}`);
  }
  
  const totalSavings = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + parseFloat(r.savings), 0) / successful;
  
  console.log(`💾 Average file size reduction: ${totalSavings.toFixed(1)}%`);
  console.log('\n⚠️  Original JPG files are preserved until verification is complete.');
}

main().catch(console.error);
