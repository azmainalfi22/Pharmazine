@echo off
echo Starting Pharmazine Scheduler...
echo.
echo This will run automated tasks:
echo - Daily backups (2:00 AM)
echo - Low stock alerts (9:00 AM, 5:00 PM)
echo - Expiry alerts (8:00 AM)
echo - Daily summary (6:00 PM)
echo - Refill reminders (10:00 AM)
echo - Auto-reorder check (Monday 9:00 AM)
echo.
echo Press Ctrl+C to stop the scheduler
echo.

python scheduler.py

