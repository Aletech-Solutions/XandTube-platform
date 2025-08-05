#!/usr/bin/env python3
"""
Main Scheduler for XandTube Channel Tracking Jobs
Runs channel tracking jobs automatically using APScheduler
"""

import os
import sys
import logging
import signal
import time
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.executors.pool import ThreadPoolExecutor

# Add the jobs directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import config
from channel_tracker import tracker

# Set up logging
os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(config.LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ChannelTrackingScheduler:
    """Main scheduler for channel tracking jobs"""
    
    def __init__(self):
        # Configure scheduler with thread pool
        executors = {
            'default': ThreadPoolExecutor(max_workers=config.JOB_MAX_WORKERS)
        }
        
        self.scheduler = BlockingScheduler(
            executors=executors,
            timezone=config.TIMEZONE
        )
        
        self.is_running = False
        self.setup_signal_handlers()
        
    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(signum, frame):
            logger.info(f"📡 Received signal {signum}, initiating graceful shutdown...")
            self.stop()
            
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    def channel_tracking_job(self, hour: int):
        """
        Job function to run channel tracking for a specific hour
        
        Args:
            hour (int): Hour of day to process (0-23)
        """
        job_id = f"channel_tracking_hour_{hour}"
        
        try:
            logger.info(f"🚀 Starting channel tracking job for hour {hour}")
            
            # Validate configuration
            config.validate_config()
            
            # Run the tracking job
            results = tracker.run_tracking_job(hour)
            
            # Log results summary
            logger.info(f"✅ Job {job_id} completed successfully")
            logger.info(f"📊 Processed {results['channels_processed']} channels")
            logger.info(f"📹 Found {results['total_videos_found']} videos, downloaded {results['total_videos_downloaded']}")
            
            if results['errors']:
                logger.warning(f"⚠️ Job {job_id} completed with {len(results['errors'])} errors")
                for error in results['errors']:
                    logger.warning(f"   - {error}")
            
        except Exception as e:
            logger.error(f"❌ Job {job_id} failed with error: {e}")
            raise
    
    def add_scheduled_jobs(self):
        """Add all scheduled jobs to the scheduler"""
        
        # Main job: Run every day at 2:00 AM BRT
        self.scheduler.add_job(
            func=self.channel_tracking_job,
            trigger=CronTrigger(hour=config.DEFAULT_CHECK_HOUR, minute=0, timezone=config.TIMEZONE),
            args=[config.DEFAULT_CHECK_HOUR],
            id='main_channel_tracking',
            name='Main Channel Tracking Job (2:00 AM BRT)',
            max_instances=1,
            coalesce=True,
            misfire_grace_time=300  # 5 minutes grace time
        )
        
        # Optional: Add jobs for other hours if needed
        # This allows users to schedule channels at different times
        additional_hours = [6, 12, 18]  # 6 AM, 12 PM, 6 PM
        
        for hour in additional_hours:
            self.scheduler.add_job(
                func=self.channel_tracking_job,
                trigger=CronTrigger(hour=hour, minute=0, timezone=config.TIMEZONE),
                args=[hour],
                id=f'channel_tracking_hour_{hour}',
                name=f'Channel Tracking Job ({hour:02d}:00 BRT)',
                max_instances=1,
                coalesce=True,
                misfire_grace_time=300
            )
        
        # Health check job: Run every hour to ensure system is working
        self.scheduler.add_job(
            func=self.health_check_job,
            trigger=CronTrigger(minute=0, timezone=config.TIMEZONE),
            id='health_check',
            name='System Health Check',
            max_instances=1,
            coalesce=True
        )
        
        # Cleanup job: Run daily at 1:00 AM to clean up old logs/temp files
        self.scheduler.add_job(
            func=self.cleanup_job,
            trigger=CronTrigger(hour=1, minute=0, timezone=config.TIMEZONE),
            id='daily_cleanup',
            name='Daily Cleanup Job',
            max_instances=1,
            coalesce=True
        )
        
        logger.info("📅 All scheduled jobs added successfully")
    
    def health_check_job(self):
        """Periodic health check job"""
        try:
            from database import db_manager
            
            # Test database connection
            if db_manager.connect():
                stats = db_manager.get_channel_stats()
                logger.info(f"💓 Health check passed - {stats.get('total_channels', 0)} channels in system")
                db_manager.disconnect()
            else:
                logger.error("❌ Health check failed - database connection error")
                
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
    
    def cleanup_job(self):
        """Daily cleanup job"""
        try:
            from database import db_manager
            
            logger.info("🧹 Running daily cleanup job")
            
            # Connect to database
            if db_manager.connect():
                # Cleanup old logs (if implemented)
                cleaned_records = db_manager.cleanup_old_logs(days_to_keep=30)
                logger.info(f"🗑️ Cleaned up {cleaned_records} old log records")
                
                db_manager.disconnect()
            
            # Additional cleanup tasks could be added here
            # e.g., temporary file cleanup, log rotation, etc.
            
            logger.info("✅ Daily cleanup job completed")
            
        except Exception as e:
            logger.error(f"❌ Cleanup job failed: {e}")
    
    def print_scheduled_jobs(self):
        """Print information about scheduled jobs"""
        jobs = self.scheduler.get_jobs()
        
        print("\n📋 Scheduled Jobs:")
        print("-" * 80)
        
        for job in jobs:
            next_run = job.next_run_time
            print(f"🕒 {job.name}")
            print(f"   ID: {job.id}")
            print(f"   Next run: {next_run.strftime('%Y-%m-%d %H:%M:%S %Z') if next_run else 'Not scheduled'}")
            print(f"   Trigger: {job.trigger}")
            print()
    
    def start(self):
        """Start the scheduler"""
        try:
            logger.info("🚀 Starting XandTube Channel Tracking Scheduler")
            logger.info(f"🌍 Timezone: {config.TIMEZONE}")
            logger.info(f"⏰ Main job scheduled for: {config.DEFAULT_CHECK_HOUR:02d}:00 daily")
            
            # Validate configuration
            config.validate_config()
            
            # Add all jobs
            self.add_scheduled_jobs()
            
            # Print job information
            self.print_scheduled_jobs()
            
            # Start the scheduler
            self.is_running = True
            logger.info("✅ Scheduler started successfully")
            logger.info("📡 Waiting for scheduled jobs... (Press Ctrl+C to stop)")
            
            self.scheduler.start()
            
        except KeyboardInterrupt:
            logger.info("📡 Keyboard interrupt received, stopping scheduler...")
            self.stop()
        except Exception as e:
            logger.error(f"❌ Failed to start scheduler: {e}")
            raise
    
    def stop(self):
        """Stop the scheduler gracefully"""
        if self.is_running:
            logger.info("🛑 Stopping scheduler...")
            self.scheduler.shutdown(wait=True)
            self.is_running = False
            logger.info("✅ Scheduler stopped successfully")

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='XandTube Channel Tracking Scheduler')
    parser.add_argument('--test-run', action='store_true', 
                       help='Run a test tracking job immediately and exit')
    parser.add_argument('--hour', type=int, default=config.DEFAULT_CHECK_HOUR,
                       help='Hour to run test job for (0-23)')
    parser.add_argument('--list-jobs', action='store_true',
                       help='List scheduled jobs and exit')
    
    args = parser.parse_args()
    
    scheduler = ChannelTrackingScheduler()
    
    if args.test_run:
        logger.info(f"🧪 Running test tracking job for hour {args.hour}")
        try:
            scheduler.channel_tracking_job(args.hour)
            logger.info("✅ Test job completed successfully")
        except Exception as e:
            logger.error(f"❌ Test job failed: {e}")
            sys.exit(1)
    
    elif args.list_jobs:
        scheduler.add_scheduled_jobs()
        scheduler.print_scheduled_jobs()
    
    else:
        # Normal operation - start the scheduler
        try:
            scheduler.start()
        except Exception as e:
            logger.error(f"❌ Scheduler failed: {e}")
            sys.exit(1)

if __name__ == '__main__':
    main()