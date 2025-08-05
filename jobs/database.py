"""
Database connection and operations module for XandTube Channel Tracking Jobs
Handles PostgreSQL connections and channel tracking operations
"""

import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import json

from config import config

# Set up logging
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages database connections and operations for channel tracking"""
    
    def __init__(self):
        self.connection = None
        self.cursor = None
    
    def connect(self) -> bool:
        """
        Establish database connection
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            self.connection = psycopg2.connect(
                host=config.DB_HOST,
                port=config.DB_PORT,
                database=config.DB_NAME,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                cursor_factory=RealDictCursor
            )
            self.cursor = self.connection.cursor()
            logger.info("✅ Database connection established successfully")
            return True
            
        except psycopg2.Error as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        try:
            if self.cursor:
                self.cursor.close()
            if self.connection:
                self.connection.close()
            logger.info("🔌 Database connection closed")
        except psycopg2.Error as e:
            logger.error(f"❌ Error closing database connection: {e}")
    
    def __enter__(self):
        """Context manager entry"""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.disconnect()
    
    def get_active_channels_for_hour(self, hour: int) -> List[Dict[str, Any]]:
        """
        Get all active channels scheduled for the specified hour
        
        Args:
            hour (int): Hour of day (0-23)
            
        Returns:
            List[Dict]: List of channel tracking records
        """
        try:
            query = """
                SELECT ct.*, u.username, u.email
                FROM channel_tracking ct
                LEFT JOIN users u ON ct.user_id = u.id
                WHERE ct.is_active = true 
                AND ct.scheduled_hour = %s
                AND (ct.error_count < %s OR ct.last_check < %s)
                ORDER BY ct.last_check ASC NULLS FIRST
            """
            
            # Don't check channels that have failed recently
            error_cooldown = datetime.now() - timedelta(hours=config.ERROR_COOLDOWN_HOURS)
            
            self.cursor.execute(query, (hour, config.MAX_CONSECUTIVE_ERRORS, error_cooldown))
            channels = self.cursor.fetchall()
            
            logger.info(f"📋 Found {len(channels)} active channels for hour {hour}")
            return [dict(channel) for channel in channels]
            
        except psycopg2.Error as e:
            logger.error(f"❌ Error fetching active channels: {e}")
            return []
    
    def update_channel_last_check(self, channel_id: str, error_message: Optional[str] = None) -> bool:
        """
        Update the last check timestamp for a channel
        
        Args:
            channel_id (str): Channel tracking ID
            error_message (str, optional): Error message if check failed
            
        Returns:
            bool: True if update successful
        """
        try:
            if error_message:
                # Increment error count and record error
                query = """
                    UPDATE channel_tracking 
                    SET last_check = %s, 
                        error_count = error_count + 1,
                        last_error = %s,
                        is_active = CASE 
                            WHEN error_count + 1 >= %s THEN false 
                            ELSE is_active 
                        END
                    WHERE id = %s
                """
                self.cursor.execute(query, (
                    datetime.now(), 
                    error_message, 
                    config.MAX_CONSECUTIVE_ERRORS,
                    channel_id
                ))
            else:
                # Reset error count on successful check
                query = """
                    UPDATE channel_tracking 
                    SET last_check = %s, 
                        error_count = 0,
                        last_error = NULL
                    WHERE id = %s
                """
                self.cursor.execute(query, (datetime.now(), channel_id))
            
            self.connection.commit()
            return True
            
        except psycopg2.Error as e:
            logger.error(f"❌ Error updating channel last check: {e}")
            self.connection.rollback()
            return False
    
    def record_videos_found(self, channel_id: str, video_count: int, last_video_id: Optional[str] = None) -> bool:
        """
        Record the number of videos found during a check
        
        Args:
            channel_id (str): Channel tracking ID
            video_count (int): Number of videos found
            last_video_id (str, optional): ID of the latest video found
            
        Returns:
            bool: True if update successful
        """
        try:
            query = """
                UPDATE channel_tracking 
                SET total_videos_found = total_videos_found + %s,
                    last_video_id = COALESCE(%s, last_video_id)
                WHERE id = %s
            """
            self.cursor.execute(query, (video_count, last_video_id, channel_id))
            self.connection.commit()
            return True
            
        except psycopg2.Error as e:
            logger.error(f"❌ Error recording videos found: {e}")
            self.connection.rollback()
            return False
    
    def record_video_downloaded(self, channel_id: str) -> bool:
        """
        Increment the downloaded video count for a channel
        
        Args:
            channel_id (str): Channel tracking ID
            
        Returns:
            bool: True if update successful
        """
        try:
            query = """
                UPDATE channel_tracking 
                SET total_videos_downloaded = total_videos_downloaded + 1
                WHERE id = %s
            """
            self.cursor.execute(query, (channel_id,))
            self.connection.commit()
            return True
            
        except psycopg2.Error as e:
            logger.error(f"❌ Error recording video download: {e}")
            self.connection.rollback()
            return False
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user information by ID
        
        Args:
            user_id (str): User ID
            
        Returns:
            Dict: User information or None if not found
        """
        try:
            query = "SELECT * FROM users WHERE id = %s"
            self.cursor.execute(query, (user_id,))
            user = self.cursor.fetchone()
            
            return dict(user) if user else None
            
        except psycopg2.Error as e:
            logger.error(f"❌ Error fetching user: {e}")
            return None
    
    def check_video_exists(self, youtube_id: str, user_id: str) -> bool:
        """
        Check if a video already exists for a user
        
        Args:
            youtube_id (str): YouTube video ID
            user_id (str): User ID
            
        Returns:
            bool: True if video exists
        """
        try:
            query = """
                SELECT 1 FROM videos 
                WHERE youtube_id = %s AND user_id = %s
                LIMIT 1
            """
            self.cursor.execute(query, (youtube_id, user_id))
            result = self.cursor.fetchone()
            
            return result is not None
            
        except psycopg2.Error as e:
            logger.error(f"❌ Error checking video existence: {e}")
            return False
    
    def get_channel_stats(self) -> Dict[str, Any]:
        """
        Get overall channel tracking statistics
        
        Returns:
            Dict: Statistics summary
        """
        try:
            query = """
                SELECT 
                    COUNT(*) as total_channels,
                    COUNT(*) FILTER (WHERE is_active = true) as active_channels,
                    COUNT(*) FILTER (WHERE error_count > 0) as channels_with_errors,
                    SUM(total_videos_found) as total_videos_found,
                    SUM(total_videos_downloaded) as total_videos_downloaded,
                    AVG(total_videos_downloaded::float / NULLIF(total_videos_found, 0)) as avg_success_rate
                FROM channel_tracking
            """
            self.cursor.execute(query)
            stats = self.cursor.fetchone()
            
            return dict(stats) if stats else {}
            
        except psycopg2.Error as e:
            logger.error(f"❌ Error fetching channel stats: {e}")
            return {}
    
    def cleanup_old_logs(self, days_to_keep: int = 30) -> int:
        """
        Clean up old tracking logs (if implemented)
        
        Args:
            days_to_keep (int): Number of days of logs to keep
            
        Returns:
            int: Number of records cleaned up
        """
        # This would be implemented if we had a separate logs table
        # For now, just return 0
        return 0

# Global database manager instance
db_manager = DatabaseManager()