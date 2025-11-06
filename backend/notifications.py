"""
Notification System for Pharmazine
Handles Email and SMS notifications
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

# Email Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")


class EmailNotification:
    """Handle email notifications"""
    
    @staticmethod
    def send_email(to_email: str, subject: str, body: str, html: bool = True) -> bool:
        """Send an email notification"""
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print("[WARNING] Email not configured. Skipping email send.")
            return False
            
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = FROM_EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject
            
            if html:
                msg.attach(MIMEText(body, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
            
            print(f"[OK] Email sent to {to_email}: {subject}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to send email: {e}")
            return False
    
    @staticmethod
    def send_low_stock_alert(products: List[dict], recipient: str = None) -> bool:
        """Send low stock alert email"""
        recipient = recipient or ADMIN_EMAIL
        if not recipient:
            return False
            
        subject = f"🔴 Low Stock Alert - {len(products)} Products Need Reordering"
        
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .header {{ background-color: #ef4444; color: white; padding: 20px; }}
                .content {{ padding: 20px; }}
                table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
                th {{ background-color: #ef4444; color: white; padding: 12px; text-align: left; }}
                td {{ padding: 10px; border-bottom: 1px solid #ddd; }}
                .critical {{ color: #dc2626; font-weight: bold; }}
                .warning {{ color: #f59e0b; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>⚠️ Low Stock Alert</h1>
                <p>Date: {datetime.now().strftime("%Y-%m-%d %H:%M")}</p>
            </div>
            <div class="content">
                <p>The following products are running low on stock and need immediate attention:</p>
                
                <table>
                    <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Current Stock</th>
                        <th>Min Level</th>
                        <th>Status</th>
                    </tr>
        """
        
        for product in products:
            status_class = "critical" if product['stock_quantity'] == 0 else "warning"
            status_text = "OUT OF STOCK" if product['stock_quantity'] == 0 else "LOW STOCK"
            
            html += f"""
                    <tr>
                        <td>{product['sku']}</td>
                        <td>{product['name']}</td>
                        <td class="{status_class}">{product['stock_quantity']}</td>
                        <td>{product.get('min_stock_level', 10)}</td>
                        <td class="{status_class}">{status_text}</td>
                    </tr>
            """
        
        html += """
                </table>
                
                <p style="margin-top: 20px;">
                    <strong>Action Required:</strong> Please create purchase orders for these products.
                </p>
                
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                    This is an automated notification from Pharmazine Pharmacy Management System.
                </p>
            </div>
        </body>
        </html>
        """
        
        return EmailNotification.send_email(recipient, subject, html, html=True)
    
    @staticmethod
    def send_expiry_alert(products: List[dict], days: int = 90, recipient: str = None) -> bool:
        """Send expiry alert email"""
        recipient = recipient or ADMIN_EMAIL
        if not recipient:
            return False
            
        subject = f"⏰ Expiry Alert - {len(products)} Products Expiring in {days} Days"
        
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .header {{ background-color: #f59e0b; color: white; padding: 20px; }}
                .content {{ padding: 20px; }}
                table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
                th {{ background-color: #f59e0b; color: white; padding: 12px; text-align: left; }}
                td {{ padding: 10px; border-bottom: 1px solid #ddd; }}
                .expired {{ color: #dc2626; font-weight: bold; }}
                .expiring-soon {{ color: #f59e0b; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>⏰ Expiry Alert</h1>
                <p>Date: {datetime.now().strftime("%Y-%m-%d %H:%M")}</p>
            </div>
            <div class="content">
                <p>The following products are expiring within {days} days:</p>
                
                <table>
                    <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Batch</th>
                        <th>Expiry Date</th>
                        <th>Days Left</th>
                        <th>Stock</th>
                    </tr>
        """
        
        for product in products:
            expiry_date = datetime.fromisoformat(product['expiry_date'].replace('Z', '+00:00'))
            days_left = (expiry_date - datetime.now()).days
            
            status_class = "expired" if days_left < 0 else "expiring-soon"
            status_text = "EXPIRED" if days_left < 0 else f"{days_left} days"
            
            html += f"""
                    <tr>
                        <td>{product.get('sku', 'N/A')}</td>
                        <td>{product['name']}</td>
                        <td>{product.get('batch_number', 'N/A')}</td>
                        <td>{expiry_date.strftime("%Y-%m-%d")}</td>
                        <td class="{status_class}">{status_text}</td>
                        <td>{product.get('stock_quantity', 0)}</td>
                    </tr>
            """
        
        html += """
                </table>
                
                <p style="margin-top: 20px;">
                    <strong>Action Required:</strong> Please review and take appropriate action (discount, return to supplier, or dispose).
                </p>
                
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                    This is an automated notification from Pharmazine Pharmacy Management System.
                </p>
            </div>
        </body>
        </html>
        """
        
        return EmailNotification.send_email(recipient, subject, html, html=True)
    
    @staticmethod
    def send_daily_summary(stats: dict, recipient: str = None) -> bool:
        """Send daily sales summary email"""
        recipient = recipient or ADMIN_EMAIL
        if not recipient:
            return False
            
        subject = f"📊 Daily Summary - {datetime.now().strftime('%Y-%m-%d')}"
        
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .header {{ background-color: #3b82f6; color: white; padding: 20px; }}
                .content {{ padding: 20px; }}
                .stat-box {{ display: inline-block; margin: 10px; padding: 15px; background-color: #f3f4f6; border-radius: 8px; }}
                .stat-value {{ font-size: 24px; font-weight: bold; color: #1f2937; }}
                .stat-label {{ font-size: 14px; color: #6b7280; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Daily Business Summary</h1>
                <p>Date: {datetime.now().strftime("%Y-%m-%d")}</p>
            </div>
            <div class="content">
                <h2>Today's Performance</h2>
                
                <div class="stat-box">
                    <div class="stat-label">Total Sales</div>
                    <div class="stat-value">${stats.get('total_sales', 0):,.2f}</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-label">Transactions</div>
                    <div class="stat-value">{stats.get('transaction_count', 0)}</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-label">Customers</div>
                    <div class="stat-value">{stats.get('customer_count', 0)}</div>
                </div>
                
                <div class="stat-box">
                    <div class="stat-label">Avg Transaction</div>
                    <div class="stat-value">${stats.get('avg_transaction', 0):,.2f}</div>
                </div>
                
                <h3 style="margin-top: 30px;">Alerts</h3>
                <ul>
                    <li>Low Stock Items: {stats.get('low_stock_count', 0)}</li>
                    <li>Products Expiring Soon: {stats.get('expiring_soon_count', 0)}</li>
                    <li>Pending Purchase Orders: {stats.get('pending_po_count', 0)}</li>
                </ul>
                
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                    This is an automated notification from Pharmazine Pharmacy Management System.
                </p>
            </div>
        </body>
        </html>
        """
        
        return EmailNotification.send_email(recipient, subject, html, html=True)


class SMSNotification:
    """Handle SMS notifications via Twilio"""
    
    @staticmethod
    def send_sms(to_phone: str, message: str) -> bool:
        """Send an SMS notification"""
        if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
            print("[WARNING] Twilio not configured. Skipping SMS send.")
            return False
        
        try:
            from twilio.rest import Client
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            
            message = client.messages.create(
                body=message,
                from_=TWILIO_PHONE_NUMBER,
                to=to_phone
            )
            
            print(f"[OK] SMS sent to {to_phone}: {message.sid}")
            return True
        except ImportError:
            print("[WARNING] Twilio library not installed. Install with: pip install twilio")
            return False
        except Exception as e:
            print(f"[ERROR] Failed to send SMS: {e}")
            return False
    
    @staticmethod
    def send_customer_reminder(customer_phone: str, customer_name: str, medication_name: str) -> bool:
        """Send medication refill reminder"""
        message = f"Hi {customer_name}, this is a reminder that your {medication_name} prescription may need a refill. Visit us or call to reorder. - Pharmazine Pharmacy"
        return SMSNotification.send_sms(customer_phone, message)


# Notification scheduler functions (to be called by cron/celery)
def check_and_send_low_stock_alerts(db_session):
    """Check for low stock and send alerts"""
    from main import Product
    
    low_stock_products = db_session.query(Product).filter(
        Product.stock_quantity <= Product.min_stock_level
    ).all()
    
    if low_stock_products:
        products_data = [
            {
                'sku': p.sku,
                'name': p.name,
                'stock_quantity': p.stock_quantity,
                'min_stock_level': p.min_stock_level
            }
            for p in low_stock_products
        ]
        EmailNotification.send_low_stock_alert(products_data)
        print(f"[OK] Low stock alert sent for {len(products_data)} products")


def check_and_send_expiry_alerts(db_session):
    """Check for expiring products and send alerts"""
    from main import Product
    from datetime import datetime, timedelta
    
    days_ahead = 90
    expiry_date = datetime.now() + timedelta(days=days_ahead)
    
    expiring_products = db_session.query(Product).filter(
        Product.expiry_date.isnot(None),
        Product.expiry_date <= expiry_date,
        Product.stock_quantity > 0
    ).all()
    
    if expiring_products:
        products_data = [
            {
                'sku': p.sku,
                'name': p.name,
                'batch_number': p.batch_number,
                'expiry_date': p.expiry_date.isoformat(),
                'stock_quantity': p.stock_quantity
            }
            for p in expiring_products
        ]
        EmailNotification.send_expiry_alert(products_data, days=days_ahead)
        print(f"[OK] Expiry alert sent for {len(products_data)} products")


def send_daily_summary_report(db_session):
    """Generate and send daily summary report"""
    from main import Sale
    from sqlalchemy import func
    from datetime import datetime
    
    today = datetime.now().date()
    
    # Get today's stats
    stats = db_session.query(
        func.count(Sale.id).label('transaction_count'),
        func.sum(Sale.net_amount).label('total_sales'),
        func.avg(Sale.net_amount).label('avg_transaction')
    ).filter(
        func.date(Sale.created_at) == today
    ).first()
    
    # Get low stock count
    from main import Product
    low_stock_count = db_session.query(Product).filter(
        Product.stock_quantity <= Product.min_stock_level
    ).count()
    
    # Get expiring soon count
    expiry_date = datetime.now() + timedelta(days=30)
    expiring_count = db_session.query(Product).filter(
        Product.expiry_date.isnot(None),
        Product.expiry_date <= expiry_date,
        Product.stock_quantity > 0
    ).count()
    
    summary_data = {
        'total_sales': float(stats.total_sales or 0),
        'transaction_count': int(stats.transaction_count or 0),
        'customer_count': int(stats.transaction_count or 0),  # Approximate
        'avg_transaction': float(stats.avg_transaction or 0),
        'low_stock_count': low_stock_count,
        'expiring_soon_count': expiring_count,
        'pending_po_count': 0  # To be implemented
    }
    
    EmailNotification.send_daily_summary(summary_data)
    print(f"[OK] Daily summary sent")

