@echo off
echo ======================================================================
echo SHARKAR PHARMACY MANAGEMENT SYSTEM
echo The Best Pharmacy Management System
echo ======================================================================
echo.
echo Starting Backend Server...
echo.

cd backend
start "Pharmazine Backend" cmd /k "python start_server.py"

timeout /t 3 /nobreak

echo.
echo Backend server started on http://localhost:8000
echo.
echo To start frontend, run in another terminal:
echo   npm run dev
echo.
echo Login Credentials:
echo   Admin:      admin@sharkarpharmacy.com    / admin123
echo   Manager:    manager@sharkarpharmacy.com  / manager123
echo   Pharmacist: employee@sharkarpharmacy.com / employee123
echo.
echo ======================================================================
pause

