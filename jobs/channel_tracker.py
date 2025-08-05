"""
Main Channel Tracking Job Module for XandTube
Handles automatic discovery and downloading of new videos from tracked channels
"""

import os
import sys
import logging
import subprocess
import json
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Add the jobs directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import config
from database import db_manager

# Set up logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(config.LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ChannelTracker:
    """Main class for tracking channels and downloading new videos"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = config.API_TIMEOUT
        
    def format_date_for_ytdlp(self, date: datetime) -> str:
        """
        Format date for yt-dlp date filters
        
        Args:
            date (datetime): Date to format
            
        Returns:
            str: Date in YYYYMMDD format
        """
        return date.strftime('%Y%m%d')
    
    @retry(
        stop=stop_after_attempt(config.MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((subprocess.TimeoutExpired, subprocess.CalledProcessError))
    )
    def get_channel_videos_in_date_range(self, channel_url: str, from_date: datetime, to_date: datetime) -> List[Dict[str, Any]]:
        """
        Get videos from a channel within a specific date range using yt-dlp
        
        Args:
            channel_url (str): YouTube channel URL
            from_date (datetime): Start date for search
            to_date (datetime): End date for search
            
        Returns:
            List[Dict]: List of video information
        """
        try:
            from_date_str = self.format_date_for_ytdlp(from_date)
            to_date_str = self.format_date_for_ytdlp(to_date)
            
            logger.info(f"🔍 Searching for videos in channel between {from_date_str} and {to_date_str}")
            
            # Build yt-dlp command
            cmd = [
                config.YTDLP_COMMAND,
                '--dump-json',
                '--flat-playlist',
                '--dateafter', from_date_str,
                '--datebefore', to_date_str,
                '--no-warnings',
                '--playlist-end', str(config.MAX_VIDEOS_PER_CHECK),
                channel_url
            ]
            
            # Execute command
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=config.YTDLP_TIMEOUT,
                check=True
            )
            
            if not result.stdout.strip():
                logger.info("ℹ️ No videos found in the specified date range")
                return []
            
            # Parse JSON output
            videos = []
            lines = result.stdout.strip().split('\n')
            
            for line in lines:
                if not line.strip():
                    continue
                    
                try:
                    video_data = json.loads(line)
                    
                    # Skip playlist metadata, only process video entries
                    if video_data.get('_type') == 'playlist':
                        continue
                        
                    if video_data.get('id'):
                        videos.append({
                            'id': video_data['id'],
                            'title': video_data.get('title', f"Video {len(videos) + 1}"),
                            'url': video_data.get('url', f"https://www.youtube.com/watch?v={video_data['id']}"),
                            'upload_date': video_data.get('upload_date'),
                            'duration': video_data.get('duration', 0),
                            'thumbnail': video_data.get('thumbnail', ''),
                            'description': video_data.get('description', ''),
                            'view_count': video_data.get('view_count', 0),
                            'uploader': video_data.get('uploader', ''),
                            'channel_id': video_data.get('channel_id', ''),
                            'webpage_url': video_data.get('webpage_url', '')
                        })
                        
                except json.JSONDecodeError as e:
                    logger.warning(f"⚠️ Failed to parse JSON line: {e}")
                    continue
            
            logger.info(f"✅ Found {len(videos)} videos in date range")
            return videos
            
        except subprocess.TimeoutExpired:
            logger.error(f"⏰ yt-dlp command timed out after {config.YTDLP_TIMEOUT} seconds")
            raise
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ yt-dlp command failed: {e.stderr}")
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error getting channel videos: {e}")
            raise
    
    @retry(
        stop=stop_after_attempt(config.MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def download_video_via_api(self, video_url: str, user_id: str, quality: str = 'best') -> bool:
        """
        Download a video using the XandTube API
        
        Args:
            video_url (str): YouTube video URL
            user_id (str): User ID for the download
            quality (str): Video quality preference
            
        Returns:
            bool: True if download was initiated successfully
        """
        try:
            # Get user token (this would need to be implemented)
            # For now, we'll use a system token or bypass authentication
            
            download_data = {
                'url': video_url,
                'quality': quality,
                'saveToLibrary': True
            }
            
            # Make API request to start download
            response = self.session.post(
                f"{config.API_BASE_URL}/download/video",
                json=download_data,
                headers={
                    'Content-Type': 'application/json',
                    # 'Authorization': f'Bearer {user_token}'  # Would need user token
                }
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"✅ Download initiated successfully for video: {video_url}")
                return True
            else:
                logger.error(f"❌ API request failed with status {response.status_code}: {response.text}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"❌ API request failed: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error downloading video: {e}")
            raise
    
    def process_channel(self, channel_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single channel: check for new videos and download them
        
        Args:
            channel_data (Dict): Channel tracking information from database
            
        Returns:
            Dict: Processing results and statistics
        """
        channel_id = channel_data['id']
        channel_name = channel_data['channel_name']
        channel_url = channel_data['channel_url']
        user_id = channel_data['user_id']
        quality = channel_data.get('quality', config.DEFAULT_QUALITY)
        save_to_library = channel_data.get('save_to_library', True)
        
        logger.info(f"🎯 Processing channel: {channel_name}")
        
        results = {
            'channel_id': channel_id,
            'channel_name': channel_name,
            'success': False,
            'videos_found': 0,
            'videos_downloaded': 0,
            'videos_skipped': 0,
            'error_message': None
        }
        
        try:
            # Calculate date range (yesterday)
            now = datetime.now(config.TIMEZONE)
            to_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            from_date = to_date - timedelta(days=config.SEARCH_DAYS_BACK)
            
            logger.info(f"📅 Searching for videos from {from_date.date()} to {to_date.date()}")
            
            # Get videos from channel in date range
            videos = self.get_channel_videos_in_date_range(channel_url, from_date, to_date)
            results['videos_found'] = len(videos)
            
            if not videos:
                logger.info(f"ℹ️ No new videos found for channel: {channel_name}")
                results['success'] = True
                return results
            
            # Process each video
            for video in videos:
                video_id = video['id']
                video_title = video['title']
                video_url = video['url']
                
                logger.info(f"📹 Processing video: {video_title}")
                
                # Check if video already exists for this user
                if db_manager.check_video_exists(video_id, user_id):
                    logger.info(f"⏭️ Video already exists, skipping: {video_title}")
                    results['videos_skipped'] += 1
                    continue
                
                # Download video if save_to_library is enabled
                if save_to_library:
                    try:
                        if self.download_video_via_api(video_url, user_id, quality):
                            results['videos_downloaded'] += 1
                            db_manager.record_video_downloaded(channel_id)
                            logger.info(f"✅ Video download initiated: {video_title}")
                        else:
                            logger.warning(f"⚠️ Failed to initiate download for: {video_title}")
                    except Exception as e:
                        logger.error(f"❌ Error downloading video {video_title}: {e}")
                        continue
                else:
                    logger.info(f"ℹ️ Save to library disabled, skipping download: {video_title}")
                    results['videos_skipped'] += 1
            
            # Record the videos found
            if videos:
                latest_video_id = videos[0]['id']  # Assuming first video is latest
                db_manager.record_videos_found(channel_id, len(videos), latest_video_id)
            
            results['success'] = True
            logger.info(f"✅ Channel processing completed: {channel_name} - Found: {results['videos_found']}, Downloaded: {results['videos_downloaded']}, Skipped: {results['videos_skipped']}")
            
        except Exception as e:
            error_msg = f"Error processing channel {channel_name}: {str(e)}"
            logger.error(f"❌ {error_msg}")
            results['error_message'] = error_msg
            results['success'] = False
        
        return results
    
    def run_tracking_job(self, hour: int) -> Dict[str, Any]:
        """
        Run the main tracking job for all channels scheduled at the specified hour
        
        Args:
            hour (int): Hour of day to process (0-23)
            
        Returns:
            Dict: Job execution summary
        """
        job_start_time = datetime.now(config.TIMEZONE)
        logger.info(f"🚀 Starting channel tracking job for hour {hour} at {job_start_time}")
        
        job_results = {
            'start_time': job_start_time,
            'end_time': None,
            'duration_seconds': 0,
            'channels_processed': 0,
            'channels_successful': 0,
            'channels_failed': 0,
            'total_videos_found': 0,
            'total_videos_downloaded': 0,
            'total_videos_skipped': 0,
            'errors': []
        }
        
        try:
            # Connect to database
            if not db_manager.connect():
                raise Exception("Failed to connect to database")
            
            # Get active channels for this hour
            channels = db_manager.get_active_channels_for_hour(hour)
            
            if not channels:
                logger.info(f"ℹ️ No active channels found for hour {hour}")
                return job_results
            
            logger.info(f"📋 Found {len(channels)} channels to process")
            
            # Process each channel
            for channel in channels:
                channel_id = channel['id']
                channel_name = channel['channel_name']
                
                try:
                    # Process the channel
                    channel_results = self.process_channel(channel)
                    
                    # Update job statistics
                    job_results['channels_processed'] += 1
                    
                    if channel_results['success']:
                        job_results['channels_successful'] += 1
                        job_results['total_videos_found'] += channel_results['videos_found']
                        job_results['total_videos_downloaded'] += channel_results['videos_downloaded']
                        job_results['total_videos_skipped'] += channel_results['videos_skipped']
                        
                        # Update channel last check timestamp
                        db_manager.update_channel_last_check(channel_id)
                        
                    else:
                        job_results['channels_failed'] += 1
                        error_msg = channel_results.get('error_message', 'Unknown error')
                        job_results['errors'].append(f"{channel_name}: {error_msg}")
                        
                        # Update channel with error
                        db_manager.update_channel_last_check(channel_id, error_msg)
                    
                except Exception as e:
                    error_msg = f"Failed to process channel {channel_name}: {str(e)}"
                    logger.error(f"❌ {error_msg}")
                    
                    job_results['channels_processed'] += 1
                    job_results['channels_failed'] += 1
                    job_results['errors'].append(error_msg)
                    
                    # Update channel with error
                    db_manager.update_channel_last_check(channel_id, error_msg)
            
        except Exception as e:
            error_msg = f"Job execution failed: {str(e)}"
            logger.error(f"❌ {error_msg}")
            job_results['errors'].append(error_msg)
            
        finally:
            # Clean up database connection
            db_manager.disconnect()
            
            # Calculate job duration
            job_results['end_time'] = datetime.now(config.TIMEZONE)
            job_results['duration_seconds'] = (job_results['end_time'] - job_results['start_time']).total_seconds()
            
            # Log job summary
            logger.info(f"🏁 Job completed in {job_results['duration_seconds']:.2f} seconds")
            logger.info(f"📊 Channels: {job_results['channels_processed']} processed, {job_results['channels_successful']} successful, {job_results['channels_failed']} failed")
            logger.info(f"📹 Videos: {job_results['total_videos_found']} found, {job_results['total_videos_downloaded']} downloaded, {job_results['total_videos_skipped']} skipped")
            
            if job_results['errors']:
                logger.warning(f"⚠️ Errors occurred: {len(job_results['errors'])}")
                for error in job_results['errors']:
                    logger.warning(f"   - {error}")
        
        return job_results

# Global tracker instance
tracker = ChannelTracker()

def main():
    """Main entry point for manual execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description='XandTube Channel Tracking Job')
    parser.add_argument('--hour', type=int, help='Hour to process (0-23)', default=datetime.now().hour)
    parser.add_argument('--test', action='store_true', help='Test mode - process all active channels regardless of hour')
    
    args = parser.parse_args()
    
    if args.test:
        logger.info("🧪 Running in test mode - processing all active channels")
        # In test mode, we could process all channels or use current hour
        results = tracker.run_tracking_job(datetime.now().hour)
    else:
        results = tracker.run_tracking_job(args.hour)
    
    # Print results
    print(f"\n📋 Job Summary:")
    print(f"   Duration: {results['duration_seconds']:.2f} seconds")
    print(f"   Channels processed: {results['channels_processed']}")
    print(f"   Videos found: {results['total_videos_found']}")
    print(f"   Videos downloaded: {results['total_videos_downloaded']}")
    
    if results['errors']:
        print(f"   Errors: {len(results['errors'])}")

if __name__ == '__main__':
    main()