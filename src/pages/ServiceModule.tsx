import { useState } from "react";
import { Plus, Stethoscope, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function ServiceModule() {
  const [activeTab, setActiveTab] = useState("services");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pharmacy-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Service Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage consultations, lab tests, and service bookings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="services"><Stethoscope className="w-4 h-4 mr-2" />Services</TabsTrigger>
          <TabsTrigger value="bookings"><Calendar className="w-4 h-4 mr-2" />Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Service management module
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle>Service Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Service bookings management
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

