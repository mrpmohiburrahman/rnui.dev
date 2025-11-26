#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

async function findMp4Files(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await findMp4Files(fullPath);
      files.push(...subFiles);
    } else if (entry.name.toLowerCase().endsWith('.mp4')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function checkFfmpeg() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('error', () => resolve(false));
    ffmpeg.on('close', (code) => resolve(code === 0));
  });
}

async function convertToH265(mp4Path) {
  const tempPath = mp4Path.replace(/\.mp4$/i, '_h265_temp.mp4');
  const backupPath = mp4Path.replace(/\.mp4$/i, '_original.mp4');
  
  return new Promise((resolve) => {
    console.log(`🔄 Converting: ${path.basename(mp4Path)}`);
    
    // FFmpeg command for H.265/HEVC encoding with aggressive compression
    // -c:v libx265: Use H.265/HEVC codec
    // -crf 28: Quality level (0-51, lower is better, 28 is good balance)
    // -preset medium: Encoding speed vs compression (slower = better compression)
    // -tag:v hvc1: Compatibility tag for Apple devices
    // -c:a aac: Use AAC audio codec (universal compatibility)
    // -b:a 96k: Lower audio bitrate for smaller size
    const ffmpeg = spawn('ffmpeg', [
      '-i', mp4Path,
      '-c:v', 'libx265',
      '-crf', '28',
      '-preset', 'medium',
      '-tag:v', 'hvc1',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-movflags', '+faststart', // Optimize for web streaming
      '-y', // Overwrite output file if exists
      tempPath
    ]);

    let errorOutput = '';

    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffmpeg.on('close', async (code) => {
      if (code === 0) {
        try {
          const originalStats = await fs.stat(mp4Path);
          const newStats = await fs.stat(tempPath);
          const savings = ((originalStats.size - newStats.size) / originalStats.size * 100).toFixed(1);
          
          // Only replace if we got smaller file
          if (parseFloat(savings) > 0) {
            // Backup original
            await fs.rename(mp4Path, backupPath);
            // Replace with new version
            await fs.rename(tempPath, mp4Path);
            
            console.log(`✓ ${path.basename(mp4Path)} → ${savings}% smaller`);
            resolve({ success: true, mp4Path, savings: parseFloat(savings), replaced: true });
          } else {
            // Keep original if new file is larger
            await fs.unlink(tempPath);
            console.log(`⚠ ${path.basename(mp4Path)} → Would be ${Math.abs(savings)}% larger, keeping original`);
            resolve({ success: true, mp4Path, savings: 0, replaced: false });
          }
        } catch (error) {
          console.error(`✗ Failed to process ${mp4Path}: ${error.message}`);
          // Clean up temp file if it exists
          try { await fs.unlink(tempPath); } catch {}
          resolve({ success: false, mp4Path, error: error.message });
        }
      } else {
        console.error(`✗ Failed to convert ${mp4Path}`);
        if (errorOutput.includes('Unknown encoder')) {
          console.error('   Error: FFmpeg does not have H.265 support (libx265)');
          console.error('   Install with: brew install ffmpeg');
        }
        // Clean up temp file if it exists
        try { await fs.unlink(tempPath); } catch {}
        resolve({ success: false, mp4Path, error: 'FFmpeg conversion failed' });
      }
    });

    ffmpeg.on('error', async (error) => {
      console.error(`✗ Failed to spawn ffmpeg for ${mp4Path}: ${error.message}`);
      try { await fs.unlink(tempPath); } catch {}
      resolve({ success: false, mp4Path, error: error.message });
    });
  });
}

async function main() {
  console.log('🔍 Checking for ffmpeg...');
  const hasFfmpeg = await checkFfmpeg();
  
  if (!hasFfmpeg) {
    console.error('❌ FFmpeg is not installed or not in PATH');
    console.error('   Install with: brew install ffmpeg');
    process.exit(1);
  }
  
  console.log('✓ FFmpeg found\n');

  const demoDir = path.join(__dirname, '../public/demo');
  
  console.log('🔍 Finding MP4 files...');
  const mp4Files = await findMp4Files(demoDir);
  console.log(`📁 Found ${mp4Files.length} MP4 files\n`);

  if (mp4Files.length === 0) {
    console.log('No MP4 files found. Nothing to convert.');
    return;
  }

  console.log('🎯 Strategy: H.265/HEVC encoding for maximum compression');
  console.log('📝 Note: Original files will be backed up as *_original.mp4');
  console.log('🔄 Converting to H.265...\n');
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < mp4Files.length; i++) {
    const mp4File = mp4Files[i];
    console.log(`\n[${i + 1}/${mp4Files.length}]`);
    const result = await convertToH265(mp4File);
    results.push(result);
  }

  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000 / 60).toFixed(1);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const replaced = results.filter(r => r.replaced).length;
  const kept = results.filter(r => r.success && !r.replaced).length;

  console.log('\n\n📊 Summary:');
  console.log(`✓ Successfully processed: ${successful}`);
  console.log(`  ├─ Replaced with smaller: ${replaced}`);
  console.log(`  └─ Kept original (would be larger): ${kept}`);
  if (failed > 0) {
    console.log(`✗ Failed: ${failed}`);
  }
  
  if (replaced > 0) {
    const totalSavings = results
      .filter(r => r.replaced)
      .reduce((sum, r) => sum + r.savings, 0) / replaced;
    
    console.log(`💾 Average file size reduction: ${totalSavings.toFixed(1)}%`);
  }
  
  console.log(`⏱️  Total time: ${totalTime} minutes`);
  console.log('\n💡 Next steps:');
  console.log('   1. Test that the videos still play correctly');
  console.log('   2. If satisfied, delete *_original.mp4 backup files');
  console.log('   3. Delete the .webm files from previous conversion');
}

main().catch(console.error);
