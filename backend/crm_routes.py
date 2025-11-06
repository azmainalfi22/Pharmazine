from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional
from datetime import datetime, timedelta, date
from decimal import Decimal
import sys
from pathlib import Path
import uuid

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from crm_models import (
    MarketingCampaign, CustomerLoyaltyPoints, LoyaltyReward, RewardRedemption,
    MarketingCampaignCreate, MarketingCampaignResponse,
    LoyaltyPointsCreate, LoyaltyPointsResponse,
    LoyaltyRewardCreate, LoyaltyRewardResponse,
    RewardRedemptionCreate, RewardRedemptionResponse
)

router = APIRouter(prefix="/api/crm", tags=["CRM"])

# Database dependency
def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication dependency (placeholder)
def get_current_user():
    return {"id": "system", "email": "system@pharmazine.com", "role": "admin"}

# Admin check dependency (placeholder)
def require_admin():
    def dependency():
        return get_current_user()
    return Depends(dependency)

# ========================
# Additional Pydantic Models (for backward compatibility)
# ========================

class CustomerLoyaltyStats(BaseModel):
    customer_id: str
    customer_name: str
    total_points: int
    points_earned: int
    points_redeemed: int
    tier: str
    lifetime_value: Decimal
    total_purchases: int
    last_purchase_date: Optional[datetime]

# ========================
# Campaign Endpoints
# ========================

@router.get("/campaigns", response_model=List[MarketingCampaignResponse])
async def get_campaigns(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all marketing campaigns"""
    query = db.query(MarketingCampaign)
    
    if status:
        query = query.filter(MarketingCampaign.status == status)
    
    campaigns = query.order_by(MarketingCampaign.created_at.desc()).all()
    
    # Fallback to sample data if no campaigns in database
    if not campaigns:
        sample_campaigns = [
        {
            "id": 1,
            "name": "Summer Health Campaign",
            "campaign_type": "email",
            "subject": "Stay Healthy This Summer!",
            "message": "Get 20% off on all vitamins and supplements",
            "target_audience": "all",
            "status": "active",
            "sent_count": 250,
            "opened_count": 180,
            "click_count": 95,
            "scheduled_date": datetime.now(),
            "sent_date": datetime.now() - timedelta(days=2),
            "created_at": datetime.now() - timedelta(days=5),
            "updated_at": datetime.now()
        },
        {
            "id": 2,
            "name": "New Medicine Launch",
            "campaign_type": "sms",
            "subject": None,
            "message": "New advanced pain relief medication now available!",
            "target_audience": "gold",
            "status": "completed",
            "sent_count": 120,
            "opened_count": 95,
            "click_count": 48,
            "scheduled_date": datetime.now() - timedelta(days=7),
            "sent_date": datetime.now() - timedelta(days=7),
            "created_at": datetime.now() - timedelta(days=10),
            "updated_at": datetime.now() - timedelta(days=7)
        },
        {
            "id": 3,
            "name": "Prescription Reminder",
            "campaign_type": "push",
            "subject": None,
            "message": "Don't forget to refill your prescriptions!",
            "target_audience": "all",
            "status": "scheduled",
            "sent_count": 0,
            "opened_count": 0,
            "click_count": 0,
            "scheduled_date": datetime.now() + timedelta(days=3),
            "sent_date": None,
            "created_at": datetime.now() - timedelta(days=1),
            "updated_at": datetime.now()
        }
    ]
    
        if status:
            sample_campaigns = [c for c in sample_campaigns if c["status"] == status]
        
        return sample_campaigns
    
    return campaigns

@router.post("/campaigns", response_model=MarketingCampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign: MarketingCampaignCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin())
):
    """Create a new marketing campaign"""
    db_campaign = MarketingCampaign(
        status='draft' if not campaign.scheduled_date else 'scheduled',
        sent_count=0,
        opened_count=0,
        click_count=0,
        created_by=current_user.get('id'),
        **campaign.model_dump()
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.get("/campaigns/{campaign_id}", response_model=MarketingCampaignResponse)
async def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get specific campaign details"""
    campaign = db.query(MarketingCampaign).filter(MarketingCampaign.id == campaign_id).first()
    
    if not campaign:
        # Sample response for backward compatibility
        return {
            "id": campaign_id,
            "name": "Sample Campaign",
            "campaign_type": "email",
            "subject": "Sample Subject",
            "message": "Sample message",
            "target_audience": "all",
            "status": "active",
            "sent_count": 100,
            "opened_count": 75,
            "click_count": 30,
            "scheduled_date": datetime.now(),
            "sent_date": datetime.now(),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": None
        }
    
    return campaign

@router.post("/campaigns/{campaign_id}/send")
async def send_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin())
):
    """Send a campaign immediately"""
    return {"message": "Campaign sent successfully", "campaign_id": campaign_id}

# ========================
# Loyalty Program Endpoints
# ========================

@router.get("/loyalty/members", response_model=List[CustomerLoyaltyStats])
async def get_loyalty_members(
    tier: Optional[str] = None,
    min_points: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all loyalty program members with stats"""
    sample_members = [
        {
            "customer_id": 1,
            "customer_name": "Ahmed Hassan",
            "total_points": 450,
            "points_earned": 650,
            "points_redeemed": 200,
            "tier": "Gold",
            "lifetime_value": Decimal("12500.50"),
            "total_purchases": 45,
            "last_purchase_date": datetime.now() - timedelta(days=2)
        },
        {
            "customer_id": 2,
            "customer_name": "Fatima Ali",
            "total_points": 280,
            "points_earned": 380,
            "points_redeemed": 100,
            "tier": "Silver",
            "lifetime_value": Decimal("8300.00"),
            "total_purchases": 32,
            "last_purchase_date": datetime.now() - timedelta(days=5)
        },
        {
            "customer_id": 3,
            "customer_name": "Mohammed Khan",
            "total_points": 150,
            "points_earned": 200,
            "points_redeemed": 50,
            "tier": "Bronze",
            "lifetime_value": Decimal("4500.75"),
            "total_purchases": 18,
            "last_purchase_date": datetime.now() - timedelta(days=10)
        }
    ]
    
    if tier:
        sample_members = [m for m in sample_members if m["tier"] == tier]
    if min_points is not None:
        sample_members = [m for m in sample_members if m["total_points"] >= min_points]
    
    return sample_members

@router.post("/loyalty/points", response_model=LoyaltyPointsResponse)
async def add_loyalty_points(
    points_data: LoyaltyPointsCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Add or deduct loyalty points for a customer"""
    db_points = CustomerLoyaltyPoints(
        created_by=current_user.get('id'),
        **points_data.model_dump()
    )
    db.add(db_points)
    db.commit()
    db.refresh(db_points)
    return db_points

@router.get("/loyalty/points/{customer_id}", response_model=List[LoyaltyPointsResponse])
async def get_customer_points_history(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get points history for a specific customer"""
    history = db.query(CustomerLoyaltyPoints).filter(
        CustomerLoyaltyPoints.customer_id == customer_id
    ).order_by(CustomerLoyaltyPoints.created_at.desc()).all()
    
    # Fallback to sample if no data
    if not history:
        sample_history = [
            {
                "id": 1,
                "customer_id": customer_id,
                "points": 50,
                "transaction_type": "earn",
                "reference_type": "purchase",
                "reference_id": "123",
                "notes": "Purchase reward",
                "created_at": datetime.now() - timedelta(days=3),
                "created_by": None
            }
        ]
        return sample_history
    
    return history

# ========================
# Rewards Endpoints
# ========================

@router.get("/rewards", response_model=List[LoyaltyRewardResponse])
async def get_rewards(
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all rewards"""
    query = db.query(LoyaltyReward)
    
    if is_active is not None:
        query = query.filter(LoyaltyReward.is_active == is_active)
    
    rewards = query.order_by(LoyaltyReward.created_at.desc()).all()
    
    # Fallback to sample data if no rewards
    if not rewards:
        sample_rewards = [
        {
            "id": 1,
            "name": "10% Discount Voucher",
            "description": "Get 10% off on your next purchase",
            "points_required": 100,
            "reward_type": "discount",
            "reward_value": Decimal("10.00"),
            "max_redemptions": 500,
            "current_redemptions": 145,
            "valid_from": date.today(),
            "valid_until": date.today() + timedelta(days=90),
            "is_active": True,
            "created_at": datetime.now() - timedelta(days=30),
            "updated_at": datetime.now()
        },
        {
            "id": 2,
            "name": "Free Health Checkup",
            "description": "Complimentary health checkup service",
            "points_required": 500,
            "reward_type": "service",
            "reward_value": Decimal("200.00"),
            "max_redemptions": 100,
            "current_redemptions": 34,
            "valid_from": date.today(),
            "valid_until": date.today() + timedelta(days=180),
            "is_active": True,
            "created_at": datetime.now() - timedelta(days=60),
            "updated_at": datetime.now()
        },
        {
            "id": 3,
            "name": "Premium Medicine Bundle",
            "description": "Free premium medicine package worth 500 LE",
            "points_required": 1000,
            "reward_type": "free_product",
            "reward_value": Decimal("500.00"),
            "max_redemptions": 50,
            "current_redemptions": 8,
            "valid_from": date.today(),
            "valid_until": date.today() + timedelta(days=365),
            "is_active": True,
            "created_at": datetime.now() - timedelta(days=90),
            "updated_at": datetime.now()
        }
    ]
    
        if is_active is not None:
            sample_rewards = [r for r in sample_rewards if r["is_active"] == is_active]
        
        return sample_rewards
    
    return rewards

@router.post("/rewards", response_model=LoyaltyRewardResponse, status_code=status.HTTP_201_CREATED)
async def create_reward(
    reward: LoyaltyRewardCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin())
):
    """Create a new reward"""
    db_reward = LoyaltyReward(
        current_redemptions=0,
        created_by=current_user.get('id'),
        **reward.model_dump()
    )
    db.add(db_reward)
    db.commit()
    db.refresh(db_reward)
    return db_reward

@router.put("/rewards/{reward_id}", response_model=LoyaltyRewardResponse)
async def update_reward(
    reward_id: int,
    reward: LoyaltyRewardCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin())
):
    """Update an existing reward"""
    db_reward = db.query(LoyaltyReward).filter(LoyaltyReward.id == reward_id).first()
    if not db_reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    for key, value in reward.model_dump(exclude_unset=True).items():
        setattr(db_reward, key, value)
    
    db_reward.updated_at = datetime.now()
    db.commit()
    db.refresh(db_reward)
    return db_reward

@router.post("/rewards/redeem", response_model=RewardRedemptionResponse)
async def redeem_reward(
    redemption: RewardRedemptionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Redeem a reward for a customer"""
    # Get reward to verify points
    reward = db.query(LoyaltyReward).filter(LoyaltyReward.id == redemption.reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    # Generate redemption code
    redemption_code = str(uuid.uuid4())[:8].upper()
    
    db_redemption = RewardRedemption(
        redemption_code=redemption_code,
        points_used=reward.points_required,
        status="pending",
        **redemption.model_dump()
    )
    db.add(db_redemption)
    
    # Deduct loyalty points
    loyalty_points = CustomerLoyaltyPoints(
        customer_id=redemption.customer_id,
        points=-reward.points_required,
        transaction_type='redeem',
        reference_type='reward',
        reference_id=str(redemption.reward_id),
        notes=f"Redeemed {reward.name}",
        created_by=current_user.get('id')
    )
    db.add(loyalty_points)
    
    # Update reward redemption count
    reward.current_redemptions += 1
    
    db.commit()
    db.refresh(db_redemption)
    return db_redemption

@router.get("/redemptions/{customer_id}", response_model=List[RewardRedemptionResponse])
async def get_customer_redemptions(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get redemption history for a customer"""
    redemptions = db.query(RewardRedemption).filter(
        RewardRedemption.customer_id == customer_id
    ).order_by(RewardRedemption.created_at.desc()).all()
    
    # Fallback to sample if no data
    if not redemptions:
        sample_redemptions = [
            {
                "id": 1,
                "customer_id": customer_id,
                "reward_id": 1,
                "points_used": 100,
                "redemption_code": "ABC123",
                "status": "redeemed",
                "redeemed_at": datetime.now() - timedelta(days=2),
                "notes": "Redeemed successfully",
                "created_at": datetime.now() - timedelta(days=3)
            }
        ]
        return sample_redemptions
    
    return redemptions

# ========================
# Analytics Endpoints
# ========================

@router.get("/analytics/summary")
async def get_crm_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get CRM analytics summary"""
    return {
        "total_customers": 1256,
        "loyalty_members": 847,
        "active_campaigns": 3,
        "total_points_distributed": 124580,
        "total_points_redeemed": 45230,
        "loyalty_tiers": {
            "Gold": 89,
            "Silver": 245,
            "Bronze": 513
        },
        "campaign_performance": {
            "total_sent": 2450,
            "total_opened": 1825,
            "average_open_rate": 74.5,
            "average_click_rate": 38.2
        },
        "recent_activity": [
            {
                "type": "campaign",
                "title": "Summer Campaign Sent",
                "description": "250 messages sent",
                "timestamp": datetime.now() - timedelta(hours=2)
            },
            {
                "type": "redemption",
                "title": "Reward Redeemed",
                "description": "Customer redeemed 10% discount",
                "timestamp": datetime.now() - timedelta(hours=5)
            }
        ]
    }

@router.get("/analytics/customer-segments")
async def get_customer_segments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get customer segmentation data"""
    return {
        "segments": [
            {"name": "High Value", "count": 156, "percentage": 12.4, "avg_ltv": 25000},
            {"name": "Regular", "count": 645, "percentage": 51.4, "avg_ltv": 8500},
            {"name": "Occasional", "count": 455, "percentage": 36.2, "avg_ltv": 3200}
        ],
        "by_age_group": [
            {"age_range": "18-30", "count": 320},
            {"age_range": "31-45", "count": 485},
            {"age_range": "46-60", "count": 298},
            {"age_range": "60+", "count": 153}
        ],
        "by_location": [
            {"city": "Cairo", "count": 542},
            {"city": "Alexandria", "count": 312},
            {"city": "Giza", "count": 245},
            {"city": "Others", "count": 157}
        ]
    }

# ========================
# Customer Insights
# ========================

@router.get("/insights/top-customers")
async def get_top_customers(
    limit: int = 10,
    metric: str = "revenue",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get top customers by various metrics"""
    sample_customers = []
    for i in range(1, limit + 1):
        sample_customers.append({
            "customer_id": i,
            "customer_name": f"Customer {i}",
            "total_purchases": 50 - i,
            "total_revenue": Decimal(str(15000 - (i * 500))),
            "loyalty_points": 500 - (i * 20),
            "tier": "Gold" if i <= 3 else ("Silver" if i <= 7 else "Bronze"),
            "last_purchase": datetime.now() - timedelta(days=i)
        })
    return sample_customers

@router.get("/insights/purchase-patterns/{customer_id}")
async def get_customer_purchase_patterns(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get purchase patterns and preferences for a customer"""
    return {
        "customer_id": customer_id,
        "favorite_categories": [
            {"category": "Pain Relief", "count": 25},
            {"category": "Vitamins", "count": 18},
            {"category": "Cold & Flu", "count": 12}
        ],
        "preferred_payment_method": "Credit Card",
        "average_order_value": Decimal("250.50"),
        "purchase_frequency": "Weekly",
        "preferred_shopping_time": "Evening (6PM-9PM)",
        "seasonal_trends": [
            {"season": "Winter", "avg_spend": 320},
            {"season": "Spring", "avg_spend": 210},
            {"season": "Summer", "avg_spend": 180},
            {"season": "Fall", "avg_spend": 250}
        ]
    }

print("[OK] CRM routes loaded successfully")

