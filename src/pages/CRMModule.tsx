import { useState, useEffect } from "react";
import { Plus, Gift, Star, Mail, Users, Send, Trophy, Tags } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CRMModule() {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loyaltyMembers, setLoyaltyMembers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Placeholder for loading CRM data
    setCampaigns([
      { id: 1, name: "Summer Health Checkup", type: "SMS", status: "active", sent: 150, opened: 98 },
      { id: 2, name: "New Medicine Launch", type: "Email", status: "completed", sent: 320, opened: 245 }
    ]);
    setLoyaltyMembers([
      { id: 1, name: "John Doe", phone: "01234567890", points: 450, tier: "Gold" },
      { id: 2, name: "Jane Smith", phone: "01987654321", points: 280, tier: "Silver" }
    ]);
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
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="p-4 rounded-lg glass-subtle">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{campaign.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{campaign.type}</Badge>
                          <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Sent</div>
                        <div className="font-medium flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          {campaign.sent}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Opened</div>
                        <div className="font-medium text-green-600">{campaign.opened}</div>
                      </div>
                    </div>
                  </div>
                ))}
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
                  {loyaltyMembers.map(member => (
                    <div key={member.id} className="p-4 rounded-lg glass-subtle flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                        <div className="text-sm text-muted-foreground">{member.phone}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          member.tier === "Gold" ? "default" :
                          member.tier === "Silver" ? "secondary" : "outline"
                        }>
                          {member.tier}
                        </Badge>
                        <div className="text-sm mt-1 font-medium flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          {member.points} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* REWARDS TAB */}
        <TabsContent value="rewards">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="w-5 h-5" />
                Rewards & Offers
              </CardTitle>
              <CardDescription>Manage reward programs and special offers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg glass-subtle border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <h3 className="font-medium">Birthday Discount</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">10% off on birthday month</p>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="p-4 rounded-lg glass-subtle border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    <h3 className="font-medium">Points Redemption</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">100 points = ৳50 discount</p>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="p-4 rounded-lg glass-subtle border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <h3 className="font-medium">Referral Bonus</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Refer a friend, get 50 points</p>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
