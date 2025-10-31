@echo off
REM Volt Dealer Suite Docker Deployment Script for Windows
REM This script automates the Docker deployment process

setlocal enabledelayedexpansion

echo 🐳 Volt Dealer Suite Docker Deployment
echo ======================================
echo.

REM Check if Docker is installed
echo [INFO] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo [SUCCESS] Docker and Docker Compose are installed

REM Check if environment file exists
echo [INFO] Checking environment configuration...
if not exist ".env.production" (
    echo [WARNING] Environment file not found. Creating from template...
    copy "env.production.example" ".env.production" >nul
    echo [WARNING] Please edit .env.production with your configuration before continuing
    echo [WARNING] Important: Update passwords and secret keys!
    pause
)
echo [SUCCESS] Environment configuration found

REM Build and start services
echo [INFO] Building and starting services...

REM Stop any existing containers
docker-compose -f docker-compose.prod.yml down >nul 2>&1

REM Build and start services
docker-compose -f docker-compose.prod.yml up --build -d
if errorlevel 1 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo [SUCCESS] Services started successfully

REM Wait for services to be healthy
echo [INFO] Waiting for services to be healthy...

REM Wait for PostgreSQL
echo [INFO] Waiting for PostgreSQL...
set timeout=60
:wait_postgres
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres -d volt_dealer_suite >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] PostgreSQL is ready
    goto postgres_ready
)
timeout /t 2 >nul
set /a timeout-=2
if !timeout! leq 0 (
    echo [ERROR] PostgreSQL failed to start within 60 seconds
    pause
    exit /b 1
)
goto wait_postgres

:postgres_ready

REM Wait for Redis
echo [INFO] Waiting for Redis...
set timeout=30
:wait_redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Redis is ready
    goto redis_ready
)
timeout /t 2 >nul
set /a timeout-=2
if !timeout! leq 0 (
    echo [ERROR] Redis failed to start within 30 seconds
    pause
    exit /b 1
)
goto wait_redis

:redis_ready

REM Initialize database
echo [INFO] Initializing database...
docker-compose -f docker-compose.prod.yml run --rm db-init
if errorlevel 1 (
    echo [ERROR] Database initialization failed
    pause
    exit /b 1
)
echo [SUCCESS] Database initialized successfully

REM Show service status
echo [INFO] Service Status:
docker-compose -f docker-compose.prod.yml ps

echo.
echo [SUCCESS] Deployment completed successfully!
echo.
echo Access URLs:
echo   Frontend: http://localhost
echo   Backend API: http://localhost/api
echo   API Documentation: http://localhost/api/docs
echo.
echo Default Login Credentials:
echo   Admin: admin@voltdealer.com / admin123
echo   Manager: manager1@voltdealer.com / manager123
echo   Employee: employee1@voltdealer.com / employee123
echo.
echo Management Commands:
echo   View logs: docker-compose -f docker-compose.prod.yml logs -f
echo   Stop services: docker-compose -f docker-compose.prod.yml down
echo   Restart services: docker-compose -f docker-compose.prod.yml restart

pause
