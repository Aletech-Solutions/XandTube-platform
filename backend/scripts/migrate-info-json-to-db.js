const fs = require('fs-extra');
const path = require('path');
const { Download, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Migration script to import all .info.json files from downloads folder into the database
 * This helps users migrate from the old file-based system to the new database system
 */

class InfoJsonMigrator {
  constructor() {
    this.downloadsPath = path.join(__dirname, '../../videos/downloads');
    this.stats = {
      totalFiles: 0,
      processed: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      duplicates: 0
    };
    this.errors = [];
  }

  async run() {
    console.log('🚀 Starting .info.json migration to database...\n');
    
    try {
      // Check if downloads folder exists
      if (!await fs.pathExists(this.downloadsPath)) {
        console.log('❌ Downloads folder not found:', this.downloadsPath);
        return;
      }

      // Get or create a default user for migration
      const defaultUser = await this.getOrCreateDefaultUser();
      console.log(`👤 Using default user: ${defaultUser.username} (ID: ${defaultUser.id})\n`);

      // Find all .info.json files
      const infoFiles = await this.findInfoJsonFiles();
      this.stats.totalFiles = infoFiles.length;

      console.log(`📁 Found ${infoFiles.length} .info.json files to process\n`);

      if (infoFiles.length === 0) {
        console.log('✅ No .info.json files found. Migration complete.');
        return;
      }

      // Process each file
      for (const filePath of infoFiles) {
        await this.processInfoJsonFile(filePath, defaultUser.id);
      }

      // Show final statistics
      this.showFinalStats();

      // Clean up old JSON cache files
      await this.cleanupJsonCacheFiles();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }

  async findInfoJsonFiles() {
    const files = [];
    
    try {
      const items = await fs.readdir(this.downloadsPath);
      
      for (const item of items) {
        const fullPath = path.join(this.downloadsPath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isFile() && item.endsWith('.info.json')) {
          files.push(fullPath);
        }
      }
      
      return files.sort(); // Sort for consistent processing order
    } catch (error) {
      console.error('❌ Error reading downloads folder:', error);
      return [];
    }
  }

  async processInfoJsonFile(filePath, userId) {
    this.stats.processed++;
    const fileName = path.basename(filePath);
    
    try {
      console.log(`📄 Processing ${this.stats.processed}/${this.stats.totalFiles}: ${fileName}`);
      
      // Read and parse the .info.json file
      const content = await fs.readFile(filePath, 'utf8');
      const videoInfo = JSON.parse(content);
      
      // Extract video ID from filename (remove .info.json extension)
      const baseFileName = fileName.replace('.info.json', '');
      
      // Check if this video already exists in database
      const existingVideo = await Download.findOne({
        where: {
          [Op.or]: [
            { youtubeId: videoInfo.id },
            { downloadId: { [Op.like]: `%${videoInfo.id}%` } },
            { videoPath: { [Op.like]: `%${baseFileName}%` } }
          ]
        }
      });

      if (existingVideo) {
        console.log(`   ⏭️  Skipped: Already exists in database (ID: ${existingVideo.id})`);
        this.stats.skipped++;
        this.stats.duplicates++;
        return;
      }

      // Find corresponding video and thumbnail files
      const videoFile = await this.findVideoFile(baseFileName);
      const thumbnailFile = await this.findThumbnailFile(baseFileName);
      
      if (!videoFile) {
        console.log(`   ⚠️  Warning: Video file not found for ${baseFileName}`);
      }

      // Create download record
      const downloadData = {
        youtubeId: videoInfo.id || 'unknown',
        downloadId: `migrated_${videoInfo.id}_${Date.now()}`,
        title: videoInfo.title || 'Unknown Title',
        description: videoInfo.description || null,
        duration: this.parseDuration(videoInfo.duration),
        channelName: videoInfo.channel || videoInfo.uploader || 'Unknown Channel',
        channelId: videoInfo.channel_id || videoInfo.uploader_id || null,
        originalUrl: videoInfo.webpage_url || videoInfo.original_url || `https://www.youtube.com/watch?v=${videoInfo.id}`,
        quality: 'best', // Default quality
        format: videoInfo.ext || 'mp4',
        resolution: this.parseResolution(videoInfo),
        fileSize: videoFile ? await this.getFileSize(videoFile) : null,
        videoPath: videoFile || path.join(this.downloadsPath, `${baseFileName}.mp4`),
        thumbnailPath: thumbnailFile,
        infoPath: filePath,
        status: 'completed',
        progress: 100,
        category: 'general', // Default category for migrated videos
        source: 'migrated', // Mark as migrated
        userId: userId,
        downloadedAt: this.parseUploadDate(videoInfo.upload_date) || new Date(),
        metadata: videoInfo // Store complete metadata
      };

      // Insert into database
      const newDownload = await Download.create(downloadData);
      
      console.log(`   ✅ Imported: ${videoInfo.title} (DB ID: ${newDownload.id})`);
      this.stats.imported++;

    } catch (error) {
      console.error(`   ❌ Error processing ${fileName}:`, error.message);
      this.stats.errors++;
      this.errors.push({
        file: fileName,
        error: error.message
      });
    }
  }

  async findVideoFile(baseName) {
    const videoExtensions = ['.mp4', '.webm', '.mkv', '.avi', '.mov'];
    
    for (const ext of videoExtensions) {
      const videoPath = path.join(this.downloadsPath, `${baseName}${ext}`);
      if (await fs.pathExists(videoPath)) {
        return videoPath;
      }
    }
    
    return null;
  }

  async findThumbnailFile(baseName) {
    const thumbnailExtensions = ['.webp', '.jpg', '.jpeg', '.png'];
    
    for (const ext of thumbnailExtensions) {
      const thumbnailPath = path.join(this.downloadsPath, `${baseName}${ext}`);
      if (await fs.pathExists(thumbnailPath)) {
        return thumbnailPath;
      }
    }
    
    return null;
  }

  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return null;
    }
  }

  parseDuration(duration) {
    if (typeof duration === 'number') {
      return duration;
    }
    if (typeof duration === 'string') {
      // Try to parse duration string (e.g., "10:30" -> 630 seconds)
      const parts = duration.split(':').map(Number);
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }
    return null;
  }

  parseResolution(videoInfo) {
    if (videoInfo.width && videoInfo.height) {
      return `${videoInfo.width}x${videoInfo.height}`;
    }
    if (videoInfo.resolution) {
      return videoInfo.resolution;
    }
    if (videoInfo.format_note) {
      return videoInfo.format_note;
    }
    return null;
  }

  parseUploadDate(uploadDate) {
    if (!uploadDate) return null;
    
    try {
      // Handle YYYYMMDD format
      if (typeof uploadDate === 'string' && uploadDate.length === 8) {
        const year = uploadDate.substring(0, 4);
        const month = uploadDate.substring(4, 6);
        const day = uploadDate.substring(6, 8);
        return new Date(`${year}-${month}-${day}`);
      }
      
      // Try to parse as regular date
      return new Date(uploadDate);
    } catch (error) {
      return null;
    }
  }

  async getOrCreateDefaultUser() {
    // Try to find an existing user
    let user = await User.findOne({
      order: [['createdAt', 'ASC']] // Get the first created user
    });

    if (!user) {
      // Create a default migration user
      user = await User.create({
        username: 'migration_user',
        email: 'migration@xandtube.local',
        password: 'migration_password_change_me', // Should be changed after migration
        role: 'admin'
      });
      
      console.log('👤 Created default migration user. Please change the password after migration!');
    }

    return user;
  }

  async cleanupJsonCacheFiles() {
    console.log('\n🧹 Cleaning up old JSON cache files...');
    
    const jsonCacheFiles = [
      path.join(__dirname, '../../videos/downloads-cache.json'),
      path.join(__dirname, '../../videos/downloads-cache.json.backup'),
      path.join(__dirname, '../../videos/channel-images.json'),
      path.join(__dirname, '../../videos/channel-images.json.backup')
    ];

    let cleanedFiles = 0;

    for (const filePath of jsonCacheFiles) {
      try {
        if (await fs.pathExists(filePath)) {
          // Create a backup before deleting (just in case)
          const backupPath = `${filePath}.migration-backup-${Date.now()}`;
          await fs.copy(filePath, backupPath);
          
          // Delete the original file
          await fs.remove(filePath);
          
          console.log(`   ✅ Deleted: ${path.basename(filePath)} (backup created)`);
          cleanedFiles++;
        } else {
          console.log(`   ⏭️  Not found: ${path.basename(filePath)}`);
        }
      } catch (error) {
        console.log(`   ❌ Error deleting ${path.basename(filePath)}: ${error.message}`);
      }
    }

    if (cleanedFiles > 0) {
      console.log(`\n🎯 Cleaned up ${cleanedFiles} JSON cache files.`);
      console.log('📦 Backup copies were created with .migration-backup timestamp.');
      console.log('🔄 The system will now use the database exclusively for video data.');
    } else {
      console.log('\n📋 No JSON cache files found to clean up.');
    }
  }

  showFinalStats() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION STATISTICS');
    console.log('='.repeat(60));
    console.log(`📁 Total .info.json files found: ${this.stats.totalFiles}`);
    console.log(`📄 Files processed: ${this.stats.processed}`);
    console.log(`✅ Successfully imported: ${this.stats.imported}`);
    console.log(`⏭️  Skipped (duplicates): ${this.stats.skipped}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log('='.repeat(60));

    if (this.stats.imported > 0) {
      console.log(`\n🎉 Successfully migrated ${this.stats.imported} videos to the database!`);
    }

    if (this.stats.errors > 0) {
      console.log(`\n⚠️  ${this.stats.errors} files had errors:`);
      this.errors.forEach(error => {
        console.log(`   • ${error.file}: ${error.error}`);
      });
    }

    if (this.stats.duplicates > 0) {
      console.log(`\n📋 ${this.stats.duplicates} videos were already in the database and were skipped.`);
    }

    console.log('\n✅ Migration completed!');
    
    if (this.stats.imported > 0) {
      console.log('\n📝 Next steps:');
      console.log('   1. Verify the imported videos in your application');
      console.log('   2. Check that thumbnails and video files are accessible');
      console.log('   3. Update user passwords if a migration user was created');
      console.log('   4. Consider backing up your .info.json files');
      console.log('   5. JSON cache files have been removed - system now uses database only');
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  const migrator = new InfoJsonMigrator();
  
  migrator.run().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

module.exports = InfoJsonMigrator;
