import { useState } from "react";
import { Plus, Users, Gift, Star, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CRMModule() {
  const [activeTab, setActiveTab] = useState("campaigns");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pharmacy-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CRM & Loyalty
          </h1>
          <p className="text-muted-foreground mt-1">
            Customer campaigns, loyalty programs, and rewards
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="campaigns"><Mail className="w-4 h-4 mr-2" />Campaigns</TabsTrigger>
          <TabsTrigger value="loyalty"><Gift className="w-4 h-4 mr-2" />Loyalty Program</TabsTrigger>
          <TabsTrigger value="rewards"><Star className="w-4 h-4 mr-2" />Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Marketing Campaigns</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Customer campaigns module
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Loyalty Program</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Loyalty program management
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Customer Rewards</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Rewards and points management
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

