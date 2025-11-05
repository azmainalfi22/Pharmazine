"""
Role-Based Access Control (RBAC) System
Granular permissions for Pharmazine
"""

from enum import Enum
from typing import List, Dict, Set
from sqlalchemy import Column, String, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship, Session
from fastapi import HTTPException, Depends
from main import Base, get_db

# Permission definitions
class Permission(str, Enum):
    # Dashboard
    VIEW_DASHBOARD = "view_dashboard"
    
    # Products & Inventory
    VIEW_PRODUCTS = "view_products"
    CREATE_PRODUCTS = "create_products"
    EDIT_PRODUCTS = "edit_products"
    DELETE_PRODUCTS = "delete_products"
    VIEW_PRODUCT_COST = "view_product_cost"
    EDIT_PRODUCT_PRICE = "edit_product_price"
    
    # Stock Management
    VIEW_STOCK = "view_stock"
    ADJUST_STOCK = "adjust_stock"
    VIEW_STOCK_VALUE = "view_stock_value"
    MANAGE_OPENING_STOCK = "manage_opening_stock"
    
    # Sales & POS
    CREATE_SALE = "create_sale"
    VIEW_SALES = "view_sales"
    DELETE_SALE = "delete_sale"
    APPLY_DISCOUNT = "apply_discount"
    PROCESS_RETURN = "process_return"
    
    # Purchases
    VIEW_PURCHASES = "view_purchases"
    CREATE_PURCHASE = "create_purchase"
    EDIT_PURCHASE = "edit_purchase"
    DELETE_PURCHASE = "delete_purchase"
    APPROVE_PURCHASE = "approve_purchase"
    
    # Customers
    VIEW_CUSTOMERS = "view_customers"
    CREATE_CUSTOMERS = "create_customers"
    EDIT_CUSTOMERS = "edit_customers"
    DELETE_CUSTOMERS = "delete_customers"
    
    # Suppliers
    VIEW_SUPPLIERS = "view_suppliers"
    CREATE_SUPPLIERS = "create_suppliers"
    EDIT_SUPPLIERS = "edit_suppliers"
    DELETE_SUPPLIERS = "delete_suppliers"
    
    # Financial
    VIEW_REPORTS = "view_reports"
    VIEW_FINANCIAL_REPORTS = "view_financial_reports"
    MANAGE_PAYMENTS = "manage_payments"
    VIEW_PROFIT_LOSS = "view_profit_loss"
    
    # Users & Permissions
    VIEW_USERS = "view_users"
    CREATE_USERS = "create_users"
    EDIT_USERS = "edit_users"
    DELETE_USERS = "delete_users"
    MANAGE_ROLES = "manage_roles"
    
    # System
    VIEW_AUDIT_LOGS = "view_audit_logs"
    MANAGE_SETTINGS = "manage_settings"
    IMPORT_DATA = "import_data"
    EXPORT_DATA = "export_data"
    BACKUP_DATABASE = "backup_database"


# Role definitions with permissions
ROLE_PERMISSIONS: Dict[str, Set[Permission]] = {
    "super_admin": set(Permission),  # All permissions
    
    "pharmacy_manager": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_PRODUCTS, Permission.CREATE_PRODUCTS, Permission.EDIT_PRODUCTS,
        Permission.VIEW_PRODUCT_COST, Permission.EDIT_PRODUCT_PRICE,
        Permission.VIEW_STOCK, Permission.ADJUST_STOCK, Permission.VIEW_STOCK_VALUE,
        Permission.MANAGE_OPENING_STOCK,
        Permission.CREATE_SALE, Permission.VIEW_SALES, Permission.PROCESS_RETURN,
        Permission.APPLY_DISCOUNT,
        Permission.VIEW_PURCHASES, Permission.CREATE_PURCHASE, Permission.EDIT_PURCHASE,
        Permission.APPROVE_PURCHASE,
        Permission.VIEW_CUSTOMERS, Permission.CREATE_CUSTOMERS, Permission.EDIT_CUSTOMERS,
        Permission.VIEW_SUPPLIERS, Permission.CREATE_SUPPLIERS, Permission.EDIT_SUPPLIERS,
        Permission.VIEW_REPORTS, Permission.VIEW_FINANCIAL_REPORTS,
        Permission.MANAGE_PAYMENTS, Permission.VIEW_PROFIT_LOSS,
        Permission.VIEW_AUDIT_LOGS,
        Permission.EXPORT_DATA,
    },
    
    "pharmacist": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_PRODUCTS, Permission.EDIT_PRODUCTS,
        Permission.VIEW_STOCK, Permission.ADJUST_STOCK,
        Permission.CREATE_SALE, Permission.VIEW_SALES, Permission.PROCESS_RETURN,
        Permission.APPLY_DISCOUNT,
        Permission.VIEW_CUSTOMERS, Permission.CREATE_CUSTOMERS, Permission.EDIT_CUSTOMERS,
        Permission.VIEW_REPORTS,
    },
    
    "cashier": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_PRODUCTS,
        Permission.VIEW_STOCK,
        Permission.CREATE_SALE, Permission.VIEW_SALES,
        Permission.VIEW_CUSTOMERS, Permission.CREATE_CUSTOMERS,
    },
    
    "stock_clerk": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_PRODUCTS, Permission.EDIT_PRODUCTS,
        Permission.VIEW_STOCK, Permission.ADJUST_STOCK,
        Permission.MANAGE_OPENING_STOCK,
        Permission.VIEW_PURCHASES,
    },
    
    "accountant": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_PRODUCTS,
        Permission.VIEW_STOCK, Permission.VIEW_STOCK_VALUE,
        Permission.VIEW_SALES,
        Permission.VIEW_PURCHASES,
        Permission.VIEW_CUSTOMERS,
        Permission.VIEW_SUPPLIERS,
        Permission.VIEW_REPORTS, Permission.VIEW_FINANCIAL_REPORTS,
        Permission.VIEW_PROFIT_LOSS,
        Permission.MANAGE_PAYMENTS,
        Permission.VIEW_AUDIT_LOGS,
        Permission.EXPORT_DATA,
    },
    
    "admin": {  # Legacy role
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_PRODUCTS, Permission.CREATE_PRODUCTS, Permission.EDIT_PRODUCTS, Permission.DELETE_PRODUCTS,
        Permission.VIEW_PRODUCT_COST, Permission.EDIT_PRODUCT_PRICE,
        Permission.VIEW_STOCK, Permission.ADJUST_STOCK, Permission.VIEW_STOCK_VALUE,
        Permission.CREATE_SALE, Permission.VIEW_SALES, Permission.DELETE_SALE, Permission.APPLY_DISCOUNT,
        Permission.VIEW_PURCHASES, Permission.CREATE_PURCHASE, Permission.EDIT_PURCHASE, Permission.DELETE_PURCHASE,
        Permission.VIEW_CUSTOMERS, Permission.CREATE_CUSTOMERS, Permission.EDIT_CUSTOMERS, Permission.DELETE_CUSTOMERS,
        Permission.VIEW_SUPPLIERS, Permission.CREATE_SUPPLIERS, Permission.EDIT_SUPPLIERS, Permission.DELETE_SUPPLIERS,
        Permission.VIEW_REPORTS, Permission.VIEW_FINANCIAL_REPORTS,
        Permission.VIEW_USERS, Permission.CREATE_USERS, Permission.EDIT_USERS,
        Permission.MANAGE_SETTINGS,
        Permission.VIEW_AUDIT_LOGS,
    },
}


class RBACHelper:
    """Helper class for RBAC checks"""
    
    @staticmethod
    def get_user_permissions(user_roles: List[str]) -> Set[Permission]:
        """Get all permissions for a user based on their roles"""
        permissions = set()
        for role in user_roles:
            if role in ROLE_PERMISSIONS:
                permissions.update(ROLE_PERMISSIONS[role])
        return permissions
    
    @staticmethod
    def has_permission(user_roles: List[str], required_permission: Permission) -> bool:
        """Check if user has a specific permission"""
        user_permissions = RBACHelper.get_user_permissions(user_roles)
        return required_permission in user_permissions
    
    @staticmethod
    def has_any_permission(user_roles: List[str], required_permissions: List[Permission]) -> bool:
        """Check if user has any of the required permissions"""
        user_permissions = RBACHelper.get_user_permissions(user_roles)
        return any(perm in user_permissions for perm in required_permissions)
    
    @staticmethod
    def has_all_permissions(user_roles: List[str], required_permissions: List[Permission]) -> bool:
        """Check if user has all required permissions"""
        user_permissions = RBACHelper.get_user_permissions(user_roles)
        return all(perm in user_permissions for perm in required_permissions)


def require_permission(permission: Permission):
    """Decorator to require specific permission"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Get user from kwargs or current_user dependency
            user = kwargs.get('current_user')
            if not user:
                raise HTTPException(status_code=401, detail="Not authenticated")
            
            # Get user roles
            user_roles = [role.role for role in user.roles] if hasattr(user, 'roles') else []
            
            # Check permission
            if not RBACHelper.has_permission(user_roles, permission):
                raise HTTPException(
                    status_code=403, 
                    detail=f"Permission denied. Required permission: {permission.value}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(permissions: List[Permission]):
    """Decorator to require any of the specified permissions"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            user = kwargs.get('current_user')
            if not user:
                raise HTTPException(status_code=401, detail="Not authenticated")
            
            user_roles = [role.role for role in user.roles] if hasattr(user, 'roles') else []
            
            if not RBACHelper.has_any_permission(user_roles, permissions):
                raise HTTPException(
                    status_code=403,
                    detail=f"Permission denied. Required one of: {[p.value for p in permissions]}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


# API endpoint to get user permissions
def get_current_user_permissions(db: Session, user_id: str) -> Dict:
    """Get permissions for current user"""
    from main import Profile, UserRole
    
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        return {"permissions": [], "roles": []}
    
    # Get user roles
    user_roles = db.query(UserRole).filter(UserRole.user_id == user_id).all()
    role_names = [role.role for role in user_roles]
    
    # Get permissions
    permissions = RBACHelper.get_user_permissions(role_names)
    
    return {
        "user_id": user_id,
        "roles": role_names,
        "permissions": [perm.value for perm in permissions]
    }

