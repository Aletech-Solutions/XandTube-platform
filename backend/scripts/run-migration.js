#!/usr/bin/env node

/**
 * Simple runner script for the .info.json to database migration
 * Usage: node run-migration.js
 */

const InfoJsonMigrator = require('./migrate-info-json-to-db');

async function runMigration() {
  console.log('🚀 XandTube Migration Tool');
  console.log('📋 This script will migrate all .info.json files to the database');
  console.log('🧹 It will also clean up old JSON cache files');
  console.log('=' .repeat(60));
  
  const migrator = new InfoJsonMigrator();
  
  try {
    await migrator.run();
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
XandTube Migration Tool

This script migrates .info.json files from the downloads folder to the database
and cleans up old JSON cache files to ensure the system uses database exclusively.

Usage:
  node run-migration.js              Run the migration
  node run-migration.js --help       Show this help

What it does:
  1. Scans videos/downloads folder for .info.json files
  2. Imports video metadata into the database
  3. Links video files and thumbnails
  4. Creates a default user if none exists
  5. Removes old JSON cache files (downloads-cache.json, etc.)
  6. Creates backups of removed files

Safety features:
  - Skips videos already in database
  - Creates backups before deleting JSON files
  - Detailed error reporting
  - Safe rollback possible using backups
`);
  process.exit(0);
}

runMigration();
