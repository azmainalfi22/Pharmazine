import { useState, useEffect } from "react";
import { Plus, Gift, Star, Mail, Users, Send, Trophy, Tags, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

interface Campaign {
  id: number;
  name: string;
  campaign_type: string;
  subject?: string;
  message: string;
  target_audience: string;
  status: string;
  sent_count: number;
  opened_count: number;
  click_count: number;
  scheduled_date?: string;
  sent_date?: string;
  created_at: string;
  updated_at: string;
}

interface LoyaltyMember {
  customer_id: number;
  customer_name: string;
  total_points: number;
  points_earned: number;
  points_redeemed: number;
  tier: string;
  lifetime_value: number;
  total_purchases: number;
  last_purchase_date?: string;
}

interface Reward {
  id: number;
  name: string;
  description?: string;
  points_required: number;
  reward_type: string;
  reward_value: number;
  max_redemptions?: number;
  current_redemptions: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CRMModule() {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loyaltyMembers, setLoyaltyMembers] = useState<LoyaltyMember[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "campaigns") {
        await loadCampaigns();
      } else if (activeTab === "loyalty") {
        await loadLoyaltyMembers();
      } else if (activeTab === "rewards") {
        await loadRewards();
      }
      await loadStats();
    } catch (error) {
      console.error("Error loading CRM data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/crm/campaigns`, {
      headers: getAuthHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      setCampaigns(data);
    }
  };

  const loadLoyaltyMembers = async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/crm/loyalty/members`, {
      headers: getAuthHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      setLoyaltyMembers(data);
    }
  };

  const loadRewards = async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/crm/rewards`, {
      headers: getAuthHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      setRewards(data);
    }
  };

  const loadStats = async () => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/crm/analytics/summary`, {
      headers: getAuthHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      setStats(data);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Prominent Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 p-8 rounded-2xl border-2 border-violet-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">
                CRM & Loyalty Program
              </h1>
              <p className="text-white/90 text-base">
                Customer campaigns, loyalty programs, and rewards
              </p>
            </div>
          </div>
          
          <Button className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg">
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="campaigns"><Mail className="w-4 h-4 mr-2" />Campaigns</TabsTrigger>
          <TabsTrigger value="loyalty"><Gift className="w-4 h-4 mr-2" />Loyalty Program</TabsTrigger>
          <TabsTrigger value="rewards"><Star className="w-4 h-4 mr-2" />Rewards</TabsTrigger>
        </TabsList>

        {/* CAMPAIGNS TAB */}
        <TabsContent value="campaigns">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="pharmacy-card">
              <CardHeader>
                <CardTitle>Marketing Campaigns</CardTitle>
                <CardDescription>Manage customer communication campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
                    No campaigns found
                  </div>
                ) : (
                  campaigns.map(campaign => (
                    <div key={campaign.id} className="p-4 rounded-lg glass-subtle">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{campaign.name}</h3>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{campaign.campaign_type}</Badge>
                            <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                              {campaign.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Sent</div>
                          <div className="font-medium flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            {campaign.sent_count}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Opened</div>
                          <div className="font-medium text-green-600">{campaign.opened_count}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Clicked</div>
                          <div className="font-medium text-blue-600">{campaign.click_count}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="pharmacy-card">
              <CardHeader>
                <CardTitle>Create Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Campaign Name</Label>
                  <Input placeholder="Enter campaign name" className="pharmacy-input" />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea placeholder="Enter your message" className="pharmacy-input" rows={4} />
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <Input placeholder="All customers" className="pharmacy-input" />
                </div>
                <Button className="pharmacy-button w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Campaign
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LOYALTY TAB */}
        <TabsContent value="loyalty">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="pharmacy-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Loyalty Tiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200">
                  <div className="font-medium text-amber-800 dark:text-amber-200">Gold</div>
                  <div className="text-sm text-muted-foreground">500+ points</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-300">
                  <div className="font-medium">Silver</div>
                  <div className="text-sm text-muted-foreground">200-499 points</div>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200">
                  <div className="font-medium text-orange-800 dark:text-orange-200">Bronze</div>
                  <div className="text-sm text-muted-foreground">0-199 points</div>
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-card lg:col-span-2">
              <CardHeader>
                <CardTitle>Loyalty Members</CardTitle>
                <CardDescription>{loyaltyMembers.length} active members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : loyaltyMembers.length === 0 ? (
                    <div className="text-center text-muted-foreground p-4">
                      No loyalty members found
                    </div>
                  ) : (
                    loyaltyMembers.map(member => (
                      <div key={member.customer_id} className="p-4 rounded-lg glass-subtle flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{member.customer_name}</h3>
                          <div className="text-sm text-muted-foreground">
                            {member.total_purchases} purchases • EGP {member.lifetime_value.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            member.tier === "Gold" ? "default" :
                            member.tier === "Silver" ? "secondary" : "outline"
                          }>
                            {member.tier}
                          </Badge>
                          <div className="text-sm mt-1 font-medium flex items-center gap-1 justify-end">
                            <Star className="w-3 h-3 text-amber-500" />
                            {member.total_points} pts
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* REWARDS TAB */}
        <TabsContent value="rewards">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tags className="w-5 h-5" />
                    Rewards & Offers
                  </CardTitle>
                  <CardDescription>Manage reward programs and special offers</CardDescription>
                </div>
                <Button className="pharmacy-button gap-2">
                  <Plus className="w-4 h-4" />
                  Create Reward
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <div className="col-span-3 flex items-center justify-center p-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : rewards.length === 0 ? (
                  <div className="col-span-3 text-center text-muted-foreground p-4">
                    No rewards found
                  </div>
                ) : (
                  rewards.map(reward => (
                    <div key={reward.id} className="p-4 rounded-lg glass-subtle border-2 border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        {reward.reward_type === 'discount' ? (
                          <Gift className="w-5 h-5 text-primary" />
                        ) : reward.reward_type === 'free_product' ? (
                          <Star className="w-5 h-5 text-amber-500" />
                        ) : reward.reward_type === 'service' ? (
                          <Users className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Tags className="w-5 h-5 text-green-500" />
                        )}
                        <h3 className="font-medium">{reward.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {reward.description || `${reward.reward_type} - EGP ${reward.reward_value}`}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <div className="text-sm">
                          <span className="font-medium">{reward.points_required}</span> points
                        </div>
                        <Badge variant={reward.is_active ? "default" : "secondary"}>
                          {reward.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {reward.current_redemptions} / {reward.max_redemptions || '∞'} redeemed
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
