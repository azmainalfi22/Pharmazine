"""
Auto-Reorder System for Pharmazine
Automatically generates purchase order recommendations
"""

from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func

def calculate_reorder_point(
    avg_daily_sales: float,
    lead_time_days: int = 7,
    safety_stock_days: int = 7
) -> int:
    """
    Calculate reorder point using formula:
    Reorder Point = (Avg Daily Sales × Lead Time) + Safety Stock
    """
    reorder_point = (avg_daily_sales * lead_time_days) + (avg_daily_sales * safety_stock_days)
    return max(int(reorder_point), 1)


def calculate_order_quantity(
    current_stock: int,
    reorder_point: int,
    avg_daily_sales: float,
    max_stock_days: int = 60
) -> int:
    """
    Calculate optimal order quantity
    Order Quantity = (Max Stock Level) - Current Stock
    """
    max_stock = int(avg_daily_sales * max_stock_days)
    order_qty = max(max_stock - current_stock, 0)
    return order_qty


class AutoReorderSystem:
    """Handles automatic reorder recommendations"""
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def get_reorder_recommendations(
        self, 
        days_to_analyze: int = 30,
        abc_priority: str = None
    ) -> List[Dict]:
        """
        Get products that need reordering
        
        Args:
            days_to_analyze: Number of days to analyze for avg daily sales
            abc_priority: Filter by ABC class ('A', 'B', 'C') or None for all
        """
        from main import Product, Sale, SaleItem
        
        # Get sales data for date range
        start_date = datetime.utcnow() - timedelta(days=days_to_analyze)
        
        # Query to get product sales
        sales_data = self.db.query(
            SaleItem.product_id,
            func.sum(SaleItem.quantity).label('total_sold'),
            func.count(func.distinct(Sale.id)).label('order_count')
        ).join(Sale, SaleItem.sale_id == Sale.id
        ).filter(Sale.created_at >= start_date
        ).group_by(SaleItem.product_id).all()
        
        # Build sales map
        sales_map = {
            item.product_id: {
                'total_sold': float(item.total_sold),
                'order_count': item.order_count,
                'avg_daily_sales': float(item.total_sold) / days_to_analyze
            }
            for item in sales_data
        }
        
        # Get all products
        products = self.db.query(Product).all()
        
        recommendations = []
        
        for product in products:
            # Skip if no sales history
            if product.id not in sales_map:
                # Check if it's low stock and has min level set
                if product.stock_quantity <= (product.min_stock_level or 0):
                    recommendations.append({
                        'product_id': product.id,
                        'sku': product.sku,
                        'product_name': product.name,
                        'current_stock': product.stock_quantity,
                        'min_stock_level': product.min_stock_level or 10,
                        'avg_daily_sales': 0,
                        'days_of_supply': 0,
                        'reorder_point': product.min_stock_level or 10,
                        'recommended_order_qty': max((product.min_stock_level or 10) * 2 - product.stock_quantity, 0),
                        'priority': 'HIGH' if product.stock_quantity == 0 else 'MEDIUM',
                        'reason': 'No sales history - based on min stock level',
                        'estimated_cost': product.cost_price * max((product.min_stock_level or 10) * 2 - product.stock_quantity, 0),
                        'supplier_id': product.supplier_id,
                        'abc_class': 'C'
                    })
                continue
            
            sales_info = sales_map[product.id]
            avg_daily_sales = sales_info['avg_daily_sales']
            
            # Calculate reorder metrics
            lead_time_days = 7  # Default 1 week lead time
            reorder_point = calculate_reorder_point(avg_daily_sales, lead_time_days)
            
            # Determine if product needs reordering
            if product.stock_quantity <= reorder_point:
                # Get ABC class (you'll need to implement this or pass it)
                abc_class = self._get_product_abc_class(product.id, sales_info['total_sold'] * product.cost_price)
                
                # Filter by ABC priority if specified
                if abc_priority and abc_class != abc_priority:
                    continue
                
                # Calculate order quantity
                max_stock_days = 60  # 2 months stock
                if abc_class == 'A':
                    max_stock_days = 30  # Tighter control for high-value items
                elif abc_class == 'C':
                    max_stock_days = 90  # Looser control for low-value items
                
                order_qty = calculate_order_quantity(
                    product.stock_quantity,
                    reorder_point,
                    avg_daily_sales,
                    max_stock_days
                )
                
                # Determine priority
                days_of_supply = product.stock_quantity / avg_daily_sales if avg_daily_sales > 0 else 999
                priority = 'CRITICAL' if days_of_supply < 3 else 'HIGH' if days_of_supply < 7 else 'MEDIUM'
                
                recommendations.append({
                    'product_id': product.id,
                    'sku': product.sku,
                    'product_name': product.name,
                    'current_stock': product.stock_quantity,
                    'min_stock_level': product.min_stock_level or reorder_point,
                    'reorder_point': reorder_point,
                    'avg_daily_sales': round(avg_daily_sales, 2),
                    'days_of_supply': round(days_of_supply, 1),
                    'recommended_order_qty': order_qty,
                    'priority': priority,
                    'abc_class': abc_class,
                    'reason': f'{days_of_supply:.1f} days supply remaining',
                    'estimated_cost': product.cost_price * order_qty,
                    'supplier_id': product.supplier_id,
                    'order_count': sales_info['order_count']
                })
        
        # Sort by priority (CRITICAL > HIGH > MEDIUM) and then by days of supply
        priority_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2}
        recommendations.sort(key=lambda x: (priority_order.get(x['priority'], 3), x['days_of_supply']))
        
        return recommendations
    
    def _get_product_abc_class(self, product_id: str, revenue: float) -> str:
        """Simple ABC classification"""
        if revenue > 10000:
            return 'A'
        elif revenue > 1000:
            return 'B'
        else:
            return 'C'
    
    def log_reorder_recommendation(
        self,
        product_id: str,
        supplier_id: str,
        current_stock: int,
        reorder_point: int,
        recommended_order_qty: int,
        avg_daily_sales: float,
        days_of_supply: float,
        priority: str,
        abc_class: str
    ):
        """Log reorder recommendation to database"""
        from sqlalchemy import text
        import uuid
        
        try:
            query = text("""
                INSERT INTO auto_reorder_log (
                    id, product_id, supplier_id, current_stock, reorder_point,
                    recommended_order_qty, avg_daily_sales, days_of_supply,
                    priority, abc_class, status, created_at, updated_at
                ) VALUES (
                    :id, :product_id, :supplier_id, :current_stock, :reorder_point,
                    :recommended_order_qty, :avg_daily_sales, :days_of_supply,
                    :priority, :abc_class, 'pending', now(), now()
                )
            """)
            
            self.db.execute(query, {
                "id": str(uuid.uuid4()),
                "product_id": product_id,
                "supplier_id": supplier_id,
                "current_stock": current_stock,
                "reorder_point": reorder_point,
                "recommended_order_qty": recommended_order_qty,
                "avg_daily_sales": avg_daily_sales,
                "days_of_supply": days_of_supply,
                "priority": priority,
                "abc_class": abc_class
            })
            
            self.db.commit()
        except Exception as e:
            print(f"[ERROR] Failed to log reorder recommendation: {e}")
            self.db.rollback()
    
    def generate_reorder_recommendations(self, days_to_analyze: int = 30) -> List[Dict]:
        """Alias for get_reorder_recommendations for backward compatibility"""
        return self.get_reorder_recommendations(days_to_analyze)
    
    def group_recommendations_by_supplier(self, recommendations: List[Dict]) -> Dict[str, List[Dict]]:
        """Group reorder recommendations by supplier"""
        grouped = {}
        
        for rec in recommendations:
            supplier_id = rec.get('supplier_id', 'unknown')
            if supplier_id not in grouped:
                grouped[supplier_id] = []
            grouped[supplier_id].append(rec)
        
        return grouped
    
    def generate_purchase_order_draft(
        self,
        supplier_id: str,
        recommendations: List[Dict]
    ) -> Dict:
        """Generate a draft purchase order from recommendations"""
        from main import Supplier
        
        supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()
        
        items = []
        total_amount = 0
        total_items = 0
        
        for rec in recommendations:
            item = {
                'product_id': rec['product_id'],
                'product_name': rec['product_name'],
                'sku': rec['sku'],
                'quantity': rec['recommended_order_qty'],
                'unit_price': rec['estimated_cost'] / rec['recommended_order_qty'] if rec['recommended_order_qty'] > 0 else 0,
                'total_price': rec['estimated_cost'],
                'priority': rec['priority']
            }
            items.append(item)
            total_amount += rec['estimated_cost']
            total_items += rec['recommended_order_qty']
        
        return {
            'supplier_id': supplier_id,
            'supplier_name': supplier.name if supplier else 'Unknown',
            'items': items,
            'total_items': total_items,
            'total_amount': total_amount,
            'created_date': datetime.now().isoformat(),
            'status': 'DRAFT'
        }
    
    def send_reorder_notification(self, recommendations: List[Dict], recipient_email: str = None):
        """Send email notification with reorder recommendations"""
        from notifications import EmailNotification
        
        if not recommendations:
            return False
        
        # Group by priority
        critical = [r for r in recommendations if r['priority'] == 'CRITICAL']
        high = [r for r in recommendations if r['priority'] == 'HIGH']
        medium = [r for r in recommendations if r['priority'] == 'MEDIUM']
        
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .header {{ background-color: #3b82f6; color: white; padding: 20px; }}
                table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
                th {{ background-color: #3b82f6; color: white; padding: 12px; text-align: left; }}
                td {{ padding: 10px; border-bottom: 1px solid #ddd; }}
                .critical {{ color: #dc2626; font-weight: bold; }}
                .high {{ color: #f59e0b; }}
                .medium {{ color: #10b981; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🛒 Auto-Reorder Recommendations</h1>
                <p>Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}</p>
            </div>
            <div style="padding: 20px;">
                <h2>Summary</h2>
                <ul>
                    <li class="critical">CRITICAL: {len(critical)} products (< 3 days supply)</li>
                    <li class="high">HIGH: {len(high)} products (< 7 days supply)</li>
                    <li class="medium">MEDIUM: {len(medium)} products</li>
                </ul>
                
                <h2>Recommended Orders</h2>
                <table>
                    <tr>
                        <th>Priority</th>
                        <th>SKU</th>
                        <th>Product</th>
                        <th>Current Stock</th>
                        <th>Days Supply</th>
                        <th>Order Qty</th>
                        <th>Est. Cost</th>
                    </tr>
        """
        
        for rec in recommendations:
            priority_class = rec['priority'].lower()
            html += f"""
                    <tr>
                        <td class="{priority_class}">{rec['priority']}</td>
                        <td>{rec['sku']}</td>
                        <td>{rec['product_name']}</td>
                        <td>{rec['current_stock']}</td>
                        <td>{rec['days_of_supply']}</td>
                        <td>{rec['recommended_order_qty']}</td>
                        <td>${rec['estimated_cost']:.2f}</td>
                    </tr>
            """
        
        total_cost = sum(r['estimated_cost'] for r in recommendations)
        html += f"""
                </table>
                
                <h3>Total Estimated Cost: ${total_cost:,.2f}</h3>
                
                <p style="margin-top: 30px;">
                    <strong>Action:</strong> Review these recommendations and create purchase orders in the system.
                </p>
            </div>
        </body>
        </html>
        """
        
        return EmailNotification.send_email(
            recipient_email or "admin@pharmacy.com",
            f"Auto-Reorder: {len(recommendations)} Products Need Ordering",
            html,
            html=True
        )


def run_auto_reorder_check(db_session: Session):
    """Run auto-reorder check and send notifications"""
    print(f"\n[TASK] Running auto-reorder check at {datetime.now()}")
    
    reorder_system = AutoReorderSystem(db_session)
    
    # Get high priority recommendations (A and B items)
    recommendations = reorder_system.get_reorder_recommendations(days_to_analyze=30)
    
    if recommendations:
        print(f"[OK] Found {len(recommendations)} products needing reorder")
        
        # Send notification
        reorder_system.send_reorder_notification(recommendations)
        
        # Group by supplier
        by_supplier = reorder_system.group_recommendations_by_supplier(recommendations)
        print(f"[OK] Recommendations grouped into {len(by_supplier)} suppliers")
        
        for supplier_id, items in by_supplier.items():
            print(f"  - Supplier {supplier_id}: {len(items)} products, ${sum(i['estimated_cost'] for i in items):.2f}")
    else:
        print("[OK] No products need reordering at this time")

