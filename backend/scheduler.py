"""
Task Scheduler for Pharmazine
Runs automated tasks (backups, notifications, etc.)
"""

import schedule
import time
from datetime import datetime
from main import SessionLocal

def run_scheduled_tasks():
    """Main scheduler loop"""
    
    # Daily backup at 2 AM
    schedule.every().day.at("02:00").do(run_backup)
    
    # Low stock alerts - twice daily (9 AM and 5 PM)
    schedule.every().day.at("09:00").do(check_low_stock)
    schedule.every().day.at("17:00").do(check_low_stock)
    
    # Expiry alerts - daily at 8 AM
    schedule.every().day.at("08:00").do(check_expiry)
    
    # Daily summary - at 6 PM
    schedule.every().day.at("18:00").do(send_daily_summary)
    
    # Refill reminders - daily at 10 AM
    schedule.every().day.at("10:00").do(send_refill_reminders)
    
    # Auto-reorder check - Monday at 9 AM
    schedule.every().monday.at("09:00").do(check_auto_reorder)
    
    print(f"[OK] Scheduler started at {datetime.now()}")
    print("[OK] Scheduled tasks:")
    print("  - Daily backup: 2:00 AM")
    print("  - Low stock alerts: 9:00 AM, 5:00 PM")
    print("  - Expiry alerts: 8:00 AM")
    print("  - Daily summary: 6:00 PM")
    print("  - Refill reminders: 10:00 AM")
    print("  - Auto-reorder check: Monday 9:00 AM")
    print()
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


def run_backup():
    """Run database backup"""
    print(f"\n[TASK] Running backup at {datetime.now()}")
    try:
        from backup_system import run_daily_backup
        run_daily_backup()
    except Exception as e:
        print(f"[ERROR] Backup failed: {e}")


def check_low_stock():
    """Check and send low stock alerts"""
    print(f"\n[TASK] Checking low stock at {datetime.now()}")
    try:
        from notifications import check_and_send_low_stock_alerts
        db = SessionLocal()
        check_and_send_low_stock_alerts(db)
        db.close()
    except Exception as e:
        print(f"[ERROR] Low stock check failed: {e}")


def check_expiry():
    """Check and send expiry alerts"""
    print(f"\n[TASK] Checking expiry at {datetime.now()}")
    try:
        from notifications import check_and_send_expiry_alerts
        db = SessionLocal()
        check_and_send_expiry_alerts(db)
        db.close()
    except Exception as e:
        print(f"[ERROR] Expiry check failed: {e}")


def send_daily_summary():
    """Send daily summary report"""
    print(f"\n[TASK] Sending daily summary at {datetime.now()}")
    try:
        from notifications import send_daily_summary_report
        db = SessionLocal()
        send_daily_summary_report(db)
        db.close()
    except Exception as e:
        print(f"[ERROR] Daily summary failed: {e}")


def send_refill_reminders():
    """Send refill reminders to patients"""
    print(f"\n[TASK] Sending refill reminders at {datetime.now()}")
    try:
        from patient_history import send_refill_reminders
        db = SessionLocal()
        send_refill_reminders(db)
        db.close()
    except Exception as e:
        print(f"[ERROR] Refill reminders failed: {e}")


def check_auto_reorder():
    """Check and send auto-reorder recommendations"""
    print(f"\n[TASK] Checking auto-reorder at {datetime.now()}")
    try:
        from auto_reorder import run_auto_reorder_check
        db = SessionLocal()
        run_auto_reorder_check(db)
        db.close()
    except Exception as e:
        print(f"[ERROR] Auto-reorder check failed: {e}")


if __name__ == "__main__":
    run_scheduled_tasks()

