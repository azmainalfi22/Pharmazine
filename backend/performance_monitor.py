"""
Performance Monitoring and Optimization
Track slow queries and system performance
"""

import time
from functools import wraps
from datetime import datetime
from typing import Callable
from sqlalchemy.orm import Session
from sqlalchemy import text

class PerformanceMonitor:
    """Monitor API and database performance"""
    
    slow_queries = []
    slow_api_calls = []
    
    @staticmethod
    def track_query_time(threshold_ms: float = 100):
        """Decorator to track slow database queries"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                start = time.time()
                result = func(*args, **kwargs)
                duration = (time.time() - start) * 1000  # Convert to ms
                
                if duration > threshold_ms:
                    PerformanceMonitor.slow_queries.append({
                        'function': func.__name__,
                        'duration_ms': round(duration, 2),
                        'timestamp': datetime.now().isoformat(),
                        'threshold_ms': threshold_ms
                    })
                    print(f"[SLOW QUERY] {func.__name__} took {duration:.2f}ms (threshold: {threshold_ms}ms)")
                
                return result
            return wrapper
        return decorator
    
    @staticmethod
    def track_api_time(threshold_ms: float = 500):
        """Decorator to track slow API endpoints"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                start = time.time()
                result = await func(*args, **kwargs)
                duration = (time.time() - start) * 1000
                
                if duration > threshold_ms:
                    PerformanceMonitor.slow_api_calls.append({
                        'endpoint': func.__name__,
                        'duration_ms': round(duration, 2),
                        'timestamp': datetime.now().isoformat()
                    })
                    print(f"[SLOW API] {func.__name__} took {duration:.2f}ms")
                
                return result
            return wrapper
        return decorator
    
    @staticmethod
    def get_slow_queries(limit: int = 10):
        """Get list of slow queries"""
        return sorted(
            PerformanceMonitor.slow_queries,
            key=lambda x: x['duration_ms'],
            reverse=True
        )[:limit]
    
    @staticmethod
    def get_slow_api_calls(limit: int = 10):
        """Get list of slow API calls"""
        return sorted(
            PerformanceMonitor.slow_api_calls,
            key=lambda x: x['duration_ms'],
            reverse=True
        )[:limit]


class DatabaseOptimizer:
    """Database optimization utilities"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def analyze_tables(self):
        """Run ANALYZE on all tables to update statistics"""
        try:
            self.db.execute(text("ANALYZE;"))
            self.db.commit()
            print("[OK] Database statistics updated")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to analyze tables: {e}")
            return False
    
    def vacuum_database(self):
        """Run VACUUM to reclaim storage"""
        try:
            # Note: VACUUM cannot run inside a transaction
            self.db.execute(text("VACUUM ANALYZE;"))
            self.db.commit()
            print("[OK] Database vacuumed")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to vacuum: {e}")
            return False
    
    def get_table_sizes(self):
        """Get size of all tables"""
        query = text("""
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
                pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY size_bytes DESC
            LIMIT 20;
        """)
        
        result = self.db.execute(query)
        tables = []
        
        for row in result:
            tables.append({
                'schema': row[0],
                'table': row[1],
                'size': row[2],
                'size_bytes': row[3]
            })
        
        return tables
    
    def get_index_usage(self):
        """Check index usage statistics"""
        query = text("""
            SELECT 
                schemaname,
                tablename,
                indexname,
                idx_scan,
                idx_tup_read,
                idx_tup_fetch
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public'
            ORDER BY idx_scan DESC
            LIMIT 20;
        """)
        
        result = self.db.execute(query)
        indexes = []
        
        for row in result:
            indexes.append({
                'schema': row[0],
                'table': row[1],
                'index': row[2],
                'scans': row[3],
                'tuples_read': row[4],
                'tuples_fetched': row[5]
            })
        
        return indexes
    
    def get_unused_indexes(self):
        """Find indexes that are never used"""
        query = text("""
            SELECT 
                schemaname,
                tablename,
                indexname,
                pg_size_pretty(pg_relation_size(indexrelid)) as index_size
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public'
              AND idx_scan = 0
              AND indexrelname NOT LIKE '%_pkey'
            ORDER BY pg_relation_size(indexrelid) DESC;
        """)
        
        result = self.db.execute(query)
        unused = []
        
        for row in result:
            unused.append({
                'schema': row[0],
                'table': row[1],
                'index': row[2],
                'size': row[3]
            })
        
        return unused


# Cache decorator for expensive operations
def cache_result(ttl_seconds: int = 300):
    """Simple cache decorator"""
    cache = {}
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            if cache_key in cache:
                cached_value, cached_time = cache[cache_key]
                if time.time() - cached_time < ttl_seconds:
                    print(f"[CACHE HIT] {func.__name__}")
                    return cached_value
            
            result = await func(*args, **kwargs)
            cache[cache_key] = (result, time.time())
            
            return result
        return wrapper
    return decorator

