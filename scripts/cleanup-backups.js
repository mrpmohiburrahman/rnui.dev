#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function findBackupFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await findBackupFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.name.toLowerCase().endsWith('_original.mp4')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const demoDir = path.join(__dirname, '../public/demo');
  
  console.log('🔍 Finding backup files (*_original.mp4)...');
  const backupFiles = await findBackupFiles(demoDir);
  console.log(`📁 Found ${backupFiles.length} backup files\n`);

  if (backupFiles.length === 0) {
    console.log('No backup files found. Nothing to delete.');
    return;
  }

  console.log('⚠️  WARNING: This will permanently delete all backup files!');
  console.log('Make sure you have tested the converted videos first.\n');
  
  console.log('Deleting backup files...\n');
  
  let deleted = 0;
  let failed = 0;
  
  for (const file of backupFiles) {
    try {
      await fs.unlink(file);
      console.log(`✓ Deleted: ${path.basename(file)}`);
      deleted++;
    } catch (error) {
      console.error(`✗ Failed to delete ${path.basename(file)}: ${error.message}`);
      failed++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✓ Deleted: ${deleted}`);
  if (failed > 0) {
    console.log(`✗ Failed: ${failed}`);
  }
  console.log('\n✅ Cleanup complete!');
}

main().catch(console.error);
