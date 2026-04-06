"""
CRM Models and Schemas
Customer Relationship Management, Loyalty, and Marketing
"""

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, Date, Numeric, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

# ============================================
# SQLALCHEMY MODELS
# ============================================

class MarketingCampaign(Base):
    __tablename__ = "marketing_campaigns"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    campaign_type = Column(String, nullable=False)  # email, sms, push
    subject = Column(String)
    message = Column(Text, nullable=False)
    target_audience = Column(String, nullable=False, default='all')  # all, gold, silver, bronze
    status = Column(String, nullable=False, default='draft')  # draft, scheduled, sent, completed
    sent_count = Column(Integer, default=0)
    opened_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    scheduled_date = Column(DateTime)
    sent_date = Column(DateTime)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)
    created_by = Column(String)


class CustomerLoyaltyPoints(Base):
    __tablename__ = "customer_loyalty_points"
    
    id = Column(Integer, primary_key=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    points = Column(Integer, nullable=False, default=0)
    transaction_type = Column(String, nullable=False)  # earn, redeem, expire, adjust
    reference_type = Column(String)  # purchase, campaign, manual
    reference_id = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    created_by = Column(String)


class LoyaltyReward(Base):
    __tablename__ = "loyalty_rewards"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    points_required = Column(Integer, nullable=False)
    reward_type = Column(String, nullable=False)  # discount, free_product, voucher, service
    reward_value = Column(Numeric, nullable=False)
    max_redemptions = Column(Integer)
    current_redemptions = Column(Integer, default=0)
    valid_from = Column(Date, nullable=False)
    valid_until = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"), onupdate=datetime.utcnow)
    created_by = Column(String)


class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"
    
    id = Column(Integer, primary_key=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    reward_id = Column(Integer, ForeignKey("loyalty_rewards.id"), nullable=False)
    points_used = Column(Integer, nullable=False)
    redemption_code = Column(String, unique=True)
    status = Column(String, default='pending')  # pending, redeemed, expired, cancelled
    redeemed_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))


# ============================================
# PYDANTIC SCHEMAS
# ============================================

class MarketingCampaignBase(BaseModel):
    name: str
    campaign_type: str
    subject: Optional[str] = None
    message: str
    target_audience: str = "all"
    scheduled_date: Optional[datetime] = None


class MarketingCampaignCreate(MarketingCampaignBase):
    pass


class MarketingCampaignResponse(MarketingCampaignBase):
    id: int
    status: str
    sent_count: int
    opened_count: int
    click_count: int
    sent_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str]
    
    class Config:
        from_attributes = True


class LoyaltyPointsBase(BaseModel):
    customer_id: str
    points: int
    transaction_type: str
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None


class LoyaltyPointsCreate(LoyaltyPointsBase):
    pass


class LoyaltyPointsResponse(LoyaltyPointsBase):
    id: int
    created_at: datetime
    created_by: Optional[str]
    
    class Config:
        from_attributes = True


class LoyaltyRewardBase(BaseModel):
    name: str
    description: Optional[str] = None
    points_required: int
    reward_type: str
    reward_value: Decimal
    max_redemptions: Optional[int] = None
    valid_from: date
    valid_until: date
    is_active: bool = True


class LoyaltyRewardCreate(LoyaltyRewardBase):
    pass


class LoyaltyRewardResponse(LoyaltyRewardBase):
    id: int
    current_redemptions: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str]
    
    class Config:
        from_attributes = True


class RewardRedemptionBase(BaseModel):
    customer_id: str
    reward_id: int
    points_used: int
    notes: Optional[str] = None


class RewardRedemptionCreate(RewardRedemptionBase):
    pass


class RewardRedemptionResponse(RewardRedemptionBase):
    id: int
    redemption_code: str
    status: str
    redeemed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

