"""
Configuration module for XandTube Channel Tracking Jobs
Handles environment variables and default settings
"""

import os
import pytz
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Configuration class for channel tracking jobs"""
    
    # Database Configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'xandtube')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
    
    # Job Scheduling Configuration
    TIMEZONE = pytz.timezone('America/Sao_Paulo')  # BRT timezone
    DEFAULT_CHECK_HOUR = 2  # 2:00 AM BRT
    JOB_MAX_WORKERS = 3  # Maximum concurrent job workers
    
    # YT-DLP Configuration
    YTDLP_COMMAND = 'yt-dlp'
    YTDLP_TIMEOUT = 300  # 5 minutes timeout for yt-dlp commands
    MAX_RETRIES = 3
    RETRY_DELAY = 60  # 1 minute delay between retries
    
    # Video Quality Settings
    DEFAULT_QUALITY = 'best'
    QUALITY_OPTIONS = ['best', 'worst', '720p', '480p', '360p', '1080p']
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = 'logs/channel_tracking.log'
    
    # File Paths
    DOWNLOADS_PATH = os.getenv('DOWNLOADS_PATH', '../videos/downloads')
    METADATA_PATH = os.getenv('METADATA_PATH', '../videos/metadata')
    
    # API Configuration
    API_BASE_URL = os.getenv('API_BASE_URL', 'http://192.168.3.46:3001/api')
    API_TIMEOUT = 30  # seconds
    
    # Error Handling
    MAX_CONSECUTIVE_ERRORS = 5  # Auto-disable channel after this many errors
    ERROR_COOLDOWN_HOURS = 24  # Hours to wait before retrying failed channels
    
    # Date Range Configuration
    SEARCH_DAYS_BACK = 1  # How many days back to search for new videos
    MAX_VIDEOS_PER_CHECK = 50  # Maximum videos to process per channel check
    
    @classmethod
    def get_db_url(cls):
        """Get database connection URL"""
        return f"postgresql://{cls.DB_USER}:{cls.DB_PASSWORD}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
    
    @classmethod
    def validate_config(cls):
        """Validate essential configuration parameters"""
        required_vars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
        missing_vars = []
        
        for var in required_vars:
            if not getattr(cls, var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required configuration variables: {', '.join(missing_vars)}")
        
        return True

# Create a default config instance
config = Config()