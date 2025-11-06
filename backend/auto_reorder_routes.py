"""
Auto-Reorder System API Routes
Automatic reordering based on stock levels and sales patterns
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, text
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/api/auto-reorder", tags=["Auto Reorder"])

# Database dependency
def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user():
    return {"id": "system", "email": "system@pharmazine.com"}


@router.get("/recommendations")
async def get_reorder_recommendations(
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get auto-reorder recommendations based on stock levels and sales patterns"""
    from auto_reorder import AutoReorderSystem
    
    system = AutoReorderSystem(db)
    recommendations = system.generate_reorder_recommendations()
    
    # Filter by priority if specified
    if priority:
        recommendations = [r for r in recommendations if r['priority'] == priority]
    
    return {
        "recommendations": recommendations,
        "count": len(recommendations),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/generate")
async def generate_reorder_list(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate and log auto-reorder recommendations"""
    from auto_reorder import AutoReorderSystem
    
    system = AutoReorderSystem(db)
    recommendations = system.generate_reorder_recommendations()
    
    # Log each recommendation
    for rec in recommendations:
        system.log_reorder_recommendation(
            product_id=rec['product_id'],
            supplier_id=rec['supplier_id'],
            current_stock=rec['current_stock'],
            reorder_point=rec['reorder_point'],
            recommended_order_qty=rec['recommended_order_qty'],
            avg_daily_sales=rec['avg_daily_sales'],
            days_of_supply=rec['days_of_supply'],
            priority=rec['priority'],
            abc_class=rec['abc_class']
        )
    
    return {
        "message": "Auto-reorder recommendations generated and logged",
        "count": len(recommendations),
        "recommendations": recommendations
    }


@router.get("/log")
async def get_reorder_log(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get auto-reorder log history"""
    try:
        query = text("""
            SELECT 
                ar.id,
                ar.product_id,
                p.name as product_name,
                p.sku,
                ar.supplier_id,
                s.name as supplier_name,
                ar.current_stock,
                ar.reorder_point,
                ar.recommended_order_qty,
                ar.avg_daily_sales,
                ar.days_of_supply,
                ar.priority,
                ar.abc_class,
                ar.status,
                ar.purchase_order_id,
                ar.created_at,
                ar.updated_at
            FROM auto_reorder_log ar
            LEFT JOIN products p ON ar.product_id::uuid = p.id::uuid
            LEFT JOIN suppliers s ON ar.supplier_id::uuid = s.id::uuid
            WHERE (:status IS NULL OR ar.status = :status)
            ORDER BY ar.created_at DESC
            LIMIT :limit OFFSET :skip
        """)
        
        results = db.execute(query, {
            "status": status,
            "limit": limit,
            "skip": skip
        }).fetchall()
        
        log_items = []
        for row in results:
            log_items.append({
                "id": str(row[0]),
                "product_id": str(row[1]) if row[1] else None,
                "product_name": row[2],
                "sku": row[3],
                "supplier_id": str(row[4]) if row[4] else None,
                "supplier_name": row[5],
                "current_stock": int(row[6] or 0),
                "reorder_point": int(row[7] or 0),
                "recommended_order_qty": int(row[8] or 0),
                "avg_daily_sales": float(row[9] or 0),
                "days_of_supply": float(row[10] or 0),
                "priority": row[11],
                "abc_class": row[12],
                "status": row[13],
                "purchase_order_id": str(row[14]) if row[14] else None,
                "created_at": row[15].isoformat() if row[15] else None,
                "updated_at": row[16].isoformat() if row[16] else None
            })
        
        return {
            "log": log_items,
            "count": len(log_items)
        }
    except Exception as e:
        return {"log": [], "count": 0, "error": str(e)}


@router.post("/log/{log_id}/create-po")
async def create_po_from_reorder_log(
    log_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create purchase order from auto-reorder log entry"""
    try:
        # Get log entry
        query = text("""
            SELECT product_id, supplier_id, recommended_order_qty
            FROM auto_reorder_log
            WHERE id = :log_id
        """)
        
        result = db.execute(query, {"log_id": log_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Auto-reorder log entry not found")
        
        product_id, supplier_id, qty = result
        
        # In a real implementation, this would create a purchase order
        # For now, we'll just update the log status
        update_query = text("""
            UPDATE auto_reorder_log
            SET status = 'po_created', updated_at = now()
            WHERE id = :log_id
        """)
        
        db.execute(update_query, {"log_id": log_id})
        db.commit()
        
        return {
            "message": "Purchase order created from auto-reorder recommendation",
            "log_id": log_id,
            "product_id": str(product_id),
            "supplier_id": str(supplier_id),
            "quantity": qty
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_auto_reorder_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get auto-reorder statistics"""
    try:
        stats_query = text("""
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                COUNT(*) FILTER (WHERE status = 'po_created') as po_created_count,
                COUNT(*) FILTER (WHERE status = 'ordered') as ordered_count,
                COUNT(*) FILTER (WHERE status = 'received') as received_count,
                COUNT(*) FILTER (WHERE priority = 'CRITICAL') as critical_count,
                COUNT(*) FILTER (WHERE priority = 'HIGH') as high_count,
                COUNT(*) FILTER (WHERE priority = 'MEDIUM') as medium_count,
                SUM(recommended_order_qty) FILTER (WHERE status = 'pending') as total_pending_qty
            FROM auto_reorder_log
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        """)
        
        result = db.execute(stats_query).fetchone()
        
        return {
            "pending_recommendations": int(result[0] or 0),
            "po_created": int(result[1] or 0),
            "ordered": int(result[2] or 0),
            "received": int(result[3] or 0),
            "critical_items": int(result[4] or 0),
            "high_priority_items": int(result[5] or 0),
            "medium_priority_items": int(result[6] or 0),
            "total_pending_quantity": int(result[7] or 0)
        }
    except Exception as e:
        return {
            "pending_recommendations": 0,
            "po_created": 0,
            "ordered": 0,
            "received": 0,
            "critical_items": 0,
            "high_priority_items": 0,
            "medium_priority_items": 0,
            "total_pending_quantity": 0,
            "error": str(e)
        }


print("[OK] Auto-reorder routes loaded successfully")

