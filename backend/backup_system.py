"""
Automated Backup System for Pharmazine
PostgreSQL database backup with rotation
"""

import os
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
import shutil
from dotenv import load_dotenv

load_dotenv()

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pharmazine123@localhost:5432/pharmazine")
BACKUP_DIR = os.getenv("BACKUP_DIR", "./backups")
BACKUP_RETENTION_DAYS = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))
MAX_BACKUPS = int(os.getenv("MAX_BACKUPS", "50"))

# Parse database URL
def parse_db_url(url: str) -> dict:
    """Parse PostgreSQL connection string"""
    # postgresql://user:pass@host:port/database
    parts = url.replace("postgresql://", "").split("@")
    user_pass = parts[0].split(":")
    host_port_db = parts[1].split("/")
    host_port = host_port_db[0].split(":")
    
    return {
        "user": user_pass[0],
        "password": user_pass[1] if len(user_pass) > 1 else "",
        "host": host_port[0],
        "port": host_port[1] if len(host_port) > 1 else "5432",
        "database": host_port_db[1]
    }


class BackupSystem:
    """Handle database backups"""
    
    def __init__(self):
        self.backup_dir = Path(BACKUP_DIR)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.db_config = parse_db_url(DATABASE_URL)
    
    def create_backup(self) -> str:
        """Create a database backup"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"pharmazine_backup_{timestamp}.sql"
        backup_path = self.backup_dir / backup_filename
        
        try:
            # Set password environment variable
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_config['password']
            
            # Run pg_dump
            cmd = [
                "pg_dump",
                "-h", self.db_config['host'],
                "-p", self.db_config['port'],
                "-U", self.db_config['user'],
                "-d", self.db_config['database'],
                "-F", "c",  # Custom format (compressed)
                "-f", str(backup_path)
            ]
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                file_size = os.path.getsize(backup_path) / (1024 * 1024)  # MB
                print(f"[OK] Backup created: {backup_filename} ({file_size:.2f} MB)")
                
                # Create a compressed version
                self._compress_backup(backup_path)
                
                return str(backup_path)
            else:
                print(f"[ERROR] Backup failed: {result.stderr}")
                return None
                
        except Exception as e:
            print(f"[ERROR] Backup failed: {e}")
            return None
    
    def _compress_backup(self, backup_path: Path):
        """Compress backup file with gzip"""
        try:
            import gzip
            
            compressed_path = Path(str(backup_path) + ".gz")
            
            with open(backup_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Remove uncompressed file
            backup_path.unlink()
            
            print(f"[OK] Backup compressed: {compressed_path.name}")
            return compressed_path
            
        except Exception as e:
            print(f"[WARNING] Compression failed: {e}")
            return backup_path
    
    def restore_backup(self, backup_path: str) -> bool:
        """Restore database from backup"""
        backup_path = Path(backup_path)
        
        if not backup_path.exists():
            print(f"[ERROR] Backup file not found: {backup_path}")
            return False
        
        try:
            # Decompress if needed
            if backup_path.suffix == '.gz':
                import gzip
                decompressed_path = Path(str(backup_path).replace('.gz', ''))
                
                with gzip.open(backup_path, 'rb') as f_in:
                    with open(decompressed_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                
                backup_path = decompressed_path
            
            # Set password environment variable
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_config['password']
            
            # Drop and recreate database
            print("[WARNING] Dropping and recreating database...")
            
            # Run pg_restore
            cmd = [
                "pg_restore",
                "-h", self.db_config['host'],
                "-p", self.db_config['port'],
                "-U", self.db_config['user'],
                "-d", self.db_config['database'],
                "-c",  # Clean (drop) database objects before recreating
                str(backup_path)
            ]
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"[OK] Database restored from: {backup_path.name}")
                return True
            else:
                print(f"[ERROR] Restore failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"[ERROR] Restore failed: {e}")
            return False
    
    def cleanup_old_backups(self):
        """Remove old backups based on retention policy"""
        if not self.backup_dir.exists():
            return
        
        # Get all backup files
        backups = sorted(self.backup_dir.glob("pharmazine_backup_*.sql*"))
        
        # Remove by age
        cutoff_date = datetime.now() - timedelta(days=BACKUP_RETENTION_DAYS)
        
        removed_count = 0
        for backup_file in backups:
            # Get file timestamp from filename
            try:
                timestamp_str = backup_file.stem.split("_")[-2] + backup_file.stem.split("_")[-1]
                file_date = datetime.strptime(timestamp_str, "%Y%m%d%H%M%S")
                
                if file_date < cutoff_date:
                    backup_file.unlink()
                    removed_count += 1
                    print(f"[OK] Removed old backup: {backup_file.name}")
            except:
                pass
        
        # Keep only MAX_BACKUPS most recent
        remaining_backups = sorted(self.backup_dir.glob("pharmazine_backup_*.sql*"))
        if len(remaining_backups) > MAX_BACKUPS:
            for backup_file in remaining_backups[:-MAX_BACKUPS]:
                backup_file.unlink()
                removed_count += 1
                print(f"[OK] Removed excess backup: {backup_file.name}")
        
        if removed_count > 0:
            print(f"[OK] Cleaned up {removed_count} old backups")
    
    def list_backups(self) -> list:
        """List all available backups"""
        if not self.backup_dir.exists():
            return []
        
        backups = []
        for backup_file in sorted(self.backup_dir.glob("pharmazine_backup_*.sql*"), reverse=True):
            file_size = os.path.getsize(backup_file) / (1024 * 1024)  # MB
            created_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
            
            backups.append({
                "filename": backup_file.name,
                "path": str(backup_file),
                "size_mb": round(file_size, 2),
                "created_at": created_time.strftime("%Y-%m-%d %H:%M:%S")
            })
        
        return backups
    
    def verify_backup(self, backup_path: str) -> bool:
        """Verify backup integrity"""
        backup_path = Path(backup_path)
        
        if not backup_path.exists():
            return False
        
        # Check file size (should be > 1KB)
        if os.path.getsize(backup_path) < 1024:
            print(f"[ERROR] Backup file too small: {backup_path.name}")
            return False
        
        # Try to read the file
        try:
            if backup_path.suffix == '.gz':
                import gzip
                with gzip.open(backup_path, 'rb') as f:
                    f.read(1024)  # Read first 1KB
            else:
                with open(backup_path, 'rb') as f:
                    f.read(1024)
            
            print(f"[OK] Backup verified: {backup_path.name}")
            return True
        except Exception as e:
            print(f"[ERROR] Backup verification failed: {e}")
            return False


def run_daily_backup():
    """Main function to run daily backup"""
    print(f"\n{'='*50}")
    print(f"Starting backup at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}\n")
    
    backup_system = BackupSystem()
    
    # Create backup
    backup_path = backup_system.create_backup()
    
    if backup_path:
        # Verify backup
        if backup_system.verify_backup(backup_path):
            print("[OK] Backup verified successfully")
        
        # Cleanup old backups
        backup_system.cleanup_old_backups()
        
        print(f"\n[SUCCESS] Backup completed successfully")
    else:
        print(f"\n[FAILED] Backup failed")
    
    print(f"\n{'='*50}\n")


if __name__ == "__main__":
    # Can be run standalone or via cron
    run_daily_backup()

