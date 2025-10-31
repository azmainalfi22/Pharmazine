# Volt Dealer Suite - Docker Deployment

This document provides comprehensive instructions for deploying the Volt Dealer Suite using Docker with Redis, Nginx, PostgreSQL, and containerized frontend/backend services.

## 🐳 Architecture Overview

The Docker setup includes:

- **Frontend**: React application served by Nginx
- **Backend**: FastAPI application with Python
- **Database**: PostgreSQL for persistent data storage
- **Cache**: Redis for session management and caching
- **Reverse Proxy**: Nginx for load balancing and SSL termination

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available
- Ports 80, 443, 5432, 6379 available

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd volt-dealer-suite
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp env.production.example .env.production

# Edit the environment variables
nano .env.production
```

**Important**: Update the following variables in `.env.production`:
- `POSTGRES_PASSWORD`: Strong database password
- `REDIS_PASSWORD`: Strong Redis password  
- `SECRET_KEY`: Random secret key for JWT tokens
- `JWT_SECRET_KEY`: Random JWT secret key

### 3. Build and Start Services

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up --build -d

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### 4. Initialize Database

```bash
# Run database initialization
docker-compose -f docker-compose.prod.yml run --rm db-init
```

### 5. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **API Documentation**: http://localhost/api/docs

## 🔧 Development Mode

For development with hot reloading and additional tools:

```bash
# Start development environment
docker-compose up --build -d

# Access development tools
# - Redis Commander: http://localhost:8081
# - pgAdmin: http://localhost:8082 (admin@voltdealer.com / admin123)
```

## 📊 Service Management

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Scale Services

```bash
# Scale backend service (load balancing)
docker-compose up --scale backend=3 -d
```

## 🗄️ Database Management

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres volt_dealer_suite > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres volt_dealer_suite < backup.sql
```

### Access Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d volt_dealer_suite

# Connect to Redis
docker-compose exec redis redis-cli -a voltdealer123
```

## 🔒 Security Configuration

### SSL/TLS Setup

1. Place SSL certificates in `./ssl/` directory:
   - `cert.pem` - SSL certificate
   - `key.pem` - Private key

2. Update `nginx.conf` to enable HTTPS:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    # ... rest of configuration
}
```

### Environment Security

- Use strong passwords for all services
- Generate random secret keys
- Enable firewall rules
- Use Docker secrets for sensitive data

## 📈 Monitoring and Health Checks

### Health Check Endpoints

- Frontend: `GET /health`
- Backend: `GET /api/health`
- Database: Built-in PostgreSQL health check
- Redis: Built-in Redis health check

### Monitoring Setup

```bash
# View container resource usage
docker stats

# Check health status
docker-compose ps
```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up --build -d

# Run database migrations (if any)
docker-compose -f docker-compose.prod.yml run --rm backend python -m alembic upgrade head
```

### Cleanup

```bash
# Remove unused containers and images
docker system prune -a

# Remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 80, 443, 5432, 6379 are available
2. **Permission issues**: Check Docker daemon permissions
3. **Memory issues**: Ensure sufficient RAM (4GB+ recommended)
4. **Database connection**: Verify PostgreSQL is healthy before starting backend

### Debug Commands

```bash
# Check container logs
docker-compose logs backend

# Execute commands in running container
docker-compose exec backend bash

# Check network connectivity
docker-compose exec backend ping postgres
docker-compose exec backend ping redis
```

## 📝 Default Credentials

### Demo Accounts
- **Admin**: admin@voltdealer.com / admin123
- **Manager**: manager1@voltdealer.com / manager123
- **Employee**: employee1@voltdealer.com / employee123

### Service Credentials
- **PostgreSQL**: postgres / voltdealer123
- **Redis**: (no user) / voltdealer123
- **pgAdmin**: admin@voltdealer.com / admin123

## 🔧 Customization

### Environment Variables

Key environment variables you can customize:

```bash
# Database
POSTGRES_DB=volt_dealer_suite
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Redis
REDIS_PASSWORD=your_password

# Application
SECRET_KEY=your_secret_key
ENVIRONMENT=production

# API
VITE_API_BASE_URL=http://localhost/api
```

### Nginx Configuration

Modify `nginx.conf` for:
- Custom domain names
- SSL configuration
- Rate limiting rules
- CORS settings

## 📞 Support

For issues and support:
1. Check the logs: `docker-compose logs`
2. Verify environment configuration
3. Ensure all prerequisites are met
4. Check Docker and Docker Compose versions

## 🎯 Production Checklist

Before deploying to production:

- [ ] Update all default passwords
- [ ] Configure SSL certificates
- [ ] Set up proper firewall rules
- [ ] Configure log rotation
- [ ] Set up monitoring and alerting
- [ ] Create database backups
- [ ] Test all functionality
- [ ] Configure domain names
- [ ] Set up CI/CD pipeline
