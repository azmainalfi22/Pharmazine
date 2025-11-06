#!/bin/bash

# Sharkar Pharmacy Management System Docker Deployment Script
# This script automates the Docker deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if environment file exists
check_env() {
    print_status "Checking environment configuration..."
    if [ ! -f ".env.production" ]; then
        print_warning "Environment file not found. Creating from template..."
        cp env.production.example .env.production
        print_warning "Please edit .env.production with your configuration before continuing"
        print_warning "Important: Update passwords and secret keys!"
        read -p "Press Enter to continue after updating .env.production..."
    fi
    print_success "Environment configuration found"
}

# Build and start services
deploy() {
    print_status "Building and starting services..."
    
    # Stop any existing containers
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml up --build -d
    
    print_success "Services started successfully"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres -d pharmazine &>/dev/null; then
            print_success "PostgreSQL is ready"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "PostgreSQL failed to start within 60 seconds"
        exit 1
    fi
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.prod.yml exec redis redis-cli ping &>/dev/null; then
            print_success "Redis is ready"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Redis failed to start within 30 seconds"
        exit 1
    fi
}

# Initialize database
init_database() {
    print_status "Initializing database..."
    docker-compose -f docker-compose.prod.yml run --rm db-init
    print_success "Database initialized successfully"
}

# Show service status
show_status() {
    print_status "Service Status:"
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    echo "Access URLs:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost/api"
    echo "  API Documentation: http://localhost/api/docs"
    echo ""
    echo "Default Login Credentials:"
    echo "  Admin: admin@sharkarpharmacy.com / admin123"
    echo "  Manager: manager@sharkarpharmacy.com / manager123"
    echo "  Employee: employee@sharkarpharmacy.com / employee123"
    echo ""
    echo "Management Commands:"
    echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
}

# Main deployment function
main() {
    echo "🐳 Sharkar Pharmacy Management System Docker Deployment"
    echo "======================================"
    echo ""
    
    check_docker
    check_env
    deploy
    wait_for_services
    init_database
    show_status
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "stop")
        print_status "Stopping services..."
        docker-compose -f docker-compose.prod.yml down
        print_success "Services stopped"
        ;;
    "restart")
        print_status "Restarting services..."
        docker-compose -f docker-compose.prod.yml restart
        print_success "Services restarted"
        ;;
    "logs")
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "status")
        docker-compose -f docker-compose.prod.yml ps
        ;;
    "clean")
        print_warning "This will remove all containers, volumes, and images!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose -f docker-compose.prod.yml down -v
            docker system prune -a -f
            print_success "Cleanup completed"
        else
            print_status "Cleanup cancelled"
        fi
        ;;
    *)
        echo "Usage: $0 {deploy|stop|restart|logs|status|clean}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy the application (default)"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - View service logs"
        echo "  status  - Show service status"
        echo "  clean   - Remove all containers and volumes"
        exit 1
        ;;
esac
